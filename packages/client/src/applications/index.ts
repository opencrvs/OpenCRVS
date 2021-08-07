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
  Action as ApplicationAction,
  Event,
  IForm,
  IFormData,
  IFormFieldValue,
  Sort
} from '@client/forms'
import { getRegisterForm } from '@client/forms/register/application-selectors'
import { syncRegistrarWorkqueue } from '@client/ListSyncController'
import { Action as NavigationAction, GO_TO_PAGE } from '@client/navigation'
import {
  UserDetailsAvailable,
  USER_DETAILS_AVAILABLE
} from '@client/profile/profileActions'
import { getScope, getUserDetails } from '@client/profile/profileSelectors'
import { SEARCH_APPLICATIONS_USER_WISE } from '@client/search/queries'
import { storage } from '@client/storage'
import { IStoreState } from '@client/store'
import {
  gqlToDraftTransformer,
  draftToGqlTransformer
} from '@client/transformer'
import { client } from '@client/utils/apolloClient'
import { DECLARED_APPLICATION_SEARCH_QUERY_COUNT } from '@client/utils/constants'
import { transformSearchQueryDataToDraft } from '@client/utils/draftUtils'
import { getUserLocation, IUserDetails } from '@client/utils/userUtils'
import { getQueryMapping } from '@client/views/DataProvider/QueryProvider'
import {
  EVENT_STATUS,
  IQueryData
} from '@client/views/RegistrationHome/RegistrationHome'
import {
  GQLEventSearchResultSet,
  GQLEventSearchSet,
  GQLHumanName,
  GQLBirthEventSearchSet,
  GQLDeathEventSearchSet
} from '@opencrvs/gateway/src/graphql/schema'
import ApolloClient, { ApolloError, ApolloQueryResult } from 'apollo-client'
import { Cmd, loop, Loop, LoopReducer } from 'redux-loop'
import { v4 as uuid } from 'uuid'

const SET_INITIAL_APPLICATION = 'APPLICATION/SET_INITIAL_APPLICATION'
const STORE_APPLICATION = 'APPLICATION/STORE_APPLICATION'
const MODIFY_APPLICATION = 'APPLICATION/MODIFY_DRAFT'
const WRITE_APPLICATION = 'APPLICATION/WRITE_DRAFT'
const DELETE_APPLICATION = 'APPLICATION/DELETE_DRAFT'
const GET_APPLICATIONS_SUCCESS = 'APPLICATION/GET_DRAFTS_SUCCESS'
const GET_APPLICATIONS_FAILED = 'APPLICATION/GET_DRAFTS_FAILED'
const UPDATE_REGISTRAR_WORKQUEUE = 'APPLICATION/UPDATE_REGISTRAR_WORKQUEUE'
const UPDATE_REGISTRAR_WORKQUEUE_SUCCESS =
  'APPLICATION/UPDATE_REGISTRAR_WORKQUEUE_SUCCESS'
const UPDATE_REGISTRAR_WORKQUEUE_FAIL =
  'APPLICATION/UPDATE_REGISTRAR_WORKQUEUE_FAIL'
const ENQUEUE_DOWNLOAD_APPLICATION = 'APPLICATION/ENQUEUE_DOWNLOAD_APPLICATION'
const DOWNLOAD_APPLICATION_SUCCESS = 'APPLICATION/DOWNLOAD_APPLICATION_SUCCESS'
const DOWNLOAD_APPLICATION_FAIL = 'APPLICATION/DOWNLOAD_APPLICATION_FAIL'
const UPDATE_FIELD_AGENT_DECLARED_APPLICATIONS =
  'APPLICATION/UPDATE_FIELD_AGENT_DECLARED_APPLICATIONS'
const UPDATE_FIELD_AGENT_DECLARED_APPLICATIONS_SUCCESS =
  'APPLICATION/UPDATE_FIELD_AGENT_DECLARED_APPLICATIONS_SUCCESS'
const UPDATE_FIELD_AGENT_DECLARED_APPLICATIONS_FAIL =
  'APPLICATION/UPDATE_FIELD_AGENT_DECLARED_APPLICATIONS_FAIL'

export enum SUBMISSION_STATUS {
  DRAFT = 'DRAFT',
  READY_TO_SUBMIT = 'READY_TO_SUBMIT',
  SUBMITTING = 'SUBMITTING',
  DECLARED = 'DECLARED',
  SUBMITTED = 'SUBMITTED',
  READY_TO_APPROVE = 'READY_TO_APPROVE',
  APPROVING = 'APPROVING',
  APPROVED = 'APPROVED',
  READY_TO_REGISTER = 'READY_TO_REGISTER',
  REGISTERING = 'REGISTERING',
  REGISTERED = 'REGISTERED',
  READY_TO_REJECT = 'READY_TO_REJECT',
  REJECTING = 'REJECTING',
  REJECTED = 'REJECTED',
  READY_TO_CERTIFY = 'READY_TO_CERTIFY',
  CERTIFYING = 'CERTIFYING',
  CERTIFIED = 'CERTIFIED',
  FAILED = 'FAILED',
  FAILED_NETWORK = 'FAILED_NETWORK'
}

export enum DOWNLOAD_STATUS {
  READY_TO_DOWNLOAD = 'READY_TO_DOWNLOAD',
  DOWNLOADING = 'DOWNLOADING',
  DOWNLOADED = 'DOWNLOADED',
  FAILED = 'FAILED',
  FAILED_NETWORK = 'FAILED_NETWORK'
}

export const processingStates = [
  SUBMISSION_STATUS.READY_TO_SUBMIT,
  SUBMISSION_STATUS.SUBMITTING,
  SUBMISSION_STATUS.READY_TO_APPROVE,
  SUBMISSION_STATUS.APPROVING,
  SUBMISSION_STATUS.READY_TO_REGISTER,
  SUBMISSION_STATUS.REGISTERING,
  SUBMISSION_STATUS.READY_TO_REJECT,
  SUBMISSION_STATUS.REJECTING,
  SUBMISSION_STATUS.READY_TO_CERTIFY,
  SUBMISSION_STATUS.CERTIFYING
]

const DOWNLOAD_MAX_RETRY_ATTEMPT = 3
interface IActionList {
  [key: string]: string
}

const ACTION_LIST: IActionList = {
  [ApplicationAction.LOAD_REVIEW_APPLICATION]:
    ApplicationAction.LOAD_REVIEW_APPLICATION,
  [ApplicationAction.LOAD_CERTIFICATE_APPLICATION]:
    ApplicationAction.LOAD_CERTIFICATE_APPLICATION
}

export interface IPayload {
  [key: string]: IFormFieldValue
}

export interface IVisitedGroupId {
  sectionId: string
  groupId: string
}

export interface ITaskHistory {
  operationType?: string
  operatedOn?: string
  operatorRole?: string
  operatorName?: Array<GQLHumanName | null>
  operatorOfficeName?: string
  operatorOfficeAlias?: Array<string | null>
  notificationFacilityName?: string
  notificationFacilityAlias?: Array<string | null>
  rejectReason?: string
  rejectComment?: string
}

export interface IApplication {
  id: string
  data: IFormData
  savedOn?: number
  modifiedOn?: number
  eventType?: string
  review?: boolean
  event: Event
  registrationStatus?: string
  submissionStatus?: string
  downloadStatus?: string
  downloadRetryAttempt?: number
  action?: string
  trackingId?: string
  compositionId?: string
  registrationNumber?: string
  payload?: IPayload
  visitedGroupIds?: IVisitedGroupId[]
  timeLoggedMS?: number
  operationHistories?: ITaskHistory[]
}

export interface IWorkqueue {
  loading?: boolean
  error?: boolean
  data: IQueryData
  initialSyncDone: boolean
}

interface IWorkqueuePaginationParams {
  inProgressCount: number
  reviewCount: number
  rejectCount: number
  approvalCount: number
  externalValidationCount: number
  printCount: number

  inProgressSkip: number
  reviewSkip: number
  rejectSkip: number
  approvalSkip: number
  externalValidationSkip: number
  printSkip: number
}

type Relation =
  | 'FATHER'
  | 'MOTHER'
  | 'SPOUSE'
  | 'SON'
  | 'DAUGHTER'
  | 'EXTENDED_FAMILY'
  | 'OTHER'
  | 'INFORMANT'
  | 'PRINT_IN_ADVANCE'

export type ICertificate = {
  collector?: Partial<{ type: Relation }>
  hasShowedVerifiedDocument?: boolean
  payments?: Payment
  data?: string
}

/*
 * This type represents a submitted application that we've received from the API
 * It provides a more strict alternative to IApplication with fields we know should always exist
 */
export interface IPrintableApplication extends Omit<IApplication, 'data'> {
  data: {
    father: {
      fathersDetailsExist: boolean
      [key: string]: IFormFieldValue
    }
    registration: {
      _fhirID: string
      presentAtBirthRegistration: Relation
      whoseContactDetails: string
      registrationPhone: string
      trackingId: string
      registrationNumber: string
      certificates: ICertificate[]
      [key: string]: IFormFieldValue
    }
  } & Exclude<IApplication['data'], 'father' | 'registration'>
}

type PaymentType = 'MANUAL'

type PaymentOutcomeType = 'COMPLETED' | 'ERROR' | 'PARTIAL'

type Payment = {
  paymentId?: string
  type: PaymentType
  total: number
  amount: number
  outcome: PaymentOutcomeType
  date: number
}

interface IStoreApplicationAction {
  type: typeof STORE_APPLICATION
  payload: { application: IApplication }
}

interface IModifyApplicationAction {
  type: typeof MODIFY_APPLICATION
  payload: {
    application: IApplication | IPrintableApplication
  }
}

export interface IWriteApplicationAction {
  type: typeof WRITE_APPLICATION
  payload: {
    application: IApplication | IPrintableApplication
    callback?: () => void
  }
}

interface ISetInitialApplicationsAction {
  type: typeof SET_INITIAL_APPLICATION
}

type OnSuccessDeleteApplicationOptions = Partial<{
  shouldUpdateFieldAgentHome: boolean
}>
interface IDeleteApplicationAction {
  type: typeof DELETE_APPLICATION
  payload: {
    application: IApplication | IPrintableApplication
  } & OnSuccessDeleteApplicationOptions
}

interface IGetStorageApplicationsSuccessAction {
  type: typeof GET_APPLICATIONS_SUCCESS
  payload: string
}

interface IGetStorageApplicationsFailedAction {
  type: typeof GET_APPLICATIONS_FAILED
}

interface UpdateRegistrarWorkQueueSuccessAction {
  type: typeof UPDATE_REGISTRAR_WORKQUEUE_SUCCESS
  payload: string
}

interface UpdateRegistrarWorkQueueFailAction {
  type: typeof UPDATE_REGISTRAR_WORKQUEUE_FAIL
}

interface IDownloadApplication {
  type: typeof ENQUEUE_DOWNLOAD_APPLICATION
  payload: {
    application: IApplication
    client: ApolloClient<{}>
  }
}

interface IDownloadApplicationSuccess {
  type: typeof DOWNLOAD_APPLICATION_SUCCESS
  payload: {
    queryData: any
    form: {
      [key in Event]: IForm
    }
    client: ApolloClient<{}>
  }
}

interface IDownloadApplicationFail {
  type: typeof DOWNLOAD_APPLICATION_FAIL
  payload: {
    error: ApolloError
    application: IApplication
    client: ApolloClient<{}>
  }
}

interface UpdateRegistrarWorkqueueAction {
  type: typeof UPDATE_REGISTRAR_WORKQUEUE
  payload: {
    inProgressCount: number
    reviewCount: number
    rejectCount: number
    approvalCount: number
    externalValidationCount: number
    printCount: number

    inProgressSkip: number
    reviewSkip: number
    rejectSkip: number
    approvalSkip: number
    externalValidationSkip: number
    printSkip: number
  }
}

interface UpdateFieldAgentDeclaredApplicationsAction {
  type: typeof UPDATE_FIELD_AGENT_DECLARED_APPLICATIONS
}
interface UpdateFieldAgentDeclaredApplicationsSuccessAction {
  type: typeof UPDATE_FIELD_AGENT_DECLARED_APPLICATIONS_SUCCESS
  payload: string
}
interface UpdateFieldAgentDeclaredApplicationsFailAction {
  type: typeof UPDATE_FIELD_AGENT_DECLARED_APPLICATIONS_FAIL
}

interface IApplicationRequestQueue {
  id: string
  action: Action
}
export type Action =
  | IStoreApplicationAction
  | IModifyApplicationAction
  | ISetInitialApplicationsAction
  | IWriteApplicationAction
  | NavigationAction
  | IDeleteApplicationAction
  | IGetStorageApplicationsSuccessAction
  | IGetStorageApplicationsFailedAction
  | IDownloadApplication
  | IDownloadApplicationSuccess
  | IDownloadApplicationFail
  | UserDetailsAvailable
  | UpdateRegistrarWorkqueueAction
  | UpdateRegistrarWorkQueueSuccessAction
  | UpdateRegistrarWorkQueueFailAction
  | UpdateFieldAgentDeclaredApplicationsAction
  | UpdateFieldAgentDeclaredApplicationsSuccessAction
  | UpdateFieldAgentDeclaredApplicationsFailAction

export interface IUserData {
  userID: string
  userPIN?: string
  applications: IApplication[]
  workqueue?: IWorkqueue
}

export interface IApplicationsState {
  userID: string
  applications: IApplication[]
  initialApplicationsLoaded: boolean
  isWritingDraft: boolean
}

export interface WorkqueueState {
  workqueue: IWorkqueue
}

const workqueueInitialState = {
  workqueue: {
    loading: true,
    error: false,
    data: {
      inProgressTab: { totalItems: 0, results: [] },
      notificationTab: { totalItems: 0, results: [] },
      reviewTab: { totalItems: 0, results: [] },
      rejectTab: { totalItems: 0, results: [] },
      approvalTab: { totalItems: 0, results: [] },
      printTab: { totalItems: 0, results: [] },
      externalValidationTab: { totalItems: 0, results: [] }
    },
    initialSyncDone: false
  }
}

const initialState: IApplicationsState = {
  userID: '',
  applications: [],
  initialApplicationsLoaded: false,
  isWritingDraft: false
}

export function createApplication(event: Event, initialData?: IFormData) {
  return {
    id: uuid(),
    data: initialData || {},
    event,
    submissionStatus: SUBMISSION_STATUS[SUBMISSION_STATUS.DRAFT]
  }
}

export function makeApplicationReadyToDownload(
  event: Event,
  compositionId: string,
  action: string
): IApplication {
  return {
    id: compositionId,
    data: {},
    event,
    compositionId,
    action,
    downloadStatus: DOWNLOAD_STATUS.READY_TO_DOWNLOAD
  }
}

export function createReviewApplication(
  applicationId: string,
  formData: IFormData,
  event: Event,
  status?: string
): IApplication {
  return {
    id: applicationId,
    data: formData,
    review: true,
    event,
    registrationStatus: status
  }
}

export function dynamicDispatch(
  action: string,
  payload: { [key: string]: string }
) {
  return {
    type: action,
    payload
  }
}

export function storeApplication(
  application: IApplication
): IStoreApplicationAction {
  application.savedOn = Date.now()
  return { type: STORE_APPLICATION, payload: { application } }
}

export function modifyApplication(
  application: IApplication | IPrintableApplication
): IModifyApplicationAction {
  application.modifiedOn = Date.now()
  return { type: MODIFY_APPLICATION, payload: { application } }
}
export function setInitialApplications() {
  return { type: SET_INITIAL_APPLICATION }
}

export const getStorageApplicationsSuccess = (
  response: string
): IGetStorageApplicationsSuccessAction => ({
  type: GET_APPLICATIONS_SUCCESS,
  payload: response
})

export const getStorageApplicationsFailed = (): IGetStorageApplicationsFailedAction => ({
  type: GET_APPLICATIONS_FAILED
})

export function deleteApplication(
  application: IApplication | IPrintableApplication,
  options?: OnSuccessDeleteApplicationOptions
): IDeleteApplicationAction {
  return { type: DELETE_APPLICATION, payload: { application, ...options } }
}

export function writeApplication(
  application: IApplication | IPrintableApplication,
  callback?: () => void
): IWriteApplicationAction {
  return { type: WRITE_APPLICATION, payload: { application, callback } }
}

export async function getCurrentUserID(): Promise<string> {
  const userDetails = await storage.getItem('USER_DETAILS')

  if (!userDetails) {
    return ''
  }
  return (JSON.parse(userDetails) as IUserDetails).userMgntUserID || ''
}

async function getUserData(userId: string) {
  const userData = await storage.getItem('USER_DATA')
  const allUserData: IUserData[] = !userData
    ? []
    : (JSON.parse(userData) as IUserData[])
  const currentUserData = allUserData.find(uData => uData.userID === userId)

  return { allUserData, currentUserData }
}

async function getFieldAgentDeclaredApplications(userDetails: IUserDetails) {
  const userId = userDetails.practitionerId
  const locationIds = (userDetails && [getUserLocation(userDetails).id]) || []

  let result
  try {
    const response = await client.query({
      query: SEARCH_APPLICATIONS_USER_WISE,
      variables: {
        userId,
        status: [EVENT_STATUS.DECLARED],
        locationIds,
        count: DECLARED_APPLICATION_SEARCH_QUERY_COUNT,
        sort: Sort.ASC
      },
      fetchPolicy: 'no-cache'
    })
    result = response.data && response.data.searchEvents
  } catch (exception) {
    result = undefined
  }

  return result
}

export function mergeDeclaredApplications(
  applications: IApplication[],
  declaredApplications: GQLEventSearchSet[]
) {
  const localApplications = applications.map(
    application => application.compositionId
  )

  const transformedDeclaredApplications = declaredApplications
    .filter(
      declaredApplication => !localApplications.includes(declaredApplication.id)
    )
    .map(app => {
      return transformSearchQueryDataToDraft(app)
    })

  applications.push(...transformedDeclaredApplications)
}

async function updateFieldAgentDeclaredApplicationsByUser(
  getState: () => IStoreState
) {
  const state = getState()
  const scope = getScope(state)

  if (
    !state.applicationsState.applications ||
    state.applicationsState.applications.length !== 0 ||
    !scope ||
    !scope.includes('declare')
  ) {
    return Promise.reject('Remote declared application merging not applicable')
  }

  const userDetails =
    getUserDetails(state) ||
    (JSON.parse(
      (await storage.getItem('USER_DETAILS')) as string
    ) as IUserDetails)

  const uID = userDetails.userMgntUserID || ''
  let { allUserData, currentUserData } = await getUserData(uID)

  const declaredApplications = await getFieldAgentDeclaredApplications(
    userDetails
  )

  if (!currentUserData) {
    currentUserData = {
      userID: uID,
      applications: state.applicationsState.applications
    }
    allUserData.push(currentUserData)
  }
  mergeDeclaredApplications(
    currentUserData.applications,
    declaredApplications.results
  )

  return Promise.all([
    storage.setItem('USER_DATA', JSON.stringify(allUserData)),
    JSON.stringify(currentUserData)
  ]).then(([_, currentUserData]) => currentUserData)
}

export async function getApplicationsOfCurrentUser(): Promise<string> {
  // returns a 'stringified' IUserData
  const storageTable = await storage.getItem('USER_DATA')
  if (!storageTable) {
    return JSON.stringify({ applications: [] })
  }

  const currentUserID = await getCurrentUserID()

  const allUserData = JSON.parse(storageTable) as IUserData[]

  if (!allUserData.length) {
    // No user-data at all
    const payloadWithoutApplications: IUserData = {
      userID: currentUserID,
      applications: []
    }

    return JSON.stringify(payloadWithoutApplications)
  }

  const currentUserData = allUserData.find(
    uData => uData.userID === currentUserID
  )
  const currentUserApplications: IApplication[] =
    (currentUserData && currentUserData.applications) || []
  const payload: IUserData = {
    userID: currentUserID,
    applications: currentUserApplications
  }
  return JSON.stringify(payload)
}

async function updateWorkqueueData(
  state: IStoreState,
  application: IApplication,
  workQueueId: keyof IQueryData,
  userWorkqueue?: IWorkqueue
) {
  if (!userWorkqueue || !userWorkqueue.data) {
    return
  }

  let workqueueApp =
    userWorkqueue.data[workQueueId] &&
    userWorkqueue.data[workQueueId].results &&
    // @ts-ignore
    userWorkqueue.data[workQueueId].results.find(
      app => app && app.id === application.id
    )
  if (!workqueueApp) {
    return
  }
  const sectionId = application.event === 'birth' ? 'child' : 'deceased'
  const sectionDefinition = getRegisterForm(state)[
    application.event
  ].sections.find(section => section.id === sectionId)

  const transformedApplication = draftToGqlTransformer(
    // transforming required section only
    { sections: sectionDefinition ? [sectionDefinition] : [] },
    application.data
  )
  const transformedName =
    (transformedApplication &&
      transformedApplication[sectionId] &&
      transformedApplication[sectionId].name) ||
    []

  if (application.event === 'birth') {
    ;(workqueueApp as GQLBirthEventSearchSet).childName = transformedName
  } else {
    ;(workqueueApp as GQLDeathEventSearchSet).deceasedName = transformedName
  }
}

export async function writeApplicationByUser(
  getState: () => IStoreState,
  userId: string,
  application: IApplication
): Promise<string> {
  const uID = userId || (await getCurrentUserID())
  let { allUserData, currentUserData } = await getUserData(uID)

  const existingApplicationId = currentUserData
    ? currentUserData.applications.findIndex(app => app.id === application.id)
    : -1

  if (existingApplicationId >= 0) {
    currentUserData &&
      currentUserData.applications.splice(existingApplicationId, 1)
  }

  if (currentUserData) {
    currentUserData.applications.push(application)
  } else {
    currentUserData = {
      userID: uID,
      applications: [application]
    }
    allUserData.push(currentUserData)
  }
  if (
    application.registrationStatus &&
    application.registrationStatus === 'IN_PROGRESS'
  ) {
    updateWorkqueueData(
      getState(),
      application,
      'inProgressTab',
      currentUserData.workqueue
    )
    updateWorkqueueData(
      getState(),
      application,
      'notificationTab',
      currentUserData.workqueue
    )
  }

  if (
    application.registrationStatus &&
    application.registrationStatus === 'DECLARED'
  ) {
    updateWorkqueueData(
      getState(),
      application,
      'reviewTab',
      currentUserData.workqueue
    )
  }

  return Promise.all([
    storage.setItem('USER_DATA', JSON.stringify(allUserData)),
    JSON.stringify(currentUserData)
  ]).then(([_, currentUserData]) => currentUserData)
}

function mergeWorkQueueData(
  state: IStoreState,
  workQueueIds: (keyof IQueryData)[],
  currentApplicatons: IApplication[] | undefined,
  destinationWorkQueue: IWorkqueue
) {
  if (!currentApplicatons) {
    return destinationWorkQueue
  }
  workQueueIds.forEach(workQueueId => {
    if (!destinationWorkQueue.data[workQueueId].results) {
      return
    }
    ;(destinationWorkQueue.data[workQueueId]
      .results as GQLEventSearchSet[]).forEach(application => {
      if (application == null) {
        return
      }
      const applicationIndex = currentApplicatons.findIndex(
        app => app && app.id === application.id
      )
      if (applicationIndex >= 0) {
        updateWorkqueueData(
          state,
          currentApplicatons[applicationIndex],
          workQueueId,
          destinationWorkQueue
        )
      }
    })
  })
  return destinationWorkQueue
}
async function getWorkqueueData(
  state: IStoreState,
  userDetails: IUserDetails,
  workqueuePaginationParams: IWorkqueuePaginationParams,
  currentWorkqueue: IWorkqueue | undefined
) {
  const registrationLocationId =
    (userDetails && getUserLocation(userDetails).id) || ''

  const scope = getScope(state)
  const reviewStatuses =
    scope && scope.includes('register')
      ? [EVENT_STATUS.DECLARED, EVENT_STATUS.VALIDATED]
      : [EVENT_STATUS.DECLARED]

  const {
    inProgressCount,
    reviewCount,
    rejectCount,
    approvalCount,
    externalValidationCount,
    printCount,
    inProgressSkip,
    reviewSkip,
    rejectSkip,
    approvalSkip,
    externalValidationSkip,
    printSkip
  } = workqueuePaginationParams

  const result = await syncRegistrarWorkqueue(
    registrationLocationId,
    reviewStatuses,
    inProgressCount,
    reviewCount,
    rejectCount,
    approvalCount,
    externalValidationCount,
    printCount,
    inProgressSkip,
    reviewSkip,
    rejectSkip,
    approvalSkip,
    externalValidationSkip,
    printSkip
  )

  let workqueue
  if (result) {
    workqueue = {
      loading: false,
      error: false,
      data: result,
      initialSyncDone: true
    }
  } else {
    workqueue = {
      loading: false,
      error: true,
      data:
        (currentWorkqueue && currentWorkqueue.data) ||
        (state.workqueueState && state.workqueueState.workqueue.data),
      initialSyncDone: false
    }
  }
  const { currentUserData } = await getUserData(
    userDetails.userMgntUserID || ''
  )
  return mergeWorkQueueData(
    state,
    ['inProgressTab', 'notificationTab'],
    currentUserData && currentUserData.applications,
    workqueue
  )
}

export async function writeRegistrarWorkqueueByUser(
  getState: () => IStoreState,
  workqueuePaginationParams: IWorkqueuePaginationParams
): Promise<string> {
  const state = getState()
  const userDetails = getUserDetails(state) as IUserDetails

  const uID = userDetails.userMgntUserID || ''
  let { allUserData, currentUserData } = await getUserData(uID)

  const workqueue = await getWorkqueueData(
    state,
    userDetails,
    workqueuePaginationParams,
    currentUserData && currentUserData.workqueue
  )

  if (currentUserData) {
    currentUserData.workqueue = workqueue
  } else {
    currentUserData = {
      userID: uID,
      applications: [],
      workqueue
    }
    allUserData.push(currentUserData)
  }
  return Promise.all([
    storage.setItem('USER_DATA', JSON.stringify(allUserData)),
    JSON.stringify(currentUserData.workqueue)
  ]).then(([_, currentUserWorkqueueData]) => currentUserWorkqueueData)
}

export async function deleteApplicationByUser(
  userId: string,
  application: IApplication
): Promise<string> {
  const uID = userId || (await getCurrentUserID())
  let { allUserData, currentUserData } = await getUserData(uID)

  const deletedApplicationId = currentUserData
    ? currentUserData.applications.findIndex(app => app.id === application.id)
    : -1

  if (deletedApplicationId >= 0) {
    currentUserData &&
      currentUserData.applications.splice(deletedApplicationId, 1)
    storage.setItem('USER_DATA', JSON.stringify(allUserData))
  }

  return JSON.stringify(currentUserData)
}

export function downloadApplication(
  application: IApplication,
  client: ApolloClient<{}>
): IDownloadApplication {
  return {
    type: ENQUEUE_DOWNLOAD_APPLICATION,
    payload: {
      application,
      client
    }
  }
}

export function updateRegistrarWorkqueue(
  inProgressCount: number = 10,
  reviewCount: number = 10,
  rejectCount: number = 10,
  approvalCount: number = 10,
  externalValidationCount: number = 10,
  printCount: number = 10,

  inProgressSkip: number = 0,
  reviewSkip: number = 0,
  rejectSkip: number = 0,
  approvalSkip: number = 0,
  externalValidationSkip: number = 0,
  printSkip: number = 0
) {
  return {
    type: UPDATE_REGISTRAR_WORKQUEUE,
    payload: {
      inProgressCount,
      reviewCount,
      rejectCount,
      approvalCount,
      externalValidationCount,
      printCount,

      inProgressSkip,
      reviewSkip,
      rejectSkip,
      approvalSkip,
      externalValidationSkip,
      printSkip
    }
  }
}

export const updateRegistrarWorkqueueSuccessActionCreator = (
  response: string
): UpdateRegistrarWorkQueueSuccessAction => ({
  type: UPDATE_REGISTRAR_WORKQUEUE_SUCCESS,
  payload: response
})

export const updateRegistrarWorkqueueFailActionCreator = (): UpdateRegistrarWorkQueueFailAction => ({
  type: UPDATE_REGISTRAR_WORKQUEUE_FAIL
})

export function updateFieldAgentDeclaredApplications() {
  return {
    type: UPDATE_FIELD_AGENT_DECLARED_APPLICATIONS
  }
}

export const updateFieldAgentDeclaredApplicationsSuccessActionCreator = (
  response: string
): UpdateFieldAgentDeclaredApplicationsSuccessAction => ({
  type: UPDATE_FIELD_AGENT_DECLARED_APPLICATIONS_SUCCESS,
  payload: response
})

export const updateFieldAgentDeclaredApplicationsFailActionCreator = (): UpdateFieldAgentDeclaredApplicationsFailAction => ({
  type: UPDATE_FIELD_AGENT_DECLARED_APPLICATIONS_FAIL
})

function createRequestForApplication(
  application: IApplication,
  client: ApolloClient<{}>
) {
  const applicationAction = ACTION_LIST[application.action as string] || null
  const result = getQueryMapping(
    application.event,
    applicationAction as ApplicationAction
  )
  const { query } = result || {
    query: null
  }

  return {
    request: client.query,
    requestArgs: {
      query,
      variables: { id: application.id }
    }
  }
}

function requestWithStateWrapper(
  mainRequest: Promise<ApolloQueryResult<any>>,
  getState: () => IStoreState,
  client: ApolloClient<{}>
) {
  const store = getState()
  return new Promise(async (resolve, reject) => {
    try {
      const data = await mainRequest
      resolve({ data, store, client })
    } catch (error) {
      reject(error)
    }
  })
}

function getDataKey(application: IApplication) {
  const result = getQueryMapping(
    application.event,
    application.action as ApplicationAction
  )

  const { dataKey } = result || { dataKey: null }
  return dataKey
}

function downloadApplicationSuccess({
  data,
  store,
  client
}: {
  data: any
  store: IStoreState
  client: ApolloClient<{}>
}): IDownloadApplicationSuccess {
  const form = getRegisterForm(store)

  return {
    type: DOWNLOAD_APPLICATION_SUCCESS,
    payload: {
      queryData: data,
      form,
      client
    }
  }
}

function downloadApplicationFail(
  error: ApolloError,
  application: IApplication,
  client: ApolloClient<{}>
): IDownloadApplicationFail {
  return {
    type: DOWNLOAD_APPLICATION_FAIL,
    payload: {
      error,
      application,
      client
    }
  }
}

export const applicationsReducer: LoopReducer<IApplicationsState, Action> = (
  state: IApplicationsState = initialState,
  action: Action
): IApplicationsState | Loop<IApplicationsState, Action> => {
  switch (action.type) {
    case GO_TO_PAGE: {
      const application = state.applications.find(
        ({ id }) => id === action.payload.applicationId
      )

      if (!application || application.data[action.payload.pageId]) {
        return state
      }
      const modifiedApplication = {
        ...application,
        data: {
          ...application.data,
          [action.payload.pageId]: {}
        }
      }
      return loop(state, Cmd.action(modifyApplication(modifiedApplication)))
    }
    case STORE_APPLICATION:
      return {
        ...state,
        applications: state.applications
          ? state.applications.concat(action.payload.application)
          : [action.payload.application]
      }
    case DELETE_APPLICATION:
      return loop(
        {
          ...state
        },
        Cmd.run(deleteApplicationByUser, {
          successActionCreator: action.payload.shouldUpdateFieldAgentHome
            ? updateFieldAgentDeclaredApplications
            : getStorageApplicationsSuccess,
          failActionCreator: getStorageApplicationsFailed,
          args: [state.userID, action.payload.application]
        })
      )
    case MODIFY_APPLICATION:
      const newApplications: IApplication[] = state.applications || []
      const currentApplicationIndex = newApplications.findIndex(
        application => application.id === action.payload.application.id
      )
      newApplications[currentApplicationIndex] = action.payload.application
      return {
        ...state,
        applications: newApplications
      }
    case WRITE_APPLICATION:
      return loop(
        {
          ...state,
          isWritingDraft: true
        },
        Cmd.run(writeApplicationByUser, {
          successActionCreator: (response: string) => {
            if (action.payload.callback) {
              action.payload.callback()
            }
            return getStorageApplicationsSuccess(response)
          },
          failActionCreator: getStorageApplicationsFailed,
          args: [Cmd.getState, state.userID, action.payload.application]
        })
      )
    case USER_DETAILS_AVAILABLE:
      return loop(
        {
          ...state
        },
        Cmd.run<
          IGetStorageApplicationsFailedAction,
          IGetStorageApplicationsSuccessAction
        >(getApplicationsOfCurrentUser, {
          successActionCreator: getStorageApplicationsSuccess,
          failActionCreator: getStorageApplicationsFailed,
          args: []
        })
      )
    case GET_APPLICATIONS_SUCCESS:
      if (action.payload) {
        const userData = JSON.parse(action.payload) as IUserData
        return {
          ...state,
          userID: userData.userID,
          applications: userData.applications,
          initialApplicationsLoaded: true,
          isWritingDraft: false
        }
      }
      return {
        ...state,
        initialApplicationsLoaded: true
      }
    case ENQUEUE_DOWNLOAD_APPLICATION:
      const { applications } = state
      const { application, client } = action.payload
      const downloadIsRunning = applications.some(
        application =>
          application.downloadStatus === DOWNLOAD_STATUS.DOWNLOADING
      )

      const applicationIndex = applications.findIndex(
        app => application.id === app.id
      )
      let newApplicationsAfterStartingDownload = Array.from(applications)

      // Download is running, so enqueue
      if (downloadIsRunning) {
        // Application is not in list
        if (applicationIndex === -1) {
          newApplicationsAfterStartingDownload = applications.concat([
            application
          ])
        } else {
          // Application is failed before, just make it ready to download
          newApplicationsAfterStartingDownload[applicationIndex] = application
        }

        // Download is running just return the state
        return {
          ...state,
          applications: newApplicationsAfterStartingDownload
        }
      }
      // Download is not running
      else {
        // Application is not in list, so push it
        if (applicationIndex === -1) {
          newApplicationsAfterStartingDownload = applications.concat([
            {
              ...application,
              downloadStatus: DOWNLOAD_STATUS.DOWNLOADING
            }
          ])
        }
        // Application is in list make it downloading
        else {
          newApplicationsAfterStartingDownload[applicationIndex] = {
            ...application,
            downloadStatus: DOWNLOAD_STATUS.DOWNLOADING
          }
        }
      }

      const newState = {
        ...state,
        applications: newApplicationsAfterStartingDownload
      }

      const { request, requestArgs } = createRequestForApplication(
        application,
        client
      ) as any

      return loop(
        newState,
        Cmd.run<IDownloadApplicationFail, IDownloadApplicationSuccess>(
          requestWithStateWrapper,
          {
            args: [
              request({ ...requestArgs, fetchPolicy: 'no-cache' }),
              Cmd.getState,
              client
            ],
            successActionCreator: downloadApplicationSuccess,
            failActionCreator: err =>
              downloadApplicationFail(
                err,
                {
                  ...application,
                  downloadStatus: DOWNLOAD_STATUS.DOWNLOADING
                },
                client
              )
          }
        )
      )
    case DOWNLOAD_APPLICATION_SUCCESS:
      const { queryData, form, client: clientFromSuccess } = action.payload

      const downloadingApplicationIndex = state.applications.findIndex(
        application =>
          application.downloadStatus === DOWNLOAD_STATUS.DOWNLOADING
      )
      const newApplicationsAfterDownload = Array.from(state.applications)
      const downloadingApplication =
        newApplicationsAfterDownload[downloadingApplicationIndex]

      const dataKey = getDataKey(downloadingApplication)
      const eventData = queryData.data[dataKey as string]
      const transData: IFormData = gqlToDraftTransformer(
        form[downloadingApplication.event],
        eventData
      )
      const downloadedAppStatus: string =
        (eventData &&
          eventData.registration &&
          eventData.registration.status &&
          eventData.registration.status[0].type) ||
        ''
      newApplicationsAfterDownload[
        downloadingApplicationIndex
      ] = createReviewApplication(
        downloadingApplication.id,
        transData,
        downloadingApplication.event,
        downloadedAppStatus
      )
      newApplicationsAfterDownload[downloadingApplicationIndex].downloadStatus =
        DOWNLOAD_STATUS.DOWNLOADED

      const newStateAfterDownload = {
        ...state,
        applications: newApplicationsAfterDownload
      }

      // Check if there is more to download
      const downloadQueueInprogress = state.applications.filter(
        application =>
          application.downloadStatus === DOWNLOAD_STATUS.READY_TO_DOWNLOAD
      )

      // If not then, write to IndexedDB and return state
      if (!downloadQueueInprogress.length) {
        return loop(
          newStateAfterDownload,
          Cmd.run(writeApplicationByUser, {
            args: [
              Cmd.getState,
              state.userID,
              newApplicationsAfterDownload[downloadingApplicationIndex]
            ],
            failActionCreator: err =>
              downloadApplicationFail(
                err,
                newApplicationsAfterDownload[downloadingApplicationIndex],
                clientFromSuccess
              )
          })
        )
      }

      const applicationToDownload = downloadQueueInprogress[0]
      applicationToDownload.downloadStatus = DOWNLOAD_STATUS.DOWNLOADING
      const {
        request: nextRequest,
        requestArgs: nextRequestArgs
      } = createRequestForApplication(
        applicationToDownload,
        clientFromSuccess
      ) as any

      // Return state, write to indexedDB and download the next ready to download application, all in sequence
      return loop(
        newStateAfterDownload,
        Cmd.list(
          [
            Cmd.run(writeApplicationByUser, {
              args: [
                Cmd.getState,
                state.userID,
                newApplicationsAfterDownload[downloadingApplicationIndex]
              ],
              failActionCreator: downloadApplicationFail
            }),
            Cmd.run<IDownloadApplicationFail, IDownloadApplicationSuccess>(
              requestWithStateWrapper,
              {
                args: [
                  nextRequest({ ...nextRequestArgs, fetchPolicy: 'no-cache' }),
                  Cmd.getState,
                  clientFromSuccess
                ],
                successActionCreator: downloadApplicationSuccess,
                failActionCreator: err =>
                  downloadApplicationFail(
                    err,
                    newApplicationsAfterDownload[downloadingApplicationIndex],
                    clientFromSuccess
                  )
              }
            )
          ],
          { sequence: true }
        )
      )

    case DOWNLOAD_APPLICATION_FAIL:
      const {
        application: erroredApplication,
        error,
        client: clientFromFail
      } = action.payload
      erroredApplication.downloadRetryAttempt =
        (erroredApplication.downloadRetryAttempt || 0) + 1

      const {
        request: retryRequest,
        requestArgs: retryRequestArgs
      } = createRequestForApplication(erroredApplication, clientFromFail) as any

      const applicationsAfterError = Array.from(state.applications)
      const erroredApplicationIndex = applicationsAfterError.findIndex(
        application =>
          application.downloadStatus === DOWNLOAD_STATUS.DOWNLOADING
      )

      applicationsAfterError[erroredApplicationIndex] = erroredApplication

      // Retry download until limit reached
      if (
        erroredApplication.downloadRetryAttempt < DOWNLOAD_MAX_RETRY_ATTEMPT
      ) {
        return loop(
          {
            ...state,
            applications: applicationsAfterError
          },
          Cmd.run<IDownloadApplicationFail, IDownloadApplicationSuccess>(
            requestWithStateWrapper,
            {
              args: [
                retryRequest({ ...retryRequestArgs, fetchPolicy: 'no-cache' }),
                Cmd.getState,
                clientFromFail
              ],
              successActionCreator: downloadApplicationSuccess,
              failActionCreator: err =>
                downloadApplicationFail(err, erroredApplication, clientFromFail)
            }
          )
        )
      }

      let status
      if (error.networkError) {
        status = DOWNLOAD_STATUS.FAILED_NETWORK
      } else {
        status = DOWNLOAD_STATUS.FAILED
      }

      erroredApplication.downloadStatus = status

      applicationsAfterError[erroredApplicationIndex] = erroredApplication

      const downloadQueueFollowing = state.applications.filter(
        application =>
          application.downloadStatus === DOWNLOAD_STATUS.READY_TO_DOWNLOAD
      )

      // If nothing more to download, return the state and write the applications
      if (!downloadQueueFollowing.length) {
        return loop(
          {
            ...state,
            applications: applicationsAfterError
          },
          Cmd.run(writeApplicationByUser, {
            args: [Cmd.getState, state.userID, erroredApplication]
          })
        )
      }

      // If there are more to download in queue, start the next request
      const nextApplication = downloadQueueFollowing[0]
      const {
        request: nextApplicationRequest,
        requestArgs: nextApplicationRequestArgs
      } = createRequestForApplication(nextApplication, clientFromFail) as any
      return loop(
        {
          ...state,
          applications: applicationsAfterError
        },
        Cmd.list(
          [
            Cmd.run(writeApplicationByUser, {
              args: [Cmd.getState, state.userID, erroredApplication]
            }),
            Cmd.run(requestWithStateWrapper, {
              args: [
                nextApplicationRequest({
                  ...nextApplicationRequestArgs,
                  fetchPolicy: 'no-cache'
                }),
                Cmd.getState,
                clientFromFail
              ],
              successActionCreator: downloadApplicationSuccess,
              failActionCreator: err =>
                downloadApplicationFail(err, nextApplication, clientFromFail)
            })
          ],
          { sequence: true }
        )
      )

    case UPDATE_FIELD_AGENT_DECLARED_APPLICATIONS:
      return loop(
        state,
        Cmd.run(updateFieldAgentDeclaredApplicationsByUser, {
          successActionCreator: updateFieldAgentDeclaredApplicationsSuccessActionCreator,
          failActionCreator: updateFieldAgentDeclaredApplicationsFailActionCreator,
          args: [Cmd.getState]
        })
      )

    case UPDATE_FIELD_AGENT_DECLARED_APPLICATIONS_SUCCESS:
      if (action.payload) {
        const userData = JSON.parse(action.payload) as IUserData

        return {
          ...state,
          applications: userData.applications
        }
      }
      return state

    default:
      return state
  }
}

export const registrarWorkqueueReducer: LoopReducer<WorkqueueState, Action> = (
  state: WorkqueueState = workqueueInitialState,
  action: Action
): WorkqueueState | Loop<WorkqueueState, Action> => {
  switch (action.type) {
    case UPDATE_REGISTRAR_WORKQUEUE:
      return loop(
        {
          workqueue: {
            ...state.workqueue,
            loading: true
          }
        },
        Cmd.run(writeRegistrarWorkqueueByUser, {
          successActionCreator: updateRegistrarWorkqueueSuccessActionCreator,
          failActionCreator: updateRegistrarWorkqueueFailActionCreator,
          args: [Cmd.getState, action.payload]
        })
      )

    case UPDATE_REGISTRAR_WORKQUEUE_SUCCESS:
      if (action.payload) {
        const workqueue = JSON.parse(action.payload) as IWorkqueue

        return {
          workqueue
        }
      }
      return state

    default:
      return state
  }
}

export function filterProcessingApplications(
  data: GQLEventSearchResultSet,
  processingApplicationIds: string[]
): GQLEventSearchResultSet {
  if (!data.results) {
    return data
  }

  const filteredResults = data.results.filter(result => {
    if (result === null) {
      return false
    }

    return !processingApplicationIds.includes(result.id)
  })
  const filteredTotal =
    (data.totalItems || 0) - (data.results.length - filteredResults.length)

  return {
    results: filteredResults,
    totalItems: filteredTotal
  }
}

export function filterProcessingApplicationsFromQuery(
  queryData: IQueryData,
  storedApplications: IApplication[]
): IQueryData {
  const processingApplicationIds = storedApplications
    .filter(
      application =>
        application.submissionStatus &&
        processingStates.includes(
          application.submissionStatus as SUBMISSION_STATUS
        )
    )
    .map(application => application.id)

  return {
    inProgressTab: filterProcessingApplications(
      queryData.inProgressTab,
      processingApplicationIds
    ),
    notificationTab: filterProcessingApplications(
      queryData.notificationTab,
      processingApplicationIds
    ),
    reviewTab: filterProcessingApplications(
      queryData.reviewTab,
      processingApplicationIds
    ),
    rejectTab: filterProcessingApplications(
      queryData.rejectTab,
      processingApplicationIds
    ),
    approvalTab: filterProcessingApplications(
      queryData.approvalTab,
      processingApplicationIds
    ),
    printTab: filterProcessingApplications(
      queryData.printTab,
      processingApplicationIds
    ),
    externalValidationTab: filterProcessingApplications(
      queryData.externalValidationTab,
      processingApplicationIds
    )
  }
}
