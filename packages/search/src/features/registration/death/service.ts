/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * OpenCRVS is also distributed under the terms of the Civil Registration
 * & Healthcare Disclaimer located at http://opencrvs.org/license.
 *
 * Copyright (C) The OpenCRVS Authors. OpenCRVS and the OpenCRVS
 * graphic logo are (registered/a) trademark(s) of Plan International.
 */
import {
  indexComposition,
  updateComposition
} from '@search/elasticsearch/dbhelper'
import {
  createStatusHistory,
  EVENT,
  getCreatedBy,
  getStatus,
  ICompositionBody,
  IDeathCompositionBody,
  IOperationHistory,
  NAME_EN,
  REJECTED_STATUS
} from '@search/elasticsearch/utils'
import {
  findEntry,
  findName,
  findNameLocale,
  findTask,
  findTaskExtension,
  findTaskIdentifier,
  findEntryResourceByUrl,
  getLocationHirarchyIDs,
  findEventLocation
} from '@search/features/fhir/fhir-utils'
import * as Hapi from '@hapi/hapi'

const DECEASED_CODE = 'deceased-details'
const INFORMANT_CODE = 'informant-details'
const MOTHER_CODE = 'mother-details'
const FATHER_CODE = 'father-details'
const SPOUSE_CODE = 'spouse-details'
const DEATH_ENCOUNTER_CODE = 'death-encounter'

export async function upsertEvent(requestBundle: Hapi.Request) {
  const bundle = requestBundle.payload as fhir.Bundle
  const bundleEntries = bundle.entry
  const authHeader = requestBundle.headers.authorization

  if (bundleEntries && bundleEntries.length === 1) {
    const resource = bundleEntries[0].resource
    if (resource && resource.resourceType === 'Task') {
      updateEvent(resource as fhir.Task, authHeader)
      return
    }
  }

  const composition = (bundleEntries &&
    bundleEntries[0].resource) as fhir.Composition
  if (!composition) {
    throw new Error('Composition not found')
  }

  const compositionId = composition.id

  if (!compositionId) {
    throw new Error(`Composition ID not found`)
  }

  await indexDeclaration(compositionId, composition, authHeader, bundleEntries)
}

async function updateEvent(task: fhir.Task, authHeader: string) {
  const compositionId =
    task &&
    task.focus &&
    task.focus.reference &&
    task.focus.reference.split('/')[1]

  if (!compositionId) {
    throw new Error('No Composition ID found')
  }

  const regLastUserIdentifier = findTaskExtension(
    task,
    'http://opencrvs.org/specs/extension/regLastUser'
  )
  const registrationNumberIdentifier = findTaskIdentifier(
    task,
    'http://opencrvs.org/specs/id/death-registration-number'
  )

  const body: ICompositionBody = {
    operationHistories: (await getStatus(compositionId)) as IOperationHistory[]
  }

  body.type =
    task &&
    task.businessStatus &&
    task.businessStatus.coding &&
    task.businessStatus.coding[0].code
  body.modifiedAt = Date.now().toString()
  const nodeText =
    (body.type === REJECTED_STATUS &&
      task &&
      task.note &&
      task.note[0].text &&
      task.note[0].text) ||
    ''
  body.rejectReason =
    (body.type === REJECTED_STATUS &&
      task &&
      task.reason &&
      task.reason.text) ||
    ''
  body.rejectComment = nodeText
  body.updatedBy =
    regLastUserIdentifier &&
    regLastUserIdentifier.valueReference &&
    regLastUserIdentifier.valueReference.reference &&
    regLastUserIdentifier.valueReference.reference.split('/')[1]
  body.registrationNumber =
    registrationNumberIdentifier && registrationNumberIdentifier.value

  await createStatusHistory(body, task, authHeader)
  await updateComposition(compositionId, body)
}

async function indexDeclaration(
  compositionId: string,
  composition: fhir.Composition,
  authHeader: string,
  bundleEntries?: fhir.BundleEntry[]
) {
  const body: ICompositionBody = {
    event: EVENT.DEATH,
    createdAt: Date.now().toString(),
    operationHistories: (await getStatus(compositionId)) as IOperationHistory[]
  }

  await createIndexBody(body, composition, authHeader, bundleEntries)
  await indexComposition(compositionId, body)
}

async function createIndexBody(
  body: IDeathCompositionBody,
  composition: fhir.Composition,
  authHeader: string,
  bundleEntries?: fhir.BundleEntry[]
) {
  await createDeceasedIndex(body, composition, bundleEntries)
  createFatherIndex(body, composition, bundleEntries)
  createMotherIndex(body, composition, bundleEntries)
  createSpouseIndex(body, composition, bundleEntries)
  createInformantIndex(body, composition, bundleEntries)
  await createApplicationIndex(body, composition, bundleEntries)
  const task = findTask(bundleEntries)
  await createStatusHistory(body, task, authHeader)
}

async function createDeceasedIndex(
  body: IDeathCompositionBody,
  composition: fhir.Composition,
  bundleEntries?: fhir.BundleEntry[]
) {
  const deceased = findEntry(
    DECEASED_CODE,
    composition,
    bundleEntries
  ) as fhir.Patient

  const deathLocation = (await findEventLocation(
    DEATH_ENCOUNTER_CODE,
    composition,
    bundleEntries
  )) as fhir.Location

  const deceasedName = deceased && findName(NAME_EN, deceased.name)
  const deceasedNameLocal = deceased && findNameLocale(deceased.name)

  body.deceasedFirstNames =
    deceasedName && deceasedName.given && deceasedName.given.join(' ')
  body.deceasedFamilyName =
    deceasedName && deceasedName.family && deceasedName.family[0]
  body.deceasedFirstNamesLocal =
    deceasedNameLocal &&
    deceasedNameLocal.given &&
    deceasedNameLocal.given.join(' ')
  body.deceasedFamilyNameLocal =
    deceasedNameLocal && deceasedNameLocal.family && deceasedNameLocal.family[0]
  body.deathDate = deceased && deceased.deceasedDateTime
  body.eventLocationId = deathLocation && deathLocation.id
}

function createMotherIndex(
  body: IDeathCompositionBody,
  composition: fhir.Composition,
  bundleEntries?: fhir.BundleEntry[]
) {
  const mother = findEntry(
    MOTHER_CODE,
    composition,
    bundleEntries
  ) as fhir.Patient

  if (!mother) {
    return
  }

  const motherName = findName(NAME_EN, mother.name)
  const motherNameLocal = findNameLocale(mother.name)

  body.motherFirstNames =
    motherName && motherName.given && motherName.given.join(' ')
  body.motherFamilyName =
    motherName && motherName.family && motherName.family[0]
  body.motherFirstNamesLocal =
    motherNameLocal && motherNameLocal.given && motherNameLocal.given.join(' ')
  body.motherFamilyNameLocal =
    motherNameLocal && motherNameLocal.family && motherNameLocal.family[0]
}

function createFatherIndex(
  body: IDeathCompositionBody,
  composition: fhir.Composition,
  bundleEntries?: fhir.BundleEntry[]
) {
  const father = findEntry(
    FATHER_CODE,
    composition,
    bundleEntries
  ) as fhir.Patient

  if (!father) {
    return
  }

  const fatherName = findName(NAME_EN, father.name)
  const fatherNameLocal = findNameLocale(father.name)

  body.fatherFirstNames =
    fatherName && fatherName.given && fatherName.given.join(' ')
  body.fatherFamilyName =
    fatherName && fatherName.family && fatherName.family[0]
  body.fatherFirstNamesLocal =
    fatherNameLocal && fatherNameLocal.given && fatherNameLocal.given.join(' ')
  body.fatherFamilyNameLocal =
    fatherNameLocal && fatherNameLocal.family && fatherNameLocal.family[0]
}

function createSpouseIndex(
  body: IDeathCompositionBody,
  composition: fhir.Composition,
  bundleEntries?: fhir.BundleEntry[]
) {
  const spouse = findEntry(
    SPOUSE_CODE,
    composition,
    bundleEntries
  ) as fhir.Patient

  if (!spouse) {
    return
  }

  const spouseName = findName(NAME_EN, spouse.name)
  const spouseNameLocal = findNameLocale(spouse.name)

  body.spouseFirstNames =
    spouseName && spouseName.given && spouseName.given.join(' ')
  body.spouseFamilyName =
    spouseName && spouseName.family && spouseName.family[0]
  body.spouseFirstNamesLocal =
    spouseNameLocal && spouseNameLocal.given && spouseNameLocal.given.join(' ')
  body.spouseFamilyNameLocal =
    spouseNameLocal && spouseNameLocal.family && spouseNameLocal.family[0]
}

function createInformantIndex(
  body: IDeathCompositionBody,
  composition: fhir.Composition,
  bundleEntries?: fhir.BundleEntry[]
) {
  const informantRef = findEntry(
    INFORMANT_CODE,
    composition,
    bundleEntries
  ) as fhir.RelatedPerson

  if (!informantRef || !informantRef.patient) {
    return
  }

  const informant = findEntryResourceByUrl(
    informantRef.patient.reference,
    bundleEntries
  ) as fhir.Patient

  if (!informant) {
    return
  }

  const informantName = findName(NAME_EN, informant.name)
  const informantNameLocal = findNameLocale(informant.name)

  body.informantFirstNames =
    informantName && informantName.given && informantName.given.join(' ')
  body.informantFamilyName =
    informantName && informantName.family && informantName.family[0]
  body.informantFirstNamesLocal =
    informantNameLocal &&
    informantNameLocal.given &&
    informantNameLocal.given.join(' ')
  body.informantFamilyNameLocal =
    informantNameLocal &&
    informantNameLocal.family &&
    informantNameLocal.family[0]
}

async function createApplicationIndex(
  body: IDeathCompositionBody,
  composition: fhir.Composition,
  bundleEntries?: fhir.BundleEntry[]
) {
  const task = findTask(bundleEntries)
  const contactPersonExtention = findTaskExtension(
    task,
    'http://opencrvs.org/specs/extension/contact-person'
  )
  const contactPersonRelationshipExtention = findTaskExtension(
    task,
    'http://opencrvs.org/specs/extension/contact-relationship'
  )
  const contactNumberExtension = findTaskExtension(
    task,
    'http://opencrvs.org/specs/extension/contact-person-phone-number'
  )
  const placeOfApplicationExtension = findTaskExtension(
    task,
    'http://opencrvs.org/specs/extension/regLastOffice'
  )

  const trackingIdIdentifier = findTaskIdentifier(
    task,
    'http://opencrvs.org/specs/id/death-tracking-id'
  )
  const registrationNumberIdentifier = findTaskIdentifier(
    task,
    'http://opencrvs.org/specs/id/death-registration-number'
  )

  const regLastUserIdentifier = findTaskExtension(
    task,
    'http://opencrvs.org/specs/extension/regLastUser'
  )

  const regLastUser =
    regLastUserIdentifier &&
    regLastUserIdentifier.valueReference &&
    regLastUserIdentifier.valueReference.reference &&
    regLastUserIdentifier.valueReference.reference.split('/')[1]

  const compositionTypeCode =
    composition.type.coding &&
    composition.type.coding.find(
      code => code.system === 'http://opencrvs.org/doc-types'
    )

  body.contactRelationship =
    (contactPersonRelationshipExtention &&
      contactPersonRelationshipExtention.valueString) ||
    (contactPersonExtention && contactPersonExtention.valueString)
  body.contactNumber =
    contactNumberExtension && contactNumberExtension.valueString
  body.type =
    task &&
    task.businessStatus &&
    task.businessStatus.coding &&
    task.businessStatus.coding[0].code
  body.dateOfApplication = task && task.lastModified
  body.trackingId = trackingIdIdentifier && trackingIdIdentifier.value
  body.registrationNumber =
    registrationNumberIdentifier && registrationNumberIdentifier.value
  body.applicationLocationId =
    placeOfApplicationExtension &&
    placeOfApplicationExtension.valueReference &&
    placeOfApplicationExtension.valueReference.reference &&
    placeOfApplicationExtension.valueReference.reference.split('/')[1]
  body.applicationLocationHirarchyIds = await getLocationHirarchyIDs(
    body.applicationLocationId
  )

  body.compositionType =
    (compositionTypeCode && compositionTypeCode.code) || 'death-application'

  const createdBy = await getCreatedBy(composition.id as string)

  body.createdBy = createdBy || regLastUser
  body.updatedBy = regLastUser
}
