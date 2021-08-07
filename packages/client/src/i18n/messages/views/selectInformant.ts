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

interface ISelectInformantMessages extends Record<string, MessageDescriptor> {
  birthInformantTitle: MessageDescriptor
  deathInformantTitle: MessageDescriptor
  parents: MessageDescriptor
  legalGuardian: MessageDescriptor
  birthErrorMessage: MessageDescriptor
  deathErrorMessage: MessageDescriptor
}

const messagesToDefine: ISelectInformantMessages = {
  birthInformantTitle: {
    id: 'register.selectInformant.birthInformantTitle',
    defaultMessage: 'Who is applying for birth registration?',
    description: 'The title that appears when asking for the birth informant'
  },
  deathInformantTitle: {
    id: 'register.selectInformant.deathInformantTitle',
    defaultMessage:
      'What relationship does the applicant have to the deceased?',
    description: 'The title that appears when asking for the death informant'
  },
  parents: {
    id: 'register.selectInformant.parents',
    defaultMessage: 'Mother & Father',
    description:
      'The description that appears when selecting the parent as informant'
  },
  legalGuardian: {
    id: 'register.selectinformant.legalGuardian',
    defaultMessage: 'Legal guardian',
    description: 'Informant option'
  },
  birthErrorMessage: {
    id: 'register.selectInformant.birthErrorMessage',
    defaultMessage: 'Please select who is present and applying',
    description: 'Error Message to show when no informant is selected for birth'
  },
  deathErrorMessage: {
    id: 'register.selectInformant.deathErrorMessage',
    defaultMessage: 'Please select the relationship to the deceased.',
    description: 'Error Message to show when no informant is selected for death'
  }
}

export const messages: ISelectInformantMessages = defineMessages(
  messagesToDefine
)
