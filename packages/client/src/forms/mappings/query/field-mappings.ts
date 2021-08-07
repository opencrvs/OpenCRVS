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
  GQLAddress,
  GQLAttachment,
  GQLComment,
  GQLHumanName,
  GQLRegWorkflow
} from '@opencrvs/gateway/src/graphql/schema'
import {
  IAttachment,
  IFormData,
  IFormField,
  IFormFieldQueryMapFunction,
  TransformedData,
  IFormSectionData
} from '@client/forms'
import { EMPTY_STRING } from '@client/utils/constants'
import { cloneDeep, get } from 'lodash'

interface IName {
  [key: string]: any
}

interface IIgnoreAddressFields {
  fieldsToIgnoreForLocalAddress: string[]
  fieldsToIgnoreForInternationalAddress: string[]
}

export const nameToFieldTransformer = (
  language: string,
  transformedFieldName?: string,
  fromSectionId?: string
) => (
  transformedData: IFormData,
  queryData: any,
  sectionId: string,
  field: IFormField
) => {
  const selectSectionId = fromSectionId ? fromSectionId : sectionId
  const selectedName: IName | undefined =
    queryData[selectSectionId] &&
    queryData[selectSectionId].name &&
    (queryData[selectSectionId].name as GQLHumanName[]).find(
      name => name.use === language
    )
  const nameKey = transformedFieldName ? transformedFieldName : field.name
  if (!selectedName || !selectedName[nameKey]) {
    return transformedData
  }
  if (!transformedData[sectionId]) {
    transformedData[sectionId] = {}
  }
  transformedData[sectionId][field.name] = selectedName[nameKey]
  return transformedData
}

export const fieldValueTransformer = (transformedFieldName: string) => (
  transformedData: IFormData,
  queryData: any,
  sectionId: string,
  field: IFormField
) => {
  if (queryData[sectionId] && queryData[sectionId][transformedFieldName]) {
    transformedData[sectionId][field.name] =
      queryData[sectionId][transformedFieldName]
  }
  return transformedData
}

export const bundleFieldToSectionFieldTransformer = (
  transformedFieldName?: string
) => (
  transformedData: IFormData,
  queryData: any,
  sectionId: string,
  field: IFormField
) => {
  const selectedFieldName = transformedFieldName
    ? transformedFieldName
    : field.name
  if (
    queryData[selectedFieldName] !== null &&
    queryData[selectedFieldName] !== undefined &&
    queryData[selectedFieldName] !== ''
  ) {
    transformedData[sectionId][field.name] = queryData[selectedFieldName]
  }
  return transformedData
}

export function arrayToFieldTransformer(
  transformedData: IFormData,
  queryData: any,
  sectionId: string,
  field: IFormField
) {
  if (
    queryData[sectionId] &&
    queryData[sectionId][field.name] &&
    queryData[sectionId][field.name][0]
  ) {
    transformedData[sectionId][field.name] = queryData[sectionId][field.name][0]
  }
  return transformedData
}

export const identifierToFieldTransformer = (identifierField: string) => (
  transformedData: IFormData,
  queryData: any,
  sectionId: string,
  field: IFormField
) => {
  if (
    !queryData[sectionId] ||
    !queryData[sectionId].identifier ||
    !queryData[sectionId].identifier[0] ||
    !queryData[sectionId].identifier[0][identifierField]
  ) {
    return transformedData
  }
  transformedData[sectionId][field.name] =
    queryData[sectionId].identifier[0][identifierField]
  return transformedData
}

export const identifierWithTypeToFieldTransformer = (
  identifierType: string
) => (
  transformedData: IFormData,
  queryData: any,
  sectionId: string,
  field: IFormField
) => {
  let identifier
  if (
    (identifier = queryData[sectionId] && queryData[sectionId].identifier) &&
    identifier.system === identifierType
  ) {
    transformedData[sectionId][field.name] = identifier.value
  }
  return transformedData
}

export const identityToFieldTransformer = (
  identifierField: string,
  identityType: string
) => (
  transformedData: IFormData,
  queryData: any,
  sectionId: string,
  field: IFormField
) => {
  if (queryData[sectionId] && queryData[sectionId].identifier) {
    const existingIdentity = queryData[sectionId].identifier.find(
      (identity: fhir.Identifier) => identity.type === identityType
    )
    transformedData[sectionId][field.name] =
      existingIdentity && identifierField in existingIdentity
        ? existingIdentity[identifierField]
        : EMPTY_STRING
  }
  return transformedData
}
interface IAddress {
  [key: string]: any
}

export const addressToFieldTransformer = (
  addressType: string,
  lineNumber: number = 0,
  transformedFieldName?: string
) => (
  transformedData: IFormData,
  queryData: any,
  sectionId: string,
  field: IFormField
) => {
  const address: IAddress | undefined =
    queryData[sectionId] &&
    queryData[sectionId].address &&
    (queryData[sectionId].address as GQLAddress[]).find(
      addr => addr.type === addressType
    )

  if (!address) {
    return transformedData
  }
  if (lineNumber > 0) {
    transformedData[sectionId][field.name] =
      (address.line && address.line[lineNumber - 1]) || ''
  } else {
    transformedData[sectionId][field.name] =
      address[transformedFieldName ? transformedFieldName : field.name]
  }
  return transformedData
}

export const sameAddressFieldTransformer = (
  fromAddressType: string,
  fromSection: string,
  toAddressType: string,
  toSection: string
) => (
  transformedData: IFormData,
  queryData: any,
  sectionId: string,
  field: IFormField
) => {
  const fromAddress =
    queryData[fromSection] &&
    queryData[fromSection].address &&
    (queryData[fromSection].address as [GQLAddress]).find(
      addr => addr.type === fromAddressType
    )
  const toAddress =
    queryData[toSection] &&
    queryData[toSection].address &&
    (queryData[toSection].address as [GQLAddress]).find(
      addr => addr.type === toAddressType
    )
  if (!fromAddress || !toAddress) {
    transformedData[sectionId][field.name] = false
    return transformedData
  }

  transformedData[sectionId][field.name] =
    fromAddress.country === toAddress.country &&
    fromAddress.state === toAddress.state &&
    fromAddress.district === toAddress.district &&
    fromAddress.postalCode === toAddress.postalCode &&
    (fromAddress.line && fromAddress.line[0]) ===
      (toAddress.line && toAddress.line[0]) &&
    (fromAddress.line && fromAddress.line[1]) ===
      (toAddress.line && toAddress.line[1]) &&
    (fromAddress.line && fromAddress.line[2]) ===
      (toAddress.line && toAddress.line[2]) &&
    (fromAddress.line && fromAddress.line[3]) ===
      (toAddress.line && toAddress.line[3]) &&
    (fromAddress.line && fromAddress.line[4]) ===
      (toAddress.line && toAddress.line[4]) &&
    (fromAddress.line && fromAddress.line[5]) ===
      (toAddress.line && toAddress.line[5])

  return transformedData
}

export const sectionFieldExchangeTransformer = (
  fromSectionId: string,
  fromSectionField?: string
) => (
  transformedData: IFormData,
  queryData: any,
  sectionId: string,
  field: IFormField
) => {
  if (
    !queryData[fromSectionId] ||
    !queryData[fromSectionId][fromSectionField ? fromSectionField : field.name]
  ) {
    return transformedData
  }
  transformedData[sectionId][field.name] =
    queryData[fromSectionId][fromSectionField ? fromSectionField : field.name]
  return transformedData
}

export function commentToFieldTransformer(
  transformedData: IFormData,
  queryData: any,
  sectionId: string,
  field: IFormField
) {
  const comment =
    queryData[sectionId].status &&
    (queryData[sectionId].status as GQLRegWorkflow[])[0].comments &&
    ((queryData[sectionId].status as GQLRegWorkflow[])[0]
      .comments as GQLComment[])[0].comment
  if (comment) {
    transformedData[sectionId][field.name] = comment
  }
  return transformedData
}

export function attachmentToFieldTransformer(
  transformedData: IFormData,
  queryData: any,
  sectionId: string,
  field: IFormField,
  alternateSectionId?: string,
  subjectMapper?: any,
  typeMapper?: any,
  fieldNameMapping?: any
) {
  const selectedSectionId = alternateSectionId ? alternateSectionId : sectionId
  let attachments: IAttachment[] = []

  if (queryData[selectedSectionId].attachments) {
    ;(queryData[selectedSectionId].attachments as GQLAttachment[]).forEach(
      attachment => {
        const subject = attachment.subject as string
        let type = attachment.type
        if (typeMapper) {
          // @ts-ignore
          type =
            Object.keys(typeMapper).find(
              key => typeMapper[key] === attachment.type
            ) || attachment.type
        }
        if (fieldNameMapping && field.name === fieldNameMapping[subject]) {
          attachments.push({
            data: attachment.data,
            type: attachment.contentType,
            optionValues: [subject, type],
            title: subject,
            description: type
          } as IAttachment)
        }
      }
    )
  }
  if (attachments) {
    transformedData[sectionId][field.name] = attachments
  }
  return transformedData
}

export const eventLocationQueryTransformer = (
  lineNumber: number = 0,
  transformedFieldName?: string,
  ignoreAddressFields?: IIgnoreAddressFields
) => (
  transformedData: IFormData,
  queryData: any,
  sectionId: string,
  field: IFormField
) => {
  if (!queryData.eventLocation || !queryData.eventLocation.address) {
    return transformedData
  }
  const eventLocation = queryData.eventLocation as fhir.Location
  const address = eventLocation.address as IAddress
  const line = address.line as string[]
  const country = address.country
  const fieldValue =
    address[transformedFieldName ? transformedFieldName : field.name]
  if (lineNumber > 0) {
    transformedData[sectionId][field.name] = line[lineNumber - 1]
  } else if (fieldValue && ignoreAddressFields) {
    if (
      (country &&
        country.toUpperCase() === window.config.COUNTRY.toUpperCase() &&
        !ignoreAddressFields.fieldsToIgnoreForLocalAddress.includes(
          field.name
        )) ||
      (country &&
        country.toUpperCase() !== window.config.COUNTRY.toUpperCase() &&
        !ignoreAddressFields.fieldsToIgnoreForInternationalAddress.includes(
          field.name
        ))
    ) {
      transformedData[sectionId][field.name] = fieldValue
    }
  } else if (fieldValue) {
    transformedData[sectionId][field.name] = fieldValue
  }

  return transformedData
}

export const eventLocationTypeQueryTransformer = () => (
  transformedData: IFormData,
  queryData: any,
  sectionId: string,
  field: IFormField
) => {
  if (!queryData.eventLocation) {
    return transformedData
  }
  if (!queryData.eventLocation.type) {
    transformedData[sectionId][field.name] = 'HOSPITAL'
  } else {
    transformedData[sectionId][field.name] = queryData.eventLocation
      .type as string
  }
  return transformedData
}

export const eventLocationIDQueryTransformer = () => (
  transformedData: IFormData,
  queryData: any,
  sectionId: string,
  field: IFormField
) => {
  if (
    !queryData.eventLocation ||
    !queryData._fhirIDMap ||
    !queryData._fhirIDMap.eventLocation
  ) {
    return transformedData
  } else {
    transformedData[sectionId][field.name] = queryData._fhirIDMap
      .eventLocation as string
  }
  return transformedData
}

export const locationIDToFieldTransformer = (transformedName?: string) => (
  transformedData: IFormData,
  queryData: any,
  sectionId: string,
  field: IFormField
) => {
  const fieldName = transformedName || field.name
  if (queryData[sectionId] && queryData[sectionId][fieldName]) {
    transformedData[sectionId][field.name] = queryData[sectionId][fieldName].id
  }

  return transformedData
}

export const nestedValueToFieldTransformer = (
  nestedFieldName: string,
  transformMethod?: IFormFieldQueryMapFunction
) => (
  transformedData: IFormData,
  queryData: any,
  sectionId: string,
  field: IFormField
) => {
  if (!queryData[sectionId] || !queryData[sectionId][nestedFieldName]) {
    return transformedData
  } else if (transformMethod) {
    const clonedData = cloneDeep(transformedData)
    if (!clonedData[nestedFieldName]) {
      clonedData[nestedFieldName] = {}
    }

    transformMethod(clonedData, queryData[sectionId], nestedFieldName, field)

    if (clonedData[nestedFieldName][field.name] === undefined) {
      return transformedData
    }
    transformedData[sectionId][field.name] =
      clonedData[nestedFieldName][field.name]
  } else {
    transformedData[sectionId][field.name] =
      queryData[sectionId][nestedFieldName][field.name]
  }
  return transformedData
}

export const reasonsNotApplyingToFieldValueTransformer = (
  transformedArrayName: string,
  transformedFieldName: string,
  extraField?: string,
  extraValues?: string[],
  transformedFieldValue?: string[]
) => (
  transformedData: IFormData,
  queryData: TransformedData,
  sectionId: string,
  field: IFormField
) => {
  const sectionData = queryData[sectionId]
  let fieldValue
  if (!sectionData) {
    return transformedData
  }

  const transformedArray = sectionData[
    transformedArrayName
  ] as IFormSectionData[]

  transformedArray.forEach((arrayField, index) => {
    const value = arrayField[transformedFieldName]
    if (
      value &&
      extraField &&
      (arrayField[extraField] === field.extraValue ||
        (extraValues && extraValues.includes(arrayField[extraField] as string)))
    ) {
      fieldValue = value
      transformedArray.splice(index, 1)
    } else if (value && extraValues && extraValues.includes(value as string)) {
      fieldValue = value
    }
  })

  if (fieldValue) {
    transformedData[sectionId][field.name] = transformedFieldValue || fieldValue
  }
}

export const valueToNestedRadioFieldTransformer = (
  transformMethod: IFormFieldQueryMapFunction
) => (
  transformedData: IFormData,
  queryData: TransformedData,
  sectionId: string,
  field: IFormField,
  nestedField?: IFormField
) => {
  const tempDraftData = {
    [sectionId]: {}
  } as IFormData
  transformMethod(tempDraftData, queryData, sectionId, nestedField || field)
  const fieldValue =
    tempDraftData[sectionId][nestedField ? nestedField.name : field.name]

  if (!fieldValue) {
    return
  }
  const transformedFieldData = transformedData[sectionId][
    field.name
  ] as IFormData
  if (!transformedFieldData) {
    transformedData[sectionId][field.name] = {
      value: fieldValue,
      nestedFields: {}
    }
  } else if (nestedField) {
    transformedFieldData.nestedFields[nestedField.name] = fieldValue
  }
}

export const bundleFieldToNestedRadioFieldTransformer = (
  transformedFieldName: string
) => (
  transformedData: TransformedData,
  queryData: IFormData,
  sectionId: string,
  field: IFormField
) => {
  transformedData[sectionId][field.name] = transformedData[sectionId][
    field.name
  ] || {
    value: get(queryData, transformedFieldName),
    nestedFields: {}
  }
}
