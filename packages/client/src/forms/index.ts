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
import { ValidationInitializer } from '@client/utils/validate'
import { MessageDescriptor } from 'react-intl'
import {
  ISelectOption as SelectComponentOption,
  IRadioOption as RadioComponentOption,
  ICheckboxOption as CheckboxComponentOption,
  THEME_MODE,
  RadioSize
} from '@opencrvs/components/lib/forms'
import { ApolloQueryResult } from 'apollo-client'
import { GQLQuery } from '@opencrvs/gateway/src/graphql/schema.d'
import { IDynamicValues } from '@opencrvs/client/src/navigation'

import * as mutations from './mappings/mutation'
import * as queries from './mappings/query'
import * as graphQLQueries from './mappings/queries'
import * as labels from './mappings/label'
import * as types from './mappings/type'
import * as responseTransformers from './mappings/response-transformers'
import * as validators from '@opencrvs/client/src/utils/validate'
import { ICertificate as IApplicationCertificate } from '@client/applications'
import { IOfflineData } from '@client/offline/reducer'
import { ISearchLocation } from '@opencrvs/components/lib/interface'

export const TEXT = 'TEXT'
export const TEL = 'TEL'
export const NUMBER = 'NUMBER'
export const BIG_NUMBER = 'BIG_NUMBER'
export const RADIO_GROUP = 'RADIO_GROUP'
export const RADIO_GROUP_WITH_NESTED_FIELDS = 'RADIO_GROUP_WITH_NESTED_FIELDS'
export const INFORMATIVE_RADIO_GROUP = 'INFORMATIVE_RADIO_GROUP'
export const CHECKBOX_GROUP = 'CHECKBOX_GROUP'
export const DATE = 'DATE'
export const TEXTAREA = 'TEXTAREA'
export const SUBSECTION = 'SUBSECTION'
export const FIELD_GROUP_TITLE = 'FIELD_GROUP_TITLE'
export const LIST = 'LIST'
export const PARAGRAPH = 'PARAGRAPH'
export const DOCUMENTS = 'DOCUMENTS'
export const SELECT_WITH_OPTIONS = 'SELECT_WITH_OPTIONS'
export const SELECT_WITH_DYNAMIC_OPTIONS = 'SELECT_WITH_DYNAMIC_OPTIONS'
export const FIELD_WITH_DYNAMIC_DEFINITIONS = 'FIELD_WITH_DYNAMIC_DEFINITIONS'
export const IMAGE_UPLOADER_WITH_OPTIONS = 'IMAGE_UPLOADER_WITH_OPTIONS'
export const DOCUMENT_UPLOADER_WITH_OPTION = 'DOCUMENT_UPLOADER_WITH_OPTION'
export const SIMPLE_DOCUMENT_UPLOADER = 'SIMPLE_DOCUMENT_UPLOADER'
export const WARNING = 'WARNING'
export const LINK = 'LINK'
export const PDF_DOCUMENT_VIEWER = 'PDF_DOCUMENT_VIEWER'
export const DYNAMIC_LIST = 'DYNAMIC_LIST'
export const FETCH_BUTTON = 'FETCH_BUTTON'
export const LOCATION_SEARCH_INPUT = 'LOCATION_SEARCH_INPUT'

export enum Event {
  BIRTH = 'birth',
  DEATH = 'death'
}

export enum Sort {
  ASC = 'asc',
  DESC = 'desc'
}

export enum Action {
  SUBMIT_FOR_REVIEW = 'submit for review',
  APPROVE_APPLICATION = 'approve',
  REGISTER_APPLICATION = 'register',
  COLLECT_CERTIFICATE = 'collect certificate',
  REJECT_APPLICATION = 'reject',
  LOAD_REVIEW_APPLICATION = 'load application data for review',
  LOAD_CERTIFICATE_APPLICATION = 'load application data for certificate collection'
}

export interface ISelectOption {
  value: SelectComponentOption['value']
  label: MessageDescriptor
}
export interface IRadioOption {
  value: RadioComponentOption['value']
  label: MessageDescriptor
  conditionals?: RadioComponentOption['conditionals']
}
export interface ICheckboxOption {
  value: CheckboxComponentOption['value']
  label: MessageDescriptor
}

export interface IDynamicOptions {
  dependency: string
  jurisdictionType?: string
  resource?: string
  options?: { [key: string]: ISelectOption[] }
}

export interface IDispatchOptions {
  action: string
  payloadKey: string
}

export interface IDynamicItems {
  dependency: string
  valueMapper: IDynamicValueMapper
  items: { [key: string]: MessageDescriptor[] }
}

export interface IDynamicFormFieldValidators {
  validator: ValidationInitializer
  dependencies: string[]
}

export type IDynamicFormFieldLabelMapper = (
  key: string
) => MessageDescriptor | undefined

export type IDynamicFormFieldHelperTextMapper = (
  key: string
) => MessageDescriptor | undefined

export type IDynamicFormFieldToolTipMapper = (
  key: string
) => MessageDescriptor | undefined

export type IDynamicValueMapper = (key: string) => string

export type IDynamicFieldTypeMapper = (key: string) => string

export interface ISerializedDynamicFormFieldDefinitions {
  label?: {
    dependency: string
    labelMapper: Operation<typeof labels>
  }
  helperText?: {
    dependency: string
    helperTextMapper: Operation<typeof labels>
  }
  tooltip?: {
    dependency: string
    tooltipMapper: Operation<typeof labels>
  }
  type?:
    | IStaticFieldType
    | {
        kind: 'dynamic'
        dependency: string
        typeMapper: Operation<typeof types>
      }
  validate?: Array<{
    dependencies: string[]
    validator: FactoryOperation<typeof validators>
  }>
}

export interface IDynamicFormFieldDefinitions {
  label?: IDynamicFieldLabel
  helperText?: IDynamicFieldHelperText
  tooltip?: IDynamicFieldTooltip
  type?: IDynamicFieldType | IStaticFieldType
  validate?: IDynamicFormFieldValidators[]
}

export interface IDynamicFieldLabel {
  dependency: string
  labelMapper: IDynamicFormFieldLabelMapper
}

export interface IDynamicFieldHelperText {
  dependency: string
  helperTextMapper: IDynamicFormFieldHelperTextMapper
}

export interface IDynamicFieldTooltip {
  dependency: string
  tooltipMapper: IDynamicFormFieldToolTipMapper
}

export interface IDynamicFieldType {
  kind: 'dynamic'
  dependency: string
  typeMapper: IDynamicFieldTypeMapper
}

export interface IStaticFieldType {
  kind: 'static'
  staticType: string
}

export interface IFieldInput {
  name: string
  valueField: string
  type?: string
}

export type IFormFieldValue =
  | string
  | string[]
  | number
  | boolean
  | Date
  | IApplicationCertificate
  | IFileValue
  | IAttachmentValue
  | FieldValueArray
  | FieldValueMap

interface FieldValueArray extends Array<IFormFieldValue> {}
export interface FieldValueMap {
  [key: string]: IFormFieldValue
}

export interface IFileValue {
  optionValues: IFormFieldValue[]
  type: string
  data: string
}

export interface IAttachmentValue {
  type: string
  data: string
}

export type IFormFieldMutationMapFunction = (
  transFormedData: TransformedData,
  draftData: IFormData,
  sectionId: string,
  fieldDefinition: IFormField,
  nestedFieldDefinition?: IFormField
) => void

export type IFormFieldQueryMapFunction = (
  transFormedData: IFormData,
  queryData: any,
  sectionId: string,
  fieldDefinition: IFormField,
  nestedFieldDefinition?: IFormField
) => void

/*
 * Takes in an array of function arguments (array, number, string, function)
 * and replaces all functions with the descriptor type
 *
 * So type Array<number | Function | string> would become
 * Array<number | Descriptor | string>
 */
type FunctionParamsToDescriptor<T> =
  // It's an array - recursively call this type for all items
  T extends Array<any>
    ? { [K in keyof T]: FunctionParamsToDescriptor<T[K]> }
    : T extends IFormFieldQueryMapFunction // It's a query transformation function - return a query transformation descriptor
    ? IQueryDescriptor
    : T extends IFormFieldMutationMapFunction // It's a mutation transformation function - return a mutation transformation descriptor
    ? IMutationDescriptor
    : T // It's a none of the above - return self

interface FactoryOperation<
  OperationMap,
  Key extends keyof OperationMap = keyof OperationMap
> {
  operation: Key
  parameters: FunctionParamsToDescriptor<Params<OperationMap[Key]>>
}
interface Operation<
  OperationMap,
  Key extends keyof OperationMap = keyof OperationMap
> {
  operation: Key
}

export type IFormFieldQueryMapDescriptor<
  T extends keyof typeof queries = keyof typeof queries
> = {
  operation: T
  parameters: FunctionParamsToDescriptor<Params<typeof queries[T]>>
}

export type IFormFieldMapping = {
  mutation?: IFormFieldMutationMapFunction
  query?: IFormFieldQueryMapFunction
}

/*
 * These types are here only for replacing mapping types to
 * serializable ones in IFormField. The default Omit type doesn't work
 * with type unions :(
 */

type UnionKeys<T> = T extends any ? keyof T : never
type UnionPick<T, K extends any> = T extends any
  ? Pick<T, Extract<K, keyof T>>
  : never

type UnionOmit<T, K extends UnionKeys<T>> = UnionPick<
  T,
  Exclude<UnionKeys<T>, K>
>

type SerializedFormFieldWithDynamicDefinitions = UnionOmit<
  IFormFieldWithDynamicDefinitions,
  'dynamicDefinitions'
> & {
  dynamicDefinitions: ISerializedDynamicFormFieldDefinitions
}
type SerializedSelectFormFieldWithOptions = Omit<
  ISelectFormFieldWithOptions,
  'options'
> & {
  options: ISelectOption[] | { resource: string }
}

type ILoaderButtonWithSerializedQueryMap = Omit<ILoaderButton, 'queryMap'> & {
  queryMap: ISerializedQueryMap
}

type SerializedRadioGroupWithNestedFields = Omit<
  IRadioGroupWithNestedFieldsFormField,
  'nestedFields'
> & {
  nestedFields: { [key: string]: SerializedFormField[] }
}

export type SerializedFormField = UnionOmit<
  | Exclude<
      IFormField,
      | IFormFieldWithDynamicDefinitions
      | ILoaderButton
      | ISelectFormFieldWithOptions
      | IRadioGroupWithNestedFieldsFormField
    >
  | SerializedSelectFormFieldWithOptions
  | SerializedFormFieldWithDynamicDefinitions
  | ILoaderButtonWithSerializedQueryMap
  | SerializedRadioGroupWithNestedFields,
  'validate' | 'mapping'
> & {
  validate: IValidatorDescriptor[]
  mapping?: {
    mutation?: IMutationDescriptor
    query?: IQueryDescriptor
  }
}
export interface IAttachment {
  data: string
  optionValues: string[]
  type: string
  title?: string
  description?: string
}

export enum REVIEW_OVERRIDE_POSITION {
  BEFORE = 'before',
  AFTER = 'after'
}

export interface IFormFieldBase {
  name: string
  type: IFormField['type']
  label: MessageDescriptor
  helperText?: MessageDescriptor
  tooltip?: MessageDescriptor
  validate: validators.Validation[]
  required?: boolean
  prefix?: string
  postfix?: string
  disabled?: boolean
  initialValue?: IFormFieldValue
  initialValueKey?: string
  extraValue?: IFormFieldValue
  conditionals?: IConditional[]
  description?: MessageDescriptor
  placeholder?: MessageDescriptor
  mapping?: IFormFieldMapping
  hideAsterisk?: boolean
  hideHeader?: boolean
  mode?: THEME_MODE
  hidden?: boolean
  previewGroup?: string
  nestedFields?: { [key: string]: IFormField[] }
  hideValueInPreview?: boolean
  // This flag will only remove the change link from preview/review screen
  // Default false
  readonly?: boolean
  hideInPreview?: boolean
  ignoreNestedFieldWrappingInPreview?: boolean
  reviewOverrides?: {
    residingSection: string
    reference: {
      sectionID: string
      groupID: string
      fieldName: string
    }
    position?: REVIEW_OVERRIDE_POSITION
    labelAs?: MessageDescriptor
    conditionals?: IConditional[]
  }
  ignoreFieldLabelOnErrorMessage?: boolean
  ignoreBottomMargin?: boolean
}

export interface ISelectFormFieldWithOptions extends IFormFieldBase {
  type: typeof SELECT_WITH_OPTIONS
  options: ISelectOption[]
}
export interface ISelectFormFieldWithDynamicOptions extends IFormFieldBase {
  type: typeof SELECT_WITH_DYNAMIC_OPTIONS
  dynamicOptions: IDynamicOptions
}

export interface IFormFieldWithDynamicDefinitions extends IFormFieldBase {
  type: typeof FIELD_WITH_DYNAMIC_DEFINITIONS
  dynamicDefinitions: IDynamicFormFieldDefinitions
}

export type INestedInputFields = {
  [key: string]: IFormField[]
}

export interface IRadioGroupFormField extends IFormFieldBase {
  type: typeof RADIO_GROUP
  options: IRadioOption[]
  size?: RadioSize
  notice?: MessageDescriptor
}

export interface IRadioGroupWithNestedFieldsFormField
  extends Omit<IRadioGroupFormField, 'type'> {
  type: typeof RADIO_GROUP_WITH_NESTED_FIELDS
  nestedFields: INestedInputFields
}

export interface IInformativeRadioGroupFormField extends IFormFieldBase {
  type: typeof INFORMATIVE_RADIO_GROUP
  information: IFormSectionData
  dynamicInformationRetriever?: (obj: any) => IFormSectionData
  options: IRadioOption[]
}

export interface ITextFormField extends IFormFieldBase {
  type: typeof TEXT
  maxLength?: number
}

export interface ITelFormField extends IFormFieldBase {
  type: typeof TEL
  isSmallSized?: boolean
}
export interface INumberFormField extends IFormFieldBase {
  type: typeof NUMBER
  step?: number
  max?: number
}
export interface IBigNumberFormField extends IFormFieldBase {
  type: typeof BIG_NUMBER
  step?: number
}
export interface ICheckboxGroupFormField extends IFormFieldBase {
  type: typeof CHECKBOX_GROUP
  options: ICheckboxOption[]
}
export interface IDateFormField extends IFormFieldBase {
  type: typeof DATE
  notice?: MessageDescriptor
  ignorePlaceHolder?: boolean
}
export interface ITextareaFormField extends IFormFieldBase {
  type: typeof TEXTAREA
}
export interface ISubsectionFormField extends IFormFieldBase {
  type: typeof SUBSECTION
}
export interface IFieldGroupTitleField extends IFormFieldBase {
  type: typeof FIELD_GROUP_TITLE
}
export interface IDocumentsFormField extends IFormFieldBase {
  type: typeof DOCUMENTS
}
export interface IListFormField extends IFormFieldBase {
  type: typeof LIST
  items: MessageDescriptor[]
}

export interface IDynamicListFormField extends IFormFieldBase {
  type: typeof DYNAMIC_LIST
  dynamicItems: IDynamicItems
}
export interface IParagraphFormField extends IFormFieldBase {
  type: typeof PARAGRAPH
  fontSize?: string
}
export interface IImageUploaderWithOptionsFormField extends IFormFieldBase {
  type: typeof IMAGE_UPLOADER_WITH_OPTIONS
  optionSection: IFormSection
}
export interface IDocumentUploaderWithOptionsFormField extends IFormFieldBase {
  type: typeof DOCUMENT_UPLOADER_WITH_OPTION
  options: ISelectOption[]
  hideOnEmptyOption?: boolean
  splitView?: boolean
}
export interface ISimpleDocumentUploaderFormField extends IFormFieldBase {
  type: typeof SIMPLE_DOCUMENT_UPLOADER
  allowedDocType?: string[]
}

export interface ILocationSearchInputFormField extends IFormFieldBase {
  type: typeof LOCATION_SEARCH_INPUT
  searchableResource: Extract<
    keyof IOfflineData,
    'facilities' | 'locations' | 'offices'
  >
  locationList: ISearchLocation[]
  searchableType: string
  dispatchOptions?: IDispatchOptions
}

export interface IWarningField extends IFormFieldBase {
  type: typeof WARNING
}

export interface ILink extends IFormFieldBase {
  type: typeof LINK
}

export interface IPDFDocumentViewerFormField extends IFormFieldBase {
  type: typeof PDF_DOCUMENT_VIEWER
}
export interface IQuery {
  query: any
  inputs: IFieldInput[]
  variables?: IDynamicValues
  modalInfoText: MessageDescriptor
  errorText: MessageDescriptor
  networkErrorText: MessageDescriptor
  responseTransformer: (response: ApolloQueryResult<GQLQuery>) => void
}

export interface ISerializedQueryMap {
  [key: string]: Omit<IQuery, 'responseTransformer' | 'query'> & {
    responseTransformer: Operation<typeof responseTransformers>
    query: Operation<typeof graphQLQueries>
  }
}
export interface IQueryMap {
  [key: string]: IQuery
}
export interface ILoaderButton extends IFormFieldBase {
  type: typeof FETCH_BUTTON
  queryMap: IQueryMap
  queryData?: IQuery
  querySelectorInput: IFieldInput
  onFetch?: (response: any) => void
  modalTitle: MessageDescriptor
  successTitle: MessageDescriptor
  errorTitle: MessageDescriptor
}

export type IFormField =
  | ITextFormField
  | ITelFormField
  | INumberFormField
  | IBigNumberFormField
  | ISelectFormFieldWithOptions
  | ISelectFormFieldWithDynamicOptions
  | IFormFieldWithDynamicDefinitions
  | IRadioGroupFormField
  | IRadioGroupWithNestedFieldsFormField
  | IInformativeRadioGroupFormField
  | ICheckboxGroupFormField
  | IDateFormField
  | ITextareaFormField
  | ISubsectionFormField
  | IFieldGroupTitleField
  | IDocumentsFormField
  | IListFormField
  | IParagraphFormField
  | IImageUploaderWithOptionsFormField
  | IDocumentUploaderWithOptionsFormField
  | IWarningField
  | ILink
  | IPDFDocumentViewerFormField
  | IDynamicListFormField
  | ILoaderButton
  | ISimpleDocumentUploaderFormField
  | ILocationSearchInputFormField

export interface IFormTag {
  id: string
  label: MessageDescriptor
  fieldToRedirect?: string
  delimiter?: string
}

export interface IDynamicFormField
  extends ISelectFormFieldWithDynamicOptions,
    IFormFieldWithDynamicDefinitions {
  type: any
}

export interface IConditional {
  action: string
  expression: string
}

export interface IConditionals {
  iDType: IConditional
  fathersDetailsExist: IConditional
  permanentAddressSameAsMother: IConditional
  addressSameAsMother: IConditional
  countryPermanent: IConditional
  statePermanent: IConditional
  districtPermanent: IConditional
  addressLine4Permanent: IConditional
  addressLine3Permanent: IConditional
  country: IConditional
  state: IConditional
  district: IConditional
  addressLine4: IConditional
  addressLine3: IConditional
  uploadDocForWhom: IConditional
  motherCollectsCertificate: IConditional
  fatherCollectsCertificate: IConditional
  informantCollectsCertificate: IConditional
  otherPersonCollectsCertificate: IConditional
  birthCertificateCollectorNotVerified: IConditional
  deathCertificateCollectorNotVerified: IConditional
  currentAddressSameAsPermanent: IConditional
  placeOfBirthHospital: IConditional
  deathPlaceAddressTypeHeathInstitue: IConditional
  otherBirthEventLocation: IConditional
  isNotCityLocation: IConditional
  isCityLocation: IConditional
  isDefaultCountry: IConditional
  isNotCityLocationPermanent: IConditional
  isDefaultCountryPermanent: IConditional
  isCityLocationPermanent: IConditional
  applicantPermanentAddressSameAsCurrent: IConditional
  iDAvailable: IConditional
  deathPlaceOther: IConditional
  deathPlaceAtPrivateHome: IConditional
  deathPlaceAtOtherLocation: IConditional
  causeOfDeathEstablished: IConditional
  isMarried: IConditional
  identifierIDSelected: IConditional
  otherRelationship: IConditional
  fatherContactDetailsRequired: IConditional
  withIn45Days: IConditional
  between46daysTo5yrs: IConditional
  after5yrs: IConditional
  deceasedNationIdSelected: IConditional
  isRegistrarOrRegistrationAgentRoleSelected: IConditional
  certCollectorOther: IConditional
  userAuditReasonSpecified: IConditional
  userAuditReasonOther: IConditional
  isAuditActionDeactivate: IConditional
  isAuditActionReactivate: IConditional
}

export type ViewType = 'form' | 'preview' | 'review' | 'hidden'

type Params<Fn> = Fn extends (...args: infer A) => void ? A : never

type FilterType<Base, Condition> = {
  [Key in keyof Base]: Base[Key] extends Condition ? Key : never
}

// Validation

type ValidationFactoryOperationKeys = FilterType<
  typeof validators,
  (...args: any[]) => (...args: any[]) => any
>[keyof typeof validators]

type ValidationDefaultOperationKeys = Exclude<
  keyof typeof validators,
  ValidationFactoryOperationKeys
>

export type ValidationFactoryOperation<
  T extends ValidationFactoryOperationKeys = ValidationFactoryOperationKeys
> = {
  operation: T
  parameters: Params<typeof validators[T]>
}

type ValidationDefaultOperation<
  T extends ValidationDefaultOperationKeys = ValidationDefaultOperationKeys
> = {
  operation: T
}

export type IValidatorDescriptor =
  | ValidationFactoryOperation
  | ValidationDefaultOperation

// Queries

type QueryFactoryOperationKeys = FilterType<
  typeof queries,
  (...args: any[]) => (...args: any[]) => any
>[keyof typeof queries]

type QueryDefaultOperationKeys = Exclude<
  keyof typeof queries,
  QueryFactoryOperationKeys
>

export type QueryFactoryOperation<
  T extends QueryFactoryOperationKeys = QueryFactoryOperationKeys
> = {
  operation: T
  parameters: FunctionParamsToDescriptor<Params<typeof queries[T]>>
}

type QueryDefaultOperation<
  T extends QueryDefaultOperationKeys = QueryDefaultOperationKeys
> = {
  operation: T
}

export type IQueryDescriptor = QueryFactoryOperation | QueryDefaultOperation

// Mutations

type MutationFactoryOperationKeys = FilterType<
  typeof mutations,
  (...args: any[]) => (...args: any[]) => any
>[keyof typeof mutations]

type MutationDefaultOperationKeys = Exclude<
  keyof typeof mutations,
  MutationFactoryOperationKeys
>

export type MutationFactoryOperation<
  T extends MutationFactoryOperationKeys = MutationFactoryOperationKeys
> = {
  operation: T
  parameters: FunctionParamsToDescriptor<Params<typeof mutations[T]>>
}

type MutationDefaultOperation<
  T extends MutationDefaultOperationKeys = MutationDefaultOperationKeys
> = {
  operation: T
}

export type IMutationDescriptor =
  | MutationFactoryOperation
  | MutationDefaultOperation

// Initial type as it's always used as an object.
// @todo should be stricter than this
export type TransformedData = { [key: string]: any }

export type IFormSectionMapping = {
  mutation?: IFormSectionMutationMapFunction
  query?: IFormSectionQueryMapFunction
}

export type IFormSectionMutationMapFunction = (
  transFormedData: TransformedData,
  draftData: IFormData,
  sectionId: string
) => void

export type IFormSectionQueryMapFunction = (
  transFormedData: IFormData,
  queryData: any,
  sectionId: string
) => void

export enum BirthSection {
  Child = 'child',
  Mother = 'mother',
  Father = 'father',
  Applicant = 'informant',
  Parent = 'primaryCaregiver',
  Registration = 'registration',
  Documents = 'documents',
  Preview = 'preview'
}

export enum DeathSection {
  Deceased = 'deceased',
  Event = 'deathEvent',
  CauseOfDeath = 'causeOfDeath',
  Applicants = 'informant',
  DeathDocuments = 'documents',
  Preview = 'preview'
}
export enum UserSection {
  User = 'user',
  Preview = 'preview'
}
export enum CertificateSection {
  Collector = 'collector',
  CollectCertificate = 'collectCertificate',
  CollectDeathCertificate = 'collectDeathCertificate',
  CertificatePreview = 'certificatePreview'
}
export enum PaymentSection {
  Payment = 'payment'
}
export enum ReviewSection {
  Review = 'review'
}

export type Section =
  | ReviewSection
  | PaymentSection
  | BirthSection
  | DeathSection
  | UserSection
  | CertificateSection

export interface IFormSection {
  id: Section
  viewType: ViewType
  name: MessageDescriptor
  title: MessageDescriptor
  groups: IFormSectionGroup[]
  disabled?: boolean
  optional?: boolean
  notice?: MessageDescriptor
  mapping?: IFormSectionMapping
  hasDocumentSection?: boolean
}

export type ISerializedFormSection = Omit<
  IFormSection,
  'groups' | 'mapping'
> & {
  groups: Array<
    Omit<IFormSectionGroup, 'fields'> & { fields: SerializedFormField[] }
  >
  mapping?: {
    mutation?: IMutationDescriptor
    query?: IQueryDescriptor
  }
}

export interface IFormSectionGroup {
  id: string
  title?: MessageDescriptor
  fields: IFormField[]
  previewGroups?: IFormTag[]
  disabled?: boolean
  ignoreSingleFieldView?: boolean
  conditionals?: IConditional[]
  error?: MessageDescriptor
  preventContinueIfError?: boolean
  showExitButtonOnly?: boolean
}

export interface IForm {
  sections: IFormSection[]
}
export interface ISerializedForm {
  sections: ISerializedFormSection[]
}

export interface Ii18nSelectOption {
  value: string
  label: string
}

export interface Ii18nFormFieldBase {
  name: string
  type: string
  label: string
  helperText?: string
  tooltip?: string
  description?: string
  validate: validators.Validation[]
  required?: boolean
  prefix?: string
  initialValue?: IFormFieldValue
  extraValue?: IFormFieldValue
  postfix?: string
  disabled?: boolean
  conditionals?: IConditional[]
  hideAsterisk?: boolean
  hideHeader?: boolean
  mode?: THEME_MODE
  placeholder?: string
  hidden?: boolean
  nestedFields?: { [key: string]: Ii18nFormField[] }
  ignoreBottomMargin?: boolean
}

export interface Ii18nSelectFormField extends Ii18nFormFieldBase {
  type: typeof SELECT_WITH_OPTIONS
  options: SelectComponentOption[]
}

export type Ii18nNestedInputFields = {
  [key: string]: Ii18nFormField[]
}

export interface Ii18nRadioGroupFormField extends Ii18nFormFieldBase {
  type: typeof RADIO_GROUP
  options: RadioComponentOption[]
  size?: RadioSize
  notice?: string
}

export interface Ii18nRadioGroupWithNestedFieldsFormField
  extends Omit<Ii18nRadioGroupFormField, 'type'> {
  type: typeof RADIO_GROUP_WITH_NESTED_FIELDS
  nestedFields: Ii18nNestedInputFields
}

type Name = {
  firstNames: string
  familyName: string
}
type Identifier = {
  id: string
  type: string
}
type Infomation = {
  name: Name[]
  birthDate: string
  nationality: [string]
  identifier: [Identifier] | null
}

export interface Ii18nInformativeRadioGroupFormField
  extends Ii18nFormFieldBase {
  type: typeof INFORMATIVE_RADIO_GROUP
  information: Infomation
  options: RadioComponentOption[]
}

export interface Ii18nTextFormField extends Ii18nFormFieldBase {
  type: typeof TEXT
  maxLength?: number
}
export interface Ii18nTelFormField extends Ii18nFormFieldBase {
  type: typeof TEL
  isSmallSized?: boolean
}
export interface Ii18nNumberFormField extends Ii18nFormFieldBase {
  type: typeof NUMBER
  step?: number
  max?: number
}

export interface Ii18nBigNumberFormField extends Ii18nFormFieldBase {
  type: typeof BIG_NUMBER
  step?: number
}

export interface Ii18nCheckboxGroupFormField extends Ii18nFormFieldBase {
  type: typeof CHECKBOX_GROUP
  options: CheckboxComponentOption[]
}
export interface Ii18nDateFormField extends Ii18nFormFieldBase {
  type: typeof DATE
  notice?: string
  ignorePlaceHolder?: boolean
}
export interface Ii18nTextareaFormField extends Ii18nFormFieldBase {
  type: typeof TEXTAREA
}
export interface Ii18nSubsectionFormField extends Ii18nFormFieldBase {
  type: typeof SUBSECTION
}
export interface Ii18nFieldGroupTitleField extends Ii18nFormFieldBase {
  type: typeof FIELD_GROUP_TITLE
}
export interface Ii18nDocumentsFormField extends Ii18nFormFieldBase {
  type: typeof DOCUMENTS
}
export interface Ii18nListFormField extends Ii18nFormFieldBase {
  type: typeof LIST
  items: MessageDescriptor[]
}
export interface Ii18nParagraphFormField extends Ii18nFormFieldBase {
  type: typeof PARAGRAPH
  fontSize?: string
}
export interface Ii18nImageUploaderWithOptionsFormField
  extends Ii18nFormFieldBase {
  type: typeof IMAGE_UPLOADER_WITH_OPTIONS
  optionSection: IFormSection
}
export interface Ii18nDocumentUploaderWithOptions extends Ii18nFormFieldBase {
  type: typeof DOCUMENT_UPLOADER_WITH_OPTION
  options: SelectComponentOption[]
  hideOnEmptyOption?: boolean
  splitView?: boolean
}
export interface Ii18nSimpleDocumentUploaderFormField
  extends Ii18nFormFieldBase {
  type: typeof SIMPLE_DOCUMENT_UPLOADER
  allowedDocType?: string[]
}

export interface Ii18nLocationSearchInputFormField extends Ii18nFormFieldBase {
  type: typeof LOCATION_SEARCH_INPUT
  searchableResource: Extract<
    keyof IOfflineData,
    'facilities' | 'locations' | 'offices'
  >
  searchableType: string
  locationList: ISearchLocation[]
  dispatchOptions?: IDispatchOptions
}

export interface Ii18nWarningField extends Ii18nFormFieldBase {
  type: typeof WARNING
}

export interface Ii18nLinkField extends Ii18nFormFieldBase {
  type: typeof LINK
}

export interface Ii18nPDFDocumentViewerFormField extends Ii18nFormFieldBase {
  type: typeof PDF_DOCUMENT_VIEWER
}

export interface Ii18nLoaderButtonField extends Ii18nFormFieldBase {
  type: typeof FETCH_BUTTON
  queryMap: IQueryMap
  queryData?: IQuery
  querySelectorInput: IFieldInput
  onFetch?: (response: any) => void
  modalTitle: string
  successTitle: string
  errorTitle: string
  errorText: string
  networkErrorText: string
}

export type Ii18nFormField =
  | Ii18nTextFormField
  | Ii18nTelFormField
  | Ii18nNumberFormField
  | Ii18nBigNumberFormField
  | Ii18nSelectFormField
  | Ii18nRadioGroupFormField
  | Ii18nRadioGroupWithNestedFieldsFormField
  | Ii18nInformativeRadioGroupFormField
  | Ii18nCheckboxGroupFormField
  | Ii18nDateFormField
  | Ii18nTextareaFormField
  | Ii18nSubsectionFormField
  | Ii18nFieldGroupTitleField
  | Ii18nDocumentsFormField
  | Ii18nListFormField
  | Ii18nParagraphFormField
  | Ii18nImageUploaderWithOptionsFormField
  | Ii18nDocumentUploaderWithOptions
  | Ii18nWarningField
  | Ii18nLinkField
  | Ii18nPDFDocumentViewerFormField
  | Ii18nLoaderButtonField
  | Ii18nSimpleDocumentUploaderFormField
  | Ii18nLocationSearchInputFormField

export interface IFormSectionData {
  [key: string]: IFormFieldValue
}

export interface IFormData {
  [key: string]: IFormSectionData
}

type PaymentType = 'MANUAL'

type PaymentOutcomeType = 'COMPLETED' | 'ERROR' | 'PARTIAL'

type Payment = {
  paymentId?: string
  type: PaymentType
  total: string
  amount: string
  outcome: PaymentOutcomeType
  date: number
}

export interface ICertificate {
  collector?: IFormSectionData
  hasShowedVerifiedDocument?: boolean
  payments?: Payment[]
  data?: string
}
