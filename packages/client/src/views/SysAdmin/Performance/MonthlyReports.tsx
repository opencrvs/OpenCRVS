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
import moment from 'moment'
import * as React from 'react'
import { connect } from 'react-redux'
import { injectIntl, WrappedComponentProps } from 'react-intl'
import { LinkButton } from '@opencrvs/components/lib/buttons'
import {
  ListTable,
  LocationSearch,
  ISearchLocation
} from '@opencrvs/components/lib/interface'
import { constantsMessages } from '@client/i18n/messages'
import { messages } from '@client/i18n/messages/views/performance'
import { goToPerformanceReport } from '@client/navigation'
import { MONTHS_IN_YEAR } from '@client/utils/constants'
import {
  Header,
  getMonthDateRange
} from '@client/views/SysAdmin/Performance/utils'
import { getToken } from '@client/utils/authUtils'
import styled from '@client/styledComponents'
import { Event } from '@client/forms'
import { IOfflineData } from '@client/offline/reducer'
import { getOfflineData } from '@client/offline/selectors'
import { IStoreState } from '@client/store'
import { generateLocations } from '@client/utils/locationUtils'
import { RouteComponentProps } from 'react-router'

interface ReportProps {
  goToPerformanceReport: typeof goToPerformanceReport
  offlineResources: IOfflineData
}

const Actions = styled.div`
  padding: 1em 0;
`

const StyledDiv = styled.div`
  margin-top: 16px;
`

function downloadAllData() {
  fetch(window.config.API_GATEWAY_URL + 'export/allPerformanceMetrics', {
    headers: {
      Authorization: `Bearer ${getToken()}`
    }
  })
    .then(resp => resp.blob())
    .then(blob => {
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'export.zip'
      a.click()
      window.URL.revokeObjectURL(url)
    })
}

type Props = ReportProps &
  WrappedComponentProps &
  Pick<RouteComponentProps, 'history'>

interface IState {
  selectedLocation: ISearchLocation | undefined
}

class MonthlyReportsComponent extends React.Component<Props, IState> {
  constructor(props: Props) {
    super(props)
    const historyState = props.history.location.state as any
    this.state = {
      selectedLocation:
        (historyState && historyState.selectedLocation) || undefined
    }
  }
  getContent(eventType: Event) {
    moment.locale(this.props.intl.locale)
    let content = []

    const currentYear = moment().year()
    let currentMonth = 1

    while (currentMonth <= 12) {
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
          <>
            <LinkButton>CSV</LinkButton> <LinkButton>PDF</LinkButton>
          </>
        )
      })
      currentMonth++
    }
    return content
  }

  pushStateToTheCurrentRoute = (state: object) => {
    const {
      push,
      location: { pathname: currentRoute }
    } = this.props.history
    return push(currentRoute, state)
  }

  onClickSearchResult = (item: ISearchLocation) => {
    this.setState(
      {
        selectedLocation: item
      },
      () =>
        this.pushStateToTheCurrentRoute({
          selectedLocation: item
        })
    )
  }

  render() {
    const { intl, offlineResources } = this.props

    return (
      <>
        <Header>{intl.formatMessage(messages.monthlyReportsBodyHeader)}</Header>

        <LocationSearch
          selectedLocation={this.state.selectedLocation}
          locationList={generateLocations(offlineResources.locations)}
          searchHandler={this.onClickSearchResult}
        />

        <StyledDiv>
          <ListTable
            tableTitle={intl.formatMessage(constantsMessages.birth)}
            isLoading={false}
            content={this.getContent(Event.BIRTH)}
            tableHeight={280}
            pageSize={MONTHS_IN_YEAR}
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
                key: 'export'
              }
            ]}
            noResultText={intl.formatMessage(constantsMessages.noResults)}
          />

          <ListTable
            tableTitle={intl.formatMessage(constantsMessages.death)}
            isLoading={false}
            content={this.getContent(Event.DEATH)}
            tableHeight={280}
            pageSize={MONTHS_IN_YEAR}
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
                key: 'export'
              }
            ]}
            noResultText={intl.formatMessage(constantsMessages.noResults)}
          />
        </StyledDiv>

        <Actions>
          <LinkButton onClick={downloadAllData} id="export-all-button">
            {intl.formatMessage(messages.exportAll)}
          </LinkButton>
        </Actions>
      </>
    )
  }
}

function mapStateToProps(state: IStoreState) {
  return {
    offlineResources: getOfflineData(state)
  }
}

export const MonthlyReports = connect(mapStateToProps, {
  goToPerformanceReport
})(injectIntl(MonthlyReportsComponent))
