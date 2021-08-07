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
import { Validation } from '@client/utils/validate'
import * as mutations from '@client/forms/mappings/mutation'
import * as queries from '@client/forms/mappings/query'
import * as labels from '@client/forms/mappings/label'
import * as responseTransformers from '@client/forms/mappings/response-transformers'
import * as graphQLQueries from '@client/forms/mappings/queries'
import * as types from '@client/forms/mappings/type'
import * as validators from '@opencrvs/client/src/utils/validate'

import {
  IForm,
  ISerializedForm,
  IFormSectionMutationMapFunction,
  IFormSectionQueryMapFunction,
  IFormFieldQueryMapFunction,
  IFormFieldMutationMapFunction,
  IValidatorDescriptor,
  ISerializedFormSection,
  IFormSection,
  FIELD_WITH_DYNAMIC_DEFINITIONS,
  ISerializedDynamicFormFieldDefinitions,
  IDynamicFormFieldDefinitions,
  ValidationFactoryOperation,
  IQueryDescriptor,
  QueryFactoryOperation,
  IMutationDescriptor,
  MutationFactoryOperation,
  FETCH_BUTTON,
  IQueryMap,
  ISerializedQueryMap,
  ILoaderButton,
  IFormFieldWithDynamicDefinitions,
  IFormField,
  SELECT_WITH_OPTIONS,
  ISelectFormFieldWithOptions,
  RADIO_GROUP_WITH_NESTED_FIELDS,
  IRadioGroupWithNestedFieldsFormField,
  SerializedFormField
} from '@client/forms'
import { countries } from '@client/forms/countries'

/*
 * Some of the exports of mutations and queries are not functions
 * There are for instance some Enums and value mappings that are exported
 *
 * This here removes those from the type, so we don't have to cast anything to any
 */

type AnyFn<T> = (...args: any[]) => T
type AnyFactoryFn<T> = (...args: any[]) => (...args: any[]) => T

type FilterType<Base, Condition> = {
  [Key in keyof Base]: Base[Key] extends Condition ? Key : never
}

type MutationFunctionExports = FilterType<
  typeof mutations,
  AnyFactoryFn<string>
>[keyof typeof mutations]

type QueryFunctionExports = FilterType<
  typeof queries,
  AnyFactoryFn<string>
>[keyof typeof queries]

type ValidatorFunctionExports = FilterType<
  typeof validators,
  Validation | AnyFn<Validation>
>[keyof typeof validators]

function isFactoryOperation(
  descriptor: IQueryDescriptor
): descriptor is QueryFactoryOperation
function isFactoryOperation(
  descriptor: IMutationDescriptor
): descriptor is MutationFactoryOperation
function isFactoryOperation(
  descriptor: IValidatorDescriptor
): descriptor is ValidationFactoryOperation
function isFactoryOperation(descriptor: any) {
  return Boolean((descriptor as ValidationFactoryOperation).parameters)
}

function configurationError(
  descriptor: { operation: string },
  operationLabel: string
) {
  const error = `Cannot find a ${operationLabel} with a name ${descriptor.operation}.
    This is a configuration error in your country specific resource package's form field definitions.`
  /* eslint-disable no-console */
  console.error(error)
  /* eslint-enable no-console */
  return new Error(error)
}

function sectionQueryDescriptorToQueryFunction(
  descriptor: IQueryDescriptor
): IFormSectionQueryMapFunction {
  const transformer: AnyFn<string> | AnyFactoryFn<string> =
    queries[descriptor.operation as QueryFunctionExports]

  if (!transformer) {
    throw configurationError(descriptor, 'query transformer')
  }

  if (isFactoryOperation(descriptor)) {
    const factory = transformer as AnyFactoryFn<string>
    return factory(...descriptor.parameters)
  }
  return transformer
}

function sectionMutationDescriptorToMutationFunction(
  descriptor: IMutationDescriptor
): IFormSectionMutationMapFunction {
  const transformer: AnyFn<string> | AnyFactoryFn<string> =
    mutations[descriptor.operation as MutationFunctionExports]

  if (!transformer) {
    throw configurationError(descriptor, 'mutation transformer')
  }

  if (isFactoryOperation(descriptor)) {
    const factory = transformer as AnyFactoryFn<string>
    return factory(...descriptor.parameters)
  }
  return transformer
}

function isOperation(param: any): param is IMutationDescriptor {
  return typeof param === 'object' && param['operation']
}

function fieldQueryDescriptorToQueryFunction(
  descriptor: IQueryDescriptor
): IFormFieldQueryMapFunction {
  const transformer: AnyFn<string> | AnyFactoryFn<string> =
    queries[descriptor.operation as QueryFunctionExports]

  if (!transformer) {
    throw configurationError(descriptor, 'query transformer')
  }

  if (isFactoryOperation(descriptor)) {
    const factory = transformer as AnyFactoryFn<string>

    const potentiallyNestedOperations = descriptor.parameters as Array<
      IQueryDescriptor
    >

    const parameters = potentiallyNestedOperations.map(parameter =>
      isOperation(parameter)
        ? fieldQueryDescriptorToQueryFunction(parameter)
        : parameter
    )

    return factory(...parameters)
  }
  return transformer
}

function fieldMutationDescriptorToMutationFunction(
  descriptor: IMutationDescriptor
): IFormFieldMutationMapFunction {
  const transformer: AnyFn<string> | AnyFactoryFn<string> =
    mutations[descriptor.operation as MutationFunctionExports]

  if (!transformer) {
    throw configurationError(descriptor, 'mutation transformer')
  }

  if (isFactoryOperation(descriptor)) {
    const factory = transformer as AnyFactoryFn<string>

    const potentiallyNestedOperations = descriptor.parameters as Array<
      IMutationDescriptor
    >

    const parameters = potentiallyNestedOperations.map(parameter =>
      isOperation(parameter)
        ? fieldMutationDescriptorToMutationFunction(parameter)
        : parameter
    )

    return factory(...parameters)
  }
  return transformer
}

function fieldValidationDescriptorToValidationFunction(
  descriptor: IValidatorDescriptor
): Validation {
  const validator: Validation | AnyFn<Validation> =
    validators[descriptor.operation as ValidatorFunctionExports]

  if (!validator) {
    throw configurationError(descriptor, 'validator')
  }

  if (isFactoryOperation(descriptor)) {
    const factory = validator as AnyFn<Validation>
    return factory(...descriptor.parameters)
  }

  return validator as Validation
}

function deserializeDynamicDefinitions(
  descriptor: ISerializedDynamicFormFieldDefinitions
): IDynamicFormFieldDefinitions {
  return {
    label: descriptor.label && {
      dependency: descriptor.label.dependency,
      labelMapper: labels[descriptor.label.labelMapper.operation]
    },
    helperText: descriptor.helperText && {
      dependency: descriptor.helperText.dependency,
      helperTextMapper: labels[descriptor.helperText.helperTextMapper.operation]
    },
    tooltip: descriptor.tooltip && {
      dependency: descriptor.tooltip.dependency,
      tooltipMapper: labels[descriptor.tooltip.tooltipMapper.operation]
    },
    type:
      descriptor.type &&
      (descriptor.type.kind === 'static'
        ? descriptor.type
        : {
            kind: 'dynamic',
            dependency: descriptor.type.dependency,
            typeMapper: types[descriptor.type.typeMapper.operation]
          }),
    validate:
      descriptor.validate &&
      descriptor.validate.map(validatorDescriptor => ({
        dependencies: validatorDescriptor.dependencies,
        validator: validators[validatorDescriptor.validator.operation] as AnyFn<
          Validation
        >
      }))
  }
}

function deserializeQueryMap(queryMap: ISerializedQueryMap) {
  return Object.keys(queryMap).reduce<IQueryMap>((deserialized, key) => {
    return {
      ...deserialized,
      [key]: {
        ...queryMap[key],
        responseTransformer:
          responseTransformers[queryMap[key].responseTransformer.operation],
        query: graphQLQueries[queryMap[key].query.operation]
      }
    }
  }, {})
}

function deserializeFormField(field: SerializedFormField) {
  return {
    ...field,
    validate: field.validate.map(fieldValidationDescriptorToValidationFunction),
    mapping: field.mapping && {
      query:
        field.mapping.query &&
        fieldQueryDescriptorToQueryFunction(field.mapping.query),
      mutation:
        field.mapping.mutation &&
        fieldMutationDescriptorToMutationFunction(field.mapping.mutation)
    }
  }
}

export function deserializeFormSection(
  section: ISerializedFormSection
): IFormSection {
  const mapping = {
    query:
      section.mapping &&
      section.mapping.query &&
      sectionQueryDescriptorToQueryFunction(section.mapping.query),
    mutation:
      section.mapping &&
      section.mapping.mutation &&
      sectionMutationDescriptorToMutationFunction(section.mapping.mutation)
  }
  const groups = section.groups.map(group => ({
    ...group,
    fields: group.fields.map(field => {
      const baseFields = deserializeFormField(field)

      if (field.type === FIELD_WITH_DYNAMIC_DEFINITIONS) {
        return {
          ...baseFields,
          dynamicDefinitions: deserializeDynamicDefinitions(
            field.dynamicDefinitions
          )
        } as IFormFieldWithDynamicDefinitions
      }

      if (field.type === RADIO_GROUP_WITH_NESTED_FIELDS) {
        const deserializedNestedFields = Object.keys(field.nestedFields).reduce(
          (fields, key) => {
            return {
              ...fields,
              [key]: field.nestedFields[key].map(deserializeFormField)
            }
          },
          {}
        )
        return {
          ...baseFields,
          nestedFields: deserializedNestedFields
        } as IRadioGroupWithNestedFieldsFormField
      }

      if (field.type === SELECT_WITH_OPTIONS) {
        return {
          ...baseFields,
          options:
            !Array.isArray(field.options) && field.options.resource
              ? // Dummy implementation for now as there's only one resource
                countries
              : field.options
        } as ISelectFormFieldWithOptions
      }

      if (field.type === FETCH_BUTTON) {
        return {
          ...baseFields,
          queryMap: deserializeQueryMap(field.queryMap)
        } as ILoaderButton
      }

      return baseFields as Exclude<
        IFormField,
        IFormFieldWithDynamicDefinitions | ILoaderButton
      >
    })
  }))

  return {
    ...section,
    mapping,
    groups
  }
}

export function deserializeForm(form: ISerializedForm): IForm {
  const sections = form.sections.map(deserializeFormSection)

  return {
    ...form,
    sections
  }
}
