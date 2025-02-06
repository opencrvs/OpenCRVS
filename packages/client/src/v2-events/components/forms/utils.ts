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
import { IntlShape } from 'react-intl'
import _ from 'lodash'
import { formatISO } from 'date-fns'
import {
  ActionFormData,
  BaseField,
  ConditionalParameters,
  FieldConfig,
  FieldType,
  FieldValue,
  validate,
  DateFieldValue,
  TextFieldValue,
  RadioGroupFieldValue
} from '@opencrvs/commons/client'
import {
  CheckboxFieldValue,
  ParagraphFieldValue,
  SelectFieldValue
} from '@opencrvs/commons'
import { DependencyInfo } from '@client/forms'
import {
  dateToString,
  INITIAL_DATE_VALUE,
  INITIAL_PARAGRAPH_VALUE,
  INITIAL_RADIO_GROUP_VALUE,
  INITIAL_TEXT_VALUE,
  paragraphToString,
  textToString
} from '@client/v2-events/features/events/registered-fields'
import { selectFieldToString } from '@client/v2-events/features/events/registered-fields/Select'
import { selectCountryFieldToString } from '@client/v2-events/features/events/registered-fields/SelectCountry'
import { ILocation } from '@client/v2-events/features/events/registered-fields/Location'
import { checkboxToString } from '@client/v2-events/features/events/registered-fields/Checkbox'

export function handleInitialValue(
  field: FieldConfig,
  formData: ActionFormData
) {
  const initialValue = field.initialValue

  if (hasInitialValueDependencyInfo(initialValue)) {
    return evalExpressionInFieldDefinition(initialValue.expression, {
      $form: formData
    })
  }

  return initialValue
}

export function isFormFieldVisible(field: FieldConfig, form: ActionFormData) {
  return getConditionalActionsForField(field, {
    $form: form,
    $now: formatISO(new Date(), {
      representation: 'date'
    })
  }).every((fieldAction) => fieldAction !== 'HIDE')
}

export function getConditionalActionsForField(
  field: FieldConfig,
  values: ConditionalParameters
) {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!field.conditionals) {
    return []
  }
  return field.conditionals
    .filter((conditional) => validate(conditional.conditional, values))
    .map((conditional) => conditional.type)
}

export function evalExpressionInFieldDefinition(
  expression: string,
  /*
   * These are used in the eval expression
   */
  { $form }: { $form: ActionFormData }
) {
  // eslint-disable-next-line no-eval
  return eval(expression) as FieldValue
}

export function hasInitialValueDependencyInfo(
  value: BaseField['initialValue']
): value is DependencyInfo {
  return typeof value === 'object' && 'dependsOn' in value
}

export function getDependentFields(
  fields: FieldConfig[],
  fieldName: string
): FieldConfig[] {
  return fields.filter((field) => {
    if (!field.initialValue) {
      return false
    }
    if (!hasInitialValueDependencyInfo(field.initialValue)) {
      return false
    }
    return field.initialValue.dependsOn.includes(fieldName)
  })
}

const initialValueMapping: Record<FieldType, FieldValue | null> = {
  [FieldType.TEXT]: INITIAL_TEXT_VALUE,
  [FieldType.DATE]: INITIAL_DATE_VALUE,
  [FieldType.RADIO_GROUP]: INITIAL_RADIO_GROUP_VALUE,
  [FieldType.PARAGRAPH]: INITIAL_PARAGRAPH_VALUE,
  [FieldType.FILE]: null,
  [FieldType.HIDDEN]: null,
  [FieldType.BULLET_LIST]: null,
  [FieldType.CHECKBOX]: null,
  [FieldType.COUNTRY]: null,
  [FieldType.LOCATION]: null,
  [FieldType.SELECT]: null,
  [FieldType.PAGE_HEADER]: null,
  [FieldType.DIVIDER]: null
}

export function getInitialValues(fields: FieldConfig[]) {
  return fields.reduce((initialValues: Record<string, FieldValue>, field) => {
    return {
      ...initialValues,
      [field.id]: initialValueMapping[field.type]
    }
  }, {})
}

export function fieldValueToString({
  fieldConfig,
  value,
  intl,
  locations
}: {
  fieldConfig: FieldConfig
  value: FieldValue
  intl: IntlShape
  locations: { [locationId: string]: ILocation }
}) {
  switch (fieldConfig.type) {
    case FieldType.DATE:
      return dateToString(value as DateFieldValue)
    case FieldType.TEXT:
      return textToString(value as TextFieldValue)
    case FieldType.PARAGRAPH:
      return paragraphToString(value as ParagraphFieldValue)
    case FieldType.CHECKBOX:
      return checkboxToString(value as CheckboxFieldValue)
    case FieldType.RADIO_GROUP:
      return selectFieldToString(
        value as RadioGroupFieldValue,
        fieldConfig.optionValues,
        intl
      )
    case FieldType.SELECT:
      return selectFieldToString(
        value as SelectFieldValue,
        fieldConfig.options,
        intl
      )
    case FieldType.COUNTRY:
      return selectCountryFieldToString(value as SelectFieldValue, intl)
    case FieldType.LOCATION: {
      let location
      if (_.isString(value)) {
        location = locations[value].name
      }
      return location ?? ''
    }
    default:
      throw new Error(`Field type ${fieldConfig.type} configuration missing.`)
  }
}
