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
import { defineMessages, MessageDescriptor } from 'react-intl'

interface IErrorMessages extends Record<string, MessageDescriptor> {
  draftFailed: MessageDescriptor
  duplicateQueryError: MessageDescriptor
  errorCodeUnauthorized: MessageDescriptor
  unknownErrorTitle: MessageDescriptor
  unknownErrorDescription: MessageDescriptor
  errorTitle: MessageDescriptor
  errorTitleUnauthorized: MessageDescriptor
  fieldAgentQueryError: MessageDescriptor
  pleaseTryAgainError: MessageDescriptor
  printQueryError: MessageDescriptor
  queryError: MessageDescriptor
  registrationQueryError: MessageDescriptor
  unauthorized: MessageDescriptor
  userQueryError: MessageDescriptor
  loadingApplications: MessageDescriptor
  noApplication: MessageDescriptor
  waitingForConnection: MessageDescriptor
  pageLoadFailed: MessageDescriptor
  passwordSubmissionError: MessageDescriptor
}

const messagesToDefine: IErrorMessages = {
  draftFailed: {
    defaultMessage:
      'This is some messaging on advicing the user on what to do... in the event of a failed applicaton.',
    description: 'Tips for failed applications',
    id: 'error.draftFailed'
  },
  duplicateQueryError: {
    defaultMessage: 'An error occurred while fetching data',
    description: 'The error message shown when a search query fails',
    id: 'duplicates.queryError'
  },
  errorCodeUnauthorized: {
    defaultMessage: '401',
    description: 'Error code',
    id: 'error.code'
  },
  unknownErrorTitle: {
    defaultMessage: 'Something went wrong.',
    description: 'Error description',
    id: 'error.somethingWentWrong'
  },
  unknownErrorDescription: {
    defaultMessage: "It's not you, it's us. This is our fault.",
    description: 'Error description',
    id: 'error.weAreTryingToFixThisError'
  },
  errorTitle: {
    defaultMessage: 'Whoops!',
    description: 'Error title',
    id: 'error.title'
  },
  errorTitleUnauthorized: {
    defaultMessage: 'Unauthorized!',
    description: 'Error title unauthorized',
    id: 'error.title.unauthorized'
  },
  fieldAgentQueryError: {
    defaultMessage: 'An error occurred while loading applications',
    description: 'The text when error ocurred loading rejected applications',
    id: 'fieldAgentHome.queryError'
  },
  pleaseTryAgainError: {
    defaultMessage: 'An error occurred. Please try again.',
    description:
      'The error message that displays if we want the user to try the action again',
    id: 'error.occurred'
  },
  printQueryError: {
    defaultMessage:
      'An error occurred while querying for birth registration data',
    description: 'The error message shown when a query fails',
    id: 'print.certificate.queryError'
  },
  queryError: {
    defaultMessage: 'An error occurred while searching',
    description: 'The error message shown when a search query fails',
    id: 'error.search'
  },
  registrationQueryError: {
    defaultMessage: 'An error occurred while fetching birth registration',
    description: 'The error message shown when a query fails',
    id: 'review.birthRegistration.queryError'
  },
  unauthorized: {
    defaultMessage: 'We are unable to display this page to you',
    description: 'The error message shown when a query fails',
    id: 'review.error.unauthorized'
  },
  userQueryError: {
    defaultMessage: 'An error occurred while loading system users',
    description: 'The text when error ocurred loading system users',
    id: 'system.user.queryError'
  },
  loadingApplications: {
    defaultMessage: 'Loading applications...',
    description: 'The text when loading application',
    id: 'search.loadingApplications'
  },
  noApplication: {
    defaultMessage: 'No applications to review',
    description: 'The text when there is no application to review',
    id: 'search.noApplications'
  },
  waitingForConnection: {
    defaultMessage: 'Reconnect to load applications',
    description: 'The text when there is no connectivity',
    id: 'search.waitingForConnection'
  },
  pageLoadFailed: {
    defaultMessage: "Sorry, we couldn't laod the content for this page",
    description: 'Error message when page failed to load',
    id: 'error.page.load.failed'
  },
  passwordSubmissionError: {
    defaultMessage: 'The password you entered was incorrect',
    description: 'Error message when password verification fails',
    id: 'error.passwordSubmissionError'
  }
}

export const errorMessages: IErrorMessages = defineMessages(messagesToDefine)
