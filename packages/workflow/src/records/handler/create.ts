/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * OpenCRVS is also distributed under the terms of the Civil Registration
 * & Healthcare Disclaimer located at http://opencrvs.org/license.
 *
 * Copyright (C) The OpenCRVS Authors located at https://github.com/opencrvs/opencrvs-core/blob/master/AUTHORS.
 */
import * as Hapi from '@hapi/hapi'
import {
  BirthRegistration,
  DeathRegistration,
  EVENT_TYPE,
  MarriageRegistration,
  buildFHIRBundle,
  Bundle,
  getComposition,
  getTrackingId as getTrackingIdFromRecord,
  isTask,
  changeState,
  InProgressRecord,
  ReadyForReviewRecord,
  ValidatedRecord,
  WaitingForValidationRecord,
  isRejected,
  isInProgress,
  isReadyForReview,
  isValidated,
  isWaitingExternalValidation,
  isComposition,
  getTaskFromSavedBundle,
  Encounter,
  Location,
  findEncounterFromRecord,
  Saved
} from '@opencrvs/commons/types'
import {
  getToken,
  hasRegisterScope,
  hasValidateScope
} from '@workflow/utils/auth-utils'
import {
  findTaskFromIdentifier,
  getLocationsById,
  mergeBundles,
  sendBundleToHearth,
  toSavedBundle,
  withPractitionerDetails
} from '@workflow/records/fhir'
import { z } from 'zod'
import { indexBundle } from '@workflow/records/search'
import { validateRequest } from '@workflow/utils'
import {
  findDuplicateIds,
  updateCompositionWithDuplicateIds,
  updateTaskWithDuplicateIds
} from '@workflow/utils/duplicate-checker'
import {
  generateTrackingIdForEvents,
  isInProgressDeclaration
} from '@workflow/features/registration/utils'
import { auditEvent } from '@workflow/records/audit'
import { getTrackingId } from '@workflow/features/registration/fhir/fhir-utils'
import {
  isNotificationEnabled,
  sendNotification
} from '@workflow/records/notification'
import { uploadBase64AttachmentsToDocumentsStore } from '@workflow/documents'
import { getAuthHeader } from '@opencrvs/commons/http'
import {
  initiateRegistration,
  toValidated,
  toWaitingForExternalValidationState
} from '@workflow/records/state-transitions'
import { logger, UUID } from '@opencrvs/commons'
import { notifyForAction } from '@workflow/utils/country-config-api'
import { getRecordSpecificToken } from '@workflow/records/token-exchange'

const requestSchema = z.object({
  event: z.custom<EVENT_TYPE>(),
  record: z.custom<
    BirthRegistration | DeathRegistration | MarriageRegistration
  >()
})

function findTask(bundle: Bundle) {
  const task = bundle.entry.map((e) => e.resource).find(isTask)
  if (!task) {
    throw new Error('Task not found in bundle')
  }
  return task
}

async function findExistingDeclarationIds(draftId: string) {
  const taskBundle = await findTaskFromIdentifier(draftId)
  if (taskBundle.entry.length > 0) {
    const trackingId = getTrackingId(taskBundle)
    if (!trackingId) {
      throw new Error('No trackingID found for existing declaration')
    }
    return {
      compositionId: taskBundle.entry[0].resource.focus.reference.split('/')[1],
      trackingId
    }
  }
  return null
}

function createInProgressOrReadyForReviewTask(
  previousTask: ReturnType<typeof findTask>,
  event: EVENT_TYPE,
  trackingId: Awaited<ReturnType<typeof generateTrackingIdForEvents>>,
  inProgress: boolean
): ReturnType<typeof findTask> {
  return {
    ...previousTask,
    identifier: [
      ...previousTask.identifier,
      {
        system: `http://opencrvs.org/specs/id/${
          event.toLowerCase() as Lowercase<EVENT_TYPE>
        }-tracking-id`,
        value: trackingId
      }
    ],
    code: {
      coding: [
        {
          system: `http://opencrvs.org/specs/types`,
          code: event
        }
      ]
    },
    businessStatus: {
      coding: [
        {
          system: `http://opencrvs.org/specs/reg-status`,
          code: inProgress ? 'IN_PROGRESS' : 'DECLARED'
        }
      ]
    }
  }
}

async function resolveLocationsForEncounter(
  encounter: Encounter
): Promise<Bundle<Location> | null> {
  if (encounter.location == null) {
    return null
  }
  const locationIds: Array<string> = []
  for (const { location } of encounter.location) {
    locationIds.push(location.reference.split('/')[1])
  }
  return getLocationsById(locationIds)
}

function bundleIncludesLocationResources(record: Saved<Bundle>) {
  const encounter = findEncounterFromRecord(record)
  const encounterLocationIds =
    encounter?.location?.map(
      ({ location }) => location.reference.split('/')[1]
    ) || []

  const bundleLocations = record.entry.filter(
    ({ resource }) => resource.resourceType == 'Location'
  )

  return encounterLocationIds.every((locationId) =>
    bundleLocations.some((location) => location.id === locationId)
  )
}

async function createRecord(
  recordDetails: z.TypeOf<typeof requestSchema>['record'],
  event: z.TypeOf<typeof requestSchema>['event'],
  token: string,
  duplicateIds: Array<{ id: UUID; trackingId: string }>
): Promise<InProgressRecord | ReadyForReviewRecord> {
  const inputBundle = buildFHIRBundle(recordDetails, event)
  const trackingId = await generateTrackingIdForEvents(
    event,
    inputBundle,
    token
  )
  const composition = getComposition(inputBundle)
  const inProgress = isInProgressDeclaration(inputBundle)

  composition.identifier = {
    system: 'urn:ietf:rfc:3986',
    value: trackingId
  }

  const task = createInProgressOrReadyForReviewTask(
    findTask(inputBundle),
    event,
    trackingId,
    inProgress
  )

  const [taskWithLocation, practitionerResourcesBundle] =
    await withPractitionerDetails(task, token)

  inputBundle.entry = inputBundle.entry.map((e) => {
    if (isComposition(e.resource) && duplicateIds.length > 0) {
      logger.info(
        `Workflow/service:createRecord: ${duplicateIds.length} duplicate composition(s) found`
      )
      return {
        ...e,
        resource: updateCompositionWithDuplicateIds(e.resource, duplicateIds)
      }
    }
    if (e.resource.resourceType !== 'Task') {
      return e
    }
    return {
      ...e,
      resource: taskWithLocation
    }
  })

  const responseBundle = await sendBundleToHearth(inputBundle)
  const savedBundle = toSavedBundle(inputBundle, responseBundle)
  const record = inProgress
    ? changeState(savedBundle, 'IN_PROGRESS')
    : changeState(savedBundle, 'READY_FOR_REVIEW')

  const mergedBundle = mergeBundles(record, practitionerResourcesBundle)

  const encounter = findEncounterFromRecord(record)
  if (encounter == null) {
    return mergedBundle
  }

  if (bundleIncludesLocationResources(record)) {
    return mergedBundle
  }

  const locationResourcesBundle = await resolveLocationsForEncounter(encounter)

  if (locationResourcesBundle == null) {
    return mergedBundle
  }

  return mergeBundles(mergedBundle, locationResourcesBundle)
}

type CreatedRecord =
  | InProgressRecord
  | ReadyForReviewRecord
  | ValidatedRecord
  | WaitingForValidationRecord

function getEventAction(record: CreatedRecord) {
  if (isInProgress(record)) {
    return 'sent-notification'
  }
  if (isReadyForReview(record)) {
    return 'sent-notification-for-review'
  }
  if (isValidated(record)) {
    return 'sent-for-approval'
  }
  if (isWaitingExternalValidation(record)) {
    return 'waiting-external-validation'
  }
  // type assertion
  record satisfies never
  // this should never be reached
  return 'sent-notification'
}

export default async function createRecordHandler(
  request: Hapi.Request,
  _: Hapi.ResponseToolkit
) {
  const token = getToken(request)
  const { record: recordDetails, event } = validateRequest(
    requestSchema,
    request.payload
  )
  const existingDeclarationIds =
    recordDetails.registration?.draftId &&
    (await findExistingDeclarationIds(recordDetails.registration.draftId))
  if (existingDeclarationIds) {
    return {
      ...existingDeclarationIds,
      isPotentiallyDuplicate: false
    }
  }
  const duplicateIds = await findDuplicateIds(
    recordDetails,
    { Authorization: token },
    event
  )
  const recordInputWithUploadedAttachments =
    await uploadBase64AttachmentsToDocumentsStore(
      recordDetails,
      getAuthHeader(request)
    )
  let record: CreatedRecord = await createRecord(
    recordInputWithUploadedAttachments,
    event,
    token,
    duplicateIds
  )

  await auditEvent(
    isInProgress(record) ? 'sent-notification' : 'sent-notification-for-review',
    record,
    token
  )

  if (duplicateIds.length) {
    await indexBundle(record, token)
    let task = getTaskFromSavedBundle(record)
    task = updateTaskWithDuplicateIds(task, duplicateIds)
    await sendBundleToHearth({
      ...record,
      entry: [{ resource: task }]
    })
    return {
      compositionId: getComposition(record).id,
      trackingId: getTrackingIdFromRecord(record),
      isPotentiallyDuplicate: true
    }
  } else if (hasValidateScope(request)) {
    record = await toValidated(record, token)
    await auditEvent('sent-for-approval', record, token)
  } else if (hasRegisterScope(request) && !isInProgress(record)) {
    record = await toWaitingForExternalValidationState(record, token)
    await auditEvent('waiting-external-validation', record, token)
  }

  const eventAction = getEventAction(record)
  await indexBundle(record, token)

  // Notification not implemented for marriage yet
  const notificationDisabled =
    eventAction === 'waiting-external-validation' ||
    !(await isNotificationEnabled(eventAction, event, token))

  if (!notificationDisabled) {
    await sendNotification(eventAction, record, token)
  }

  /*
   * We need to initiate registration for a
   * record in waiting validation state
   *
   * `initiateRegistration` notifies country configuration about the event which then either confirms or rejects the record.
   */
  if (isWaitingExternalValidation(record)) {
    const rejectedOrWaitingValidationRecord = await initiateRegistration(
      record,
      request.headers,
      token
    )

    if (isRejected(rejectedOrWaitingValidationRecord)) {
      await indexBundle(rejectedOrWaitingValidationRecord, token)
      await auditEvent('sent-for-updates', record, token)
    }
  } else {
    /*
     * Notify country configuration about the event so that countries can hook into actions like "sent-for-approval"
     */
    const recordSpecificToken = await getRecordSpecificToken(
      token,
      request.headers,
      getComposition(record).id
    )
    await notifyForAction({
      event,
      action: eventAction,
      record,
      headers: {
        ...request.headers,
        authorization: `Bearer ${recordSpecificToken.access_token}`
      }
    })
  }

  return {
    compositionId: getComposition(record).id,
    trackingId: getTrackingIdFromRecord(record),
    isPotentiallyDuplicate: false
  }
}
