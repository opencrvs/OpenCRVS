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
import {
  IFormField,
  Ii18nFormField,
  ISelectOption,
  IConditionals,
  IFormSectionData,
  IConditional,
  SELECT_WITH_OPTIONS,
  RADIO_GROUP,
  CHECKBOX_GROUP,
  IRadioOption,
  ICheckboxOption,
  ISelectFormFieldWithDynamicOptions,
  INFORMATIVE_RADIO_GROUP,
  PARAGRAPH,
  IDynamicListFormField,
  IDynamicValueMapper,
  IFormData,
  IDynamicFormFieldValidators,
  IDynamicFormField,
  FETCH_BUTTON,
  ILoaderButton,
  IFieldInput,
  IFormSection,
  IQuery,
  DATE,
  IDateFormField,
  IFormSectionGroup,
  IRadioGroupFormField,
  RADIO_GROUP_WITH_NESTED_FIELDS,
  DOCUMENT_UPLOADER_WITH_OPTION
} from '@client/forms'
import { IntlShape, MessageDescriptor } from 'react-intl'
import {
  getValidationErrorsForForm,
  IFieldErrors,
  Errors
} from '@client/forms/validation'
import {
  OFFLINE_LOCATIONS_KEY,
  OFFLINE_FACILITIES_KEY,
  ILocation,
  IOfflineData,
  LocationType
} from '@client/offline/reducer'
import {
  Validation,
  isAValidDateFormat,
  isDateNotInFuture
} from '@client/utils/validate'
import moment from 'moment'
import { IRadioOption as CRadioOption } from '@opencrvs/components/lib/forms'
import { IDynamicValues } from '@client/navigation'
import { generateLocations } from '@client/utils/locationUtils'
import { callingCountries } from 'country-data'

interface IRange {
  start: number
  end?: number
  value: string
}

export const internationaliseOptions = (
  intl: IntlShape,
  options: Array<ISelectOption | IRadioOption | ICheckboxOption>
) => {
  return options.map(opt => {
    return {
      ...opt,
      label: intl.formatMessage(opt.label)
    }
  })
}

export const internationaliseFieldObject = (
  intl: IntlShape,
  field: IFormField
): Ii18nFormField => {
  const base = {
    ...field,
    label:
      field.type === PARAGRAPH ? field.label : intl.formatMessage(field.label),
    helperText: field.helperText && intl.formatMessage(field.helperText),
    tooltip: field.tooltip && intl.formatMessage(field.tooltip),
    description: field.description && intl.formatMessage(field.description),
    placeholder: field.placeholder && intl.formatMessage(field.placeholder)
  }

  if (
    base.type === SELECT_WITH_OPTIONS ||
    base.type === INFORMATIVE_RADIO_GROUP ||
    base.type === CHECKBOX_GROUP ||
    base.type === DOCUMENT_UPLOADER_WITH_OPTION
  ) {
    ;(base as any).options = internationaliseOptions(intl, base.options)
  }

  if (
    base.type === RADIO_GROUP ||
    base.type === RADIO_GROUP_WITH_NESTED_FIELDS
  ) {
    ;(base as any).options = internationaliseOptions(intl, base.options)
    if ((field as IDateFormField).notice) {
      ;(base as any).notice = intl.formatMessage(
        // @ts-ignore
        (field as IRadioGroupFormField).notice
      )
    }
  }

  if (base.type === DATE && (field as IDateFormField).notice) {
    ;(base as any).notice = intl.formatMessage(
      // @ts-ignore
      (field as IDateFormField).notice
    )
  }

  if (base.type === FETCH_BUTTON) {
    ;(base as any).modalTitle = intl.formatMessage(
      (field as ILoaderButton).modalTitle
    )
    ;(base as any).successTitle = intl.formatMessage(
      (field as ILoaderButton).successTitle
    )
    ;(base as any).errorTitle = intl.formatMessage(
      (field as ILoaderButton).errorTitle
    )
  }

  return base as Ii18nFormField
}

export const generateOptions = (
  options: ILocation[],
  optionType: string
): ISelectOption[] => {
  const optionsArray: ISelectOption[] = []
  options.forEach((option: ILocation, index: number) => {
    optionsArray.push({
      value: option.id,
      label: {
        id: `${optionType}.${option.id}`,
        defaultMessage: option.name,
        description: `${optionType} select item for ${option.id}`
      }
    })
  })
  return optionsArray
}

export const getFieldType = (
  field: IDynamicFormField,
  values: IFormSectionData
): string => {
  if (!field.dynamicDefinitions.type) {
    return field.type
  }

  switch (field.dynamicDefinitions.type.kind) {
    case 'dynamic':
      return field.dynamicDefinitions.type.typeMapper(
        values[field.dynamicDefinitions.type.dependency] as string
      )
    case 'static':
    default:
      return field.dynamicDefinitions.type.staticType
  }
}

export const getFieldLabel = (
  field: IDynamicFormField,
  values: IFormSectionData
): MessageDescriptor | undefined => {
  if (!field.dynamicDefinitions.label) {
    return undefined
  }
  return field.dynamicDefinitions.label.labelMapper(
    values[field.dynamicDefinitions.label.dependency] as string
  )
}

export const getFieldHelperText = (
  field: IDynamicFormField,
  values: IFormSectionData
): MessageDescriptor | undefined => {
  if (!field.dynamicDefinitions.helperText) {
    return undefined
  }
  return field.dynamicDefinitions.helperText.helperTextMapper(
    values[field.dynamicDefinitions.helperText.dependency] as string
  )
}

export const getFieldLabelToolTip = (
  field: IDynamicFormField,
  values: IFormSectionData
): MessageDescriptor | undefined => {
  if (!field.dynamicDefinitions.tooltip) {
    return undefined
  }
  return field.dynamicDefinitions.tooltip.tooltipMapper(
    values[field.dynamicDefinitions.tooltip.dependency] as string
  )
}

export const getFieldValidation = (
  field: IDynamicFormField,
  values: IFormSectionData
): Validation[] => {
  const validate: Validation[] = []
  if (
    field.dynamicDefinitions &&
    field.dynamicDefinitions.validate &&
    field.dynamicDefinitions.validate.length > 0
  ) {
    field.dynamicDefinitions.validate.map(
      (element: IDynamicFormFieldValidators) => {
        const params: any[] = []
        element.dependencies.map((dependency: string) =>
          params.push(values[dependency])
        )
        const fun = element.validator(...params)
        validate.push(fun)
        return element
      }
    )
  }

  return validate
}

export const getVisibleGroupFields = (group: IFormSectionGroup) => {
  return group.fields.filter(field => !field.hidden)
}
export const getFieldOptions = (
  field: ISelectFormFieldWithDynamicOptions,
  values: IFormSectionData,
  resources: IOfflineData
) => {
  const locations = resources[OFFLINE_LOCATIONS_KEY]
  const dependencyVal = values[field.dynamicOptions.dependency] as string
  if (field.dynamicOptions.jurisdictionType) {
    return generateOptions(
      Object.values(locations).filter((location: ILocation) => {
        return (
          location.jurisdictionType === field.dynamicOptions.jurisdictionType
        )
      }),
      'location'
    )
  } else if (
    resources &&
    field.dynamicOptions.resource === OFFLINE_LOCATIONS_KEY
  ) {
    if (!dependencyVal) {
      return []
    }
    let partOf: string
    if (dependencyVal === window.config.COUNTRY.toUpperCase()) {
      partOf = 'Location/0'
    } else {
      partOf = `Location/${dependencyVal}`
    }
    return generateOptions(
      Object.values(locations).filter((location: ILocation) => {
        return location.partOf === partOf
      }),
      'location'
    )
  } else if (
    resources &&
    field.dynamicOptions.resource === OFFLINE_FACILITIES_KEY
  ) {
    const facilities = resources[OFFLINE_FACILITIES_KEY]
    return generateOptions(Object.values(facilities), 'facility')
  } else {
    let options
    if (!field.dynamicOptions.options) {
      throw new Error(
        `Dependency '${dependencyVal}' has illegal value, the value should have an entry in the dynamic options object.`
      )
    } else {
      options = field.dynamicOptions.options[dependencyVal] || []
    }
    return options
  }
}

interface INested {
  [key: string]: any
}

const getNestedValue = (obj: object, key: string) => {
  return key.split('.').reduce((res: INested, k) => res[k] || '', obj)
}

const betweenRange = (range: IRange, check: number) =>
  range.end ? check >= range.start && check <= range.end : check >= range.start

export const getFieldOptionsByValueMapper = (
  field: IDynamicListFormField,
  values: IFormSectionData | IFormData,
  valueMapper: IDynamicValueMapper
) => {
  const dependencyVal = (getNestedValue(
    values,
    field.dynamicItems.dependency
  ) as unknown) as string

  const firstKey = Object.keys(field.dynamicItems.items)[0]

  if (!dependencyVal) {
    return field.dynamicItems.items[firstKey]
  }

  const mappedValue = valueMapper(dependencyVal)

  let items

  if (!field.dynamicItems.items[mappedValue]) {
    items = field.dynamicItems.items[firstKey]
  } else {
    items = field.dynamicItems.items[mappedValue]
  }
  return items
}

export const diffDoB = (doB: string) => {
  if (!isAValidDateFormat(doB) || !isDateNotInFuture(doB)) return 'within45days'
  const todaysDate = moment(Date.now())
  const birthDate = moment(doB)
  const diffInDays = todaysDate.diff(birthDate, 'days')

  const ranges: IRange[] = [
    { start: 0, end: 45, value: 'within45days' },
    { start: 46, end: 5 * 365, value: 'between46daysTo5yrs' },
    { start: 5 * 365 + 1, value: 'after5yrs' }
  ]
  const valueWithinRange = ranges.find(range => betweenRange(range, diffInDays))
  return valueWithinRange ? valueWithinRange.value : ''
}

export function isCityLocation(
  locations: { [key: string]: ILocation },
  locationId: string
): boolean {
  const selectedLocation = locations[locationId]
  if (selectedLocation) {
    if (selectedLocation.jurisdictionType === 'CITYCORPORATION') {
      return true
    } else {
      return false
    }
  } else {
    return false
  }
}

export function isDefaultCountry(countryCode: string): boolean {
  return countryCode === window.config.COUNTRY.toUpperCase()
}

export function getListOfLocations(
  resource: IOfflineData,
  resourceType: Extract<
    keyof IOfflineData,
    'facilities' | 'locations' | 'offices'
  >,
  locationType?: LocationType
) {
  return resource[resourceType]
    ? locationType
      ? generateLocations(resource[resourceType], undefined, [locationType])
      : generateLocations(resource[resourceType])
    : []
}

interface IVars {
  [key: string]: any
}

export function getInputValues(
  inputs: IFieldInput[],
  values: IFormSectionData
): IDynamicValues {
  const variables: IVars = {}
  inputs.forEach((input: IFieldInput) => {
    if (input.type && input.type === 'ENVIRONMENT') {
      variables[input.name] =
        window.config[input.valueField as keyof typeof window.config]
    } else {
      variables[input.name] = values[input.valueField]
    }
  })
  return variables
}

export function getQueryData(
  field: ILoaderButton,
  values: IFormSectionData
): IQuery | undefined {
  const selectedValue = values[field.querySelectorInput.valueField] as string
  const queryData = field.queryMap[selectedValue]

  if (!queryData) {
    return
  }

  const variables = getInputValues(queryData.inputs, values)
  queryData.variables = variables
  return queryData
}

export const getConditionalActionsForField = (
  field: IFormField,
  /*
   * These are used in the eval expression
   */
  values: IFormSectionData,
  resources?: IOfflineData,
  draftData?: IFormData
): string[] => {
  if (!field.conditionals) {
    return []
  }
  return (
    field.conditionals
      // eslint-disable-next-line no-eval
      .filter(conditional => eval(conditional.expression))
      .map((conditional: IConditional) => conditional.action)
  )
}

export const getVisibleSectionGroupsBasedOnConditions = (
  section: IFormSection,
  values: IFormSectionData,
  draftData?: IFormData
): IFormSectionGroup[] => {
  return section.groups.filter(group => {
    if (!group.conditionals) {
      return true
    }
    return (
      group.conditionals
        // eslint-disable-next-line no-eval
        .filter(conditional => eval(conditional.expression))
        .map((conditional: IConditional) => conditional.action)
        .includes('hide') !== true
    )
  })
}

export const getVisibleOptions = (
  radioOptions: CRadioOption[],
  draftData: IFormData
): CRadioOption[] => {
  return radioOptions.filter(option => {
    if (!option.conditionals) {
      return true
    }
    return (
      option.conditionals
        // eslint-disable-next-line no-eval
        .filter(conditional => eval(conditional.expression))
        .map((conditional: IConditional) => conditional.action)
        .includes('hide') !== true
    )
  })
}

export const getSectionFields = (
  section: IFormSection,
  values?: IFormSectionData,
  draftData?: IFormData
) => {
  let fields: IFormField[] = []
  getVisibleSectionGroupsBasedOnConditions(
    section,
    values || {},
    draftData
  ).forEach(group => (fields = fields.concat(group.fields)))
  return fields
}

export const hasFormError = (
  fields: IFormField[],
  values: IFormSectionData,
  resource?: IOfflineData,
  drafts?: IFormData
): boolean => {
  const errors: Errors = getValidationErrorsForForm(
    fields,
    values,
    resource,
    drafts
  )

  const fieldListWithErrors = Object.values(errors).filter(
    error =>
      (error as IFieldErrors).errors.length > 0 ||
      Object.values(error.nestedFields).some(
        nestedFieldErrors => nestedFieldErrors.length > 0
      )
  )

  return fieldListWithErrors && fieldListWithErrors.length > 0
}

export const convertToMSISDN = (phone: string) => {
  const countryCode =
    callingCountries[window.config.COUNTRY.toUpperCase()].countryCallingCodes[0]

  if (phone.startsWith(countryCode) || `+${phone}`.startsWith(countryCode)) {
    return phone.startsWith('+') ? phone : `+${phone}`
  }
  return phone.startsWith('0')
    ? `${countryCode}${phone.substring(1)}`
    : `${countryCode}${phone}`
}

export const conditionals: IConditionals = {
  iDType: {
    action: 'hide',
    expression: "!values.iDType || (values.iDType !== 'OTHER')"
  },
  fathersDetailsExist: {
    action: 'hide',
    expression: '!values.fathersDetailsExist'
  },
  permanentAddressSameAsMother: {
    action: 'hide',
    expression: 'values.permanentAddressSameAsMother'
  },
  addressSameAsMother: {
    action: 'hide',
    expression: 'values.addressSameAsMother'
  },
  currentAddressSameAsPermanent: {
    action: 'hide',
    expression: 'values.currentAddressSameAsPermanent'
  },
  countryPermanent: {
    action: 'hide',
    expression: '!values.countryPermanent'
  },
  isDefaultCountryPermanent: {
    action: 'hide',
    expression: 'isDefaultCountry(values.countryPermanent)'
  },
  statePermanent: {
    action: 'hide',
    expression: '!values.statePermanent'
  },
  districtPermanent: {
    action: 'hide',
    expression: '!values.districtPermanent'
  },
  addressLine4Permanent: {
    action: 'hide',
    expression: '!values.addressLine4Permanent'
  },
  addressLine3Permanent: {
    action: 'hide',
    expression: '!values.addressLine3Permanent'
  },
  country: {
    action: 'hide',
    expression: '!values.country'
  },
  isDefaultCountry: {
    action: 'hide',
    expression: 'isDefaultCountry(values.country)'
  },
  state: {
    action: 'hide',
    expression: '!values.state'
  },
  district: {
    action: 'hide',
    expression: '!values.district'
  },
  addressLine4: {
    action: 'hide',
    expression: '!values.addressLine4'
  },
  addressLine3: {
    action: 'hide',
    expression: '!values.addressLine3'
  },
  uploadDocForWhom: {
    action: 'hide',
    expression: '!values.uploadDocForWhom'
  },
  motherCollectsCertificate: {
    action: 'hide',
    expression: 'values.personCollectingCertificate!="MOTHER"'
  },
  fatherCollectsCertificate: {
    action: 'hide',
    expression: 'values.personCollectingCertificate!="FATHER"'
  },
  informantCollectsCertificate: {
    action: 'hide',
    expression: 'values.personCollectingCertificate!="INFORMANT"'
  },
  otherPersonCollectsCertificate: {
    action: 'hide',
    expression: 'values.personCollectingCertificate!="OTHER"'
  },
  birthCertificateCollectorNotVerified: {
    action: 'hide',
    expression:
      '!(values.personCollectingCertificate=="MOTHER" && values.motherDetails===false) && !(values.personCollectingCertificate=="FATHER" && values.fatherDetails===false) && !(values.personCollectingCertificate =="OTHER" && values.otherPersonSignedAffidavit===false)'
  },
  deathCertificateCollectorNotVerified: {
    action: 'hide',
    expression:
      '!(values.personCollectingCertificate=="INFORMANT" && values.informantDetails===false) && !(values.personCollectingCertificate =="OTHER" && values.otherPersonSignedAffidavit===false)'
  },
  placeOfBirthHospital: {
    action: 'hide',
    expression:
      '(values.placeOfBirth!="HOSPITAL" && values.placeOfBirth!="OTHER_HEALTH_INSTITUTION")'
  },
  deathPlaceAddressTypeHeathInstitue: {
    action: 'hide',
    expression: 'values.deathPlaceAddress!="HEALTH_FACILITY"'
  },
  otherBirthEventLocation: {
    action: 'hide',
    expression:
      '(values.placeOfBirth!="OTHER" && values.placeOfBirth!="PRIVATE_HOME")'
  },
  isNotCityLocation: {
    action: 'hide',
    expression:
      '(resources && resources.locations && isCityLocation(resources.locations,values.addressLine4))'
  },
  isCityLocation: {
    action: 'hide',
    expression:
      '!(resources && resources.locations && isCityLocation(resources.locations,values.addressLine4))'
  },
  isNotCityLocationPermanent: {
    action: 'hide',
    expression:
      '(resources && resources.locations && isCityLocation(resources.locations,values.addressLine4Permanent))'
  },
  isCityLocationPermanent: {
    action: 'hide',
    expression:
      '!(resources && resources.locations && isCityLocation(resources.locations,values.addressLine4Permanent))'
  },
  iDAvailable: {
    action: 'hide',
    expression: '!values.iDType || values.iDType === "NO_ID"'
  },
  applicantPermanentAddressSameAsCurrent: {
    action: 'hide',
    expression: 'values.applicantPermanentAddressSameAsCurrent'
  },
  deathPlaceOther: {
    action: 'hide',
    expression: 'values.deathPlaceAddress !== "OTHER"'
  },
  deathPlaceAtPrivateHome: {
    action: 'hide',
    expression: 'values.deathPlaceAddress !== "PRIVATE_HOME"'
  },
  deathPlaceAtOtherLocation: {
    action: 'hide',
    expression: 'values.deathPlaceAddress !== "OTHER"'
  },
  causeOfDeathEstablished: {
    action: 'hide',
    expression: '!values.causeOfDeathEstablished'
  },
  isMarried: {
    action: 'hide',
    expression: '(!values.maritalStatus || values.maritalStatus !== "MARRIED")'
  },
  identifierIDSelected: {
    action: 'hide',
    expression:
      '(!values.iDType || (values.iDType !== "BIRTH_REGISTRATION_NUMBER" && values.iDType !== "NATIONAL_ID"))'
  },
  otherRelationship: {
    action: 'hide',
    expression: 'values.applicantsRelationToDeceased !== "OTHER"'
  },
  fatherContactDetailsRequired: {
    action: 'hide',
    expression:
      '(draftData && draftData.registration && draftData.registration.whoseContactDetails === "FATHER")'
  },
  withIn45Days: {
    action: 'hide',
    expression:
      '(draftData && draftData.child && draftData.child.childBirthDate && diffDoB(draftData.child.childBirthDate) === "within45days") || !draftData.child || !draftData.child.childBirthDate'
  },
  between46daysTo5yrs: {
    action: 'hide',
    expression:
      '(draftData && draftData.child && draftData.child.childBirthDate && diffDoB(draftData.child.childBirthDate) === "between46daysTo5yrs") || !draftData.child || !draftData.child.childBirthDate'
  },
  after5yrs: {
    action: 'hide',
    expression:
      '(draftData && draftData.child && draftData.child.childBirthDate && diffDoB(draftData.child.childBirthDate) === "after5yrs")  || !draftData.child || !draftData.child.childBirthDate'
  },
  deceasedNationIdSelected: {
    action: 'hide',
    expression:
      '(values.uploadDocForDeceased && !!values.uploadDocForDeceased.find(a => ["National ID (front)", "National ID (Back)"].indexOf(a.optionValues[1]) > -1))'
  },
  isRegistrarOrRegistrationAgentRoleSelected: {
    action: 'hide',
    expression:
      'values.role!=="LOCAL_REGISTRAR" && values.role!=="REGISTRATION_AGENT"'
  },
  certCollectorOther: {
    action: 'hide',
    expression: 'values.type !== "OTHER"'
  },
  userAuditReasonSpecified: {
    action: 'hide',
    expression: 'values.reason === "OTHER"'
  },
  userAuditReasonOther: {
    action: 'hide',
    expression: 'values.reason !== "OTHER"'
  },
  isAuditActionDeactivate: {
    action: 'hide',
    expression: 'draftData.formValues.action !== "DEACTIVATE"'
  },
  isAuditActionReactivate: {
    action: 'hide',
    expression: 'draftData.formValues.action !== "REACTIVATE"'
  }
}
