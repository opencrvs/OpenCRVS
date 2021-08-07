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
import { validationMessages as messages } from '@client/i18n/messages'
import { IFormFieldValue, IFormData } from '@opencrvs/client/src/forms'
import {
  REGEXP_BLOCK_ALPHA_NUMERIC_DOT,
  REGEXP_ALPHA_NUMERIC,
  REGEXP_DECIMAL_POINT_NUMBER
} from '@client/utils/constants'
import { validate as validateEmail } from 'email-validator'
import * as XRegExp from 'xregexp'
import { isArray } from 'util'
import {
  NATIONAL_ID,
  BIRTH_REGISTRATION_NUMBER,
  DEATH_REGISTRATION_NUMBER,
  PASSPORT,
  DRIVING_LICENSE
} from '@client/forms/identity'
import moment from 'moment'

export interface IValidationResult {
  message: MessageDescriptor
  props?: { [key: string]: any }
}

export type RangeValidation = (
  min: number,
  max: number
) => (value: IFormFieldValue) => IValidationResult | undefined

export type MaxLengthValidation = (
  customisation: number
) => (value: IFormFieldValue) => IValidationResult | undefined

export type Validation = (
  value: IFormFieldValue,
  drafts?: IFormData
) => IValidationResult | undefined

export type ValidationInitializer = (...value: any[]) => Validation

export const isAValidPhoneNumberFormat = (value: string): boolean => {
  const { pattern } = window.config.PHONE_NUMBER_PATTERN
  return pattern.test(value)
}

export const isAValidEmailAddressFormat = (value: string): boolean => {
  return validateEmail(value)
}

export const isAValidDateFormat = (value: string): boolean => {
  const dateFormatRegex = '^\\d{4}-(0?[1-9]|1[012])-(0?[1-9]|[12][0-9]|3[01])$'
  const dateRegex = new RegExp(dateFormatRegex)

  if (!dateRegex.test(value)) {
    return false
  }

  const pad = (n: number) => {
    return (str: string) => {
      while (str.length < n) {
        str = '0' + str
      }
      return str
    }
  }

  const valueISOString = value
    .split(/-/g)
    .map(pad(2))
    .join('-')

  const givenDate = new Date(valueISOString)

  return givenDate.toISOString().slice(0, 10) === valueISOString
}

export const requiredSymbol: Validation = (value: IFormFieldValue) =>
  value ? undefined : { message: messages.requiredSymbol }

export const required = (
  message: MessageDescriptor = messages.required
): Validation => (value: IFormFieldValue) => {
  if (typeof value === 'string') {
    return value !== '' ? undefined : { message }
  }
  if (isArray(value)) {
    return value.length > 0 ? undefined : { message }
  }
  return value !== undefined && value !== null ? undefined : { message }
}

export const minLength = (min: number) => (value: string) => {
  return value && value.length < min
    ? { message: messages.minLength, props: { min } }
    : undefined
}

export const validLength = (length: number) => (value: IFormFieldValue) => {
  return value && value.toString().length === length
    ? undefined
    : {
        message: messages.validNationalId,
        props: { validLength: length }
      }
}

const isLessOrEqual = (value: string, max: number) => {
  return value && value.toString().length <= max
}

export const maxLength: MaxLengthValidation = (max: number) => (
  value: IFormFieldValue
) => {
  return isLessOrEqual(value as string, max)
    ? undefined
    : { message: messages.maxLength, props: { max } }
}

const isNumber = (value: string): boolean => !value || !isNaN(Number(value))

const isRegexpMatched = (value: string, regexp: string): boolean =>
  !value || value.match(regexp) !== null

export const blockAlphaNumericDot: Validation = (value: IFormFieldValue) => {
  const cast = value as string
  return isRegexpMatched(cast, REGEXP_BLOCK_ALPHA_NUMERIC_DOT)
    ? undefined
    : { message: messages.blockAlphaNumericDot }
}

export const nonDecimalPointNumber: Validation = (value: IFormFieldValue) => {
  const cast = value as string
  if (cast) {
    return !isRegexpMatched(cast.toString(), REGEXP_DECIMAL_POINT_NUMBER)
      ? undefined
      : { message: messages.nonDecimalPointNumber }
  }
}

export const numeric: Validation = (value: IFormFieldValue) => {
  const cast = value as string
  return isNumber(cast) ? undefined : { message: messages.numberRequired }
}

export const phoneNumberFormat: Validation = (value: IFormFieldValue) => {
  const { start, num } = window.config.PHONE_NUMBER_PATTERN
  const validationProps = { start, num }

  const cast = value as string
  const trimmedValue = cast === undefined || cast === null ? '' : cast.trim()

  if (!trimmedValue) {
    return undefined
  }

  return isAValidPhoneNumberFormat(trimmedValue)
    ? undefined
    : {
        message: messages.phoneNumberFormat,
        props: validationProps
      }
}

export const emailAddressFormat: Validation = (value: IFormFieldValue) => {
  const cast = value as string
  return cast && isAValidEmailAddressFormat(cast)
    ? undefined
    : {
        message: messages.emailAddressFormat
      }
}

export const dateFormat: Validation = (value: IFormFieldValue) => {
  const cast = value as string
  return cast && isAValidDateFormat(cast)
    ? undefined
    : {
        message: messages.dateFormat
      }
}

export const isDateNotInFuture = (date: string) => {
  return new Date(date) <= new Date(Date.now())
}

export const isDateNotBeforeBirth = (date: string, drafts: IFormData) => {
  const birthDate = drafts.deceased && drafts.deceased.birthDate
  return birthDate
    ? new Date(date) >= new Date(JSON.stringify(birthDate))
    : true
}

export const isDateNotAfterBirthEvent = (date: string, drafts?: IFormData) => {
  const dateOfBirth = drafts && drafts.child && drafts.child.childBirthDate
  return dateOfBirth
    ? new Date(date) <= new Date(JSON.stringify(dateOfBirth))
    : true
}

export const isDateNotAfterDeath = (date: string, drafts?: IFormData) => {
  const deathDate = drafts && drafts.deathEvent && drafts.deathEvent.deathDate
  return deathDate
    ? new Date(date).setHours(0, 0, 0, 0) <=
        new Date(JSON.stringify(deathDate)).setHours(0, 0, 0, 0)
    : true
}

export const isDateAfter = (first: string, second: string) => {
  return new Date(first) >= new Date(second)
}

export const minAgeGapExist = (
  first: string,
  second: string,
  minAgeGap: number
): boolean => {
  const diff =
    (new Date(first).getTime() - new Date(second).getTime()) /
    (1000 * 60 * 60 * 24) /
    365

  return diff >= minAgeGap
}

export const isValidBirthDate: Validation = (
  value: IFormFieldValue,
  drafts?
) => {
  const cast = value as string
  return !cast
    ? { message: messages.required }
    : cast &&
      isDateNotInFuture(cast) &&
      isAValidDateFormat(cast) &&
      isDateNotAfterBirthEvent(cast, drafts as IFormData)
    ? isDateNotAfterDeath(cast, drafts as IFormData)
      ? undefined
      : {
          message: messages.isDateNotAfterDeath
        }
    : {
        message: messages.isValidBirthDate
      }
}

export const isValidChildBirthDate: Validation = (value: IFormFieldValue) => {
  const childBirthDate = value as string
  return !childBirthDate
    ? { message: messages.required }
    : childBirthDate &&
      isAValidDateFormat(childBirthDate) &&
      isDateNotInFuture(childBirthDate)
    ? undefined
    : { message: messages.isValidBirthDate }
}

export const isValidParentsBirthDate = (minAgeGap: number): Validation => (
  value: IFormFieldValue,
  drafts
) => {
  const parentsBirthDate = value as string
  const childBirthDate =
    drafts && drafts.child && (drafts.child.childBirthDate as string)

  return parentsBirthDate &&
    isAValidDateFormat(parentsBirthDate) &&
    isDateNotInFuture(parentsBirthDate)
    ? childBirthDate
      ? minAgeGapExist(childBirthDate, parentsBirthDate, minAgeGap)
        ? undefined
        : {
            message: messages.isValidBirthDate
          }
      : undefined
    : {
        message: messages.isValidBirthDate
      }
}

export const checkBirthDate = (marriageDate: string): Validation => (
  value: IFormFieldValue
) => {
  const cast = value as string
  if (!isAValidDateFormat(cast)) {
    return {
      message: messages.dateFormat
    }
  }

  const bDate = new Date(cast)
  // didn't call `isDateNotInFuture(value)`, because no need to call `new Date(value)` twice
  if (bDate > new Date()) {
    return {
      message: messages.dateFormat
    }
  }

  if (!marriageDate || !isAValidDateFormat(marriageDate)) {
    return undefined
  }

  return bDate < new Date(marriageDate)
    ? undefined
    : {
        message: messages.dobEarlierThanDom
      }
}

export const checkMarriageDate = (birthDate: string): Validation => (
  value: IFormFieldValue
) => {
  const cast = value as string
  if (!isAValidDateFormat(cast)) {
    return {
      message: messages.dateFormat
    }
  }

  const mDate = new Date(cast)
  // didn't call `isDateNotInFuture(value)`, because no need to call `new Date(value)` twice
  if (mDate > new Date()) {
    return {
      message: messages.dateFormat
    }
  }

  if (!birthDate || !isAValidDateFormat(birthDate)) {
    return undefined
  }

  return mDate > new Date(birthDate)
    ? undefined
    : {
        message: messages.domLaterThanDob
      }
}

export const dateGreaterThan = (previousDate: string): Validation => (
  value: IFormFieldValue
) => {
  const cast = value as string
  if (!previousDate || !isAValidDateFormat(previousDate)) {
    return undefined
  }

  return new Date(cast) > new Date(previousDate)
    ? undefined
    : {
        message: messages.domLaterThanDob
      }
}

export const dateLessThan = (laterDate: string): Validation => (
  value: IFormFieldValue
) => {
  const cast = value as string
  if (!laterDate || !isAValidDateFormat(laterDate)) {
    return undefined
  }

  return new Date(cast) < new Date(laterDate)
    ? undefined
    : {
        message: messages.dobEarlierThanDom
      }
}

export const dateNotInFuture = (): Validation => (value: IFormFieldValue) => {
  const cast = value as string
  if (isDateNotInFuture(cast)) {
    return undefined
  } else {
    return { message: messages.dateFormat }
  }
}

export const dateNotToday = (date: string): boolean => {
  const today = new Date().setHours(0, 0, 0, 0)
  const day = new Date(date).setHours(0, 0, 0, 0)
  return day !== today
}

export const isDateInPast: Validation = (value: IFormFieldValue) => {
  const cast = value as string
  if (isDateNotInFuture(cast) && dateNotToday(cast)) {
    return undefined
  } else {
    return { message: messages.isValidBirthDate } // specific to DOB of parent/applicant
  }
}

export const dateInPast = (): Validation => (value: IFormFieldValue) =>
  isDateInPast(value)

export const dateFormatIsCorrect = (): Validation => (value: IFormFieldValue) =>
  dateFormat(value)

/*
 * TODO: The name validation functions should be refactored out.
 *
 * Name validation has some complexities. These will vary from country to
 * country too. e.g. in Bangladesh there is actually no given name or
 * family name. Or first name/last name. To fit names in the common western
 * format, people have to use multiple words in a "first name" or a "last name".
 *
 * Another complexity is what letters are allowed. Should we allow hyphens?
 * Then in Bengali, there are some rules which we can build to ensure better
 * quality input. e.g. a word can not start with a "mark" or diatribe.
 *
 * For now, we are going with simple validation that just prevents entering
 * an English name in the Bengali name field and vice versa.
 */

// Each character has to be a part of the Unicode Bengali script or the hyphen.

export const isValidBengaliWord = (value: string): boolean => {
  const bengaliRe = XRegExp.cache(
    '(^[\\p{Bengali}.-]*\\([\\p{Bengali}.-]+\\)[\\p{Bengali}.-]*$)|(^[\\p{Bengali}.-]+$)'
  )
  const lettersRe = XRegExp.cache(
    '(^[\\pL\\pM.-]*\\([\\pL\\pM.-]+\\)[\\pL\\pM.-]*$)|(^[\\pL\\pM.-]+$)'
  )

  return bengaliRe.test(value) && lettersRe.test(value)
}

//
// Simple pattern. Allow only English (Latin) characters and the hyphen.
//
export const isValidEnglishWord = (value: string): boolean => {
  // Still using XRegExp for its caching ability
  const englishRe = XRegExp.cache(
    '(^[\\p{Latin}.-]*\\([\\p{Latin}.-]+\\)[\\p{Latin}.-]*$)|(^[\\p{Latin}.-]+$)'
  )

  return englishRe.test(value)
}

type Checker = (value: string) => boolean

// Utility 2nd order function. Does a little common task then passes on to
// the callback.

const checkNameWords = (value: string, checker: Checker): boolean => {
  const trimmedValue = value === undefined || value === null ? '' : value.trim()

  if (!trimmedValue) {
    return true
  }

  const parts: string[] = trimmedValue.split(/\s+/)
  return parts.every(checker)
}

export const isValidBengaliName = (value: string): boolean => {
  return checkNameWords(value, isValidBengaliWord)
}

export const isValidEnglishName = (value: string): boolean => {
  return checkNameWords(value, isValidEnglishWord)
}

export const isLengthWithinRange = (value: string, min: number, max: number) =>
  !value || (value.length >= min && value.length <= max)

export const isValueWithinRange = (min: number, max: number) => (
  value: number
): boolean => {
  return !isNaN(value) && value >= min && value <= max
}

export const bengaliOnlyNameFormat: Validation = (value: IFormFieldValue) => {
  const cast = value as string
  return isValidBengaliName(cast)
    ? undefined
    : { message: messages.bengaliOnlyNameFormat }
}

export const englishOnlyNameFormat: Validation = (value: IFormFieldValue) => {
  const cast = value as string
  return isValidEnglishName(cast)
    ? undefined
    : { message: messages.englishOnlyNameFormat }
}

export const range: RangeValidation = (min: number, max: number) => (
  value: IFormFieldValue
) => {
  const cast = value as string
  return isValueWithinRange(min, max)(parseFloat(cast))
    ? undefined
    : { message: messages.range, props: { min, max } }
}

const hasValidLength = (value: string, length: number): boolean =>
  !value || value.length === length

export const validIDNumber = (typeOfID: string): Validation => (value: any) => {
  const validNationalIDLengths = [10, 17]
  const validBirthRegistrationNumberLength = 17
  const validDeathRegistrationNumberLength = 18
  const validPassportLength = 9
  const validDrivingLicenseLength = 15
  value = (value && value.toString()) || ''
  switch (typeOfID) {
    case NATIONAL_ID:
      const containsOnlyNumbers = value.match(/^[0-9]+$/)

      if (
        validNationalIDLengths.includes(value.length) &&
        containsOnlyNumbers
      ) {
        return undefined
      }
      return {
        message: messages.validNationalId,
        props: {
          min: validNationalIDLengths[0],
          max: validNationalIDLengths[1]
        }
      }

    case BIRTH_REGISTRATION_NUMBER:
      return hasValidLength(
        value.toString(),
        validBirthRegistrationNumberLength
      )
        ? undefined
        : {
            message: messages.validBirthRegistrationNumber,
            props: { validLength: validBirthRegistrationNumberLength }
          }

    case DEATH_REGISTRATION_NUMBER:
      return hasValidLength(
        value.toString(),
        validDeathRegistrationNumberLength
      )
        ? undefined
        : {
            message: messages.validDeathRegistrationNumber,
            props: { validLength: validDeathRegistrationNumberLength }
          }

    case PASSPORT:
      return hasValidLength(value.toString(), validPassportLength) &&
        isRegexpMatched(value, REGEXP_ALPHA_NUMERIC)
        ? undefined
        : {
            message: messages.validPassportNumber,
            props: { validLength: validPassportLength }
          }
    case DRIVING_LICENSE:
      return hasValidLength(value, validDrivingLicenseLength) &&
        isRegexpMatched(value, REGEXP_ALPHA_NUMERIC)
        ? undefined
        : {
            message: messages.validDrivingLicenseNumber,
            props: { validLength: validDrivingLicenseLength }
          }
    default:
      return undefined
  }
}

export const isValidDeathOccurrenceDate: Validation = (
  value: IFormFieldValue,
  drafts
) => {
  const cast = value && value.toString()

  return cast && isDateNotInFuture(cast) && isAValidDateFormat(cast)
    ? isDateNotBeforeBirth(cast, drafts as IFormData)
      ? undefined
      : {
          message: messages.isDateNotBeforeBirth
        }
    : {
        message: messages.isValidDateOfDeath
      }
}

export const isMoVisitDateAfterBirthDateAndBeforeDeathDate: Validation = (
  value: IFormFieldValue,
  drafts
) => {
  const cast = value && value.toString()
  if (drafts && drafts.deathEvent && !drafts.deathEvent.birthDate) {
    if (drafts && drafts.deathEvent && cast <= drafts.deathEvent.deathDate) {
      return undefined
    } else if (
      drafts &&
      drafts.deathEvent &&
      cast > drafts.deathEvent.deathDate
    ) {
      return {
        message: messages.isMoVisitAfterDeath
      }
    }
  } else {
    if (
      drafts &&
      drafts.deathEvent &&
      cast <= drafts.deathEvent.deathDate &&
      cast >= drafts.deceased.birthDate
    ) {
      return undefined
    } else if (
      drafts &&
      drafts.deathEvent &&
      cast > drafts.deathEvent.deathDate
    ) {
      return {
        message: messages.isMoVisitAfterDeath
      }
    } else if (
      drafts &&
      drafts.deathEvent &&
      cast < drafts.deceased.birthDate
    ) {
      return {
        message: messages.isMoVisitBeforeBirth
      }
    }
  }
}

export const isInformantOfLegalAge: Validation = (value: IFormFieldValue) => {
  if (value) {
    if (
      minAgeGapExist(
        moment(new Date()).format('YYYY-MM-DD'),
        value.toString(),
        window.config.INFORMANT_MINIMUM_AGE
      )
    ) {
      return undefined
    } else {
      return {
        message: messages.isInformantOfLegalAge
      }
    }
  }
}

export const greaterThanZero: Validation = (value: IFormFieldValue) => {
  return !value && value !== 0
    ? { message: messages.required }
    : value && Number(value) > 0
    ? undefined
    : { message: messages.greaterThanZero }
}

export const notGreaterThan = (maxValue: number): Validation => (
  value: IFormFieldValue
) => {
  const numericValue = Number.parseInt(value as string)
  return value && !Number.isNaN(numericValue) && numericValue <= maxValue
    ? undefined
    : { message: messages.notGreaterThan, props: { maxValue } }
}
