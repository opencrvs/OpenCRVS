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
  detectDuplicates,
  EVENT,
  getCreatedBy,
  getStatus,
  IBirthCompositionBody,
  ICompositionBody,
  NAME_EN,
  IOperationHistory,
  REJECTED_STATUS
} from '@search/elasticsearch/utils'
import {
  addDuplicatesToComposition,
  findEntry,
  findName,
  findNameLocale,
  findTask,
  findTaskExtension,
  findTaskIdentifier,
  getCompositionById,
  updateInHearth,
  findEntryResourceByUrl,
  selectObservationEntry,
  findEventLocation,
  getLocationHirarchyIDs
} from '@search/features/fhir/fhir-utils'
import { logger } from '@search/logger'
import * as Hapi from '@hapi/hapi'

const MOTHER_CODE = 'mother-details'
const FATHER_CODE = 'father-details'
const INFORMANT_CODE = 'informant-details'
const PRIMARY_CAREGIVER_CODE = 'primary-caregiver-details'
const PRIMARY_CAREGIVER_TYPE_CODE = 'primary-caregiver'
const CHILD_CODE = 'child-details'
const BIRTH_ENCOUNTER_CODE = 'birth-encounter'

export async function upsertEvent(requestBundle: Hapi.Request) {
  const bundle = requestBundle.payload as fhir.Bundle
  const bundleEntries = bundle.entry
  const authHeader = requestBundle.headers.authorization

  if (bundleEntries && bundleEntries.length === 1) {
    const resource = bundleEntries[0].resource
    if (resource && resource.resourceType === 'Task') {
      await updateEvent(resource as fhir.Task, authHeader)
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

  await indexAndSearchComposition(
    compositionId,
    composition,
    authHeader,
    bundleEntries
  )
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
    'http://opencrvs.org/specs/id/birth-registration-number'
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
  const rejectAnnotation: fhir.Annotation = (body.type === REJECTED_STATUS &&
    task &&
    task.note &&
    Array.isArray(task.note) &&
    task.note.length > 0 &&
    task.note[task.note.length - 1]) || { text: '' }
  const nodeText = rejectAnnotation.text
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

async function indexAndSearchComposition(
  compositionId: string,
  composition: fhir.Composition,
  authHeader: string,
  bundleEntries?: fhir.BundleEntry[]
) {
  const body: IBirthCompositionBody = {
    event: EVENT.BIRTH,
    createdAt: Date.now().toString(),
    operationHistories: (await getStatus(compositionId)) as IOperationHistory[]
  }

  await createIndexBody(body, composition, authHeader, bundleEntries)
  await indexComposition(compositionId, body)
  if (body.type !== 'IN_PROGRESS') {
    await detectAndUpdateDuplicates(compositionId, composition, body)
  }
}

async function createIndexBody(
  body: IBirthCompositionBody,
  composition: fhir.Composition,
  authHeader: string,
  bundleEntries?: fhir.BundleEntry[]
) {
  await createChildIndex(body, composition, bundleEntries)
  createMotherIndex(body, composition, bundleEntries)
  createFatherIndex(body, composition, bundleEntries)
  createInformantIndex(body, composition, bundleEntries)
  createPrimaryCaregiverIndex(body, composition, bundleEntries)
  await createApplicationIndex(body, composition, bundleEntries)
  const task = findTask(bundleEntries)
  await createStatusHistory(body, task, authHeader)
}

async function createChildIndex(
  body: IBirthCompositionBody,
  composition: fhir.Composition,
  bundleEntries?: fhir.BundleEntry[]
) {
  const child = findEntry(
    CHILD_CODE,
    composition,
    bundleEntries
  ) as fhir.Patient

  const birthLocation = (await findEventLocation(
    BIRTH_ENCOUNTER_CODE,
    composition
  )) as fhir.Location

  const childName = child && findName(NAME_EN, child.name)
  const childNameLocal = child && findNameLocale(child.name)

  body.childFirstNames =
    childName && childName.given && childName.given.join(' ')
  body.childFamilyName = childName && childName.family && childName.family[0]
  body.childFirstNamesLocal =
    childNameLocal && childNameLocal.given && childNameLocal.given.join(' ')
  body.childFamilyNameLocal =
    childNameLocal && childNameLocal.family && childNameLocal.family[0]
  body.childDoB = child && child.birthDate
  body.gender = child && child.gender
  body.eventLocationId = birthLocation && birthLocation.id
}

function createMotherIndex(
  body: IBirthCompositionBody,
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
  body.motherDoB = mother.birthDate
  body.motherIdentifier =
    mother.identifier && mother.identifier[0] && mother.identifier[0].value
}

function createFatherIndex(
  body: IBirthCompositionBody,
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
  body.fatherDoB = father.birthDate
  body.fatherIdentifier =
    father.identifier && father.identifier[0] && father.identifier[0].value
}

function createInformantIndex(
  body: IBirthCompositionBody,
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

function createPrimaryCaregiverIndex(
  body: IBirthCompositionBody,
  composition: fhir.Composition,
  bundleEntries?: fhir.BundleEntry[]
) {
  const observationEntry = selectObservationEntry(
    PRIMARY_CAREGIVER_TYPE_CODE,
    bundleEntries
  )
  const observation =
    observationEntry && (observationEntry.resource as fhir.Observation)
  const primaryCaregiverType = (observation && observation.valueString) || ''

  if (
    primaryCaregiverType === 'MOTHER' ||
    primaryCaregiverType === 'FATHER' ||
    primaryCaregiverType === 'INFORMANT'
  ) {
    return
  }

  const primaryCaregiver = findEntry(
    PRIMARY_CAREGIVER_CODE,
    composition,
    bundleEntries
  ) as fhir.Patient

  if (!primaryCaregiver) {
    return
  }

  const primaryCaregiverName = findName(NAME_EN, primaryCaregiver.name)
  const primaryCaregiverNameLocal = findNameLocale(primaryCaregiver.name)

  body.primaryCaregiverFirstNames =
    primaryCaregiverName &&
    primaryCaregiverName.given &&
    primaryCaregiverName.given.join(' ')
  body.primaryCaregiverFamilyName =
    primaryCaregiverName &&
    primaryCaregiverName.family &&
    primaryCaregiverName.family[0]
  body.primaryCaregiverFirstNamesLocal =
    primaryCaregiverNameLocal &&
    primaryCaregiverNameLocal.given &&
    primaryCaregiverNameLocal.given.join(' ')
  body.primaryCaregiverFamilyNameLocal =
    primaryCaregiverNameLocal &&
    primaryCaregiverNameLocal.family &&
    primaryCaregiverNameLocal.family[0]
}

async function createApplicationIndex(
  body: IBirthCompositionBody,
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
    'http://opencrvs.org/specs/id/birth-tracking-id'
  )
  const registrationNumberIdentifier = findTaskIdentifier(
    task,
    'http://opencrvs.org/specs/id/birth-registration-number'
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
    (compositionTypeCode && compositionTypeCode.code) || 'birth-application'

  const createdBy = await getCreatedBy(composition.id || '')

  body.createdBy = createdBy || regLastUser
  body.updatedBy = regLastUser
}

async function detectAndUpdateDuplicates(
  compositionId: string,
  composition: fhir.Composition,
  body: IBirthCompositionBody
) {
  const duplicates = await detectDuplicates(compositionId, body)
  if (!duplicates.length) {
    return
  }
  logger.info(
    `Search/service: ${duplicates.length} duplicate composition(s) found`
  )

  return await updateCompositionWithDuplicates(composition, duplicates)
}

async function updateCompositionWithDuplicates(
  composition: fhir.Composition,
  duplicates: string[]
) {
  const duplicateCompositions = await Promise.all(
    // tslint:disable-next-line
    duplicates.map(duplicate => getCompositionById(duplicate))
  )

  const duplicateCompositionIds = duplicateCompositions.map(
    dupComposition => dupComposition.id
  )

  if (composition && composition.id) {
    const body: ICompositionBody = {}
    body.relatesTo = duplicateCompositionIds
    updateComposition(composition.id, body)
  }
  const compositionFromFhir = (await getCompositionById(
    composition.id as string
  )) as fhir.Composition
  addDuplicatesToComposition(duplicateCompositionIds, compositionFromFhir)

  return updateInHearth(compositionFromFhir, compositionFromFhir.id)
}
