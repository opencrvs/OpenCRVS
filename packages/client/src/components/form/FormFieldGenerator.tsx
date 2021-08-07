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
import * as React from 'react'
import {
  CheckboxGroup,
  DateField,
  PDFViewer,
  RadioGroup,
  Select,
  TextArea,
  TextInput,
  WarningMessage,
  RadioSize
} from '@opencrvs/components/lib/forms'
import { Paragraph, Link } from '@opencrvs/components/lib/typography'
import {
  internationaliseFieldObject,
  getConditionalActionsForField,
  getFieldOptions,
  getFieldLabel,
  getFieldLabelToolTip,
  getFieldOptionsByValueMapper,
  getFieldType,
  getQueryData,
  getVisibleOptions,
  getListOfLocations,
  getFieldHelperText
} from '@client/forms/utils'

import styled, { keyframes } from '@client/styledComponents'
import { gqlToDraftTransformer } from '@client/transformer'
import {
  SELECT_WITH_DYNAMIC_OPTIONS,
  SELECT_WITH_OPTIONS,
  RADIO_GROUP,
  CHECKBOX_GROUP,
  DATE,
  DOCUMENT_UPLOADER_WITH_OPTION,
  TEXTAREA,
  TEL,
  SUBSECTION,
  WARNING,
  FIELD_WITH_DYNAMIC_DEFINITIONS,
  IDynamicFormField,
  IFileValue,
  IForm,
  IFormField,
  IFormFieldValue,
  IFormSectionData,
  Ii18nFormField,
  INFORMATIVE_RADIO_GROUP,
  ISelectFormFieldWithDynamicOptions,
  ISelectFormFieldWithOptions,
  ITextFormField,
  Ii18nTextFormField,
  LINK,
  LIST,
  NUMBER,
  BIG_NUMBER,
  PARAGRAPH,
  PDF_DOCUMENT_VIEWER,
  DYNAMIC_LIST,
  IDynamicListFormField,
  IListFormField,
  IFormData,
  FETCH_BUTTON,
  ILoaderButton,
  FIELD_GROUP_TITLE,
  IFormSection,
  SIMPLE_DOCUMENT_UPLOADER,
  IAttachmentValue,
  RADIO_GROUP_WITH_NESTED_FIELDS,
  Ii18nRadioGroupWithNestedFieldsFormField,
  LOCATION_SEARCH_INPUT
} from '@client/forms'
import { getValidationErrorsForForm, Errors } from '@client/forms/validation'
import { InputField } from '@client/components/form/InputField'
import { SubSectionDivider } from '@client/components/form/SubSectionDivider'

import { FormList } from '@client/components/form/FormList'
import { FetchButtonField } from '@client/components/form/FetchButton'

import { InformativeRadioGroup } from '@client/views/PrintCertificate/InformativeRadioGroup'
import { DocumentUploaderWithOption } from './DocumentUploadfield/DocumentUploaderWithOption'
import {
  WrappedComponentProps as IntlShapeProps,
  injectIntl,
  FormattedMessage,
  MessageDescriptor
} from 'react-intl'
import {
  withFormik,
  FastField,
  Field,
  FormikProps,
  FieldProps,
  FormikTouched,
  FormikValues
} from 'formik'
import { IOfflineData, LocationType } from '@client/offline/reducer'
import { isEqual, flatten } from 'lodash'
import { SimpleDocumentUploader } from './DocumentUploadfield/SimpleDocumentUploader'
import { IStoreState } from '@client/store'
import { getOfflineData } from '@client/offline/selectors'
import { connect } from 'react-redux'
import { dynamicDispatch } from '@client/applications'
import { LocationSearch } from '@opencrvs/components/lib/interface'
import { REGEXP_NUMBER_INPUT_NON_NUMERIC } from '@client/utils/constants'
import { isMobileDevice } from '@client/utils/commonUtils'

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`

const FormItem = styled.div<{
  ignoreBottomMargin?: boolean
  hideFakeMarginTop?: boolean
}>`
  animation: ${fadeIn} 500ms;
  margin-bottom: ${({ ignoreBottomMargin }) =>
    ignoreBottomMargin ? '0px' : '32px'};

  ${({ hideFakeMarginTop }) =>
    !hideFakeMarginTop &&
    `& > div::before {
    content: ' ';
    height: 80px;
    margin-top: -80px;
    display: block;
    visibility: hidden;
    pointer-events: none;
  }`}
`
const LinkFormField = styled(Link)`
  ${({ theme }) => theme.fonts.bodyStyle};
`

const FieldGroupTitle = styled.div`
  ${({ theme }) => theme.fonts.h4Style};
  margin-top: 16px;
`

const LocationSearchFormField = styled(LocationSearch)`
  ${({ theme }) => `@media (min-width: ${theme.grid.breakpoints.md}px) {
    width: 535px;
  }`}

  & > input {
    border-radius: 0;
  }
`

function handleSelectFocus(id: string, isSearchable: boolean) {
  if (isMobileDevice() && isSearchable) {
    setTimeout(() => {
      const inputElement = document.getElementById(`${id}-form-input`)

      if (inputElement) {
        inputElement.scrollIntoView({
          behavior: 'smooth'
        })
      }
    }, 20)
  }
}

type GeneratedInputFieldProps = {
  fieldDefinition: Ii18nFormField
  onSetFieldValue: (name: string, value: IFormFieldValue) => void
  onChange: (e: React.ChangeEvent<any>) => void
  onBlur: (e: React.FocusEvent<any>) => void
  resetDependentSelectValues: (name: string) => void
  resetNestedInputValues?: (field: Ii18nFormField) => void
  nestedFields?: { [key: string]: JSX.Element[] }
  value: IFormFieldValue
  touched: boolean
  error: string
  draftData?: IFormData
  disabled?: boolean
} & IDispatchProps

function GeneratedInputField({
  fieldDefinition,
  onChange,
  onBlur,
  onSetFieldValue,
  resetDependentSelectValues,
  resetNestedInputValues,
  error,
  touched,
  value,
  nestedFields,
  draftData,
  disabled,
  dynamicDispatch
}: GeneratedInputFieldProps) {
  const inputFieldProps = {
    id: fieldDefinition.name,
    label: fieldDefinition.label,
    helperText: fieldDefinition.helperText,
    tooltip: fieldDefinition.tooltip,
    description: fieldDefinition.description,
    required: fieldDefinition.required,
    disabled: fieldDefinition.disabled,
    prefix: fieldDefinition.prefix,
    postfix: fieldDefinition.postfix,
    hideAsterisk: fieldDefinition.hideAsterisk,
    hideInputHeader: fieldDefinition.hideHeader,
    error,
    touched,
    mode: fieldDefinition.mode
  }

  const inputProps = {
    id: fieldDefinition.name,
    onChange,
    onBlur,
    value,
    disabled: fieldDefinition.disabled,
    error: Boolean(error),
    touched: Boolean(touched),
    placeholder: fieldDefinition.placeholder
  }

  if (fieldDefinition.type === SELECT_WITH_OPTIONS) {
    return (
      <InputField {...inputFieldProps}>
        <Select
          {...inputProps}
          isDisabled={fieldDefinition.disabled}
          value={value as string}
          onChange={(val: string) => {
            resetDependentSelectValues(fieldDefinition.name)
            onSetFieldValue(fieldDefinition.name, val)
          }}
          onFocus={() =>
            handleSelectFocus(
              fieldDefinition.name,
              fieldDefinition.options.length > 10
            )
          }
          options={fieldDefinition.options}
        />
      </InputField>
    )
  }
  if (fieldDefinition.type === DOCUMENT_UPLOADER_WITH_OPTION) {
    return (
      <DocumentUploaderWithOption
        name={fieldDefinition.name}
        label={fieldDefinition.label}
        options={fieldDefinition.options}
        splitView={fieldDefinition.splitView}
        files={value as IFileValue[]}
        extraValue={fieldDefinition.extraValue || ''}
        hideOnEmptyOption={fieldDefinition.hideOnEmptyOption}
        onComplete={(files: IFileValue[]) =>
          onSetFieldValue(fieldDefinition.name, files)
        }
      />
    )
  }
  if (fieldDefinition.type === SIMPLE_DOCUMENT_UPLOADER) {
    return (
      <SimpleDocumentUploader
        name={fieldDefinition.name}
        label={fieldDefinition.label}
        description={fieldDefinition.description}
        allowedDocType={fieldDefinition.allowedDocType}
        files={value as IAttachmentValue}
        error={error}
        onComplete={file => onSetFieldValue(fieldDefinition.name, file)}
      />
    )
  }
  if (fieldDefinition.type === RADIO_GROUP) {
    return (
      <InputField {...inputFieldProps}>
        <RadioGroup
          {...inputProps}
          size={fieldDefinition.size}
          onChange={(val: string) => {
            resetDependentSelectValues(fieldDefinition.name)
            onSetFieldValue(fieldDefinition.name, val)
          }}
          options={fieldDefinition.options}
          name={fieldDefinition.name}
          value={value as string}
          notice={fieldDefinition.notice}
        />
      </InputField>
    )
  }

  if (
    fieldDefinition.type === RADIO_GROUP_WITH_NESTED_FIELDS &&
    nestedFields &&
    resetNestedInputValues
  ) {
    const visibleRadioOptions = getVisibleOptions(
      fieldDefinition.options,
      draftData as IFormData
    )
    return (
      <InputField {...inputFieldProps}>
        <RadioGroup
          {...inputProps}
          size={RadioSize.LARGE}
          onChange={(val: string) => {
            resetNestedInputValues(fieldDefinition)
            onSetFieldValue(`${fieldDefinition.name}.value`, val)
          }}
          nestedFields={nestedFields}
          options={visibleRadioOptions}
          name={fieldDefinition.name}
          value={value as string}
          notice={fieldDefinition.notice}
        />
      </InputField>
    )
  }

  if (fieldDefinition.type === INFORMATIVE_RADIO_GROUP) {
    return (
      <InformativeRadioGroup
        inputProps={inputProps}
        value={value as string}
        onSetFieldValue={onSetFieldValue}
        fieldDefinition={fieldDefinition}
        inputFieldProps={inputFieldProps}
      />
    )
  }

  if (fieldDefinition.type === CHECKBOX_GROUP) {
    return (
      <InputField {...inputFieldProps}>
        <CheckboxGroup
          {...inputProps}
          options={fieldDefinition.options}
          name={fieldDefinition.name}
          value={value as string[]}
          onChange={(val: string[]) =>
            onSetFieldValue(fieldDefinition.name, val)
          }
        />
      </InputField>
    )
  }

  if (fieldDefinition.type === DATE) {
    return (
      <InputField {...inputFieldProps}>
        <DateField
          {...inputProps}
          notice={fieldDefinition.notice}
          ignorePlaceHolder={fieldDefinition.ignorePlaceHolder}
          onChange={(val: string) => onSetFieldValue(fieldDefinition.name, val)}
          value={value as string}
        />
      </InputField>
    )
  }
  if (fieldDefinition.type === TEXTAREA) {
    return (
      <InputField {...inputFieldProps}>
        <TextArea {...inputProps} />
      </InputField>
    )
  }
  if (fieldDefinition.type === TEL) {
    return (
      <InputField {...inputFieldProps}>
        <TextInput
          type="tel"
          {...inputProps}
          isSmallSized={fieldDefinition.isSmallSized}
          value={inputProps.value as string}
        />
      </InputField>
    )
  }
  if (fieldDefinition.type === SUBSECTION) {
    return (
      <SubSectionDivider
        label={fieldDefinition.label}
        required={inputFieldProps.required}
      />
    )
  }
  if (fieldDefinition.type === FIELD_GROUP_TITLE) {
    return <FieldGroupTitle>{fieldDefinition.label}</FieldGroupTitle>
  }
  if (fieldDefinition.type === PARAGRAPH) {
    const label = (fieldDefinition.label as unknown) as MessageDescriptor

    return (
      <Paragraph fontSize={fieldDefinition.fontSize}>
        <FormattedMessage
          {...label}
          values={{
            [fieldDefinition.name]: value as any
          }}
        />
      </Paragraph>
    )
  }
  if (fieldDefinition.type === LIST) {
    return <FormList {...inputProps} list={fieldDefinition.items} />
  }
  if (fieldDefinition.type === NUMBER) {
    return (
      <InputField {...inputFieldProps}>
        <TextInput
          type="number"
          step={fieldDefinition.step}
          max={fieldDefinition.max}
          {...inputProps}
          onKeyPress={e => {
            if (e.key.match(REGEXP_NUMBER_INPUT_NON_NUMERIC)) {
              e.preventDefault()
            }
          }}
          value={inputProps.value as string}
          onWheel={(event: React.WheelEvent<HTMLInputElement>) => {
            event.currentTarget.blur()
          }}
        />
      </InputField>
    )
  }
  if (fieldDefinition.type === BIG_NUMBER) {
    return (
      <InputField {...inputFieldProps}>
        <TextInput
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          step={fieldDefinition.step}
          {...inputProps}
          value={inputProps.value as string}
          onWheel={(event: React.WheelEvent<HTMLInputElement>) => {
            event.currentTarget.blur()
          }}
        />
      </InputField>
    )
  }
  if (fieldDefinition.type === WARNING) {
    return <WarningMessage>{fieldDefinition.label}</WarningMessage>
  }

  if (fieldDefinition.type === LINK) {
    return (
      <LinkFormField
        onClick={() => onSetFieldValue(fieldDefinition.name, true)}
      >
        {fieldDefinition.label}
      </LinkFormField>
    )
  }

  if (fieldDefinition.type === PDF_DOCUMENT_VIEWER) {
    return (
      <PDFViewer
        id={fieldDefinition.name}
        pdfSource={fieldDefinition.initialValue as string}
      />
    )
  }

  if (fieldDefinition.type === LOCATION_SEARCH_INPUT) {
    const selectedLocation = fieldDefinition.locationList.find(
      location => location.id === value
    )

    return (
      <InputField {...inputFieldProps}>
        <LocationSearchFormField
          {...inputProps}
          selectedLocation={selectedLocation}
          locationList={fieldDefinition.locationList}
          searchHandler={item => {
            onSetFieldValue(fieldDefinition.name, item.id)
            if (fieldDefinition.dispatchOptions) {
              dynamicDispatch(fieldDefinition.dispatchOptions.action, {
                [fieldDefinition.dispatchOptions.payloadKey]: item.id
              })
            }
          }}
        />
      </InputField>
    )
  }

  if (fieldDefinition.type === FETCH_BUTTON) {
    return (
      <FetchButtonField
        id={fieldDefinition.name}
        queryData={fieldDefinition.queryData}
        modalTitle={fieldDefinition.modalTitle}
        label={fieldDefinition.label}
        successTitle={fieldDefinition.successTitle}
        errorTitle={fieldDefinition.errorTitle}
        onFetch={fieldDefinition.onFetch}
        isDisabled={disabled}
      />
    )
  }

  return (
    <InputField {...inputFieldProps}>
      <TextInput
        type="text"
        {...inputProps}
        value={inputProps.value as string}
        maxLength={(fieldDefinition as Ii18nTextFormField).maxLength}
        isDisabled={disabled}
      />
    </InputField>
  )
}

const mapFieldsToValues = (fields: IFormField[]) =>
  fields.reduce((memo, field) => {
    let fieldInitialValue = field.initialValue as IFormFieldValue

    if (field.type === RADIO_GROUP_WITH_NESTED_FIELDS && !field.initialValue) {
      const nestedFieldsFlatted = flatten(Object.values(field.nestedFields))

      const nestedInitialValues = nestedFieldsFlatted.reduce(
        (nestedValues, nestedField) => ({
          ...nestedValues,
          [nestedField.name]: nestedField.initialValue
        }),
        {}
      )

      fieldInitialValue = {
        value: field.initialValue as IFormFieldValue,
        nestedFields: nestedInitialValues
      }
    }
    return { ...memo, [field.name]: fieldInitialValue }
  }, {})

type ISetTouchedFunction = (touched: FormikTouched<FormikValues>) => void
interface IFormSectionProps {
  fields: IFormField[]
  id: string
  fieldsToShowValidationErrors?: IFormField[]
  setAllFieldsDirty: boolean
  onChange: (values: IFormSectionData) => void
  draftData?: IFormData
  onSetTouched?: (func: ISetTouchedFunction) => void
  requiredErrorMessage?: MessageDescriptor
}

interface IStateProps {
  resources: IOfflineData
}

interface IDispatchProps {
  dynamicDispatch: typeof dynamicDispatch
}

type Props = IFormSectionProps &
  IStateProps &
  IDispatchProps &
  FormikProps<IFormSectionData> &
  IntlShapeProps

interface IQueryData {
  [key: string]: any
}

export interface ITouchedNestedFields {
  value: boolean
  nestedFields: {
    [fieldName: string]: boolean
  }
}

class FormSectionComponent extends React.Component<Props> {
  componentDidUpdate(prevProps: Props) {
    const userChangedForm = !isEqual(this.props.values, prevProps.values)
    const sectionChanged = prevProps.id !== this.props.id

    if (userChangedForm) {
      prevProps.onChange(this.props.values)
    }

    if (sectionChanged) {
      prevProps.resetForm()
      if (this.props.setAllFieldsDirty) {
        this.showValidationErrors(this.props.fields)
      } else if (
        this.props.fieldsToShowValidationErrors &&
        this.props.fieldsToShowValidationErrors.length > 0
      ) {
        this.showValidationErrors(this.props.fieldsToShowValidationErrors)
      }
    }
  }

  async componentDidMount() {
    if (this.props.setAllFieldsDirty) {
      this.showValidationErrors(this.props.fields)
    }

    if (this.props.onSetTouched) {
      this.props.onSetTouched(this.props.setTouched)
    }

    if (window.location.hash) {
      setTimeout(() => {
        const newScroll = document.documentElement.scrollTop - 100
        window.scrollTo(0, newScroll)

        const focusedElementId = window.location.hash.replace('#', '')
        let focusedElement = document.querySelector(
          `input[id*="${focusedElementId}"]`
        ) as HTMLElement
        if (focusedElement === null) {
          // Handling for Select
          focusedElement = document.querySelector(
            `${window.location.hash} input`
          ) as HTMLElement
          focusedElement && focusedElement.focus()
        } else {
          // Handling for Input
          focusedElement && focusedElement.focus()
        }
      }, 0)
    }
  }

  showValidationErrors(fields: IFormField[]) {
    const touched = fields.reduce((memo, field) => {
      let fieldTouched: boolean | ITouchedNestedFields = true
      if (field.nestedFields) {
        fieldTouched = {
          value: true,
          nestedFields: flatten(Object.values(field.nestedFields)).reduce(
            (nestedMemo, nestedField) => ({
              ...nestedMemo,
              [nestedField.name]: true
            }),
            {}
          )
        }
      }
      return { ...memo, [field.name]: fieldTouched }
    }, {})

    this.props.setTouched(touched)
  }

  handleBlur = (e: React.FocusEvent<any>) => {
    this.props.setFieldTouched(e.target.name)
  }

  resetDependentSelectValues = (fieldName: string) => {
    const fields = this.props.fields
    const fieldToReset = fields.find(
      field =>
        field.type === SELECT_WITH_DYNAMIC_OPTIONS &&
        field.dynamicOptions.dependency === fieldName
    )
    if (fieldToReset) {
      this.props.setFieldValue(fieldToReset.name, '')
    }
  }

  resetNestedInputValues = (parentField: Ii18nFormField) => {
    const nestedFields = (parentField as Ii18nRadioGroupWithNestedFieldsFormField)
      .nestedFields
    const nestedFieldsToReset = flatten(
      Object.keys(nestedFields).map(key => nestedFields[key])
    )

    nestedFieldsToReset.forEach(nestedField => {
      this.props.setFieldValue(
        `${parentField.name}.nestedFields.${nestedField.name}`,
        ''
      )
    })
  }

  render() {
    const {
      values,
      fields,
      setFieldValue,
      touched,
      resources,
      intl,
      draftData,
      setValues,
      dynamicDispatch
    } = this.props

    const language = this.props.intl.locale

    const errors = (this.props.errors as unknown) as Errors
    /*
     * HACK
     *
     * No idea why, but when "fields" prop is changed from outside,
     * "values" still reflect the old version for one render.
     *
     * This causes React to throw an error. You can see this happening by doing:
     *
     * if (fields.length > Object.keys(values).length) {
     *   console.log({ fields, values })
     * }
     *
     * 22.8.2019
     *
     * This might be because of setState not used with the function syntax
     */
    const fieldsWithValuesDefined = fields.filter(
      field => values[field.name] !== undefined
    )

    return (
      <section>
        {fieldsWithValuesDefined.map(field => {
          let error: string
          const fieldErrors = errors[field.name] && errors[field.name].errors

          if (fieldErrors && fieldErrors.length > 0) {
            const [firstError] = fieldErrors
            error = intl.formatMessage(firstError.message, firstError.props)
          }

          const conditionalActions: string[] = getConditionalActionsForField(
            field,
            values,
            resources,
            draftData
          )

          if (conditionalActions.includes('hide')) {
            return null
          }

          const isFieldDisabled = conditionalActions.includes('disable')
          const isDateField =
            field.type === DATE ||
            (field.type === FIELD_WITH_DYNAMIC_DEFINITIONS &&
              getFieldType(field as IDynamicFormField, values) === DATE)

          if (
            isDateField &&
            touched[`${field.name}-dd`] !== undefined &&
            touched[`${field.name}-mm`] !== undefined &&
            touched[`${field.name}-yyyy`] !== undefined
          ) {
            touched[field.name] =
              touched[`${field.name}-dd`] &&
              touched[`${field.name}-mm`] &&
              touched[`${field.name}-yyyy`]
          }

          const withDynamicallyGeneratedFields =
            field.type === SELECT_WITH_DYNAMIC_OPTIONS
              ? ({
                  ...field,
                  type: SELECT_WITH_OPTIONS,
                  options: getFieldOptions(
                    field as ISelectFormFieldWithDynamicOptions,
                    values,
                    resources
                  )
                } as ISelectFormFieldWithOptions)
              : field.type === FIELD_WITH_DYNAMIC_DEFINITIONS
              ? ({
                  ...field,
                  type: getFieldType(field as IDynamicFormField, values),
                  label: getFieldLabel(field as IDynamicFormField, values),
                  helperText: getFieldHelperText(
                    field as IDynamicFormField,
                    values
                  ),
                  tooltip: getFieldLabelToolTip(
                    field as IDynamicFormField,
                    values
                  )
                } as ITextFormField)
              : field.type === DYNAMIC_LIST
              ? ({
                  ...field,
                  type: LIST,
                  items: getFieldOptionsByValueMapper(
                    field as IDynamicListFormField,
                    draftData as IFormData,
                    field.dynamicItems.valueMapper
                  )
                } as IListFormField)
              : field.type === FETCH_BUTTON
              ? ({
                  ...field,
                  queryData: getQueryData(field as ILoaderButton, values),
                  draftData: draftData as IFormData,
                  onFetch: response => {
                    const section = {
                      id: this.props.id,
                      groups: [
                        {
                          id: `${this.props.id}-view-group`,
                          fields: fieldsWithValuesDefined
                        }
                      ]
                    } as IFormSection

                    const form = {
                      sections: [section]
                    } as IForm

                    const queryData: IQueryData = {}
                    queryData[this.props.id] = response

                    const transformedData = gqlToDraftTransformer(
                      form,
                      queryData
                    )
                    const updatedValues = Object.assign(
                      {},
                      values,
                      transformedData[this.props.id]
                    )
                    setValues(updatedValues)
                  }
                } as ILoaderButton)
              : field.type === LOCATION_SEARCH_INPUT
              ? {
                  ...field,
                  locationList: getListOfLocations(
                    resources,
                    field.searchableResource,
                    field.searchableType as LocationType
                  )
                }
              : field

          if (
            field.type === PDF_DOCUMENT_VIEWER ||
            field.type === FETCH_BUTTON ||
            field.type === FIELD_WITH_DYNAMIC_DEFINITIONS ||
            field.type === SELECT_WITH_DYNAMIC_OPTIONS
          ) {
            return (
              <FormItem
                key={`${field.name}`}
                ignoreBottomMargin={field.ignoreBottomMargin}
              >
                <Field name={field.name}>
                  {(formikFieldProps: FieldProps<any>) => (
                    <GeneratedInputField
                      fieldDefinition={internationaliseFieldObject(
                        intl,
                        withDynamicallyGeneratedFields
                      )}
                      onSetFieldValue={setFieldValue}
                      resetDependentSelectValues={
                        this.resetDependentSelectValues
                      }
                      {...formikFieldProps.field}
                      touched={touched[field.name] || false}
                      error={error}
                      draftData={draftData}
                      disabled={isFieldDisabled}
                      dynamicDispatch={dynamicDispatch}
                    />
                  )}
                </Field>
              </FormItem>
            )
          } else if (
            field.type === RADIO_GROUP_WITH_NESTED_FIELDS &&
            field.nestedFields
          ) {
            let nestedFieldElements = Object.create(null)

            nestedFieldElements = Object.keys(field.nestedFields).reduce(
              (childElements, key) => ({
                ...childElements,
                [key]: field.nestedFields[key].map(nestedField => {
                  let nestedError: string
                  const nestedFieldErrors =
                    errors[field.name] &&
                    errors[field.name].nestedFields[nestedField.name]

                  if (nestedFieldErrors && nestedFieldErrors.length > 0) {
                    const [firstError] = nestedFieldErrors
                    nestedError = intl.formatMessage(
                      firstError.message,
                      firstError.props
                    )
                  }

                  const nestedFieldName = `${field.name}.nestedFields.${nestedField.name}`
                  const nestedFieldTouched =
                    touched[field.name] &&
                    ((touched[field.name] as unknown) as ITouchedNestedFields)
                      .nestedFields &&
                    ((touched[field.name] as unknown) as ITouchedNestedFields)
                      .nestedFields[nestedField.name]

                  return (
                    <FormItem
                      key={nestedFieldName}
                      ignoreBottomMargin={field.ignoreBottomMargin}
                      hideFakeMarginTop
                    >
                      <FastField name={nestedFieldName}>
                        {(formikFieldProps: FieldProps<any>) => (
                          <GeneratedInputField
                            fieldDefinition={internationaliseFieldObject(intl, {
                              ...nestedField,
                              name: nestedFieldName
                            })}
                            onSetFieldValue={setFieldValue}
                            resetDependentSelectValues={
                              this.resetDependentSelectValues
                            }
                            {...formikFieldProps.field}
                            touched={nestedFieldTouched || false}
                            error={nestedError}
                            draftData={draftData}
                            dynamicDispatch={dynamicDispatch}
                          />
                        )}
                      </FastField>
                    </FormItem>
                  )
                })
              }),
              {}
            )

            return (
              <FormItem
                key={field.name}
                ignoreBottomMargin={field.ignoreBottomMargin}
              >
                <Field name={`${field.name}.value`}>
                  {(formikFieldProps: FieldProps<any>) => (
                    <GeneratedInputField
                      fieldDefinition={internationaliseFieldObject(
                        intl,
                        withDynamicallyGeneratedFields
                      )}
                      onSetFieldValue={setFieldValue}
                      resetDependentSelectValues={
                        this.resetDependentSelectValues
                      }
                      resetNestedInputValues={this.resetNestedInputValues}
                      {...formikFieldProps.field}
                      nestedFields={nestedFieldElements}
                      touched={Boolean(touched[field.name]) || false}
                      error={error}
                      draftData={draftData}
                      dynamicDispatch={dynamicDispatch}
                    />
                  )}
                </Field>
              </FormItem>
            )
          } else {
            return (
              <FormItem
                key={`${field.name}${language}${
                  isFieldDisabled ? 'disabled' : ''
                }`}
                ignoreBottomMargin={field.ignoreBottomMargin}
              >
                <FastField name={field.name}>
                  {(formikFieldProps: FieldProps<any>) => (
                    <GeneratedInputField
                      fieldDefinition={internationaliseFieldObject(
                        intl,
                        withDynamicallyGeneratedFields
                      )}
                      onSetFieldValue={setFieldValue}
                      resetDependentSelectValues={
                        this.resetDependentSelectValues
                      }
                      {...formikFieldProps.field}
                      touched={touched[field.name] || false}
                      error={isFieldDisabled ? '' : error}
                      draftData={draftData}
                      dynamicDispatch={dynamicDispatch}
                      disabled={isFieldDisabled}
                    />
                  )}
                </FastField>
              </FormItem>
            )
          }
        })}
      </section>
    )
  }
}

const FormFieldGeneratorWithFormik = withFormik<
  IFormSectionProps & IStateProps & IDispatchProps,
  IFormSectionData
>({
  mapPropsToValues: props => mapFieldsToValues(props.fields),
  handleSubmit: values => {},
  validate: (values, props: IFormSectionProps & IStateProps) =>
    getValidationErrorsForForm(
      props.fields,
      values,
      props.resources,
      props.draftData,
      props.requiredErrorMessage
    )
})(injectIntl(FormSectionComponent))

export const FormFieldGenerator = connect(
  (state: IStoreState, ownProps: IFormSectionProps) => ({
    ...ownProps,
    resources: getOfflineData(state)
  }),
  { dynamicDispatch }
)(FormFieldGeneratorWithFormik)
