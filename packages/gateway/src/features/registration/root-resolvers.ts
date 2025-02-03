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
import { AUTH_URL, COUNTRY_CONFIG_URL, SEARCH_URL } from '@gateway/constants'
import { fetchFHIR } from '@gateway/features/fhir/service'
import {
  hasRecordAccess,
  hasScope,
  inScope
} from '@gateway/features/user/utils'
import fetch from '@gateway/fetch'
import { IAuthHeader } from '@opencrvs/commons'
import {
  Bundle,
  EVENT_TYPE,
  Patient,
  Saved,
  Task,
  getComposition,
  getTaskFromSavedBundle
} from '@opencrvs/commons/types'
import {
  GQLBirthRegistrationInput,
  GQLDeathRegistrationInput,
  GQLMarriageRegistrationInput,
  GQLResolver,
  GQLStatusWiseRegistrationCount
} from '@gateway/graphql/schema'

import {
  validateBirthDeclarationAttachments,
  validateDeathDeclarationAttachments,
  validateMarriageDeclarationAttachments
} from '@gateway/utils/validators'
import { checkUserAssignment } from '@gateway/authorisation'

import { setCollectorForPrintInAdvance } from '@gateway/features/registration/utils'
import {
  archiveRegistration,
  certifyRegistration,
  createRegistration,
  issueRegistration,
  registerDeclaration,
  unassignRegistration,
  rejectDeclaration,
  updateRegistration,
  validateRegistration,
  fetchRegistrationForDownloading,
  reinstateRegistration,
  duplicateRegistration,
  viewDeclaration,
  verifyRegistration,
  markNotADuplicate,
  rejectRegistration,
  confirmRegistration,
  upsertRegistrationIdentifier,
  updateField
} from '@gateway/workflow/index'
import { getRecordById } from '@gateway/records'
import { SCOPES } from '@opencrvs/commons/authentication'
import { UnassignError, UserInputError } from '@gateway/utils/graphql-errors'
import { Context } from '@gateway/graphql/context'
import { GraphQLResolveInfo } from 'graphql'

async function getAnonymousToken() {
  const res = await fetch(new URL('/anonymous-token', AUTH_URL).toString())
  const { token } = await res.json()
  return token
}

// This should take into account the status
// of the record like so in useNavigation
const ACTIONABLE_SCOPES = [
  SCOPES.RECORD_SUBMIT_FOR_REVIEW,
  SCOPES.RECORD_SUBMIT_INCOMPLETE,
  SCOPES.RECORD_REGISTER,
  SCOPES.RECORD_SUBMIT_FOR_APPROVAL,
  SCOPES.RECORD_DECLARE_BIRTH,
  SCOPES.RECORD_PRINT_ISSUE_CERTIFIED_COPIES,
  SCOPES.RECORD_REGISTRATION_CORRECT,
  SCOPES.RECORD_SUBMIT_FOR_UPDATES,
  SCOPES.RECORD_REGISTRATION_REQUEST_CORRECTION,
  SCOPES.RECORD_DECLARATION_REINSTATE,
  SCOPES.RECORD_DECLARATION_ARCHIVE
]

const requireAssignment =
  <P, A, R>(
    fn: (
      parent: P,
      args: A & { id: string },
      context: Context,
      info: GraphQLResolveInfo
    ) => R
  ) =>
  async (...args: Parameters<typeof fn>) => {
    const assignedToSelf = await checkUserAssignment(
      args[1].id,
      args[2].headers
    )
    if (!assignedToSelf) {
      throw new UnassignError('User is not assigned to the record')
    }
    return fn(...args)
  }

export const resolvers: GQLResolver = {
  RecordDetails: {
    __resolveType(obj): any {
      if (!obj?.type?.text) return 'BirthRegistration'
      if (obj.type.text == 'Birth Declaration') return 'BirthRegistration'
      if (obj.type.text == 'Death Declaration') return 'DeathRegistration'
    }
  },
  Query: {
    async fetchBirthRegistration(_, { id }, context): Promise<Saved<Bundle>> {
      if (inScope(context.headers, ACTIONABLE_SCOPES)) {
        const record = await fetchRegistrationForDownloading(
          id,
          context.headers
        )
        context.dataSources.recordsAPI.setRecord(record)
        return record
      } else {
        throw new Error('User does not have enough scope')
      }
    },
    async fetchDeathRegistration(_, { id }, context): Promise<Saved<Bundle>> {
      if (inScope(context.headers, ACTIONABLE_SCOPES)) {
        const record = await fetchRegistrationForDownloading(
          id,
          context.headers
        )
        context.dataSources.recordsAPI.setRecord(record)
        return record
      } else {
        throw new Error('User does not have enough scope')
      }
    },
    async fetchMarriageRegistration(
      _,
      { id },
      context
    ): Promise<Saved<Bundle>> {
      if (inScope(context.headers, ACTIONABLE_SCOPES)) {
        const record = await fetchRegistrationForDownloading(
          id,
          context.headers
        )
        context.dataSources.recordsAPI.setRecord(record)
        return record
      } else {
        throw new Error('User does not have enough scope')
      }
    },
    async queryRegistrationByIdentifier(
      _,
      { identifier },
      { headers: authHeader }
    ): Promise<Saved<Bundle>> {
      if (
        hasScope(authHeader, SCOPES.RECORD_REGISTER) ||
        hasScope(authHeader, SCOPES.RECORD_SUBMIT_FOR_APPROVAL)
      ) {
        const taskBundle = await fetchFHIR<Bundle<Task>>(
          `/Task?identifier=${identifier}`,
          authHeader
        )

        if (!taskBundle || !taskBundle.entry || !taskBundle.entry[0]) {
          throw new Error(`Task does not exist for identifer ${identifier}`)
        }
        const task = taskBundle.entry[0].resource

        if (!task.focus || !task.focus.reference) {
          throw new Error(`Composition reference not found`)
        }

        return await fetchFHIR(`/${task.focus.reference}`, authHeader)
      } else {
        throw new Error('User does not have enough scope')
      }
    },
    async fetchRegistration(_, { id }, context): Promise<Saved<Bundle>> {
      const record = await getRecordById(id, context.headers.Authorization)
      context.dataSources.recordsAPI.setRecord(record)
      return record
    },
    async fetchRegistrationForViewing(
      _,
      { id },
      context
    ): Promise<Saved<Bundle>> {
      const record = await viewDeclaration(id, context.headers)
      context.dataSources.recordsAPI.setRecord(record)
      return record
    },
    async queryPersonByIdentifier(_, { identifier }, { headers: authHeader }) {
      if (
        hasScope(authHeader, SCOPES.RECORD_REGISTER) ||
        hasScope(authHeader, SCOPES.RECORD_SUBMIT_FOR_APPROVAL) ||
        hasScope(authHeader, SCOPES.RECORD_SUBMIT_INCOMPLETE)
      ) {
        const personBundle = await fetchFHIR<Bundle<Patient>>(
          `/Patient?identifier=${identifier}`,
          authHeader
        )
        if (!personBundle || !personBundle.entry || !personBundle.entry[0]) {
          throw new Error(`Person does not exist for identifer ${identifier}`)
        }
        const person = personBundle.entry[0].resource

        return person
      } else {
        throw new Error('User does not have enough scope')
      }
    },
    async queryPersonByNidIdentifier(
      _,
      { dob, nid, country },
      { headers: authHeader }
    ) {
      if (
        hasScope(authHeader, SCOPES.RECORD_REGISTER) ||
        hasScope(authHeader, SCOPES.RECORD_SUBMIT_FOR_APPROVAL) ||
        hasScope(authHeader, SCOPES.RECORD_DECLARE_BIRTH) ||
        hasScope(authHeader, SCOPES.RECORD_DECLARE_DEATH) ||
        hasScope(authHeader, SCOPES.RECORD_DECLARE_MARRIAGE)
      ) {
        const response = await fetch(
          `${COUNTRY_CONFIG_URL}/verify/nid/${country}`,
          {
            method: 'POST',
            body: JSON.stringify({ dob, nid }),
            headers: {
              'Content-Type': 'application/json',
              ...authHeader
            }
          }
        ).then((data) => data.json())

        if (!response.operationResult.success) {
          throw new Error(response.operationResult.error.errorMessage)
        } else {
          return response.data
        }
      } else {
        throw new Error('User does not have enough scope')
      }
    },
    async fetchRegistrationCountByStatus(
      _,
      { locationId, status, event },
      { headers: authHeader }
    ) {
      if (
        hasScope(authHeader, SCOPES.RECORD_REGISTER) ||
        hasScope(authHeader, SCOPES.RECORD_SUBMIT_FOR_APPROVAL) ||
        hasScope(authHeader, SCOPES.RECORD_DECLARE_BIRTH) ||
        hasScope(authHeader, SCOPES.RECORD_DECLARE_DEATH) ||
        hasScope(authHeader, SCOPES.RECORD_DECLARE_MARRIAGE) ||
        hasScope(authHeader, SCOPES.PERFORMANCE_READ)
      ) {
        const payload: {
          declarationJurisdictionId?: string
          status: string[]
          event?: string
        } = {
          declarationJurisdictionId: locationId,
          status: status as string[],
          event
        }

        const results: GQLStatusWiseRegistrationCount[] = await fetch(
          `${SEARCH_URL}statusWiseRegistrationCount`,
          {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
              'Content-Type': 'application/json',
              ...authHeader
            }
          }
        ).then((data) => data.json())

        let total = 0
        if (results && results.length > 0) {
          total = results.reduce(
            (totalCount, statusCount) => ({
              count: totalCount.count + statusCount.count
            }),
            {
              count: total
            }
          ).count
        }
        return {
          results,
          total
        }
      } else {
        throw new Error('User does not have enough scope')
      }
    },
    async fetchRecordDetailsForVerification(_, { id }, context) {
      const token = await getAnonymousToken()
      context.headers.Authorization = `Bearer ${token}`
      const record = await verifyRegistration(id, context.headers)
      context.dataSources.recordsAPI.setRecord(record)
      return record
    }
  },

  Mutation: {
    async createBirthRegistration(_, { details }, { headers: authHeader }) {
      try {
        await validateBirthDeclarationAttachments(details)
      } catch (error) {
        throw new UserInputError(error.message)
      }

      return await createRegistration(details, EVENT_TYPE.BIRTH, authHeader)
    },
    async createDeathRegistration(_, { details }, { headers: authHeader }) {
      try {
        await validateDeathDeclarationAttachments(details)
      } catch (error) {
        throw new UserInputError(error.message)
      }

      return createRegistration(details, EVENT_TYPE.DEATH, authHeader)
    },
    async createMarriageRegistration(_, { details }, { headers: authHeader }) {
      try {
        await validateMarriageDeclarationAttachments(details)
      } catch (error) {
        throw new UserInputError(error.message)
      }

      return createRegistration(details, EVENT_TYPE.MARRIAGE, authHeader)
    },
    async markBirthAsValidated(_, { id, details }, { headers: authHeader }) {
      const hasAssignedToThisUser = await checkUserAssignment(id, authHeader)
      if (!hasAssignedToThisUser) {
        throw new UnassignError('User has been unassigned')
      }
      if (!hasScope(authHeader, SCOPES.RECORD_SUBMIT_FOR_APPROVAL)) {
        throw new Error('User does not have enough scope')
      } else {
        return await markEventAsValidated(
          id,
          authHeader,
          EVENT_TYPE.BIRTH,
          details
        )
      }
    },
    async markDeathAsValidated(_, { id, details }, { headers: authHeader }) {
      const hasAssignedToThisUser = await checkUserAssignment(id, authHeader)
      if (!hasAssignedToThisUser) {
        throw new UnassignError('User has been unassigned')
      }
      if (!hasScope(authHeader, SCOPES.RECORD_SUBMIT_FOR_APPROVAL)) {
        throw new Error('User does not have enough scope')
      }
      return await markEventAsValidated(
        id,
        authHeader,
        EVENT_TYPE.DEATH,
        details
      )
    },
    async markMarriageAsValidated(_, { id, details }, { headers: authHeader }) {
      const hasAssignedToThisUser = await checkUserAssignment(id, authHeader)
      if (!hasAssignedToThisUser) {
        throw new UnassignError('User has been unassigned')
      }
      if (!hasScope(authHeader, SCOPES.RECORD_SUBMIT_FOR_APPROVAL)) {
        throw new Error('User does not have enough scope')
      } else {
        return await markEventAsValidated(
          id,
          authHeader,
          EVENT_TYPE.MARRIAGE,
          details
        )
      }
    },
    async markBirthAsRegistered(_, { id, details }, { headers: authHeader }) {
      const hasAssignedToThisUser = await checkUserAssignment(id, authHeader)
      if (!hasAssignedToThisUser) {
        throw new UnassignError('User has been unassigned')
      }
      if (hasScope(authHeader, SCOPES.RECORD_REGISTER)) {
        return markEventAsRegistered(id, authHeader, EVENT_TYPE.BIRTH, details)
      } else {
        throw new Error('User does not have a register scope')
      }
    },
    async markDeathAsRegistered(_, { id, details }, { headers: authHeader }) {
      const hasAssignedToThisUser = await checkUserAssignment(id, authHeader)
      if (!hasAssignedToThisUser) {
        throw new UnassignError('User has been unassigned')
      }
      if (hasScope(authHeader, SCOPES.RECORD_REGISTER)) {
        return markEventAsRegistered(id, authHeader, EVENT_TYPE.DEATH, details)
      } else {
        throw new Error('User does not have a register scope')
      }
    },
    async markMarriageAsRegistered(
      _,
      { id, details },
      { headers: authHeader }
    ) {
      const hasAssignedToThisUser = await checkUserAssignment(id, authHeader)
      if (!hasAssignedToThisUser) {
        throw new UnassignError('User has been unassigned')
      }
      if (hasScope(authHeader, SCOPES.RECORD_REGISTER)) {
        return markEventAsRegistered(
          id,
          authHeader,
          EVENT_TYPE.MARRIAGE,
          details
        )
      } else {
        throw new Error('User does not have a register scope')
      }
    },
    async markEventAsVoided(
      _,
      { id, reason, comment },
      { headers: authHeader }
    ) {
      const hasAssignedToThisUser = await checkUserAssignment(id, authHeader)
      if (!hasAssignedToThisUser) {
        throw new UnassignError('User has been unassigned')
      }
      if (
        !inScope(authHeader, [
          SCOPES.RECORD_REGISTER,
          SCOPES.RECORD_SUBMIT_FOR_APPROVAL
        ])
      ) {
        throw new Error('User does not have enough scope')
      }
      const taskEntry = await rejectDeclaration(id, authHeader, reason, comment)
      if (!taskEntry) {
        throw new Error('Task not found')
      }

      // return the taskId
      return taskEntry.resource.id
    },
    async markEventAsArchived(
      _,
      { id, reason, comment, duplicateTrackingId },
      { headers: authHeader }
    ) {
      const hasAssignedToThisUser = await checkUserAssignment(id, authHeader)
      if (!hasAssignedToThisUser) {
        throw new UnassignError('User has been unassigned')
      }
      if (
        !inScope(authHeader, [
          SCOPES.RECORD_REGISTER,
          SCOPES.RECORD_SUBMIT_FOR_APPROVAL
        ])
      ) {
        throw new Error('User does not have enough scope')
      }
      const taskEntry = await archiveRegistration(
        id,
        authHeader,
        reason,
        comment,
        duplicateTrackingId
      )
      // return the taskId
      return taskEntry.resource.id
    },
    async markEventAsReinstated(_, { id }, { headers: authHeader }) {
      const hasAssignedToThisUser = await checkUserAssignment(id, authHeader)
      if (!hasAssignedToThisUser) {
        throw new UnassignError('User has been unassigned')
      }
      if (
        !inScope(authHeader, [
          SCOPES.RECORD_REGISTER,
          SCOPES.RECORD_SUBMIT_FOR_APPROVAL
        ])
      ) {
        throw new Error('User does not have enough scope')
      }

      const { taskId, prevRegStatus } = await reinstateRegistration(
        id,
        authHeader
      )

      return {
        taskEntryResourceID: taskId,
        registrationStatus: prevRegStatus
      }
    },
    markBirthAsCertified: requireAssignment(
      async (_, { id, details }, { headers: authHeader }) => {
        if (
          !hasScope(authHeader, SCOPES.RECORD_PRINT_ISSUE_CERTIFIED_COPIES) &&
          !hasScope(authHeader, SCOPES.SELF_SERVICE_PORTAL)
        ) {
          throw new Error('User does not have enough scope')
        }
        return markEventAsCertified(id, details, authHeader, EVENT_TYPE.BIRTH)
      }
    ),
    // @todo: add new query for certify and issue later where require assignment wrapper will be used
    markBirthAsIssued: (_, { id, details }, { headers: authHeader }) => {
      if (
        !hasScope(authHeader, SCOPES.RECORD_PRINT_ISSUE_CERTIFIED_COPIES) &&
        !hasScope(authHeader, SCOPES.SELF_SERVICE_PORTAL)
      ) {
        throw new Error('User does not have enough scope')
      }
      return markEventAsIssued(id, details, authHeader, EVENT_TYPE.BIRTH)
    },
    markDeathAsCertified: requireAssignment(
      (_, { id, details }, { headers: authHeader }) => {
        if (
          !hasScope(authHeader, SCOPES.RECORD_PRINT_ISSUE_CERTIFIED_COPIES) &&
          !hasScope(authHeader, SCOPES.SELF_SERVICE_PORTAL)
        ) {
          throw new Error('User does not have enough scope')
        }
        return markEventAsCertified(id, details, authHeader, EVENT_TYPE.DEATH)
      }
    ),
    // @todo: add new query for certify and issue later where require assignment wrapper will be used
    markDeathAsIssued: (_, { id, details }, { headers: authHeader }) => {
      if (
        !hasScope(authHeader, SCOPES.RECORD_PRINT_ISSUE_CERTIFIED_COPIES) &&
        !hasScope(authHeader, SCOPES.SELF_SERVICE_PORTAL)
      ) {
        throw new Error('User does not have enough scope')
      }
      return markEventAsIssued(id, details, authHeader, EVENT_TYPE.DEATH)
    },
    markMarriageAsCertified: requireAssignment(
      (_, { id, details }, { headers: authHeader }) => {
        if (!hasScope(authHeader, SCOPES.RECORD_PRINT_ISSUE_CERTIFIED_COPIES)) {
          throw new Error('User does not have enough scope')
        }
        return markEventAsCertified(
          id,
          details,
          authHeader,
          EVENT_TYPE.MARRIAGE
        )
      }
    ),
    // @todo: add new query for certify and issue later where require assignment wrapper will be used
    markMarriageAsIssued: (_, { id, details }, { headers: authHeader }) => {
      if (!hasScope(authHeader, SCOPES.RECORD_PRINT_ISSUE_CERTIFIED_COPIES)) {
        throw new Error('User does not have enough scope')
      }
      return markEventAsIssued(id, details, authHeader, EVENT_TYPE.MARRIAGE)
    },
    async markEventAsNotDuplicate(_, { id }, { headers: authHeader }) {
      const isAssignedToThisUser = await checkUserAssignment(id, authHeader)
      if (!isAssignedToThisUser) {
        throw new UnassignError('User has been unassigned')
      }
      if (
        hasScope(authHeader, SCOPES.RECORD_REGISTER) ||
        hasScope(authHeader, SCOPES.RECORD_SUBMIT_FOR_APPROVAL)
      ) {
        const composition = await markNotADuplicate(id, authHeader)

        return composition.id
      } else {
        throw new Error('User does not have enough scope')
      }
    },
    async markEventAsUnassigned(_, { id }, { headers: authHeader }) {
      const assignedToSelf = await checkUserAssignment(id, authHeader)
      if (
        assignedToSelf ||
        inScope(authHeader, [SCOPES.RECORD_UNASSIGN_OTHERS])
      ) {
        const task = getTaskFromSavedBundle(
          await unassignRegistration(id, authHeader)
        )

        // return the taskId
        return task.id
      }
      throw new Error('User does not have enough scope')
    },
    async markEventAsDuplicate(
      _,
      { id, reason, comment, duplicateTrackingId },
      { headers: authHeader }
    ) {
      const hasAssignedToThisUser = await checkUserAssignment(id, authHeader)
      if (!hasAssignedToThisUser) {
        throw new UnassignError('User has been unassigned')
      }
      if (
        !inScope(authHeader, [
          SCOPES.RECORD_REGISTER,
          SCOPES.RECORD_SUBMIT_FOR_APPROVAL
        ])
      ) {
        throw new Error('User does not have enough scope')
      }

      const taskEntry = await duplicateRegistration(
        id,
        authHeader,
        reason,
        comment,
        duplicateTrackingId
      )

      return taskEntry.resource.id
    },
    async confirmRegistration(_, { id, details }, { headers: authHeader }) {
      if (!inScope(authHeader, [SCOPES.RECORD_CONFIRM_REGISTRATION])) {
        throw new Error('User does not have a Confirm Registration scope')
      }

      if (!hasRecordAccess(authHeader, id)) {
        throw new Error('User does not have access to the record')
      }

      try {
        const taskEntry = await confirmRegistration(id, authHeader, details)

        return taskEntry.resource.id
      } catch (error) {
        throw new Error(`Failed to confirm registration: ${error.message}`)
      }
    },
    async rejectRegistration(_, { id, details }, { headers: authHeader }) {
      if (!inScope(authHeader, [SCOPES.RECORD_REJECT_REGISTRATION])) {
        throw new Error('User does not have a Reject Registration" scope')
      }

      if (!hasRecordAccess(authHeader, id)) {
        throw new Error('User does not have access to the record')
      }

      try {
        const taskEntry = await rejectRegistration(id, authHeader, {
          comment: details.comment || 'No comment provided',
          reason: details.reason
        })

        return taskEntry.resource.id
      } catch (error) {
        throw new Error(`Error in rejectRegistration: ${error.message}`)
      }
    },
    async upsertRegistrationIdentifier(
      _,
      { id, identifierType, identifierValue },
      { headers: authHeader }
    ) {
      if (!hasRecordAccess(authHeader, id)) {
        throw new Error('User does not have access to the record')
      }

      try {
        const taskEntry = await upsertRegistrationIdentifier(id, authHeader, {
          identifiers: [{ type: identifierType, value: identifierValue }]
        })

        return taskEntry.resource.id
      } catch (error) {
        throw new Error(`Failed to confirm registration: ${error.message}`)
      }
    },
    async updateField(_, { id, details }, { headers: authHeader }) {
      if (!hasRecordAccess(authHeader, id)) {
        throw new Error('User does not have access to the record')
      }

      await updateField(id, authHeader, details)

      return true
    }
  }
}

async function markEventAsValidated(
  id: string,
  authHeader: IAuthHeader,
  event: EVENT_TYPE,
  details?:
    | GQLBirthRegistrationInput
    | GQLDeathRegistrationInput
    | GQLMarriageRegistrationInput
) {
  if (
    details?.registration?.changedValues &&
    details.registration.changedValues.length > 0
  ) {
    await updateRegistration(id, authHeader, details, event)
  }

  const comment =
    details?.registration?.status?.[0]?.comments?.[0]?.comment ?? undefined
  const timeLoggedMS =
    details?.registration?.status?.[0]?.timeLoggedMS ?? undefined

  await validateRegistration(id, authHeader, comment, timeLoggedMS)
  return id
}

async function markEventAsRegistered(
  id: string,
  authHeader: IAuthHeader,
  event: EVENT_TYPE,
  details:
    | GQLBirthRegistrationInput
    | GQLDeathRegistrationInput
    | GQLMarriageRegistrationInput
) {
  if (
    details?.registration?.changedValues &&
    details.registration.changedValues.length > 0
  ) {
    await updateRegistration(id, authHeader, details, event)
  }

  const comments =
    details?.registration?.status?.[0]?.comments?.[0]?.comment ?? undefined
  const timeLoggedMS =
    details?.registration?.status?.[0]?.timeLoggedMS ?? undefined

  await registerDeclaration(id, authHeader, comments, timeLoggedMS)
  return id
}

async function markEventAsCertified(
  id: string,
  details:
    | GQLBirthRegistrationInput
    | GQLDeathRegistrationInput
    | GQLMarriageRegistrationInput,
  authHeader: IAuthHeader,
  event: EVENT_TYPE
) {
  await setCollectorForPrintInAdvance(details, authHeader)
  const certificateDetails = details.registration?.certificates?.[0]
  if (!certificateDetails) {
    return Promise.reject(new Error('Certificate details required'))
  }
  const certifiedRecord = await certifyRegistration(
    id,
    certificateDetails,
    event,
    authHeader
  )
  return getComposition(certifiedRecord).id
}

async function markEventAsIssued(
  id: string,
  details:
    | GQLBirthRegistrationInput
    | GQLDeathRegistrationInput
    | GQLMarriageRegistrationInput,
  authHeader: IAuthHeader,
  event: EVENT_TYPE
) {
  const certificateDetails = details.registration?.certificates?.[0]
  if (!certificateDetails) {
    return Promise.reject(new Error('Certificate details required'))
  }
  const { payments, ...withoutPayments } = certificateDetails
  if (!payments?.[0]) {
    return Promise.reject(new Error('Payment details required'))
  }
  const issuedRecord = await issueRegistration(
    id,
    { ...withoutPayments, payment: payments[0] },
    event,
    authHeader
  )
  return getComposition(issuedRecord).id
}
