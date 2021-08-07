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
import { DateRangePicker } from '@client/components/DateRangePicker'
import { ApplicationStatusWindow } from '@client/components/interface/ApplicationStatusWindow'
import {
  NOTIFICATION_TYPE,
  ToastNotification
} from '@client/components/interface/ToastNotification'
import { Query } from '@client/components/Query'
import { Event } from '@client/forms'
import { buttonMessages, constantsMessages } from '@client/i18n/messages'
import { messages } from '@client/i18n/messages/views/performance'
import { messages as statusMessages } from '@client/i18n/messages/views/registrarHome'
import {
  goToOperationalReport,
  goToPerformanceHome,
  goToPerformanceReport,
  goToRegistrationRates,
  goToWorkflowStatus
} from '@client/navigation'
import { IOfflineData } from '@client/offline/reducer'
import { getOfflineData } from '@client/offline/selectors'
import { IStoreState } from '@client/store'
import styled from '@client/styledComponents'
import { getToken } from '@client/utils/authUtils'
import { generateLocations } from '@client/utils/locationUtils'
import { PerformanceSelect } from '@client/views/SysAdmin/Performance/PerformanceSelect'
import { FETCH_STATUS_WISE_REGISTRATION_COUNT } from '@client/views/SysAdmin/Performance/queries'
import {
  IStatusMapping,
  StatusWiseApplicationCountView
} from '@client/views/SysAdmin/Performance/reports/operational/StatusWiseApplicationCountView'
import {
  ActionContainer,
  FilterContainer,
  getMonthDateRange
} from '@client/views/SysAdmin/Performance/utils'
import { SysAdminContentWrapper } from '@client/views/SysAdmin/SysAdminContentWrapper'
import {
  ICON_ALIGNMENT,
  LinkButton,
  TertiaryButton
} from '@opencrvs/components/lib/buttons'
import { colors } from '@opencrvs/components/lib/colors'
import { Activity } from '@opencrvs/components/lib/icons'
import {
  ISearchLocation,
  ListTable,
  ColumnContentAlignment
} from '@opencrvs/components/lib/interface'
import { ITheme } from '@opencrvs/components/lib/theme'
import {
  GQLApplicationsStartedMetrics,
  GQLEventEstimationMetrics,
  GQLRegistrationCountResult
} from '@opencrvs/gateway/src/graphql/schema'
import { ApolloError } from 'apollo-client'
import moment from 'moment'
import { parse } from 'query-string'
import * as React from 'react'
import { injectIntl, WrappedComponentProps } from 'react-intl'
import { connect } from 'react-redux'
import { RouteComponentProps } from 'react-router'
import { withTheme } from 'styled-components'
import { OPERATIONAL_REPORTS_METRICS } from './metricsQuery'
import { ApplicationsStartedReport } from './reports/operational/ApplicationsStartedReport'
import { RegistrationRatesReport } from './reports/operational/RegistrationRatesReport'

interface IConnectProps {
  offlineLocations: IOfflineData['locations']
}
interface IDispatchProps {
  goToPerformanceHome: typeof goToPerformanceHome
  goToOperationalReport: typeof goToOperationalReport
  goToPerformanceReport: typeof goToPerformanceReport
  goToRegistrationRates: typeof goToRegistrationRates
  goToWorkflowStatus: typeof goToWorkflowStatus
}

interface IMetricsQueryResult {
  getEventEstimationMetrics: GQLEventEstimationMetrics
  getApplicationsStartedMetrics: GQLApplicationsStartedMetrics
  fetchRegistrationCountByStatus: GQLRegistrationCountResult
}
export enum OPERATIONAL_REPORT_SECTION {
  OPERATIONAL = 'OPERATIONAL',
  REPORTS = 'REPORTS'
}

interface ISearchParams {
  sectionId: OPERATIONAL_REPORT_SECTION
  locationId: string
  timeStart: string
  timeEnd: string
}

type Props = WrappedComponentProps &
  RouteComponentProps &
  IConnectProps &
  IDispatchProps & { theme: ITheme }

interface State {
  sectionId: OPERATIONAL_REPORT_SECTION
  selectedLocation: ISearchLocation
  timeStart: moment.Moment
  timeEnd: moment.Moment
  expandStatusWindow: boolean
  statusWindowWidth: number
  mainWindowLeftMargin: number
  mainWindowRightMargin: number
}

const Header = styled.h2`
  color: ${({ theme }) => theme.colors.copy};
  ${({ theme }) => theme.fonts.h2Style};
  margin: 0;
`

const HeaderContainer = styled.div`
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;

  & > :first-child {
    margin-right: 24px;
  }

  & > :nth-child(2) {
    position: relative;
    bottom: 2px;
  }
`

const Container = styled.div`
  margin-bottom: 160px;
`

const MonthlyReportsList = styled.div`
  margin-top: 8px;
`
const DeathReportHolder = styled.div`
  margin-top: 6px;
`

const StatusTitleContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
`

const Title = styled.div`
  ${({ theme }) => theme.fonts.bigBodyBoldStyle}
  margin-left: 8px;
  @media (max-width: ${({ theme }) => theme.grid.breakpoints.md}px) {
    ${({ theme }) => theme.fonts.bodyBoldStyle}
  }
`

const RowLink = styled(LinkButton)`
  padding-right: 15px !important;
`

export const StatusMapping: IStatusMapping = {
  IN_PROGRESS: {
    labelDescriptor: statusMessages.inProgress,
    color: colors.inProgress
  },
  DECLARED: {
    labelDescriptor: statusMessages.readyForReview,
    color: colors.readyForReview
  },
  REJECTED: {
    labelDescriptor: statusMessages.sentForUpdates,
    color: colors.sentForUpdate
  },
  VALIDATED: {
    labelDescriptor: statusMessages.sentForApprovals,
    color: colors.waitingForApproval
  },
  WAITING_VALIDATION: {
    labelDescriptor: statusMessages.sentForExternalValidation,
    color: colors.waitingForExternalValidation
  },
  REGISTERED: {
    labelDescriptor: statusMessages.readyToPrint,
    color: colors.readyToPrint
  },
  CERTIFIED: {
    labelDescriptor: statusMessages.certified,
    color: colors.readyToPrint
  }
}

class OperationalReportComponent extends React.Component<Props, State> {
  static transformPropsToState(props: Props, state?: State) {
    const {
      location: { search }
    } = props
    const { timeStart, timeEnd, locationId, sectionId } = (parse(
      search
    ) as unknown) as ISearchParams
    const searchableLocations = generateLocations(props.offlineLocations)
    const selectedLocation = searchableLocations.find(
      ({ id }) => id === locationId
    ) as ISearchLocation

    return {
      sectionId,
      selectedLocation,
      timeStart: moment(timeStart),
      timeEnd: moment(timeEnd),
      expandStatusWindow: state ? state.expandStatusWindow : false,
      statusWindowWidth: state ? state.statusWindowWidth : 0,
      mainWindowLeftMargin: state ? state.mainWindowLeftMargin : 0,
      mainWindowRightMargin: state ? state.mainWindowRightMargin : 0
    }
  }

  constructor(props: Props) {
    super(props)
    moment.locale(this.props.intl.locale)
    moment.defaultFormat = 'MMMM YYYY'

    this.state = OperationalReportComponent.transformPropsToState(
      props,
      undefined
    )
  }

  static getDerivedStateFromProps(props: Props, state: State) {
    return OperationalReportComponent.transformPropsToState(props, state)
  }

  downloadMonthlyData = (
    monthStart: moment.Moment,
    monthEnd: moment.Moment,
    event: string
  ) => {
    const metricsURL = `${
      window.config.API_GATEWAY_URL
    }export/monthlyPerformanceMetrics?locationId=${
      this.state.selectedLocation.id
    }&timeStart=${monthStart.toISOString()}&timeEnd=${monthEnd.toISOString()}&event=${event}`
    fetch(metricsURL, {
      headers: {
        Authorization: `Bearer ${getToken()}`
      }
    })
      .then(resp => resp.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${monthStart.format('MMMM_YYYY')}_export.zip`
        a.click()
        window.URL.revokeObjectURL(url)
      })
  }

  onChangeLocation = () => {
    this.props.goToPerformanceHome({
      selectedLocation: this.state.selectedLocation
    })
  }

  getTotal(applicationMetrics: GQLApplicationsStartedMetrics): number {
    return (
      applicationMetrics.fieldAgentApplications +
      applicationMetrics.hospitalApplications +
      applicationMetrics.officeApplications
    )
  }

  getContent(eventType: Event) {
    moment.locale(this.props.intl.locale)
    let content = []
    let currentYear = this.state.timeStart.year()
    let currentMonth = this.state.timeStart.month() + 1
    const startMonth =
      this.state.timeStart.month() + this.state.timeStart.year() * 12
    const endMonth = this.state.timeEnd.month() + this.state.timeEnd.year() * 12
    const monthDiff = currentMonth + (endMonth - startMonth)
    while (currentMonth <= monthDiff) {
      const { start, end } = getMonthDateRange(currentYear, currentMonth)
      const title = start.format('MMMM YYYY')
      content.push({
        month: (
          <LinkButton
            onClick={() =>
              this.props.goToPerformanceReport(
                this.state.selectedLocation!,
                eventType,
                start.toDate(),
                end.toDate()
              )
            }
            disabled={!this.state.selectedLocation}
          >
            {title}
          </LinkButton>
        ),
        export: (
          <RowLink
            onClick={() =>
              this.downloadMonthlyData(start, end, eventType.toString())
            }
          >
            CSV
          </RowLink>
        )
      })
      currentMonth++
    }
    return content.reverse()
  }

  getPercentage(
    totalMetrics: GQLApplicationsStartedMetrics,
    value: number
  ): number {
    return Math.round((value / this.getTotal(totalMetrics)) * 100)
  }

  onClickRegistrationRatesDetails = (event: Event, title: string) => {
    const { selectedLocation, timeStart, timeEnd } = this.state
    this.props.goToRegistrationRates(
      event,
      title,
      selectedLocation.id,
      timeStart.toDate(),
      timeEnd.toDate()
    )
  }

  statusButtonClickHandler = () => {
    this.setState({
      ...this.state,
      expandStatusWindow: true,
      statusWindowWidth: 450,
      mainWindowLeftMargin: 10,
      mainWindowRightMargin: 460
    })
  }

  statusWindowCrossClickHandler = () => {
    this.setState({
      ...this.state,
      expandStatusWindow: false,
      statusWindowWidth: 0,
      mainWindowLeftMargin: 0,
      mainWindowRightMargin: 0
    })
  }

  getStatusWindowTitle = () => {
    const { intl, theme } = this.props
    return (
      <StatusTitleContainer>
        <Activity stroke={theme.colors.copy} />{' '}
        <Title>{intl.formatMessage(buttonMessages.status)}</Title>
      </StatusTitleContainer>
    )
  }

  onClickStatusDetails = (status?: keyof IStatusMapping) => {
    const { selectedLocation, sectionId, timeStart, timeEnd } = this.state
    const { id: locationId } = selectedLocation
    this.props.goToWorkflowStatus(
      sectionId,
      locationId,
      timeStart.toDate(),
      timeEnd.toDate(),
      status
    )
  }
  render() {
    const { intl } = this.props

    const {
      selectedLocation,
      sectionId,
      timeStart,
      timeEnd,
      expandStatusWindow,
      statusWindowWidth,
      mainWindowLeftMargin,
      mainWindowRightMargin
    } = this.state
    const { displayLabel: title, id: locationId } = selectedLocation
    return (
      <SysAdminContentWrapper
        marginLeft={mainWindowLeftMargin}
        marginRight={mainWindowRightMargin}
      >
        <Container>
          <HeaderContainer>
            <Header id="header-location-name">{title}</Header>
            <LinkButton
              id="change-location-link"
              onClick={this.onChangeLocation}
            >
              {intl.formatMessage(buttonMessages.change)}
            </LinkButton>
          </HeaderContainer>
          <ActionContainer>
            <FilterContainer id="operational-report-view">
              <PerformanceSelect
                onChange={option => {
                  this.props.goToOperationalReport(
                    selectedLocation.id,
                    option.value as OPERATIONAL_REPORT_SECTION,
                    timeStart.toDate(),
                    timeEnd.toDate()
                  )
                }}
                id="operational-select"
                value={sectionId || OPERATIONAL_REPORT_SECTION.OPERATIONAL}
                options={[
                  {
                    label: intl.formatMessage(messages.operational),
                    value: OPERATIONAL_REPORT_SECTION.OPERATIONAL
                  },
                  {
                    label: intl.formatMessage(messages.reports),
                    value: OPERATIONAL_REPORT_SECTION.REPORTS
                  }
                ]}
              />
              <DateRangePicker
                startDate={timeStart.toDate()}
                endDate={timeEnd.toDate()}
                onDatesChange={({ startDate, endDate }) => {
                  this.props.goToOperationalReport(
                    selectedLocation.id,
                    sectionId,
                    startDate,
                    endDate
                  )
                }}
              />
            </FilterContainer>
            {!expandStatusWindow && (
              <TertiaryButton
                id="btn-status"
                align={ICON_ALIGNMENT.LEFT}
                icon={() => <Activity />}
                onClick={this.statusButtonClickHandler}
              >
                {intl.formatMessage(buttonMessages.status)}
              </TertiaryButton>
            )}
          </ActionContainer>
          {sectionId === OPERATIONAL_REPORT_SECTION.OPERATIONAL && (
            <Query
              query={OPERATIONAL_REPORTS_METRICS}
              variables={{
                timeStart: timeStart.toISOString(),
                timeEnd: timeEnd.toISOString(),
                locationId
              }}
              fetchPolicy="no-cache"
            >
              {({
                loading,
                error,
                data
              }: {
                loading: boolean
                error?: ApolloError
                data?: IMetricsQueryResult
              }) => {
                if (error) {
                  return (
                    <>
                      <RegistrationRatesReport loading={true} />
                      <ApplicationsStartedReport
                        loading={true}
                        locationId={locationId}
                        reportTimeFrom={timeStart}
                        reportTimeTo={timeEnd}
                      />
                      <ToastNotification type={NOTIFICATION_TYPE.ERROR} />
                    </>
                  )
                } else {
                  return (
                    <>
                      <RegistrationRatesReport
                        loading={loading}
                        data={data && data.getEventEstimationMetrics}
                        reportTimeFrom={timeStart.format()}
                        reportTimeTo={timeEnd.format()}
                        onClickEventDetails={
                          this.onClickRegistrationRatesDetails
                        }
                      />
                      <ApplicationsStartedReport
                        loading={loading}
                        locationId={locationId}
                        data={data && data.getApplicationsStartedMetrics}
                        reportTimeFrom={timeStart}
                        reportTimeTo={timeEnd}
                      />
                    </>
                  )
                }
              }}
            </Query>
          )}
          {sectionId === OPERATIONAL_REPORT_SECTION.REPORTS && (
            <MonthlyReportsList id="report-lists">
              <ListTable
                tableTitle={intl.formatMessage(constantsMessages.births)}
                isLoading={false}
                content={this.getContent(Event.BIRTH)}
                tableHeight={280}
                pageSize={24}
                hideBoxShadow={true}
                columns={[
                  {
                    label: intl.formatMessage(constantsMessages.month),
                    width: 70,
                    key: 'month'
                  },
                  {
                    label: intl.formatMessage(constantsMessages.export),
                    width: 30,
                    alignment: ColumnContentAlignment.RIGHT,
                    key: 'export'
                  }
                ]}
                noResultText={intl.formatMessage(constantsMessages.noResults)}
              />
              <DeathReportHolder>
                <ListTable
                  tableTitle={intl.formatMessage(constantsMessages.deaths)}
                  isLoading={false}
                  content={this.getContent(Event.DEATH)}
                  tableHeight={280}
                  pageSize={24}
                  hideBoxShadow={true}
                  columns={[
                    {
                      label: intl.formatMessage(constantsMessages.month),
                      width: 70,
                      key: 'month'
                    },
                    {
                      label: intl.formatMessage(constantsMessages.export),
                      width: 30,
                      alignment: ColumnContentAlignment.RIGHT,
                      key: 'export'
                    }
                  ]}
                  noResultText={intl.formatMessage(constantsMessages.noResults)}
                />
              </DeathReportHolder>
            </MonthlyReportsList>
          )}
        </Container>
        {expandStatusWindow && (
          <ApplicationStatusWindow
            width={statusWindowWidth}
            crossClickHandler={this.statusWindowCrossClickHandler}
            title={this.getStatusWindowTitle()}
          >
            <Query
              query={FETCH_STATUS_WISE_REGISTRATION_COUNT}
              variables={{
                locationId,
                status: [
                  'IN_PROGRESS',
                  'DECLARED',
                  'REJECTED',
                  'VALIDATED',
                  'WAITING_VALIDATION',
                  'REGISTERED'
                ]
              }}
            >
              {({
                loading,
                error,
                data
              }: {
                loading: boolean
                error?: ApolloError
                data?: IMetricsQueryResult
              }) => {
                if (error) {
                  return (
                    <>
                      <StatusWiseApplicationCountView
                        loading={true}
                        locationId={locationId}
                        onClickStatusDetails={this.onClickStatusDetails}
                      />
                      <ToastNotification type={NOTIFICATION_TYPE.ERROR} />
                    </>
                  )
                }
                return (
                  <StatusWiseApplicationCountView
                    loading={loading}
                    locationId={locationId}
                    data={data && data.fetchRegistrationCountByStatus}
                    statusMapping={StatusMapping}
                    onClickStatusDetails={this.onClickStatusDetails}
                  />
                )
              }}
            </Query>
          </ApplicationStatusWindow>
        )}
      </SysAdminContentWrapper>
    )
  }
}

function mapStateToProps(state: IStoreState) {
  const offlineResources = getOfflineData(state)
  return {
    offlineLocations: offlineResources.locations
  }
}

export const OperationalReport = connect(mapStateToProps, {
  goToPerformanceHome,
  goToOperationalReport,
  goToPerformanceReport,
  goToRegistrationRates,
  goToWorkflowStatus
})(withTheme(injectIntl(OperationalReportComponent)))
