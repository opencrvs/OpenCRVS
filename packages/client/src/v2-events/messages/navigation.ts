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

interface INavigationMessages
  extends Record<string | number | symbol, MessageDescriptor> {
  CREATED: MessageDescriptor
  DECLARED: MessageDescriptor
  REGISTERED: MessageDescriptor
}

const messagesToDefine: INavigationMessages = {
  CREATED: {
    defaultMessage: 'In progress',
    description: 'In progress label in navigation',
    id: 'v2.navigation.CREATED'
  },
  DECLARED: {
    defaultMessage: 'Ready for review',
    description: 'Ready for review label in navigation',
    id: 'v2.navigation.DECLARED'
  },
  REGISTERED: {
    defaultMessage: 'Ready to print',
    description: 'Ready to print label in navigation',
    id: 'v2.navigation.REGISTERED'
  }
}

/** @knipignore */
export const navigationMessages: INavigationMessages =
  defineMessages(messagesToDefine)
