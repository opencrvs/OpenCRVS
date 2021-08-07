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

interface IFieldAgentHomeMessages extends Record<string, MessageDescriptor> {
  inProgressCount: MessageDescriptor
  sentForReviewCount: MessageDescriptor
  requireUpdates: MessageDescriptor
  zeroUpdatesText: MessageDescriptor
  allUpdatesText: MessageDescriptor
  requireUpdatesLoading: MessageDescriptor
}

const messagesToDefine: IFieldAgentHomeMessages = {
  inProgressCount: {
    id: 'fieldAgentHome.inProgressCount',
    defaultMessage: 'In progress ({total})',
    description: 'The title of in progress tab'
  },
  sentForReviewCount: {
    id: 'fieldAgentHome.sentForReviewCount',
    defaultMessage: 'Sent for review ({total})',
    description: 'The title of sent for review tab'
  },
  requireUpdates: {
    id: 'fieldAgentHome.requireUpdatesCount',
    defaultMessage: 'Require updates ({total})',
    description: 'The title of require updates tab'
  },

  zeroUpdatesText: {
    id: 'fieldAgentHome.zeroUpdatesText',
    defaultMessage: 'No applications require updates',
    description: 'The text when no rejected applications'
  },
  allUpdatesText: {
    id: 'fieldAgentHome.allUpdatesText',
    defaultMessage: 'Great job! You have updated all applications',
    description: 'The text when all rejected applications updated'
  },
  requireUpdatesLoading: {
    id: 'fieldAgentHome.requireUpdatesCountLoading',
    defaultMessage: 'Checking your applications',
    description: 'The text when all rejected applications are loading'
  }
}

export const messages: IFieldAgentHomeMessages = defineMessages(
  messagesToDefine
)
