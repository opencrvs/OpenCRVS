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
  DOWNLOAD_STATUS,
  IApplication,
  modifyApplication,
  writeApplication,
  createReviewApplication
} from '@client/applications'
import { Action, IForm, IFormData } from '@client/forms'
import { AppStore } from '@client/store'
import { client } from '@client/utils/apolloClient'
// eslint-disable-next-line no-restricted-imports
import * as Sentry from '@sentry/browser'
import ApolloClient, { ApolloError } from 'apollo-client'
import { getRegisterForm } from './forms/register/application-selectors'
import { gqlToDraftTransformer } from './transformer'
import { getQueryMapping } from './views/DataProvider/QueryProvider'
import { RequestHandler } from 'mock-apollo-client'
import { DocumentNode } from 'apollo-link'

const INTERVAL_TIME = 5000
const MAX_RETRY_ATTEMPT = 3
const ALLOWED_STATUS_FOR_RETRY = [DOWNLOAD_STATUS.READY_TO_DOWNLOAD.toString()]

interface IActionList {
  [key: string]: string
}

const ACTION_LIST: IActionList = {
  [Action.LOAD_REVIEW_APPLICATION]: Action.LOAD_REVIEW_APPLICATION,
  [Action.LOAD_CERTIFICATE_APPLICATION]: Action.LOAD_CERTIFICATE_APPLICATION
}

const REQUEST_IN_PROGRESS_STATUS: IActionList = {
  [Action.LOAD_REVIEW_APPLICATION]: DOWNLOAD_STATUS.DOWNLOADING,
  [Action.LOAD_CERTIFICATE_APPLICATION]: DOWNLOAD_STATUS.DOWNLOADING
}

const SUCCESS_DOWNLOAD_STATUS: IActionList = {
  [Action.LOAD_REVIEW_APPLICATION]: DOWNLOAD_STATUS.DOWNLOADED,
  [Action.LOAD_CERTIFICATE_APPLICATION]: DOWNLOAD_STATUS.DOWNLOADED
}

export class InboxController {
  private store: AppStore
  public client: ApolloClient<{}> & {
    setRequestHandler: (query: DocumentNode, handler: RequestHandler) => void // used for mocking in tests
  }
  public syncRunning: boolean = false

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

  private getDownloadableApplications = () => {
    return this.getApplications().filter(
      (app: IApplication) =>
        app.downloadStatus &&
        ALLOWED_STATUS_FOR_RETRY.includes(app.downloadStatus)
    )
  }

  public sync = async () => {
    if (this.syncRunning) {
      return
    }

    this.syncRunning = true

    const applications = this.getDownloadableApplications()
    for (const application of applications) {
      await this.queryData(application)
    }

    this.syncRunning = false
  }

  public queryData = async (application: IApplication | undefined) => {
    if (!application) {
      return
    }

    const applicationAction = ACTION_LIST[application.action as string] || null

    const forms = getRegisterForm(this.store.getState())

    const result = getQueryMapping(
      application.event,
      // @ts-ignore
      applicationAction
    )
    const { query, dataKey } = result || {
      query: null,
      dataKey: null
    }

    const requestInProgressStatus =
      REQUEST_IN_PROGRESS_STATUS[application.action as string] ||
      DOWNLOAD_STATUS.DOWNLOADING
    application.downloadStatus = requestInProgressStatus
    this.store.dispatch(modifyApplication(application))
    this.store.dispatch(writeApplication(application))

    if (query) {
      try {
        const queryResult = await this.client.query({
          query,
          variables: {
            id: application.id
          }
        })
        this.onSuccess(
          application,
          forms[application.event],
          queryResult.data[dataKey as string]
        )
      } catch (exception) {
        this.onError(application, exception)
      }
    }
  }

  private onSuccess = (application: IApplication, form: IForm, result: any) => {
    const transData: IFormData = gqlToDraftTransformer(form, result)
    const app: IApplication = createReviewApplication(
      application.id,
      transData,
      application.event
    )
    app.downloadStatus =
      SUCCESS_DOWNLOAD_STATUS[application.action as string] ||
      DOWNLOAD_STATUS.DOWNLOADED
    this.store.dispatch(modifyApplication(app))
    this.store.dispatch(writeApplication(app))
  }

  private onError = (application: IApplication, error: ApolloError) => {
    application.downloadRetryAttempt =
      (application.downloadRetryAttempt || 0) + 1

    if (application.downloadRetryAttempt < MAX_RETRY_ATTEMPT) {
      application.downloadStatus = DOWNLOAD_STATUS.READY_TO_DOWNLOAD
      this.store.dispatch(modifyApplication(application))
      this.store.dispatch(writeApplication(application))
      return
    }

    let status
    if (error.networkError) {
      status = DOWNLOAD_STATUS.FAILED_NETWORK
    } else {
      status = DOWNLOAD_STATUS.FAILED
      Sentry.captureException(error)
    }

    application.downloadStatus = status
    this.store.dispatch(modifyApplication(application))
    this.store.dispatch(writeApplication(application))
  }
}
