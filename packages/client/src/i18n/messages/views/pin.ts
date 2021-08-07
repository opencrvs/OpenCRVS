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

interface IPinMessages extends Record<string, MessageDescriptor> {
  createTitle: MessageDescriptor
  createDescription: MessageDescriptor
  pinSameDigitsError: MessageDescriptor
  pinSequentialDigitsError: MessageDescriptor
  pinMatchError: MessageDescriptor
  reEnterTitle: MessageDescriptor
  reEnterDescription: MessageDescriptor
  incorrect: MessageDescriptor
  lastTry: MessageDescriptor
  locked: MessageDescriptor
}

const messagesToDefine: IPinMessages = {
  incorrect: {
    id: 'unlockApp.incorrectPin',
    defaultMessage: 'Incorrect pin. Please try again',
    description: 'The message displayed when a user enters an incorrect PIN'
  },
  lastTry: {
    id: 'unlockApp.lastTry',
    defaultMessage: 'Last Try',
    description:
      'The message displayed before the 3rd attempt of an incorrect PIN'
  },
  locked: {
    id: 'unlockApp.locked',
    defaultMessage:
      'Your account has been locked. Please try again in 1 minute.',
    description: 'The title displayed while creating a PIN'
  },
  createTitle: {
    id: 'misc.createTitle',
    defaultMessage: 'Create a PIN',
    description: 'The title displayed while creating a PIN'
  },
  createDescription: {
    id: 'misc.createDescription',
    defaultMessage:
      "Choose a PIN that doesn't have 4 repeating digits or sequential numbers.",
    description: 'The description displayed while creating a PIN'
  },
  pinSameDigitsError: {
    id: 'misc.pinSameDigitsError',
    defaultMessage: 'PIN cannot have same 4 digits',
    description: 'The error displayed if PIN contains 4 same digits.'
  },
  pinSequentialDigitsError: {
    id: 'misc.pinSeqDigitsError',
    defaultMessage: 'PIN cannot contain sequential digits',
    description: 'The error displayed if PIN contains sequential digits.'
  },
  pinMatchError: {
    id: 'misc.pinMatchError',
    defaultMessage: 'PIN code did not match. Please try again.',
    description: "The error displayed if PINs don't match"
  },
  reEnterTitle: {
    id: 'misc.reEnterTitle',
    defaultMessage: 'Re-enter your new PIN',
    description: 'The title displayed while creating a PIN'
  },
  reEnterDescription: {
    id: 'misc.reEnterDescription',
    defaultMessage: "Let's make sure we collected your PIN correctly.",
    description: ''
  }
}

export const messages: IPinMessages = defineMessages(messagesToDefine)
