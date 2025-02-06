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
import { MessageDescriptor } from 'react-intl'
import { formatISO } from 'date-fns'
import {
  ConditionalParameters,
  defineConditional,
  FieldConfig,
  validate
} from '@opencrvs/commons/client'
import { ActionFormData } from '@opencrvs/commons'
import { IValidationResult } from '@client/utils/validate'
import { getConditionalActionsForField } from './utils'

interface IFieldErrors {
  errors: IValidationResult[]
}

export interface Errors {
  [fieldName: string]: IFieldErrors
}

function isFieldHidden(field: FieldConfig, params: ConditionalParameters) {
  const hasShowRule = (field.conditionals ?? []).some(
    (conditional) => conditional.type === 'SHOW'
  )
  const validConditionals = getConditionalActionsForField(field, params)
  const isVisible = !hasShowRule || validConditionals.includes('SHOW')
  return !isVisible
}

function isFieldDisabled(field: FieldConfig, params: ConditionalParameters) {
  const hasEnableRule = (field.conditionals ?? []).some(
    (conditional) => conditional.type === 'ENABLE'
  )
  const validConditionals = getConditionalActionsForField(field, params)
  const isEnabled = !hasEnableRule || validConditionals.includes('ENABLE')
  return !isEnabled
}

function getValidationErrors(
  field: FieldConfig,
  values: ActionFormData,
  requiredErrorMessage?: MessageDescriptor,
  checkValidationErrorsOnly?: boolean
) {
  const conditionalParameters = {
    $form: values,
    $now: formatISO(new Date(), { representation: 'date' })
  }

  if (
    isFieldHidden(field, conditionalParameters) ||
    isFieldDisabled(field, conditionalParameters)
  ) {
    return {
      errors: []
    }
  }

  const validators = field.validation ? field.validation : []

  if (field.required && !checkValidationErrorsOnly) {
    validators.push({
      message: {
        defaultMessage: 'Required for registration',
        description: 'This is the error message for required fields',
        id: 'v2.error.required'
      },
      validator: defineConditional({
        type: 'object',
        properties: {
          $form: {
            type: 'object',
            properties: {
              [field.id]: {
                type: 'string',
                minLength: 1
              }
            },
            required: [field.id]
          }
        },
        required: ['$form']
      })
    })
  }
  //  else if (isFieldButton(field)) {
  //   const { trigger } = field.options
  //   validators.push(httpErrorResponseValidator(trigger))
  // } else if (field.validateEmpty) {
  // } else if (!value && value !== 0) {
  //   validators = []
  // }

  const validationResults = validators
    .filter((validation) => {
      return !validate(validation.validator, {
        $form: values,
        $now: formatISO(new Date(), { representation: 'date' })
      })
    })
    .map((validation) => ({ message: validation.message }))

  return {
    errors: validationResults
  }
}
export function getValidationErrorsForForm(
  fields: FieldConfig[],
  values: ActionFormData,
  requiredErrorMessage?: MessageDescriptor,
  checkValidationErrorsOnly?: boolean
) {
  return fields.reduce(
    (errorsForAllFields: Errors, field) =>
      // eslint-disable-next-line
      errorsForAllFields[field.id] &&
      errorsForAllFields[field.id].errors.length > 0
        ? errorsForAllFields
        : {
            ...errorsForAllFields,
            [field.id]: getValidationErrors(
              field,
              values,
              requiredErrorMessage,
              checkValidationErrorsOnly
            )
          },
    {}
  )
}
