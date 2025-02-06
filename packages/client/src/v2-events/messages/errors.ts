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

interface IErrorMessages
  extends Record<string | number | symbol, MessageDescriptor> {
  queryError: MessageDescriptor
}

const messagesToDefine: IErrorMessages = {
  queryError: {
    defaultMessage: 'An error occurred while searching',
    description: 'The error message shown when a search query fails',
    id: 'v2.error.search'
  }
}

export const errorMessages: IErrorMessages = defineMessages(messagesToDefine)
