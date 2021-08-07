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

interface IregistrationHomeMessages extends Record<string, MessageDescriptor> {
  certified: MessageDescriptor
  dataTableResults: MessageDescriptor
  inProgress: MessageDescriptor
  inProgressFieldAgents: MessageDescriptor
  inProgressOwnDrafts: MessageDescriptor
  hospitalDrafts: MessageDescriptor
  listItemAction: MessageDescriptor
  listItemApplicationDate: MessageDescriptor
  listItemRegisteredDate: MessageDescriptor
  readyForReview: MessageDescriptor
  readyToPrint: MessageDescriptor
  registrationNumber: MessageDescriptor
  sentForApprovals: MessageDescriptor
  sentForUpdates: MessageDescriptor
  sentForExternalValidation: MessageDescriptor
  validatedApplicationTooltipForRegistrar: MessageDescriptor
  validatedApplicationTooltipForRegistrationAgent: MessageDescriptor
  waitingForExternalValidation: MessageDescriptor
}

const messagesToDefine: IregistrationHomeMessages = {
  certified: {
    defaultMessage: 'Certified',
    description: 'Label for registration status certified',
    id: 'regHome.certified'
  },
  dataTableResults: {
    defaultMessage: 'Results',
    description: 'Results label at the top of the data table component',
    id: 'regHome.table.label'
  },
  inProgress: {
    defaultMessage: 'In progress',
    description: 'The title of In progress',
    id: 'regHome.inProgress'
  },
  inProgressFieldAgents: {
    defaultMessage: 'Field agents',
    description: 'The title of In progress field agents',
    id: 'regHome.inPro.selector.field.agents'
  },
  inProgressOwnDrafts: {
    defaultMessage: 'Yours',
    description: 'The title of In progress own drafts',
    id: 'regHome.inPro.selector.own.drafts'
  },
  hospitalDrafts: {
    defaultMessage: 'Hospitals',
    description: 'The title of In progress Hospitals',
    id: 'regHome.inPro.selector.hospital.drafts'
  },
  listItemAction: {
    defaultMessage: 'Action',
    description: 'Label for action in work queue list item',
    id: 'regHome.table.label.action'
  },
  listItemApplicationDate: {
    defaultMessage: 'Application sent',
    description: 'Label for application date in work queue list item',
    id: 'regHome.table.label.applicationDate'
  },
  listItemRegisteredDate: {
    defaultMessage: 'Application registered',
    description: 'Label for date of registration in work queue list item',
    id: 'regHome.table.label.registeredDate'
  },
  readyForReview: {
    defaultMessage: 'Ready for review',
    description: 'The title of ready for review',
    id: 'regHome.readyForReview'
  },
  readyToPrint: {
    defaultMessage: 'Ready to print',
    description: 'The title of ready to print tab',
    id: 'regHome.readyToPrint'
  },
  registrationNumber: {
    defaultMessage: 'Registration no.',
    description: 'The heading of registration no. column',
    id: 'regHome.registrationNumber'
  },
  sentForApprovals: {
    defaultMessage: 'Sent for approval',
    description: 'The title of sent for approvals tab',
    id: 'regHome.sentForApprovals'
  },
  sentForExternalValidation: {
    defaultMessage: 'Sent to BRIS',
    description: 'The label for external validation waiting duration column',
    id: 'regHome.sentForExternalValidation'
  },
  sentForUpdates: {
    defaultMessage: 'Sent for updates',
    description: 'The title of sent for updates tab',
    id: 'regHome.sentForUpdates'
  },
  validatedApplicationTooltipForRegistrar: {
    defaultMessage: 'Application has been validated by a registration agent',
    description: 'Text to display for validated application as tooltip',
    id: 'regHome.validated.registrar.tooltip'
  },
  validatedApplicationTooltipForRegistrationAgent: {
    defaultMessage: 'Application has been validated and waiting for approval',
    description: 'Text to display for validated application as tooltip',
    id: 'regHome.val.regAgent.tooltip'
  },
  waitingForExternalValidation: {
    defaultMessage: 'Waiting for BRIS',
    description: 'The title of waiting for external validation',
    id: 'regHome.waitingForExternalValidation'
  }
}

export const messages: IregistrationHomeMessages = defineMessages(
  messagesToDefine
)
