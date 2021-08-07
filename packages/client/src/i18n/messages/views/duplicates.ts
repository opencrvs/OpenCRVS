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

interface IDuplicatesMessages extends Record<string, MessageDescriptor> {
  notDuplicate: MessageDescriptor
  notDuplicateConfirmationTxt: MessageDescriptor
  rejectDescription: MessageDescriptor
  duplicateFoundTitle: MessageDescriptor
  duplicateFoundDescription: MessageDescriptor
  possibleDuplicateFound: MessageDescriptor
  duplicateReview: MessageDescriptor
  keep: MessageDescriptor
  duplicate: MessageDescriptor
}

const messagesToDefine: IDuplicatesMessages = {
  rejectDescription: {
    id: 'duplicates.modal.reject',
    defaultMessage:
      'Are you sure you want to reject this application for being a duplicate ?',
    description: 'Description of the reject modal'
  },
  duplicateFoundTitle: {
    id: 'duplicates.duplicateFoundTitle',
    defaultMessage: 'Possible duplicate found',
    description: 'The title of the text box in the duplicates page'
  },
  duplicateFoundDescription: {
    id: 'duplicates.duplicateFoundDescription',
    defaultMessage:
      'The following application has been flagged as a possible duplicate of an existing registered record.',
    description: 'The description at the top of the duplicates page'
  },
  possibleDuplicateFound: {
    id: 'duplicates.possibleDuplicateFound',
    defaultMessage: 'Possible duplicate',
    description: 'The duplicates page title'
  },
  notDuplicate: {
    id: 'duplicates.details.notDuplicate',
    defaultMessage: 'Not a duplicate?',
    description: 'A Question which is a link: Not a duplicate?'
  },
  notDuplicateConfirmationTxt: {
    id: 'duplicates.notDuplicate.modal.confirmationText',
    defaultMessage: 'Are you sure this is not a duplicate application?',
    description: 'Not a duplicate modal confirmation text'
  },
  duplicateReview: {
    id: 'duplicates.details.duplicateReview',
    defaultMessage: 'Duplicate review',
    description: 'Duplicate review Page header'
  },
  keep: {
    id: 'duplicates.details.keep',
    defaultMessage: 'Keep',
    description: 'Button text for non duplicate'
  },
  duplicate: {
    id: 'duplicates.details.duplicate',
    defaultMessage: 'Duplicate',
    description: 'Button text for Duplicate'
  }
}

export const messages: IDuplicatesMessages = defineMessages(messagesToDefine)
