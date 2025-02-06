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
import { IFormData, IFormSectionGroup, ISelectOption } from '@client/forms'
import { EventType } from '@client/utils/gateway'
import { dynamicMessages } from '@client/i18n/messages/views/certificate'
import { getAvailableLanguages } from '@client/i18n/utils'
import { ILanguageState } from '@client/i18n/reducer'
import { ICertificate, IPrintableDeclaration } from '@client/declarations'
import { IntlShape } from 'react-intl'
import { IOfflineData } from '@client/offline/reducer'
import differenceInDays from 'date-fns/differenceInDays'

const MONTH_IN_DAYS = 30
const YEAR_IN_DAYS = 365

interface IRange {
  start: number
  end?: number
  value: number
}

export interface ICountry {
  value: string
  name: string
}

export interface IAvailableCountries {
  language?: string
  countries?: ICountry[]
}

export function getCountryTranslations(
  languageState: ILanguageState,
  countries: ISelectOption[]
): IAvailableCountries[] {
  const certificateCountries: IAvailableCountries[] = []
  getAvailableLanguages().forEach((language: string) => {
    const certificateCountry: IAvailableCountries = { language }
    const availableCountries: ICountry[] = []
    countries.forEach((country) => {
      availableCountries.push({
        value: country.value,
        name: languageState[language].messages[`countries.${country.value}`]
      })
    })
    certificateCountry.countries = availableCountries
    certificateCountries.push(certificateCountry)
  })
  return certificateCountries
}

function getDayRanges(
  offlineData: IOfflineData,
  certificate: ICertificate
): IRange[] {
  const templateConfig = offlineData.templates.certificates.find(
    (x) => x.id === certificate.certificateTemplateId
  )
  switch (templateConfig?.event) {
    case EventType.Birth: {
      const BIRTH_REGISTRATION_TARGET =
        offlineData.config.BIRTH.REGISTRATION_TARGET
      const BIRTH_LATE_REGISTRATION_TARGET =
        offlineData.config.BIRTH.LATE_REGISTRATION_TARGET
      const BIRTH_ON_TIME_FEE = templateConfig?.fee.onTime
      const BIRTH_LATE_FEE = templateConfig?.fee.late
      const BIRTH_DELAYED_FEE = templateConfig?.fee.delayed
      const birthRanges = [
        { start: 0, end: BIRTH_REGISTRATION_TARGET, value: BIRTH_ON_TIME_FEE },
        {
          start: BIRTH_REGISTRATION_TARGET + 1,
          end: BIRTH_LATE_REGISTRATION_TARGET,
          value: BIRTH_LATE_FEE
        },
        { start: BIRTH_LATE_REGISTRATION_TARGET + 1, value: BIRTH_DELAYED_FEE }
      ]
      return birthRanges
    }

    case EventType.Death: {
      const DEATH_REGISTRATION_TARGET =
        offlineData.config.DEATH.REGISTRATION_TARGET
      const DEATH_ON_TIME_FEE = templateConfig?.fee.onTime
      const DEATH_DELAYED_FEE = templateConfig?.fee.delayed

      const deathRanges = [
        { start: 0, end: DEATH_REGISTRATION_TARGET, value: DEATH_ON_TIME_FEE },
        { start: DEATH_REGISTRATION_TARGET + 1, value: DEATH_DELAYED_FEE }
      ]
      return deathRanges
    }
    case EventType.Marriage: {
      const MARRIAGE_REGISTRATION_TARGET =
        offlineData.config.MARRIAGE.REGISTRATION_TARGET
      const MARRIAGE_ON_TIME_FEE = templateConfig?.fee.onTime
      const MARRIAGE_DELAYED_FEE = templateConfig?.fee.delayed
      const marriageRanges = [
        {
          start: 0,
          end: MARRIAGE_REGISTRATION_TARGET,
          value: MARRIAGE_ON_TIME_FEE
        },
        { start: MARRIAGE_REGISTRATION_TARGET + 1, value: MARRIAGE_DELAYED_FEE }
      ]

      return marriageRanges
    }
    default:
      return []
  }
}

function getValue(
  offlineData: IOfflineData,
  certificate: ICertificate,
  check: number
): IRange['value'] {
  const rangeByEvent = getDayRanges(offlineData, certificate) as IRange[]
  const foundRange = rangeByEvent.find((range) =>
    range.end
      ? check >= range.start && check <= range.end
      : check >= range.start
  )
  return foundRange ? foundRange.value : rangeByEvent[0]?.value || 0
}

export function calculateDaysFromToday(doE: string) {
  const todaysDate = new Date(Date.now())
  const eventDate = new Date(doE)
  const diffInDays = differenceInDays(todaysDate, eventDate)
  return diffInDays
}

function calculateDays(doE: string, regDate: string) {
  const registeredDate = new Date(regDate)
  const eventDate = new Date(doE)
  const diffInDays = differenceInDays(registeredDate, eventDate)
  return diffInDays
}

export function timeElapsed(days: number) {
  const output: { unit: string; value: number } = { value: 0, unit: 'Day' }

  const year = Math.floor(days / YEAR_IN_DAYS)
  const month = Math.floor(days / MONTH_IN_DAYS)

  if (year > 0) {
    output.value = year
    output.unit = 'Year'
  } else if (month > 0) {
    output.value = month
    output.unit = 'Month'
  } else {
    output.value = days
  }

  return output
}

export function calculatePrice(
  event: EventType,
  eventDate: string,
  registeredDate: string,
  offlineData: IOfflineData,
  certificate: ICertificate
) {
  if (!certificate) return 0
  const days = calculateDays(eventDate, registeredDate)
  const result = getValue(offlineData, certificate, days)
  return result
}

export function getServiceMessage(
  intl: IntlShape,
  event: EventType,
  eventDate: string,
  registeredDate: string,
  offlineData: IOfflineData
) {
  const days = calculateDays(eventDate, registeredDate)

  if (event === EventType.Birth) {
    if (days <= offlineData.config.BIRTH.REGISTRATION_TARGET) {
      return intl.formatMessage(dynamicMessages[`${event}ServiceBefore`], {
        target: offlineData.config.BIRTH.REGISTRATION_TARGET
      })
    } else if (
      days > offlineData.config.BIRTH.REGISTRATION_TARGET &&
      days <= offlineData.config.BIRTH.LATE_REGISTRATION_TARGET
    ) {
      return intl.formatMessage(dynamicMessages[`${event}ServiceBetween`], {
        target: offlineData.config.BIRTH.REGISTRATION_TARGET,
        latetarget: offlineData.config.BIRTH.LATE_REGISTRATION_TARGET
      })
    } else {
      return intl.formatMessage(dynamicMessages[`${event}ServiceAfter`], {
        target: offlineData.config.BIRTH.LATE_REGISTRATION_TARGET
      })
    }
  } else if (event === EventType.Death) {
    if (days <= offlineData.config.DEATH.REGISTRATION_TARGET) {
      return intl.formatMessage(dynamicMessages[`${event}ServiceBefore`], {
        target: offlineData.config.DEATH.REGISTRATION_TARGET
      })
    } else {
      return intl.formatMessage(dynamicMessages[`${event}ServiceAfter`], {
        target: offlineData.config.DEATH.REGISTRATION_TARGET
      })
    }
  } else if (event === EventType.Marriage) {
    if (days <= offlineData.config.DEATH.REGISTRATION_TARGET) {
      return intl.formatMessage(dynamicMessages[`${event}ServiceBefore`], {
        target: offlineData.config.MARRIAGE.REGISTRATION_TARGET
      })
    } else {
      return intl.formatMessage(dynamicMessages[`${event}ServiceAfter`], {
        target: offlineData.config.MARRIAGE.REGISTRATION_TARGET
      })
    }
  }
}

export function isFreeOfCost(
  certificate: ICertificate,
  eventDate: string,
  registeredDate: string,
  offlineData: IOfflineData
): boolean {
  const days = calculateDays(eventDate, registeredDate)
  const result = getValue(offlineData, certificate, days)
  return result === 0
}

export function getEventDate(data: IFormData, event: EventType) {
  switch (event) {
    case EventType.Birth:
      return data.child.childBirthDate as string
    case EventType.Death:
      return data.deathEvent.deathDate as string
    case EventType.Marriage:
      return data.marriageEvent.marriageDate as string
  }
}

export function getRegisteredDate(data: IFormData) {
  const historyList = data.history as unknown as { [key: string]: any }[]
  const regHistory = historyList.find(
    (history) => history.regStatus === 'REGISTERED'
  )
  return regHistory && regHistory.date
}

export function getEvent(eventType: string | undefined) {
  switch (eventType && eventType.toLowerCase()) {
    case 'birth':
    default:
      return EventType.Birth
    case 'death':
      return EventType.Death
    case 'marriage':
      return EventType.Marriage
  }
}

export function isCertificateForPrintInAdvance(
  declaration: IPrintableDeclaration | undefined
) {
  const collectorType =
    declaration?.data?.registration?.certificates?.[0]?.collector?.type
  if (collectorType && collectorType === 'PRINT_IN_ADVANCE') {
    return true
  }
  return false
}

export function filterPrintInAdvancedOption(collectionForm: IFormSectionGroup) {
  const filtredCollectionForm = collectionForm.fields.map((field) => {
    if (field.type !== 'RADIO_GROUP') return field

    const filteredOption = field.options.filter(
      (option) => option.value !== 'PRINT_IN_ADVANCE'
    )
    return { ...field, options: filteredOption }
  })

  return { ...collectionForm, fields: filtredCollectionForm }
}
