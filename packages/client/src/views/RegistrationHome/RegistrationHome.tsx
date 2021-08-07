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
  filterProcessingApplicationsFromQuery,
  IApplication,
  IWorkqueue,
  SUBMISSION_STATUS,
  updateRegistrarWorkqueue
} from '@client/applications'
import { Header } from '@client/components/interface/Header/Header'
import { IViewHeadingProps } from '@client/components/ViewHeading'
import { messages as certificateMessage } from '@client/i18n/messages/views/certificate'
import { messages } from '@client/i18n/messages/views/registrarHome'
import {
  goToEvents,
  goToPage,
  goToPrintCertificate,
  goToRegistrarHomeTab,
  goToReviewDuplicate
} from '@client/navigation'
import { getScope, getUserDetails } from '@client/profile/profileSelectors'
import { IStoreState } from '@client/store'
import styled, { ITheme, withTheme } from '@client/styledComponents'
import { Scope } from '@client/utils/authUtils'
import { getUserLocation } from '@client/utils/userUtils'
import NotificationToast from '@client/views/RegistrationHome/NotificationToast'
import {
  Button,
  FloatingActionButton,
  IButtonProps,
  ICON_ALIGNMENT
} from '@opencrvs/components/lib/buttons'
import {
  PlusTransparentWhite,
  StatusGray,
  StatusGreen,
  StatusOrange,
  StatusProgress,
  StatusRejected
} from '@opencrvs/components/lib/icons'
import { PAGE_TRANSITIONS_ENTER_TIME } from '@client/utils/constants'
import {
  FloatingNotification,
  ISearchInputProps,
  NOTIFICATION_TYPE,
  Spinner,
  TopBar
} from '@opencrvs/components/lib/interface'
import { GQLEventSearchResultSet } from '@opencrvs/gateway/src/graphql/schema'
import ApolloClient from 'apollo-client'
import * as React from 'react'
import { injectIntl, WrappedComponentProps as IntlShapeProps } from 'react-intl'
import { connect } from 'react-redux'
import { RouteComponentProps } from 'react-router'
import { Dispatch } from 'redux'
import { ApprovalTab } from './tabs/approvals/approvalTab'
import { InProgressTab } from './tabs/inProgress/inProgressTab'
import { PrintTab } from './tabs/print/printTab'
import { RejectTab } from './tabs/reject/rejectTab'
import { ReviewTab } from './tabs/review/reviewTab'
import { StatusWaitingValidation } from '@opencrvs/components/lib/icons/StatusWaitingValidation'
import { ExternalValidationTab } from './tabs/externalValidation/externalValidationTab'

export interface IProps extends IButtonProps {
  active?: boolean
  disabled?: boolean
  id: string
}

export interface IQueryData {
  inProgressTab: GQLEventSearchResultSet
  notificationTab: GQLEventSearchResultSet
  reviewTab: GQLEventSearchResultSet
  rejectTab: GQLEventSearchResultSet
  approvalTab: GQLEventSearchResultSet
  printTab: GQLEventSearchResultSet
  externalValidationTab: GQLEventSearchResultSet
}

export const IconTab = styled(Button)<IProps>`
  color: ${({ theme }) => theme.colors.copy};
  ${({ theme }) => theme.fonts.subtitleStyle};
  padding-left: 0;
  padding-right: 0;
  border-radius: 0;
  flex-shrink: 0;
  outline: none;
  margin-left: 16px;
  @media (max-width: ${({ theme }) => theme.grid.breakpoints.md}px) {
    margin-left: 8px;
  }
  ${({ active }) =>
    active
      ? 'border-bottom: 3px solid #5E93ED'
      : 'border-bottom: 3px solid transparent'};
  & > div {
    padding: 0 8px;
  }
  :first-child > div {
    position: relative;
    padding-left: 0;
  }
  & div > div {
    margin-right: 8px;
  }
  &:focus {
    outline: none;
    background: ${({ theme }) => theme.colors.focus};
    color: ${({ theme }) => theme.colors.copy};
  }
  &:not([data-focus-visible-added]) {
    background: transparent;
    outline: none;
    color: ${({ theme }) => theme.colors.copy};
  }
`
export const StyledSpinner = styled(Spinner)`
  margin: 20% auto;
`
export const ErrorText = styled.div`
  color: ${({ theme }) => theme.colors.error};
  ${({ theme }) => theme.fonts.bodyStyle};
  text-align: center;
  margin-top: 100px;
`
const FABContainer = styled.div`
  position: fixed;
  right: 40px;
  bottom: 55px;
  @media (min-width: ${({ theme }) => theme.grid.breakpoints.lg}px) {
    display: none;
  }
`

interface IBaseRegistrationHomeProps {
  theme: ITheme
  language: string
  scope: Scope | null
  goToPage: typeof goToPage
  goToRegistrarHomeTab: typeof goToRegistrarHomeTab
  goToReviewDuplicate: typeof goToReviewDuplicate
  goToPrintCertificate: typeof goToPrintCertificate
  goToEvents: typeof goToEvents
  updateRegistrarWorkqueue: typeof updateRegistrarWorkqueue
  registrarLocationId: string
  tabId: string
  selectorId: string
  drafts: IApplication[]
  applications: IApplication[]
  workqueue: IWorkqueue
  storedApplications: IApplication[]
  client: ApolloClient<{}>
  dispatch: Dispatch
  reviewStatuses: string[]
}

interface IRegistrationHomeState {
  progressCurrentPage: number
  reviewCurrentPage: number
  updatesCurrentPage: number
  approvalCurrentPage: number
  printCurrentPage: number
  externalValidationCurrentPage: number
  showCertificateToast: boolean
}

type IRegistrationHomeProps = IntlShapeProps &
  IViewHeadingProps &
  ISearchInputProps &
  IBaseRegistrationHomeProps

const TAB_ID = {
  inProgress: 'progress',
  readyForReview: 'review',
  sentForUpdates: 'updates',
  sentForApproval: 'approvals',
  readyForPrint: 'print',
  externalValidation: 'waitingValidation'
}

export const EVENT_STATUS = {
  IN_PROGRESS: 'IN_PROGRESS',
  DECLARED: 'DECLARED',
  VALIDATED: 'VALIDATED',
  REGISTERED: 'REGISTERED',
  REJECTED: 'REJECTED',
  WAITING_VALIDATION: 'WAITING_VALIDATION'
}
export class RegistrationHomeView extends React.Component<
  IRegistrationHomeProps,
  IRegistrationHomeState
> {
  pageSize = 10
  showPaginated = false
  interval: any = undefined
  constructor(props: IRegistrationHomeProps) {
    super(props)
    this.state = {
      progressCurrentPage: 1,
      reviewCurrentPage: 1,
      updatesCurrentPage: 1,
      approvalCurrentPage: 1,
      printCurrentPage: 1,
      externalValidationCurrentPage: 1,
      showCertificateToast: Boolean(
        this.props.applications.filter(
          item => item.submissionStatus === SUBMISSION_STATUS.READY_TO_CERTIFY
        ).length
      )
    }
  }

  syncWorkqueue() {
    this.props.updateRegistrarWorkqueue(
      this.state.progressCurrentPage * this.pageSize,
      this.state.reviewCurrentPage * this.pageSize,
      this.state.updatesCurrentPage * this.pageSize,
      this.state.approvalCurrentPage * this.pageSize,
      this.state.externalValidationCurrentPage * this.pageSize,
      this.state.printCurrentPage * this.pageSize,
      0,
      0,
      0,
      0,
      0,
      0
    )
  }

  componentDidMount() {
    setTimeout(() => this.syncWorkqueue(), PAGE_TRANSITIONS_ENTER_TIME)
    this.interval = setInterval(() => {
      this.syncWorkqueue()
    }, 300000)
  }

  componentWillUnmount() {
    clearInterval(this.interval)
  }

  componentDidUpdate(
    prevProps: IRegistrationHomeProps,
    prevState: IRegistrationHomeState
  ) {
    if (prevProps.tabId !== this.props.tabId) {
      this.setState({
        progressCurrentPage: 1,
        reviewCurrentPage: 1,
        updatesCurrentPage: 1,
        approvalCurrentPage: 1,
        printCurrentPage: 1
      })
      this.syncWorkqueue()
    }
  }

  userHasRegisterScope() {
    return this.props.scope && this.props.scope.includes('register')
  }

  userHasValidateScope() {
    return this.props.scope && this.props.scope.includes('validate')
  }

  subtractApplicationsWithStatus(count: number, status: string[]) {
    const outboxCount = this.props.storedApplications.filter(
      app => app.submissionStatus && status.includes(app.submissionStatus)
    ).length
    return count - outboxCount
  }

  onPageChange = (newPageNumber: number) => {
    switch (this.props.tabId) {
      case TAB_ID.inProgress:
        this.setState({ progressCurrentPage: newPageNumber }, () => {
          this.syncWorkqueue()
        })
        break
      case TAB_ID.readyForReview:
        this.setState({ reviewCurrentPage: newPageNumber }, () => {
          this.syncWorkqueue()
        })
        break
      case TAB_ID.sentForUpdates:
        this.setState({ updatesCurrentPage: newPageNumber }, () => {
          this.syncWorkqueue()
        })
        break
      case TAB_ID.sentForApproval:
        this.setState({ approvalCurrentPage: newPageNumber }, () => {
          this.syncWorkqueue()
        })
        break
      case TAB_ID.readyForPrint:
        this.setState({ printCurrentPage: newPageNumber }, () => {
          this.syncWorkqueue()
        })
        break
      case TAB_ID.externalValidation:
        this.setState(
          { externalValidationCurrentPage: newPageNumber },
          this.syncWorkqueue
        )
        break
      default:
        throw new Error(`Unknown tab id when changing page ${this.props.tabId}`)
    }
  }

  getData = (
    progressCurrentPage: number,
    reviewCurrentPage: number,
    updatesCurrentPage: number,
    approvalCurrentPage: number,
    printCurrentPage: number,
    externalValidationCurrentPage: number
  ) => {
    const {
      workqueue,
      intl,
      tabId,
      drafts,
      selectorId,
      registrarLocationId,
      storedApplications
    } = this.props
    const { loading, error, data, initialSyncDone } = workqueue
    const filteredData = filterProcessingApplicationsFromQuery(
      data,
      storedApplications
    )

    return (
      <>
        <TopBar>
          <IconTab
            id={`tab_${TAB_ID.inProgress}`}
            key={TAB_ID.inProgress}
            active={tabId === TAB_ID.inProgress}
            align={ICON_ALIGNMENT.LEFT}
            icon={() => <StatusProgress />}
            onClick={() => this.props.goToRegistrarHomeTab(TAB_ID.inProgress)}
          >
            {intl.formatMessage(messages.inProgress)} (
            {!initialSyncDone
              ? '?'
              : drafts.filter(
                  draft =>
                    draft.submissionStatus ===
                    SUBMISSION_STATUS[SUBMISSION_STATUS.DRAFT]
                ).length +
                (filteredData.inProgressTab.totalItems || 0) +
                (filteredData.notificationTab.totalItems || 0)}
            )
          </IconTab>
          <IconTab
            id={`tab_${TAB_ID.readyForReview}`}
            key={TAB_ID.readyForReview}
            active={tabId === TAB_ID.readyForReview}
            align={ICON_ALIGNMENT.LEFT}
            icon={() => <StatusOrange />}
            onClick={() =>
              this.props.goToRegistrarHomeTab(TAB_ID.readyForReview)
            }
          >
            {intl.formatMessage(messages.readyForReview)} (
            {!initialSyncDone ? '?' : filteredData.reviewTab.totalItems})
          </IconTab>
          <IconTab
            id={`tab_${TAB_ID.sentForUpdates}`}
            key={TAB_ID.sentForUpdates}
            active={tabId === TAB_ID.sentForUpdates}
            align={ICON_ALIGNMENT.LEFT}
            icon={() => <StatusRejected />}
            onClick={() =>
              this.props.goToRegistrarHomeTab(TAB_ID.sentForUpdates)
            }
          >
            {intl.formatMessage(messages.sentForUpdates)} (
            {!initialSyncDone ? '?' : filteredData.rejectTab.totalItems})
          </IconTab>
          {this.userHasValidateScope() && (
            <IconTab
              id={`tab_${TAB_ID.sentForApproval}`}
              key={TAB_ID.sentForApproval}
              active={tabId === TAB_ID.sentForApproval}
              align={ICON_ALIGNMENT.LEFT}
              icon={() => <StatusGray />}
              onClick={() =>
                this.props.goToRegistrarHomeTab(TAB_ID.sentForApproval)
              }
            >
              {intl.formatMessage(messages.sentForApprovals)} (
              {!initialSyncDone ? '?' : filteredData.approvalTab.totalItems})
            </IconTab>
          )}
          {window.config.EXTERNAL_VALIDATION_WORKQUEUE && (
            <IconTab
              id={`tab_${TAB_ID.externalValidation}`}
              key={TAB_ID.externalValidation}
              active={tabId === TAB_ID.externalValidation}
              align={ICON_ALIGNMENT.LEFT}
              icon={() => <StatusWaitingValidation />}
              onClick={() =>
                this.props.goToRegistrarHomeTab(TAB_ID.externalValidation)
              }
            >
              {intl.formatMessage(messages.waitingForExternalValidation)} (
              {!initialSyncDone
                ? '?'
                : filteredData.externalValidationTab.totalItems}
              )
            </IconTab>
          )}
          <IconTab
            id={`tab_${TAB_ID.readyForPrint}`}
            key={TAB_ID.readyForPrint}
            active={tabId === TAB_ID.readyForPrint}
            align={ICON_ALIGNMENT.LEFT}
            icon={() => <StatusGreen />}
            onClick={() =>
              this.props.goToRegistrarHomeTab(TAB_ID.readyForPrint)
            }
          >
            {intl.formatMessage(messages.readyToPrint)} (
            {!initialSyncDone ? '?' : filteredData.printTab.totalItems})
          </IconTab>
        </TopBar>
        {tabId === TAB_ID.inProgress && (
          <InProgressTab
            drafts={drafts}
            selectorId={selectorId}
            registrarLocationId={registrarLocationId}
            queryData={{
              inProgressData: filteredData.inProgressTab,
              notificationData: filteredData.notificationTab
            }}
            showPaginated={this.showPaginated}
            page={progressCurrentPage}
            onPageChange={this.onPageChange}
            loading={loading}
            error={error}
          />
        )}
        {tabId === TAB_ID.readyForReview && (
          <ReviewTab
            registrarLocationId={registrarLocationId}
            queryData={{
              data: filteredData.reviewTab
            }}
            showPaginated={this.showPaginated}
            page={reviewCurrentPage}
            onPageChange={this.onPageChange}
            loading={loading}
            error={error}
          />
        )}
        {tabId === TAB_ID.sentForUpdates && (
          <RejectTab
            registrarLocationId={registrarLocationId}
            queryData={{
              data: filteredData.rejectTab
            }}
            showPaginated={this.showPaginated}
            page={updatesCurrentPage}
            onPageChange={this.onPageChange}
            loading={loading}
            error={error}
          />
        )}

        {tabId === TAB_ID.externalValidation &&
          window.config.EXTERNAL_VALIDATION_WORKQUEUE && (
            <ExternalValidationTab
              registrarLocationId={registrarLocationId}
              queryData={{
                data: filteredData.externalValidationTab
              }}
              showPaginated={this.showPaginated}
              page={externalValidationCurrentPage}
              onPageChange={this.onPageChange}
              loading={loading}
              error={error}
            />
          )}
        {tabId === TAB_ID.sentForApproval && (
          <ApprovalTab
            registrarLocationId={registrarLocationId}
            queryData={{
              data: filteredData.approvalTab
            }}
            showPaginated={this.showPaginated}
            page={approvalCurrentPage}
            onPageChange={this.onPageChange}
            loading={loading}
            error={error}
          />
        )}
        {tabId === TAB_ID.readyForPrint && (
          <PrintTab
            registrarLocationId={registrarLocationId}
            queryData={{
              data: filteredData.printTab
            }}
            showPaginated={this.showPaginated}
            page={printCurrentPage}
            onPageChange={this.onPageChange}
            loading={loading}
            error={error}
          />
        )}
      </>
    )
  }

  render() {
    const { intl } = this.props
    const {
      progressCurrentPage,
      reviewCurrentPage,
      updatesCurrentPage,
      approvalCurrentPage,
      printCurrentPage,
      externalValidationCurrentPage
    } = this.state

    return (
      <>
        <Header />

        {this.getData(
          progressCurrentPage,
          reviewCurrentPage,
          updatesCurrentPage,
          approvalCurrentPage,
          printCurrentPage,
          externalValidationCurrentPage
        )}

        <FABContainer>
          <FloatingActionButton
            id="new_event_declaration"
            onClick={this.props.goToEvents}
            icon={() => <PlusTransparentWhite />}
          />
        </FABContainer>
        <NotificationToast showPaginated={this.showPaginated} />

        {this.state.showCertificateToast && (
          <FloatingNotification
            id="print-cert-notification"
            type={NOTIFICATION_TYPE.SUCCESS}
            show={this.state.showCertificateToast}
            callback={() => {
              this.setState({ showCertificateToast: false })
            }}
          >
            {intl.formatMessage(certificateMessage.toastMessage)}
          </FloatingNotification>
        )}
      </>
    )
  }
}

function mapStateToProps(
  state: IStoreState,
  props: RouteComponentProps<{ tabId: string; selectorId?: string }>
) {
  const { match } = props
  const userDetails = getUserDetails(state)
  const registrarLocationId =
    (userDetails && getUserLocation(userDetails).id) || ''
  const scope = getScope(state)

  return {
    applications: state.applicationsState.applications,
    workqueue: state.workqueueState.workqueue,
    language: state.i18n.language,
    scope,
    registrarLocationId,
    tabId: (match && match.params && match.params.tabId) || 'review',
    selectorId: (match && match.params && match.params.selectorId) || '',
    storedApplications: state.applicationsState.applications,
    drafts:
      (state.applicationsState.applications &&
        state.applicationsState.applications.filter(
          (application: IApplication) =>
            application.submissionStatus ===
            SUBMISSION_STATUS[SUBMISSION_STATUS.DRAFT]
        )) ||
      []
  }
}

export const RegistrationHome = connect(mapStateToProps, {
  goToEvents,
  goToPage,
  goToRegistrarHomeTab,
  goToReviewDuplicate,
  goToPrintCertificate,
  updateRegistrarWorkqueue
})(injectIntl(withTheme(RegistrationHomeView)))
