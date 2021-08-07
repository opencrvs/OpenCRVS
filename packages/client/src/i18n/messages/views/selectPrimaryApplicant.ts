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

interface ISelectPrimaryApplicantMessages
  extends Record<string, MessageDescriptor> {
  registerNewEventTitle: MessageDescriptor
  registerNewEventHeading: MessageDescriptor
  primaryApplicantDescription: MessageDescriptor
  errorMessage: MessageDescriptor
}

const messagesToDefine: ISelectPrimaryApplicantMessages = {
  registerNewEventTitle: {
    id: 'register.selectVitalEvent.registerNewEventTitle',
    defaultMessage: 'New application',
    description: 'The title that appears on the select vital event page'
  },
  registerNewEventHeading: {
    id: 'register.primaryApplicant.registerNewEventHeading',
    defaultMessage: 'Who is the primary applicant for this application?',
    description: 'The section heading on the page'
  },
  primaryApplicantDescription: {
    id: 'register.primaryApplicant.description',
    defaultMessage:
      'This person is responsible for providing accurate information in this application. ',
    description: 'The section heading on the page'
  },
  errorMessage: {
    id: 'register.primaryApplicant.errorMessage',
    defaultMessage: 'Please select who is the primary applicant',
    description: 'Error Message to show when no event is being selected'
  }
}

export const messages: ISelectPrimaryApplicantMessages = defineMessages(
  messagesToDefine
)
