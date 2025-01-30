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
import {
  DOWNLOAD_STATUS,
  IDeclaration,
  SUBMISSION_STATUS,
  getProcessingDeclarationIds
} from '@client/declarations'
import { DownloadButton } from '@client/components/interface/DownloadButton'
import { Header } from '@client/components/Header/Header'
import { Query } from '@client/components/Query'
import { DownloadAction } from '@client/forms'
import {
  buttonMessages,
  constantsMessages,
  dynamicConstantsMessages,
  errorMessages
} from '@client/i18n/messages'
import { messages as registrarHomeMessages } from '@client/i18n/messages/views/registrarHome'
import { messages as rejectMessages } from '@client/i18n/messages/views/reject'
import { messages } from '@client/i18n/messages/views/search'
import {
  goToDeclarationRecordAudit,
  goToEvents as goToEventsAction,
  goToIssueCertificate as goToIssueCertificateAction,
  goToPage as goToPageAction,
  goToPrintCertificate as goToPrintCertificateAction
} from '@client/navigation'
import {
  REVIEW_CORRECTION,
  REVIEW_EVENT_PARENT_FORM_PAGE
} from '@client/navigation/routes'
import { getScope, getUserDetails } from '@client/profile/profileSelectors'
import { SEARCH_EVENTS } from '@client/search/queries'
import { transformData } from '@client/search/transformer'
import { IStoreState } from '@client/store'
import styled, { withTheme } from 'styled-components'
import { ITheme } from '@opencrvs/components/lib/theme'
import { Scope } from '@client/utils/authUtils'
import {
  BRN_DRN_TEXT,
  EMAIL,
  NAME_TEXT,
  NATIONAL_ID_TEXT,
  PHONE_TEXT,
  SEARCH_RESULT_SORT,
  TRACKING_ID_TEXT
} from '@client/utils/constants'
import { getUserLocation, UserDetails } from '@client/utils/userUtils'
import { SearchEventsQuery, SystemRoleType } from '@client/utils/gateway'

import {
  ColumnContentAlignment,
  Workqueue,
  IAction,
  COLUMNS
} from '@opencrvs/components/lib/Workqueue'
import { Frame } from '@opencrvs/components/lib/Frame'

import * as React from 'react'
import { injectIntl, WrappedComponentProps as IntlShapeProps } from 'react-intl'
import { connect } from 'react-redux'
import { RouteComponentProps } from 'react-router'
import ReactTooltip from 'react-tooltip'
import { convertToMSISDN } from '@client/forms/utils'
import { formattedDuration } from '@client/utils/date-formatting'
import { Navigation } from '@client/components/interface/Navigation'
import {
  IconWithName,
  IconWithNameEvent,
  NoNameContainer,
  NameContainer
} from '@client/views/OfficeHome/components'
import { WQContentWrapper } from '@client/views/OfficeHome/WQContentWrapper'
import { LoadingIndicator } from '@client/views/OfficeHome/LoadingIndicator'

const ErrorText = styled.div`
  color: ${({ theme }) => theme.colors.negative};
  ${({ theme }) => theme.fonts.reg16};
  text-align: center;
  margin-top: 100px;
`

const ToolTipContainer = styled.span`
  text-align: center;
`

export function getRejectionReasonDisplayValue(reason: string) {
  switch (reason.toLowerCase()) {
    case 'duplicate':
      return rejectMessages.rejectionReasonDuplicate
    case 'misspelling':
      return rejectMessages.rejectionReasonMisspelling
    case 'missing_supporting_doc':
      return rejectMessages.rejectionReasonMissingSupportingDoc
    case 'other':
      return rejectMessages.rejectionReasonOther
    default:
      return rejectMessages.rejectionReasonOther
  }
}

interface ISerachInputCustomProps {
  searchValue?: string
  error?: boolean
  touched?: boolean
  focusInput?: boolean
  buttonLabel: string
  onSearchTextChange?: (searchText: string) => void
  onSubmit: (searchText: string) => any
}

export type ISearchInputProps = ISerachInputCustomProps &
  React.InputHTMLAttributes<HTMLInputElement>

interface IBaseSearchResultProps {
  theme: ITheme
  language: string
  scope: Scope | null
  goToEvents: typeof goToEventsAction
  userDetails: UserDetails | null
  outboxDeclarations: IDeclaration[]
  goToPage: typeof goToPageAction
  goToPrintCertificate: typeof goToPrintCertificateAction
  goToIssueCertificate: typeof goToIssueCertificateAction
  goToDeclarationRecordAudit: typeof goToDeclarationRecordAudit
}

interface IMatchParams {
  searchText: string
  searchType: string
}

type ISearchResultProps = IntlShapeProps &
  ISearchInputProps &
  IBaseSearchResultProps &
  RouteComponentProps<IMatchParams>

interface ISearchResultState {
  width: number
}

type QueryData = SearchEventsQuery['searchEvents']

class SearchResultView extends React.Component<
  ISearchResultProps,
  ISearchResultState
> {
  pageSize = 10
  showPaginated = false
  constructor(props: ISearchResultProps) {
    super(props)
    this.state = {
      width: window.innerWidth
    }
  }

  componentDidMount() {
    window.addEventListener('resize', this.recordWindowWidth)
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.recordWindowWidth)
  }

  recordWindowWidth = () => {
    this.setState({ width: window.innerWidth })
  }

  getExpandable = () => {
    return this.state.width > this.props.theme.grid.breakpoints.lg
      ? true
      : false
  }

  getColumns = () => {
    if (this.state.width > this.props.theme.grid.breakpoints.lg) {
      return [
        {
          width: 35,
          label: this.props.intl.formatMessage(constantsMessages.name),
          key: COLUMNS.ICON_WITH_NAME
        },
        {
          label: this.props.intl.formatMessage(constantsMessages.event),
          width: 20,
          key: COLUMNS.EVENT
        },
        {
          label: this.props.intl.formatMessage(constantsMessages.eventDate),
          width: 20,
          key: COLUMNS.DATE_OF_EVENT
        },
        {
          width: 25,
          alignment: ColumnContentAlignment.RIGHT,
          key: COLUMNS.ACTIONS,
          isActionColumn: true
        }
      ]
    } else {
      return [
        {
          label: this.props.intl.formatMessage(constantsMessages.name),
          width: 70,
          key: COLUMNS.ICON_WITH_NAME_EVENT
        },
        {
          width: 30,
          alignment: ColumnContentAlignment.RIGHT,
          key: COLUMNS.ACTIONS,
          isActionColumn: true
        }
      ]
    }
  }

  userHasRegisterScope() {
    return this.props.scope && this.props.scope.includes('register')
  }

  userHasValidateScope() {
    return this.props.scope && this.props.scope.includes('validate')
  }

  userHasCertifyScope() {
    return this.props.scope && this.props.scope.includes('certify')
  }

  transformSearchContent = (data: QueryData) => {
    if (!data || !data.results) {
      return []
    }

    const transformedData = transformData(data, this.props.intl)

    const processingDeclarationIds = getProcessingDeclarationIds(
      this.props.outboxDeclarations
    )

    const { match, userDetails } = this.props
    const officeLocationId =
      userDetails?.primaryOffice?.id?.split('-')[0] ?? 'NO OFFICE ID'

    return transformedData
      .filter(
        (_transformeData) =>
          window.config.LIMIT_RECORD_PER_LOCATION
            ? _transformeData.registeredLocationId
                .toUpperCase()
                .includes(officeLocationId.toUpperCase())
            : true // Keep all records if the condition is false
      )
      .filter(({ id }) => !processingDeclarationIds.includes(id))
      .map((reg, index) => {
        const foundDeclaration = this.props.outboxDeclarations.find(
          (declaration) => declaration.id === reg.id
        )
        const actions: IAction[] = []
        const downloadStatus =
          (foundDeclaration && foundDeclaration.downloadStatus) || undefined

        const declarationIsRequestedCorrection =
          reg.declarationStatus === 'REQUESTED_CORRECTION'
        const declarationIsRegistered = reg.declarationStatus === 'REGISTERED'
        const declarationIsCertified = reg.declarationStatus === 'CERTIFIED'
        const declarationIsRejected = reg.declarationStatus === 'REJECTED'
        const declarationIsValidated = reg.declarationStatus === 'VALIDATED'
        const declarationIsInProgress = reg.declarationStatus === 'IN_PROGRESS'
        const declarationIsIssued = reg.declarationStatus === 'ISSUED'
        const isDeclared = reg.declarationStatus === 'DECLARED'
        const declarationIsCorrectionRequested =
          reg.declarationStatus === 'CORRECTION_REQUESTED'
        const isDuplicate =
          reg.duplicates &&
          reg.duplicates.length > 0 &&
          reg.declarationStatus !== SUBMISSION_STATUS.CERTIFIED &&
          reg.declarationStatus !== SUBMISSION_STATUS.REGISTERED
        const { intl, location, userDetails } = this.props
        const search = location.search
        const params = new URLSearchParams(search)
        const [searchText, searchType] = [
          params.get('searchText'),
          params.get('searchType')
        ]
        const isDeclarationReviewableByRegistrar =
          declarationIsRejected ||
          declarationIsValidated ||
          declarationIsCorrectionRequested ||
          isDeclared ||
          declarationIsInProgress

        const isDeclarationReviewableByRegAgent =
          isDeclared || declarationIsInProgress || declarationIsRejected

        const shouldShowReviewButton =
          (this.userHasRegisterScope() && isDeclarationReviewableByRegistrar) ||
          (this.userHasValidateScope() && isDeclarationReviewableByRegAgent)
        if (this.state.width > this.props.theme.grid.breakpoints.lg) {
          if (
            (declarationIsRegistered || declarationIsIssued) &&
            this.userHasCertifyScope()
          ) {
            actions.push({
              label: this.props.intl.formatMessage(buttonMessages.print),
              handler: (
                e: React.MouseEvent<HTMLButtonElement, MouseEvent> | undefined
              ) => {
                e && e.stopPropagation()
                this.props.goToPrintCertificate(reg.id, reg.event)
              },
              disabled: downloadStatus !== DOWNLOAD_STATUS.DOWNLOADED
            })
          } else if (declarationIsCertified && this.userHasCertifyScope()) {
            actions.push({
              label: this.props.intl.formatMessage(buttonMessages.issue),
              handler: (
                e: React.MouseEvent<HTMLButtonElement, MouseEvent> | undefined
              ) => {
                e && e.stopPropagation()
                this.props.goToIssueCertificate(reg.id)
              },
              disabled: downloadStatus !== DOWNLOAD_STATUS.DOWNLOADED
            })
          } else if (shouldShowReviewButton) {
            actions.push({
              label:
                declarationIsRejected || declarationIsInProgress
                  ? this.props.intl.formatMessage(constantsMessages.update)
                  : this.props.intl.formatMessage(constantsMessages.review),
              handler: () =>
                this.props.goToPage(
                  reg.declarationStatus === 'CORRECTION_REQUESTED'
                    ? REVIEW_CORRECTION
                    : REVIEW_EVENT_PARENT_FORM_PAGE,
                  reg.id,
                  'review',
                  reg.event.toLowerCase()
                ),
              disabled: downloadStatus !== DOWNLOAD_STATUS.DOWNLOADED
            })
          }
        }
        actions.push({
          actionComponent: (
            <DownloadButton
              key={reg.id}
              downloadConfigs={{
                event: reg.event,
                compositionId: reg.id,
                assignment: reg.assignment,
                refetchQueries: [
                  {
                    query: SEARCH_EVENTS,
                    variables: {
                      advancedSearchParameters: {
                        trackingId:
                          searchType === TRACKING_ID_TEXT ? searchText : '',
                        nationalId:
                          searchType === NATIONAL_ID_TEXT ? searchText : '',
                        registrationNumber:
                          searchType === BRN_DRN_TEXT ? searchText : '',
                        contactNumber:
                          searchType === PHONE_TEXT
                            ? convertToMSISDN(
                                searchText!,
                                window.config.COUNTRY
                              )
                            : '',
                        name: searchType === NAME_TEXT ? searchText : '',
                        declarationLocationId:
                          userDetails &&
                          ![
                            SystemRoleType.LocalRegistrar,
                            SystemRoleType.NationalRegistrar,
                            SystemRoleType.RegistrationAgent
                          ].includes(userDetails.systemRole)
                            ? getUserLocation(userDetails).id
                            : ''
                      },
                      sort: SEARCH_RESULT_SORT
                    }
                  }
                ],
                action:
                  ((declarationIsRegistered || declarationIsCertified) &&
                    DownloadAction.LOAD_CERTIFICATE_DECLARATION) ||
                  (declarationIsRequestedCorrection &&
                    DownloadAction.LOAD_REQUESTED_CORRECTION_DECLARATION) ||
                  DownloadAction.LOAD_REVIEW_DECLARATION
              }}
              status={downloadStatus as DOWNLOAD_STATUS}
            />
          )
        })
        const event =
          (reg.event &&
            intl.formatMessage(
              dynamicConstantsMessages[reg.event.toLowerCase()]
            )) ||
          ''
        const dateOfEvent =
          reg.dateOfEvent && formattedDuration(new Date(reg.dateOfEvent))
        const isValidatedOnReview =
          reg.declarationStatus === SUBMISSION_STATUS.VALIDATED &&
          this.userHasRegisterScope()
            ? true
            : false
        const isArchived = reg.declarationStatus === SUBMISSION_STATUS.ARCHIVED
        const NameComponent = reg.name ? (
          <NameContainer
            id={`name_${index}`}
            onClick={() =>
              this.props.goToDeclarationRecordAudit('search', reg.id)
            }
          >
            {reg.name}
          </NameContainer>
        ) : (
          <NoNameContainer
            id={`name_${index}`}
            onClick={() =>
              this.props.goToDeclarationRecordAudit('search', reg.id)
            }
          >
            {intl.formatMessage(constantsMessages.noNameProvided)}
          </NoNameContainer>
        )
        return {
          ...reg,
          event,
          name: reg.name && reg.name.toLowerCase(),
          iconWithName: (
            <IconWithName
              status={reg.declarationStatus}
              name={NameComponent}
              isValidatedOnReview={isValidatedOnReview}
              isDuplicate={isDuplicate}
              isArchived={isArchived}
            />
          ),
          iconWithNameEvent: (
            <IconWithNameEvent
              status={reg.declarationStatus}
              name={NameComponent}
              event={event}
              isDuplicate={isDuplicate}
              isValidatedOnReview={isValidatedOnReview}
              isArchived={isArchived}
            />
          ),
          dateOfEvent,
          actions
        }
      })
  }

  render() {
    const { intl, location, userDetails } = this.props
    const search = location.search
    const params = new URLSearchParams(search)
    const [searchText, searchType] = [
      params.get('searchText'),
      params.get('searchType')
    ]
    return (
      <Frame
        header={
          <Header
            searchText={searchText!}
            selectedSearchType={searchType!}
            mobileSearchBar={true}
            enableMenuSelection={false}
          />
        }
        navigation={<Navigation />}
        skipToContentText={intl.formatMessage(
          constantsMessages.skipToMainContent
        )}
      >
        {searchText && searchType && (
          <Query<SearchEventsQuery>
            query={SEARCH_EVENTS}
            variables={{
              advancedSearchParameters: {
                declarationLocationId:
                  userDetails &&
                  ![
                    SystemRoleType.LocalRegistrar,
                    SystemRoleType.NationalRegistrar,
                    SystemRoleType.RegistrationAgent
                  ].includes(userDetails.systemRole)
                    ? getUserLocation(userDetails).id
                    : '',
                trackingId: searchType === TRACKING_ID_TEXT ? searchText : '',
                nationalId: searchType === NATIONAL_ID_TEXT ? searchText : '',
                registrationNumber:
                  searchType === BRN_DRN_TEXT ? searchText : '',
                contactNumber:
                  searchType === PHONE_TEXT
                    ? convertToMSISDN(searchText, window.config.COUNTRY)
                    : '',
                contactEmail: searchType === EMAIL ? searchText : '',
                name: searchType === NAME_TEXT ? searchText : ''
              },
              sort: SEARCH_RESULT_SORT
            }}
            fetchPolicy="cache-and-network"
          >
            {({ loading, error, data }) => {
              const total = loading
                ? -1
                : data?.searchEvents?.results?.length || 0
              return (
                <WQContentWrapper
                  title={intl.formatMessage(messages.searchResultFor, {
                    param: searchText
                  })}
                  isMobileSize={
                    this.state.width < this.props.theme.grid.breakpoints.lg
                  }
                  noResultText={intl.formatMessage(messages.noResultFor, {
                    param: searchText
                  })}
                  noContent={total < 1 && !loading}
                >
                  {loading ? (
                    <div id="search_loader">
                      <LoadingIndicator loading={true} />
                    </div>
                  ) : error ? (
                    <ErrorText id="search-result-error-text">
                      {intl.formatMessage(errorMessages.queryError)}
                    </ErrorText>
                  ) : (
                    data?.searchEvents &&
                    total > 0 && (
                      <>
                        <ReactTooltip id="validateTooltip">
                          <ToolTipContainer>
                            {this.props.intl.formatMessage(
                              registrarHomeMessages.validatedDeclarationTooltipForRegistrar
                            )}
                          </ToolTipContainer>
                        </ReactTooltip>
                        <Workqueue
                          content={this.transformSearchContent(
                            data.searchEvents
                          )}
                          columns={this.getColumns()}
                          noResultText={intl.formatMessage(
                            constantsMessages.noResults
                          )}
                          hideLastBorder={true}
                        />
                      </>
                    )
                  )}
                </WQContentWrapper>
              )
            }}
          </Query>
        )}
      </Frame>
    )
  }
}
export const SearchResult = connect(
  (state: IStoreState) => ({
    language: state.i18n.language,
    scope: getScope(state),
    userDetails: getUserDetails(state),
    outboxDeclarations: state.declarationsState.declarations
  }),
  {
    goToEvents: goToEventsAction,
    goToPage: goToPageAction,
    goToPrintCertificate: goToPrintCertificateAction,
    goToIssueCertificate: goToIssueCertificateAction,
    goToDeclarationRecordAudit
  }
)(injectIntl(withTheme(SearchResultView)))
