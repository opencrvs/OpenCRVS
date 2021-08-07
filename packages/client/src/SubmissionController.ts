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
import ApolloClient, { ApolloError } from 'apollo-client'
// eslint-disable-next-line no-restricted-imports
import * as Sentry from '@sentry/browser'
import {
  IApplication,
  modifyApplication,
  writeApplication,
  SUBMISSION_STATUS,
  updateRegistrarWorkqueue,
  deleteApplication
} from '@client/applications'
import { Action } from '@client/forms'
import { getRegisterForm } from '@client/forms/register/application-selectors'
import { AppStore } from '@client/store'
import { getMutationMapping } from '@client/views/DataProvider/MutationProvider'
import { REGISTRATION_HOME_QUERY } from '@client/views/RegistrationHome/queries'
import { getOperationName } from 'apollo-utilities'
import { client } from '@client/utils/apolloClient'
import moment from 'moment'
import { FetchResult, DocumentNode } from 'apollo-link'
import {
  getAttachmentSectionKey,
  updateApplicationTaskHistory
} from './utils/draftUtils'
import { getScope } from './profile/profileSelectors'
import { RequestHandler } from 'mock-apollo-client'

const INTERVAL_TIME = 5000
const HANGING_EXPIRE_MINUTES = 15
const ALLOWED_STATUS_FOR_RETRY = [
  SUBMISSION_STATUS.READY_TO_SUBMIT.toString(),
  SUBMISSION_STATUS.READY_TO_APPROVE.toString(),
  SUBMISSION_STATUS.READY_TO_REGISTER.toString(),
  SUBMISSION_STATUS.READY_TO_REJECT.toString(),
  SUBMISSION_STATUS.READY_TO_CERTIFY.toString(),
  SUBMISSION_STATUS.FAILED_NETWORK.toString()
]
const INPROGRESS_STATUS = [
  SUBMISSION_STATUS.SUBMITTING.toString(),
  SUBMISSION_STATUS.APPROVING.toString(),
  SUBMISSION_STATUS.REGISTERING.toString(),
  SUBMISSION_STATUS.REJECTING.toString(),
  SUBMISSION_STATUS.CERTIFYING.toString()
]
const changeStatus = {
  [SUBMISSION_STATUS.SUBMITTING.toString()]: SUBMISSION_STATUS.READY_TO_SUBMIT,
  [SUBMISSION_STATUS.APPROVING.toString()]: SUBMISSION_STATUS.READY_TO_APPROVE,
  [SUBMISSION_STATUS.REGISTERING.toString()]: SUBMISSION_STATUS.READY_TO_REGISTER,
  [SUBMISSION_STATUS.REJECTING.toString()]: SUBMISSION_STATUS.READY_TO_REJECT,
  [SUBMISSION_STATUS.CERTIFYING.toString()]: SUBMISSION_STATUS.READY_TO_CERTIFY
}

interface IActionList {
  [key: string]: string
}

const ACTION_LIST: IActionList = {
  [Action.SUBMIT_FOR_REVIEW]: Action.SUBMIT_FOR_REVIEW,
  [Action.APPROVE_APPLICATION]: Action.APPROVE_APPLICATION,
  [Action.REGISTER_APPLICATION]: Action.REGISTER_APPLICATION,
  [Action.REJECT_APPLICATION]: Action.REJECT_APPLICATION,
  [Action.COLLECT_CERTIFICATE]: Action.COLLECT_CERTIFICATE
}
const REQUEST_IN_PROGRESS_STATUS: IActionList = {
  [Action.SUBMIT_FOR_REVIEW]: SUBMISSION_STATUS.SUBMITTING,
  [Action.APPROVE_APPLICATION]: SUBMISSION_STATUS.APPROVING,
  [Action.REGISTER_APPLICATION]: SUBMISSION_STATUS.REGISTERING,
  [Action.REJECT_APPLICATION]: SUBMISSION_STATUS.REJECTING,
  [Action.COLLECT_CERTIFICATE]: SUBMISSION_STATUS.CERTIFYING
}
const SUCCESS_SUBMISSION_STATUS: IActionList = {
  [Action.SUBMIT_FOR_REVIEW]: SUBMISSION_STATUS.SUBMITTED,
  [Action.APPROVE_APPLICATION]: SUBMISSION_STATUS.APPROVED,
  [Action.REGISTER_APPLICATION]: SUBMISSION_STATUS.REGISTERED,
  [Action.REJECT_APPLICATION]: SUBMISSION_STATUS.REJECTED,
  [Action.COLLECT_CERTIFICATE]: SUBMISSION_STATUS.CERTIFIED
}

export class SubmissionController {
  private store: AppStore
  public client: ApolloClient<{}> & {
    setRequestHandler: (query: DocumentNode, handler: RequestHandler) => void // used for mocking in tests
  }
  public syncRunning: boolean = false
  private syncCount: number = 0

  constructor(store: AppStore) {
    this.store = store
    this.client = client
  }

  public start = () => {
    setInterval(() => {
      this.sync()
    }, INTERVAL_TIME)
  }

  private getApplications = () =>
    this.store.getState().applicationsState.applications || []

  private getSubmitableApplications = () => {
    return this.getApplications().filter(
      (app: IApplication) =>
        app.submissionStatus &&
        ALLOWED_STATUS_FOR_RETRY.includes(app.submissionStatus)
    )
  }
  public requeueHangingApplications = async () => {
    const now = moment(Date.now())
    this.getApplications()
      .filter((app: IApplication) => {
        return (
          app.submissionStatus &&
          INPROGRESS_STATUS.includes(app.submissionStatus) &&
          now.diff(app.modifiedOn, 'minutes') > HANGING_EXPIRE_MINUTES
        )
      })
      .forEach(async (app: IApplication) => {
        if (app.submissionStatus) {
          app.submissionStatus = changeStatus[app.submissionStatus]
          await this.store.dispatch(modifyApplication(app))
          await this.store.dispatch(writeApplication(app))
        }
      })
  }
  /* eslint-disable no-console */

  public sync = async () => {
    this.syncCount++
    console.debug(`[${this.syncCount}] Starting sync...`)
    if (!navigator.onLine || this.syncRunning) {
      console.debug(
        `[${this.syncCount}] Sync exiting early (offline or already syncing)`
      )
      return
    }

    this.syncRunning = true

    await this.requeueHangingApplications()
    const applications = this.getSubmitableApplications()
    console.debug(
      `[${this.syncCount}] Syncing ${applications.length} applications`
    )
    for (const application of applications) {
      await this.callMutation(application)
    }

    this.syncRunning = false
    console.debug(`[${this.syncCount}] Finish sync.`)
  }

  /* eslint-enable no-console */

  private callMutation = async (application: IApplication | undefined) => {
    if (!application) {
      return
    }

    const applicationAction = ACTION_LIST[application.action || ''] || null

    const forms = getRegisterForm(this.store.getState())

    const result = getMutationMapping(
      application.event,
      // @ts-ignore
      applicationAction,
      application.payload,
      forms[application.event],
      application
    )
    const { mutation, variables } = result || {
      mutation: null,
      variables: null
    }

    const requestInProgressStatus =
      REQUEST_IN_PROGRESS_STATUS[application.action || ''] ||
      SUBMISSION_STATUS.SUBMITTING
    application.submissionStatus = requestInProgressStatus
    await this.store.dispatch(modifyApplication(application))
    await this.store.dispatch(writeApplication(application))

    if (mutation) {
      try {
        const mutationResult = await this.client.mutate({
          mutation,
          variables,
          refetchQueries: [getOperationName(REGISTRATION_HOME_QUERY) || ''],
          awaitRefetchQueries: true
        })
        await this.onSuccess(application, mutationResult)
      } catch (exception) {
        await this.onError(application, exception)
      }
    }
  }

  private onSuccess = async (
    application: IApplication,
    result: FetchResult<any, any, any>
  ) => {
    const submissionStatus =
      SUCCESS_SUBMISSION_STATUS[application.action || ''] ||
      SUBMISSION_STATUS.SUBMITTED
    application.submissionStatus = submissionStatus
    let response =
      (result && result.data && result.data.createBirthRegistration) ||
      (result && result.data && result.data.createDeathRegistration) ||
      null
    if (response) {
      const { compositionId, trackingId } = response
      if (compositionId) {
        application.compositionId = compositionId
      }
      if (trackingId) {
        application.trackingId = trackingId
      }
    }
    const scopes = getScope(this.store.getState()) || []
    if (
      application.submissionStatus === SUBMISSION_STATUS.SUBMITTED &&
      scopes.includes('declare')
    ) {
      const taskHistory = updateApplicationTaskHistory(
        application,
        this.store.getState().profile.userDetails
      )
      if (!application.operationHistories) {
        application.operationHistories = []
      }
      application.operationHistories.push(taskHistory)
    }
    await this.store.dispatch(updateRegistrarWorkqueue())
    await this.store.dispatch(modifyApplication(application))

    if (
      application.submissionStatus === SUBMISSION_STATUS.SUBMITTED ||
      application.submissionStatus === SUBMISSION_STATUS.APPROVED ||
      application.submissionStatus === SUBMISSION_STATUS.REGISTERED ||
      application.submissionStatus === SUBMISSION_STATUS.REJECTED
    ) {
      if (scopes.includes('declare')) {
        const attachmentSectionKey = getAttachmentSectionKey(application.event)
        if (
          application.data &&
          application.data[attachmentSectionKey] &&
          Object.keys(application.data[attachmentSectionKey]).length > 0
        ) {
          delete application.data[attachmentSectionKey]
        }
        this.store.dispatch(writeApplication(application))
      } else {
        this.store.dispatch(deleteApplication(application))
      }
    } else {
      await this.store.dispatch(writeApplication(application))
    }
  }

  private onError = async (application: IApplication, error: ApolloError) => {
    let status
    if (error.networkError) {
      status = SUBMISSION_STATUS.FAILED_NETWORK
    } else {
      status = SUBMISSION_STATUS.FAILED
      Sentry.captureException(error)
    }

    application.submissionStatus = status
    await this.store.dispatch(modifyApplication(application))
    await this.store.dispatch(writeApplication(application))
  }
}
