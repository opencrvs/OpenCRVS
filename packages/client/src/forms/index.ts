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
import { ApolloQueryResult } from '@apollo/client'
import { ValidationInitializer } from '@client/utils/validate'
import { IDynamicValues } from '@opencrvs/client/src/navigation'
import { ICheckboxOption as CheckboxComponentOption } from '@opencrvs/components/lib/Checkbox'
import {
  IRadioOption as RadioComponentOption,
  RadioSize
} from '@opencrvs/components/lib/Radio'
import { ISelectOption as SelectComponentOption } from '@opencrvs/components/lib/Select'
import type { GQLQuery } from '@client/utils/gateway-deprecated-do-not-use.d'
import { MessageDescriptor } from 'react-intl'

import { ICertificate as IDeclarationCertificate } from '@client/declarations'
import { IOfflineData } from '@client/offline/reducer'
import * as validators from '@opencrvs/client/src/utils/validate'
import { IFont } from '@opencrvs/components/lib/fonts'
import { ISearchLocation } from '@opencrvs/components/lib/LocationSearch'
import * as mutations from './register/mappings/mutation'
import * as graphQLQueries from './register/legacy'
import * as queries from './register/mappings/query'
import * as responseTransformers from './register/legacy/response-transformers'
import { UserDetails } from '@client/utils/userUtils'
import { Conditional } from './conditionals'
import * as labels from '@client/forms/certificate/fieldDefinitions/label'
import {
  BIRTH_REGISTRATION_NUMBER,
  DEATH_REGISTRATION_NUMBER,
  NATIONAL_ID
} from '@client/utils/constants'
import { IconProps } from '@opencrvs/components/lib'
import { UUID } from '@opencrvs/commons/client'

export const TEXT = 'TEXT'
export const TEL = 'TEL'
export const NUMBER = 'NUMBER'
export const BIG_NUMBER = 'BIG_NUMBER'
export const RADIO_GROUP = 'RADIO_GROUP'
export const HIDDEN = 'HIDDEN'
export const RADIO_GROUP_WITH_NESTED_FIELDS = 'RADIO_GROUP_WITH_NESTED_FIELDS'
export const INFORMATIVE_RADIO_GROUP = 'INFORMATIVE_RADIO_GROUP'
export const CHECKBOX_GROUP = 'CHECKBOX_GROUP'
export const CHECKBOX = 'CHECKBOX'
export const DATE = 'DATE'
export const DATE_RANGE_PICKER = 'DATE_RANGE_PICKER'
export const TEXTAREA = 'TEXTAREA'
export const SUBSECTION_HEADER = 'SUBSECTION_HEADER'
export const FIELD_GROUP_TITLE = 'FIELD_GROUP_TITLE'
export const BULLET_LIST = 'BULLET_LIST'
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
export const DYNAMIC_LIST = 'DYNAMIC_LIST'
export const FETCH_BUTTON = 'FETCH_BUTTON'
export const LOCATION_SEARCH_INPUT = 'LOCATION_SEARCH_INPUT'
export const TIME = 'TIME'
export const DIVIDER = 'DIVIDER'
export const HEADING3 = 'HEADING3'
export const SIGNATURE = 'SIGNATURE'
export const HTTP = 'HTTP'
export const BUTTON = 'BUTTON'
export const LINK_BUTTON = 'LINK_BUTTON'
export const ID_READER = 'ID_READER'
export const ID_VERIFICATION_BANNER = 'ID_VERIFICATION_BANNER'

export enum SubmissionAction {
  SUBMIT_FOR_REVIEW = 'submit for review',
  APPROVE_DECLARATION = 'approve',
  REGISTER_DECLARATION = 'register',
  CERTIFY_DECLARATION = 'certify declaration',
  REJECT_DECLARATION = 'reject',
  ARCHIVE_DECLARATION = 'archive',
  ISSUE_DECLARATION = 'issue certificate',
  CERTIFY_AND_ISSUE_DECLARATION = 'certify and issue declaration',
  MAKE_CORRECTION = 'make correction',
  APPROVE_CORRECTION = 'approve correction',
  REJECT_CORRECTION = 'reject correction',
  REQUEST_CORRECTION = 'request correction'
}

export enum DownloadAction {
  LOAD_REVIEW_DECLARATION = 'load declaration data for review',
  LOAD_CERTIFICATE_DECLARATION = 'load declaration data for certificate collection',
  LOAD_REQUESTED_CORRECTION_DECLARATION = 'load declaration data for which is requested correction'
}

export enum AddressCases {
  PRIMARY_ADDRESS = 'PRIMARY_ADDRESS',
  SECONDARY_ADDRESS = 'SECONDARY_ADDRESS'
}

export type Action = SubmissionAction | DownloadAction
export interface ISelectOption {
  value: SelectComponentOption['value']
  label: MessageDescriptor
}
export interface IRadioOption {
  value: RadioComponentOption['value']
  label: MessageDescriptor
  param?: Record<string, string>
  conditionals?: RadioComponentOption['conditionals']
}
export interface ICheckboxOption {
  value: CheckboxComponentOption['value']
  label: MessageDescriptor
}

export interface IDynamicOptions {
  dependency?: string
  jurisdictionType?: string
  resource?: string
  options?: { [key: string]: ISelectOption[] }
}

interface IDispatchOptions {
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

export type IDynamicFormFieldUnitMapper = (
  key: string
) => MessageDescriptor | undefined

export type IDynamicValueMapper = (key: string) => string

export type IDynamicFieldTypeMapper = (key: string) => string

export const identityTypeMapper: IDynamicFieldTypeMapper = (key: string) => {
  switch (key) {
    case NATIONAL_ID:
      return BIG_NUMBER
    case BIRTH_REGISTRATION_NUMBER:
      return BIG_NUMBER
    case DEATH_REGISTRATION_NUMBER:
      return BIG_NUMBER
    default:
      return TEXT
  }
}

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
  unit?: {
    dependency: string
    unitMapper: Operation<typeof labels>
  }
  type?:
    | IStaticFieldType
    | {
        kind: 'dynamic'
        dependency: string
        typeMapper: Operation<typeof identityTypeMapper>
      }
  validator?: Array<{
    dependencies: string[]
    validator: FactoryOperation<typeof validators, IQueryDescriptor>
  }>
}

export interface IDynamicFormFieldDefinitions {
  label?: IDynamicFieldLabel
  helperText?: IDynamicFieldHelperText
  tooltip?: IDynamicFieldTooltip
  unit?: IDynamicFieldUnit
  type?: IDynamicFieldType | IStaticFieldType
  validator?: IDynamicFormFieldValidators[]
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

export interface IDynamicFieldUnit {
  dependency: string
  unitMapper: IDynamicFormFieldUnitMapper
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
  | IDeclarationCertificate
  | IFileValue
  | IAttachmentValue
  | FieldValueArray
  | FieldValueMap
  | IContactPoint
  | IInformant
  | IDateRangePickerValue

interface FieldValueArray extends Array<IFormFieldValue> {}
export interface FieldValueMap {
  [key: string]: IFormFieldValue
}

export interface IQuestionnaireQuestion {
  fieldId: string
  value: string
}

export interface IFileValue {
  optionValues: IFormFieldValue[]
  type: string
  data: string
  fileSize: number
}

export interface IContactPointPhone {
  registrationPhone: string
}

interface IInformantOtherInformantType {
  otherInformantType: string
}
interface IInformant {
  value: string
  nestedFields: IInformantOtherInformantType
}

export interface IContactPoint {
  value: string
  nestedFields: IContactPointPhone
}

export interface IDateRangePickerValue {
  exact: string | undefined
  rangeStart: string | undefined
  rangeEnd: string | undefined
  isDateRangeActive: boolean | undefined
}

export interface IAttachmentValue {
  name?: string
  type: string
  data: string
  uri?: string
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
  nestedFieldDefinition?: IFormField,
  offlineData?: IOfflineData
) => void

export type IFormFieldTemplateMapOperation =
  | [string, IFormFieldQueryMapFunction]
  | [string]
/*
 * Takes in an array of function arguments (array, number, string, function)
 * and replaces all functions with the descriptor type
 *
 * So type Array<number | Function | string> would become
 * Array<number | Descriptor | string>
 */
type FunctionParamsToDescriptor<T, Descriptor> =
  // It's an array - recursively call this type for all items
  T extends Array<any>
    ? { [K in keyof T]: FunctionParamsToDescriptor<T[K], Descriptor> }
    : T extends IFormFieldQueryMapFunction | IFormFieldMutationMapFunction // It's a query transformation function - return a query transformation descriptor
    ? Descriptor
    : T // It's a none of the above - return self

interface FactoryOperation<
  OperationMap,
  Descriptor extends IQueryDescriptor | IMutationDescriptor,
  Key extends keyof OperationMap = keyof OperationMap
> {
  operation: Key
  parameters: FunctionParamsToDescriptor<Params<OperationMap[Key]>, Descriptor>
}
interface Operation<
  OperationMap,
  Key extends keyof OperationMap = keyof OperationMap
> {
  operation: Key
}

export type IFormFieldMapping = {
  mutation?: IFormFieldMutationMapFunction
  query?: IFormFieldQueryMapFunction
  template?: IFormFieldTemplateMapOperation
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
  optionCondition?: string
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

export type IMapping = {
  mutation?: IMutationDescriptor
  query?: IQueryDescriptor
  template?: ITemplateDescriptor
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
  'validator' | 'mapping'
> & {
  validator: IValidatorDescriptor[]
  mapping?: IMapping
}
export interface IAttachment {
  data: string
  uri?: string
  optionValues: string[]
  type: string
  title?: string
  description?: string
}

export enum REVIEW_OVERRIDE_POSITION {
  BEFORE = 'before',
  AFTER = 'after'
}

export type DependencyInfo = {
  expression: string
  dependsOn: string[]
}
export type InitialValue = IFormFieldValue | DependencyInfo

interface IFormFieldBase {
  name: string
  type: IFormField['type']
  label: MessageDescriptor
  labelParam?: Record<string, string>
  helperText?: MessageDescriptor
  tooltip?: MessageDescriptor
  validator: validators.Validation[]
  required?: boolean
  // Whether or not to run validation functions on the field if it's empty
  // Default false
  validateEmpty?: boolean
  prefix?: string
  postfix?: string
  unit?: MessageDescriptor
  disabled?: boolean
  enabled?: string
  custom?: boolean
  initialValue?: InitialValue
  initialValueKey?: string
  extraValue?: IFormFieldValue
  conditionals?: Conditional[]
  description?: MessageDescriptor
  placeholder?: MessageDescriptor
  mapping?: IFormFieldMapping
  hideAsterisk?: boolean
  hideHeader?: boolean
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
    conditionals?: Conditional[]
  }
  ignoreFieldLabelOnErrorMessage?: boolean
  ignoreBottomMargin?: boolean
  customQuestionMappingId?: string
}

export interface ISelectFormFieldWithOptions extends IFormFieldBase {
  type: typeof SELECT_WITH_OPTIONS
  options: ISelectOption[]
  optionCondition?: string
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

export enum FLEX_DIRECTION {
  ROW = 'row',
  ROW_REVERSE = 'row-reverse',
  COLUMN = 'column',
  COLUMN_REVERSE = 'column-reverse',
  INITIAL = 'initial',
  INHERIT = 'inherit'
}

export interface IRadioGroupFormField extends IFormFieldBase {
  type: typeof RADIO_GROUP
  options: IRadioOption[]
  size?: RadioSize
  notice?: MessageDescriptor
  flexDirection?: FLEX_DIRECTION
}

export interface IRadioGroupWithNestedFieldsFormField
  extends Omit<IRadioGroupFormField, 'type'> {
  type: typeof RADIO_GROUP_WITH_NESTED_FIELDS
  nestedFields: INestedInputFields
}

interface IInformativeRadioGroupFormField extends IFormFieldBase {
  type: typeof INFORMATIVE_RADIO_GROUP
  information: IFormSectionData
  dynamicInformationRetriever?: (obj: any) => IFormSectionData
  options: IRadioOption[]
}

export interface ITextFormField extends IFormFieldBase {
  type: typeof TEXT
  maxLength?: number
  dependency?: string
}
interface IHiddenFormField extends IFormFieldBase {
  type: typeof HIDDEN
}

interface ITelFormField extends IFormFieldBase {
  type: typeof TEL
  isSmallSized?: boolean
}
interface INumberFormField extends IFormFieldBase {
  type: typeof NUMBER
  step?: number
  max?: number
  inputWidth?: number
  maxLength?: number
}
interface IBigNumberFormField extends IFormFieldBase {
  type: typeof BIG_NUMBER
  step?: number
}
export interface ICheckboxGroupFormField extends IFormFieldBase {
  type: typeof CHECKBOX_GROUP
  options: ICheckboxOption[]
}
export interface ICheckboxFormField extends IFormFieldBase {
  type: typeof CHECKBOX
  checkedValue?: 'true' | 'false' | boolean
  uncheckedValue?: 'true' | 'false' | boolean
}
export interface IDateFormField extends IFormFieldBase {
  type: typeof DATE
  notice?: MessageDescriptor
  ignorePlaceHolder?: boolean
}
interface IDateRangePickerFormField extends IFormFieldBase {
  type: typeof DATE_RANGE_PICKER
  notice?: MessageDescriptor
  ignorePlaceHolder?: boolean
}

interface ITextareaFormField extends IFormFieldBase {
  type: typeof TEXTAREA
  maxLength?: number
}
interface ISubsectionFormField extends IFormFieldBase {
  type: typeof SUBSECTION_HEADER
}
interface IDividerFormField extends IFormFieldBase {
  type: typeof DIVIDER
}
interface IFieldGroupTitleField extends IFormFieldBase {
  type: typeof FIELD_GROUP_TITLE
}
interface IDocumentsFormField extends IFormFieldBase {
  type: typeof DOCUMENTS
}
export interface IListFormField extends IFormFieldBase {
  type: typeof BULLET_LIST
  items: MessageDescriptor[]
}

export interface IDynamicListFormField extends IFormFieldBase {
  type: typeof DYNAMIC_LIST
  dynamicItems: IDynamicItems
}
interface IParagraphFormField extends IFormFieldBase {
  type: typeof PARAGRAPH
  fontVariant?: string
}
interface IImageUploaderWithOptionsFormField extends IFormFieldBase {
  type: typeof IMAGE_UPLOADER_WITH_OPTIONS
  optionSection: IFormSection
}
export interface IDocumentUploaderWithOptionsFormField extends IFormFieldBase {
  type: typeof DOCUMENT_UPLOADER_WITH_OPTION
  compressImagesToSizeMB?: number
  maxSizeMB?: number
  options: ISelectOption[]
  optionCondition?: string
  hideOnEmptyOption?: boolean
}
interface ISimpleDocumentUploaderFormField extends IFormFieldBase {
  type: typeof SIMPLE_DOCUMENT_UPLOADER
  allowedDocType?: string[]
}

interface ILocationSearchInputFormField extends IFormFieldBase {
  type: typeof LOCATION_SEARCH_INPUT
  searchableResource: Array<
    Extract<keyof IOfflineData, 'facilities' | 'locations' | 'offices'>
  >
  locationList?: ISearchLocation[]
  searchableType: string[]
  dispatchOptions?: IDispatchOptions
  userOfficeId?: UUID // added to filter searchable location
  dynamicOptions?: IDynamicOptions
}

interface IWarningField extends IFormFieldBase {
  type: typeof WARNING
}

interface ILink extends IFormFieldBase {
  type: typeof LINK
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

interface ITimeFormFIeld extends IFormFieldBase {
  type: typeof TIME
  ignorePlaceHolder?: boolean
}

export interface ISignatureFormField extends IFormFieldBase {
  type: typeof SIGNATURE
  maxSizeMb?: number
  allowedFileFormats?: (
    | 'image/png'
    | 'image/jpg'
    | 'image/jpeg'
    | 'image/svg'
  )[]
}

export interface IHttpFormField extends IFormFieldBase {
  type: typeof HTTP
  options: {
    headers: Record<string, string>
    body?: Record<string, unknown>
    params?: Record<string, string>
  } & Omit<Request, 'body' | 'headers'>
}
export interface IButtonFormField extends IFormFieldBase {
  type: typeof BUTTON
  icon?: IconProps['name']
  buttonLabel: MessageDescriptor
  loadingLabel?: MessageDescriptor
  options: {
    trigger: string
    shouldHandleLoadingState?: boolean
  }
}

export interface ILinkButtonFormField extends IFormFieldBase {
  type: typeof LINK_BUTTON
  icon?: {
    desktop: IconProps['name']
    mobile: IconProps['name']
  }
  options: {
    url: string
    callback: {
      trigger: string
      /**
       * If the redirection url has the exact same param keys
       * with exact same values sepecified in the below `params`
       * field, only then the callback will be triggered
       */
      params: Record<string, string>
    }
  }
}

export interface QRReaderType {
  type: 'QR'
  validation: {
    rule: unknown
    errorMessage: MessageDescriptor
  }
}

export type ReaderType = QRReaderType | ILinkButtonFormField
export interface IDReaderFormField extends IFormFieldBase {
  type: typeof ID_READER
  dividerLabel: MessageDescriptor
  manualInputInstructionLabel: MessageDescriptor
  readers: [ReaderType, ...ReaderType[]]
}

export type BannerType = 'authenticated' | 'verified' | 'failed'
interface IIDVerificationBannerFormField extends IFormFieldBase {
  type: typeof ID_VERIFICATION_BANNER
  bannerType: BannerType
  idFieldName: string
}

export type IFormField =
  | ITextFormField
  | ITelFormField
  | INumberFormField
  | IBigNumberFormField
  | IHiddenFormField
  | ISelectFormFieldWithOptions
  | ISelectFormFieldWithDynamicOptions
  | IFormFieldWithDynamicDefinitions
  | IRadioGroupFormField
  | IRadioGroupWithNestedFieldsFormField
  | IInformativeRadioGroupFormField
  | ICheckboxGroupFormField
  | ICheckboxFormField
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
  | IDynamicListFormField
  | ILoaderButton
  | ISimpleDocumentUploaderFormField
  | ILocationSearchInputFormField
  | IDateRangePickerFormField
  | ITimeFormFIeld
  | IDividerFormField
  | ISignatureFormField
  | IHttpFormField
  | IButtonFormField
  | ILinkButtonFormField
  | IDReaderFormField
  | IIDVerificationBannerFormField

export interface IPreviewGroup {
  id: string
  label: MessageDescriptor
  fieldToRedirect?: string
  delimiter?: string
  required?: boolean
  initialValue?: string
}

export interface IDynamicFormField
  extends ISelectFormFieldWithDynamicOptions,
    IFormFieldWithDynamicDefinitions {
  type: any
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
  parameters: Params<(typeof validators)[T]>
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
  parameters: FunctionParamsToDescriptor<
    Params<(typeof queries)[T]>,
    IQueryDescriptor
  >
}

type QueryDefaultOperation<
  T extends QueryDefaultOperationKeys = QueryDefaultOperationKeys
> = {
  operation: T
}

export type IQueryDescriptor = QueryFactoryOperation | QueryDefaultOperation

type ISimpleTemplateDescriptor = { fieldName: string }
export type IQueryTemplateDescriptor = ISimpleTemplateDescriptor &
  IQueryDescriptor
export type ITemplateDescriptor =
  | IQueryTemplateDescriptor
  | ISimpleTemplateDescriptor
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
  parameters: FunctionParamsToDescriptor<
    Params<(typeof mutations)[T]>,
    IMutationDescriptor
  >
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
  template?: [string, IFormSectionQueryMapFunction][]
}

export type IFormSectionMutationMapFunction = (
  transFormedData: TransformedData,
  draftData: IFormData,
  sectionId: string
) => void

export type IFormSectionQueryMapFunction = (
  transFormedData: IFormData,
  queryData: any,
  sectionId: string,
  targetSectionId?: string, // used for template query mappings
  targetFieldName?: string, // used for template query mappings
  offlineData?: IOfflineData, // used for template offline mappings
  userDetails?: UserDetails // user for template user mappings
) => void

export enum UserSection {
  User = 'user',
  Preview = 'preview'
}

export enum CertificateSection {
  Collector = 'collector'
}

export enum CorrectionSection {
  Corrector = 'corrector',
  Reason = 'reason',
  SupportingDocuments = 'supportingDocuments',
  CorrectionFeesPayment = 'currectionFeesPayment',
  Summary = 'summary'
}

export enum PaymentSection {
  Payment = 'payment'
}

export enum ReviewSection {
  Review = 'review'
}

enum RegistrationSection {
  Registration = 'registration'
}

export type Section =
  | ReviewSection
  | PaymentSection
  | UserSection
  | CertificateSection
  | CorrectionSection
  | RegistrationSection

export interface IFormSection {
  id: Section | string
  viewType: ViewType
  name: MessageDescriptor
  title?: MessageDescriptor
  groups: IFormSectionGroup[]
  disabled?: boolean
  optional?: boolean
  notice?: MessageDescriptor
  mapping?: IFormSectionMapping
  /**
   * used for disabling continue button conditionally on a loading value
   * of a FETCH field
   * example: canContinue: '!$form.fetch?.loading'
   * above example blocks user when fetch is on loading state, preventing implications
   * caused by the unresolved pending requests
   */
  canContinue?: string
}

type ISerializedFormSectionGroup = Omit<IFormSectionGroup, 'fields'> & {
  fields: SerializedFormField[]
}

export type ISerializedFormSection = Omit<
  IFormSection,
  'groups' | 'mapping'
> & {
  groups: ISerializedFormSectionGroup[]
  mapping?: {
    mutation?: IMutationDescriptor
    query?: IQueryDescriptor
    template?: (IQueryDescriptor & { fieldName: string })[]
  }
}

export interface IFormSectionGroup {
  id: string
  title?: MessageDescriptor
  fields: IFormField[]
  previewGroups?: IPreviewGroup[]
  disabled?: boolean
  ignoreSingleFieldView?: boolean
  conditionals?: Conditional[]
  error?: MessageDescriptor
  preventContinueIfError?: boolean
}

export interface IForm {
  sections: IFormSection[]
}
export interface ISerializedForm {
  sections: ISerializedFormSection[]
}

interface Ii18nFormFieldBase {
  name: string
  type: Ii18nFormField['type']
  label: string
  helperText?: string
  tooltip?: string
  description?: string
  validator: validators.Validation[]
  required?: boolean
  prefix?: string
  initialValue?: IFormFieldValue
  extraValue?: IFormFieldValue
  postfix?: string
  unit?: string
  disabled?: boolean
  conditionals?: Conditional[]
  hideAsterisk?: boolean
  hideHeader?: boolean
  placeholder?: string
  hidden?: boolean
  nestedFields?: { [key: string]: Ii18nFormField[] }
  ignoreBottomMargin?: boolean
  dependsOn?: string[]
}

interface Ii18nSelectFormField extends Ii18nFormFieldBase {
  type: typeof SELECT_WITH_OPTIONS
  optionCondition?: string
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
  flexDirection?: string
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
export interface Ii18nHiddenFormField extends Ii18nFormFieldBase {
  type: typeof HIDDEN
}
interface Ii18nTelFormField extends Ii18nFormFieldBase {
  type: typeof TEL
  isSmallSized?: boolean
}
interface Ii18nNumberFormField extends Ii18nFormFieldBase {
  type: typeof NUMBER
  step?: number
  max?: number
  inputWidth?: number
  maxLength?: number
}

interface Ii18nBigNumberFormField extends Ii18nFormFieldBase {
  type: typeof BIG_NUMBER
  step?: number
}

interface Ii18nCheckboxGroupFormField extends Ii18nFormFieldBase {
  type: typeof CHECKBOX_GROUP
  options: CheckboxComponentOption[]
}

interface Ii18nCheckboxFormField extends Ii18nFormFieldBase {
  type: typeof CHECKBOX
  checkedValue?: 'true' | 'false' | boolean
  uncheckedValue?: 'true' | 'false' | boolean
}
interface Ii18nDateFormField extends Ii18nFormFieldBase {
  type: typeof DATE
  notice?: string
  ignorePlaceHolder?: boolean
}
interface Ii18nDateRangePickerFormField extends Ii18nFormFieldBase {
  type: typeof DATE_RANGE_PICKER
  notice?: string
  ignorePlaceHolder?: boolean
}
interface Ii18nTextareaFormField extends Ii18nFormFieldBase {
  type: typeof TEXTAREA
  maxLength?: number
}
interface Ii18nSubsectionFormField extends Ii18nFormFieldBase {
  type: typeof SUBSECTION_HEADER
}
interface Ii18nFieldGroupTitleField extends Ii18nFormFieldBase {
  type: typeof FIELD_GROUP_TITLE
}
interface Ii18nDocumentsFormField extends Ii18nFormFieldBase {
  type: typeof DOCUMENTS
}
interface Ii18nListFormField extends Ii18nFormFieldBase {
  type: typeof BULLET_LIST
  items: string[]
}
interface Ii18nParagraphFormField extends Ii18nFormFieldBase {
  type: typeof PARAGRAPH
  fontVariant?: IFont
}
interface Ii18nImageUploaderWithOptionsFormField extends Ii18nFormFieldBase {
  type: typeof IMAGE_UPLOADER_WITH_OPTIONS
  optionSection: IFormSection
}
interface Ii18nDocumentUploaderWithOptions extends Ii18nFormFieldBase {
  type: typeof DOCUMENT_UPLOADER_WITH_OPTION
  options: SelectComponentOption[]
  optionCondition?: string
  compressImagesToSizeMB?: number
  maxSizeMB?: number
  hideOnEmptyOption?: boolean
}
interface Ii18nSimpleDocumentUploaderFormField extends Ii18nFormFieldBase {
  type: typeof SIMPLE_DOCUMENT_UPLOADER
  allowedDocType?: string[]
}

interface Ii18nLocationSearchInputFormField extends Ii18nFormFieldBase {
  type: typeof LOCATION_SEARCH_INPUT
  searchableResource: Array<
    Extract<keyof IOfflineData, 'facilities' | 'locations' | 'offices'>
  >
  searchableType: string[]
  locationList?: ISearchLocation[]
  dispatchOptions?: IDispatchOptions

  dynamicOptions?: IDynamicOptions
}

interface Ii18nWarningField extends Ii18nFormFieldBase {
  type: typeof WARNING
}

interface Ii18nLinkField extends Ii18nFormFieldBase {
  type: typeof LINK
}

interface Ii18nLoaderButtonField extends Ii18nFormFieldBase {
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

interface I18nDividerField extends Ii18nFormFieldBase {
  type: typeof DIVIDER
}

interface I18nHeading3Field extends Ii18nFormFieldBase {
  type: typeof HEADING3
}

interface Ii18nTimeFormField extends Ii18nFormFieldBase {
  type: typeof TIME
  ignorePlaceHolder?: boolean
}

interface Ii18nSignatureField extends Ii18nFormFieldBase {
  type: typeof SIGNATURE
  maxSizeMb?: number
  allowedFileFormats?: (
    | 'image/png'
    | 'image/jpg'
    | 'image/jpeg'
    | 'image/svg'
  )[]
}

interface Ii18nHttpFormField extends Ii18nFormFieldBase {
  type: typeof HTTP
  options: {
    headers: Record<string, string>
    body?: Record<string, unknown>
    params?: Record<string, string>
  } & Omit<Request, 'body' | 'headers'>
}

export interface Ii18nButtonFormField extends Ii18nFormFieldBase {
  type: typeof BUTTON
  icon?: IconProps['name']
  buttonLabel: string
  loadingLabel?: string
  options: {
    trigger: string
    shouldHandleLoadingState?: boolean
  }
}

export interface Ii18nLinkButtonFormField extends Ii18nFormFieldBase {
  type: typeof LINK_BUTTON
  icon?: {
    desktop: IconProps['name']
    mobile: IconProps['name']
  }
  options: {
    url: string
    callback: {
      trigger: string
      params: Record<string, string>
    }
  }
}

export interface Ii18nIDReaderFormField extends Ii18nFormFieldBase {
  type: typeof ID_READER
  dividerLabel: string
  manualInputInstructionLabel: string
  readers: [ReaderType, ...ReaderType[]]
}

interface Ii18nIDVerificationBannerFormField extends Ii18nFormFieldBase {
  type: typeof ID_VERIFICATION_BANNER
  bannerType: BannerType
  idFieldName: string
}
export type Ii18nFormField =
  | Ii18nTextFormField
  | Ii18nTelFormField
  | Ii18nHiddenFormField
  | Ii18nNumberFormField
  | Ii18nBigNumberFormField
  | Ii18nSelectFormField
  | Ii18nRadioGroupFormField
  | Ii18nRadioGroupWithNestedFieldsFormField
  | Ii18nInformativeRadioGroupFormField
  | Ii18nCheckboxGroupFormField
  | Ii18nCheckboxFormField
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
  | Ii18nLoaderButtonField
  | Ii18nSimpleDocumentUploaderFormField
  | Ii18nLocationSearchInputFormField
  | Ii18nDateRangePickerFormField
  | Ii18nTimeFormField
  | I18nDividerField
  | I18nHeading3Field
  | Ii18nSignatureField
  | Ii18nHttpFormField
  | Ii18nButtonFormField
  | Ii18nLinkButtonFormField
  | Ii18nIDReaderFormField
  | Ii18nIDVerificationBannerFormField

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
  amount: string
  outcome: PaymentOutcomeType
  date: number
}

export interface ICertificate {
  collector?: IFormSectionData
  hasShowedVerifiedDocument?: boolean
  payments?: Payment[]
  certificateTemplateId?: string
}

export function modifyFormField(
  form: IForm,
  sectionId: string,
  groupId: string,
  fieldName: string,
  modifyFn: (field: IFormField) => IFormField
) {
  return {
    ...form,
    sections: form.sections.map((section) => {
      if (section.id === sectionId) {
        return {
          ...section,
          groups: section.groups.map((group) => {
            if (group.id === groupId) {
              return {
                ...group,
                fields: group.fields.map((field) => {
                  if (field.name === fieldName) {
                    return modifyFn(field)
                  }
                  return field
                })
              }
            }
            return group
          })
        }
      }
      return section
    })
  }
}
