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
import { defineMessages, MessageDescriptor } from 'react-intl'

interface IWorkqueueMessages
  extends Record<string | number | symbol, MessageDescriptor> {
  CREATED: MessageDescriptor
  DECLARED: MessageDescriptor
  REGISTERED: MessageDescriptor
}

const messagesToDefine: IWorkqueueMessages = {
  CREATED: {
    id: 'v2.wq.noRecords.CREATED',
    defaultMessage: 'No records in progress',
    description: 'No records messages for empty draft tab'
  },
  DECLARED: {
    id: 'v2.wq.noRecords.DECLARED',
    defaultMessage: 'No records ready for review',
    description: 'No records messages for ready for review tab'
  },
  REGISTERED: {
    id: 'v2.wq.noRecords.REGISTERED',
    defaultMessage: 'No records ready to print',
    description: 'No records messages for ready to print tab'
  }
}

/** @knipignore */
export const wqMessages: IWorkqueueMessages = defineMessages(messagesToDefine)
