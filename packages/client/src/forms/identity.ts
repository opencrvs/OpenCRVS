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
import { MessageDescriptor } from 'react-intl'
import { TEXT, IDynamicFieldTypeMapper, BIG_NUMBER } from '.'
import { formMessages as messages } from '@client/i18n/messages'

export const NATIONAL_ID = 'NATIONAL_ID'
export const BIRTH_REGISTRATION_NUMBER = 'BIRTH_REGISTRATION_NUMBER'
export const PASSPORT = 'PASSPORT'
export const DEATH_REGISTRATION_NUMBER = 'DEATH_REGISTRATION_NUMBER'
export const DRIVING_LICENSE = 'DRIVING_LICENSE'
export const REFUGEE_NUMBER = 'REFUGEE_NUMBER'
export const ALIEN_NUMBER = 'ALIEN_NUMBER'
export const OTHER = 'OTHER'
export const NO_ID = 'NO_ID'
export const SOCIAL_SECURITY_NO = 'SOCIAL_SECURITY_NO'

export const identityOptions = [
  { value: PASSPORT, label: messages.iDTypePassport },
  { value: NATIONAL_ID, label: messages.iDTypeNationalID },
  {
    value: DRIVING_LICENSE,
    label: messages.iDTypeDrivingLicense
  },
  {
    value: BIRTH_REGISTRATION_NUMBER,
    label: messages.iDTypeBRN
  },
  {
    value: REFUGEE_NUMBER,
    label: messages.iDTypeRefugeeNumber
  },
  { value: ALIEN_NUMBER, label: messages.iDTypeAlienNumber },
  { value: NO_ID, label: messages.iDTypeNoId },
  { value: OTHER, label: messages.iDTypeOther }
]

export const identityTypeMapper: IDynamicFieldTypeMapper = (key: string) => {
  switch (key) {
    case NATIONAL_ID:
      return BIG_NUMBER
    case BIRTH_REGISTRATION_NUMBER:
      return BIG_NUMBER
    case DEATH_REGISTRATION_NUMBER:
      return BIG_NUMBER
    default:
      return TEXT
  }
}

export function identityHelperTextMapper(
  code: string
): MessageDescriptor | undefined {
  switch (code) {
    case 'NATIONAL_ID':
      return messages.helperTextNID
    default:
      return undefined
  }
}

export function identityTooltipMapper(code: string): MessageDescriptor {
  switch (code) {
    case 'NATIONAL_ID':
      return messages.tooltipNationalID
    case 'BIRTH_REGISTRATION_NUMBER':
      return messages.iDTypeBRN
    default:
      return messages.iD
  }
}

export function identityNameMapper(code: string): MessageDescriptor {
  switch (code) {
    case 'NATIONAL_ID':
      return messages.iDTypeNationalID
    case 'PASSPORT':
      return messages.iDTypePassport
    case 'DRIVING_LICENSE':
      return messages.iDTypeDrivingLicense
    case 'BIRTH_REGISTRATION_NUMBER':
      return messages.iDTypeBRN
    case 'DEATH_REGISTRATION_NUMBER':
      return messages.iDTypeDRN
    case 'REFUGEE_NUMBER':
      return messages.iDTypeRefugeeNumber
    case 'ALIEN_NUMBER':
      return messages.iDTypeAlienNumber
    default:
      return messages.iD
  }
}
