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
import { IDeclaration, IDuplicates } from '@client/declarations'
import {
  IForm,
  IFormData,
  IFormField,
  IFormFieldMapping,
  IFormFieldMutationMapFunction,
  IFormFieldQueryMapFunction,
  IFormSection,
  TransformedData
} from '@client/forms'
import { sectionTransformer } from '@client/forms/register/mappings/query'
import {
  getConditionalActionsForField,
  getSelectedRadioOptionWithNestedFields,
  getVisibleSectionGroupsBasedOnConditions,
  isFieldButton,
  isFieldHttp,
  isFieldIDReader,
  isFieldLinkButton,
  isRadioGroupWithNestedField,
  serializeFieldValue
} from '@client/forms/utils'
import { IOfflineData } from '@client/offline/reducer'
import {
  CorrectionValueInput,
  DuplicatesInfo,
  EventRegistration,
  EventSearchSet
} from '@client/utils/gateway'
import { UserDetails } from '@client/utils/userUtils'
import { hasFieldChanged } from '@client/views/CorrectionForm/utils'
import { get, isEmpty } from 'lodash'

const nestedFieldsMapping = (
  transformedData: TransformedData,
  draftData: IFormData,
  sectionId: string,
  fieldDef: IFormField,
  mappingKey: keyof IFormFieldMapping
) => {
  let tempFormField: IFormField
  for (const index in fieldDef.nestedFields) {
    for (const nestedIndex in fieldDef.nestedFields[index]) {
      tempFormField = fieldDef.nestedFields[index][nestedIndex]
      tempFormField &&
        tempFormField.mapping &&
        tempFormField.mapping[mappingKey] &&
        (
          tempFormField.mapping[mappingKey] as
            | IFormFieldMutationMapFunction
            | IFormFieldQueryMapFunction
        )(transformedData, draftData, sectionId, fieldDef, tempFormField)
    }
  }
}

const documentChangedValue = (
  section: IFormSection,
  fieldDef: IFormField,
  draftData: IFormData,
  originalDraftData: IFormData
): CorrectionValueInput => {
  const generateValue = (data: IFormData, prefix: string) =>
    isEmpty(data[section.id][fieldDef.name])
      ? ''
      : `${prefix} ${fieldDef.label.defaultMessage}`

  return {
    section: section.id,
    fieldName: fieldDef.name,
    newValue: generateValue(draftData, 'New'),
    oldValue: generateValue(originalDraftData, 'Old')
  }
}
const toCorrectionValue = (
  section: IFormSection,
  fieldDef: IFormField,
  draftData: IFormData,
  originalDraftData: IFormData,
  nestedFieldDef: IFormField | null = null
) => {
  const newSerializedFieldValue = serializeFieldValue(
    fieldDef,
    draftData[section.id][fieldDef.name],
    draftData[section.id]
  )
  const changedValues: CorrectionValueInput[] = []
  if (nestedFieldDef) {
    const valuePath = `${fieldDef.name}.nestedFields.${nestedFieldDef.name}`
    const newFieldValue = get(draftData[section.id], valuePath)
    const oldFieldValue = get(originalDraftData[section.id], valuePath)
    if (newFieldValue !== oldFieldValue && newSerializedFieldValue) {
      changedValues.push({
        section: section.id,
        fieldName: valuePath,
        newValue: newSerializedFieldValue,
        oldValue: serializeFieldValue(
          fieldDef,
          oldFieldValue,
          originalDraftData[section.id]
        )
      })
    }
  } else if (isRadioGroupWithNestedField(fieldDef)) {
    const selectedRadioOption = getSelectedRadioOptionWithNestedFields(
      fieldDef,
      draftData[section.id]
    )
    const selectedRadioOptionOld = getSelectedRadioOptionWithNestedFields(
      fieldDef,
      originalDraftData[section.id]
    )

    if (selectedRadioOption !== selectedRadioOptionOld) {
      changedValues.push({
        section: section.id,
        fieldName: fieldDef.name,
        newValue: selectedRadioOption ?? '',
        oldValue: selectedRadioOptionOld ?? ''
      })
    }

    if (
      selectedRadioOption &&
      Array.isArray(fieldDef.nestedFields[selectedRadioOption])
    ) {
      for (const nestedFieldDef of fieldDef.nestedFields[selectedRadioOption]) {
        const nestedChangedValues = toCorrectionValue(
          section,
          fieldDef,
          draftData,
          originalDraftData,
          nestedFieldDef
        )
        changedValues.push(...nestedChangedValues)
      }
    }
  } else if (section.id === 'documents') {
    changedValues.push(
      documentChangedValue(section, fieldDef, draftData, originalDraftData)
    )
  } else {
    changedValues.push({
      section: section.id,
      fieldName: fieldDef.name,
      newValue: newSerializedFieldValue ?? '',
      oldValue:
        serializeFieldValue(
          fieldDef,
          originalDraftData[section.id][fieldDef.name],
          originalDraftData[section.id]
        ) ?? ''
    })
  }
  return changedValues
}
/**
 * This check ensures these fields are ignored when submitting, as they only generate
 * other field values and shouldn't be sent to the backend.
 */
function isMetaTypeField(field: IFormField): boolean {
  return (
    isFieldHttp(field) || isFieldLinkButton(field) || isFieldIDReader(field)
  )
}
export function getChangedValues(
  formDefinition: IForm,
  declaration: IDeclaration,
  offlineCountryConfig: IOfflineData,
  userDetails: UserDetails | null
) {
  const draftData = declaration.data
  const originalDraftData = declaration.originalData || {}
  const changedValues: CorrectionValueInput[] = []

  if (!formDefinition.sections) {
    throw new Error('Sections are missing in form definition')
  }

  formDefinition.sections.forEach((section) => {
    if (!draftData[section.id]) {
      return
    }

    getVisibleSectionGroupsBasedOnConditions(
      section,
      draftData[section.id],
      draftData
    ).forEach((groupDef) => {
      groupDef.fields.forEach((fieldDef) => {
        const conditionalActions: string[] = getConditionalActionsForField(
          fieldDef,
          draftData[section.id],
          offlineCountryConfig,
          draftData,
          userDetails
        )

        originalDraftData[section.id] ??= {}

        if (
          (!conditionalActions.includes('hide') ||
            fieldDef.name === 'detailsExist') &&
          !isMetaTypeField(fieldDef) &&
          hasFieldChanged(
            fieldDef,
            draftData[section.id],
            originalDraftData[section.id]
          )
        ) {
          changedValues.push(
            ...toCorrectionValue(
              section,
              fieldDef,
              draftData,
              originalDraftData
            )
          )
        }
      })
    })
  })

  return changedValues
}

export const draftToGqlTransformer = (
  formDefinition: IForm,
  draftData: IFormData,
  draftId: string,
  userDetails: UserDetails | null,
  offlineCountryConfig: IOfflineData
) => {
  if (!formDefinition.sections) {
    throw new Error('Sections are missing in form definition')
  }

  const transformedData: TransformedData = { createdAt: new Date() }
  const inCompleteFieldList: string[] = []
  formDefinition.sections.forEach((section) => {
    if (!draftData[section.id]) {
      draftData[section.id] = {}
    }
    if (!transformedData[section.id]) {
      transformedData[section.id] = {}
    }
    getVisibleSectionGroupsBasedOnConditions(
      section,
      draftData[section.id],
      draftData,
      userDetails
    ).forEach((groupDef) => {
      groupDef.fields.forEach((fieldDef) => {
        const conditionalActions: string[] = getConditionalActionsForField(
          fieldDef,
          draftData[section.id],
          offlineCountryConfig,
          draftData,
          userDetails
        )
        if (
          fieldDef.required &&
          // do not count value even if it is required when the field is a button
          !isFieldButton(fieldDef) &&
          !conditionalActions.includes('hide') &&
          !conditionalActions.includes('disable') &&
          (draftData[section.id][fieldDef.name] === undefined ||
            draftData[section.id][fieldDef.name] === '')
        ) {
          /* eslint-disable no-console */
          console.error(
            `Data is missing for a required field: ${fieldDef.name}` +
              ` on section ${section.id}`
          )
          /* eslint-enable no-console */
          inCompleteFieldList.push(
            `${section.id}/${groupDef.id}/${fieldDef.name}`
          )
          return
        }

        if (
          draftData[section.id][fieldDef.name] !== null &&
          draftData[section.id][fieldDef.name] !== undefined &&
          draftData[section.id][fieldDef.name] !== '' &&
          (!conditionalActions.includes('hide') ||
            fieldDef.name === 'detailsExist') // https://github.com/opencrvs/opencrvs-core/issues/7821#issuecomment-2514398986
        ) {
          if (fieldDef.mapping && fieldDef.mapping.mutation) {
            fieldDef.mapping.mutation(
              transformedData,
              draftData,
              section.id,
              fieldDef
            )
            nestedFieldsMapping(
              transformedData,
              draftData,
              section.id,
              fieldDef,
              'mutation'
            )
          } else {
            transformedData[section.id][fieldDef.name] =
              draftData[section.id][fieldDef.name]
          }
        }
      })
    })
    if (draftData[section.id]._fhirID) {
      transformedData[section.id]._fhirID = draftData[section.id]._fhirID
    }
    if (section.mapping && section.mapping.mutation) {
      section.mapping.mutation(transformedData, draftData, section.id)
    }
    if (
      transformedData[section.id] &&
      Object.keys(transformedData[section.id]).length < 1
    ) {
      delete transformedData[section.id]
    }
  })
  if (draftData._fhirIDMap) {
    transformedData._fhirIDMap = draftData._fhirIDMap
  }
  if (inCompleteFieldList && inCompleteFieldList.length > 0) {
    if (transformedData.registration) {
      transformedData.registration.inCompleteFields =
        inCompleteFieldList.join(',')
    } else {
      transformedData.registration = {
        inCompleteFields: inCompleteFieldList.join(',')
      }
    }
  }
  if (draftId) {
    if (transformedData.registration) {
      transformedData.registration.draftId = draftId
    } else {
      transformedData.registration = { draftId }
    }
  }
  return transformedData
}

export const appendGqlMetadataFromDraft = (
  draft: IDeclaration,
  gqlDetails: TransformedData
) => {
  const { timeLoggedMS } = draft

  if (!gqlDetails.registration.status) {
    gqlDetails.registration.status = []
  }
  if (!gqlDetails.registration.status[0]) {
    gqlDetails.registration.status[0] = {}
  }
  gqlDetails.registration.status[0].timeLoggedMS = timeLoggedMS
}

export const gqlToDraftTransformer = (
  formDefinition: IForm,
  queryData: any,
  offlineData?: IOfflineData,
  userDetails?: UserDetails
) => {
  if (!formDefinition.sections) {
    throw new Error('Sections are missing in form definition')
  }
  if (!queryData) {
    throw new Error('Provided query data is not valid')
  }
  const transformedData: IFormData = {}

  const visibleSections = formDefinition.sections.filter((section) =>
    getVisibleSectionGroupsBasedOnConditions(
      section,
      queryData[section.id] || {},
      queryData,
      userDetails
    )
  )
  visibleSections.forEach((section) => {
    transformedData[section.id] = {}
    section.groups.forEach((groupDef) => {
      groupDef.fields.forEach((fieldDef) => {
        if (fieldDef.mapping?.template) {
          if (!transformedData.template) {
            transformedData.template = {}
          }
          /**
           * Wraps actual transformer with
           * section transformer
           */
          const [fieldName, fieldTransformer] = fieldDef.mapping.template
          sectionTransformer('template', fieldTransformer, fieldName)(
            transformedData,
            queryData,
            section.id,
            fieldDef,
            undefined,
            offlineData
          )
        }
        if (fieldDef.mapping && fieldDef.mapping.query) {
          fieldDef.mapping.query(
            transformedData,
            queryData,
            section.id,
            fieldDef
          )
          nestedFieldsMapping(
            transformedData,
            queryData,
            section.id,
            fieldDef,
            'query'
          )
        } else if (
          queryData[section.id] &&
          queryData[section.id][fieldDef.name] &&
          queryData[section.id][fieldDef.name] !== ''
        ) {
          transformedData[section.id][fieldDef.name] =
            queryData[section.id][fieldDef.name]
        }
      })
    })
    if (queryData[section.id] && queryData[section.id].id) {
      transformedData[section.id]._fhirID = queryData[section.id].id
    }
    if (section.mapping && section.mapping.query) {
      section.mapping.query(
        transformedData,
        queryData,
        section.id,
        undefined,
        undefined,
        offlineData
      )
    }
    if (section.mapping?.template) {
      if (!transformedData.template) {
        transformedData.template = {}
      }
      section.mapping.template.forEach(([fieldName, transformer]) => {
        transformer(
          transformedData,
          queryData,
          section.id,
          'template',
          fieldName,
          offlineData,
          userDetails
        )
      })
    }
    if (
      transformedData[section.id] &&
      Object.keys(transformedData[section.id]).length < 1
    ) {
      delete transformedData[section.id]
    }
  })
  if (queryData._fhirIDMap) {
    transformedData._fhirIDMap = queryData._fhirIDMap
  }
  if (queryData.history) {
    transformedData.history = queryData.history
  }

  if (queryData.user?.role) {
    transformedData.user.role = queryData.user.role.id
  }

  return transformedData
}

export function getPotentialDuplicateIds(
  eventRegistration: EventRegistration | EventSearchSet | null
) {
  const duplicates = eventRegistration?.registration?.duplicates
  if (duplicates && duplicates[0] && typeof duplicates[0] === 'object') {
    return (eventRegistration?.registration?.duplicates as DuplicatesInfo[])
      .filter(
        (duplicate): duplicate is IDuplicates => !!duplicate.compositionId
      )
      .map(({ compositionId }) => compositionId)
  } else if (duplicates && typeof duplicates[0] === 'string') {
    return (eventRegistration?.registration?.duplicates as string[]).filter(
      (duplicate): duplicate is string => !!duplicate
    )
  }
}
