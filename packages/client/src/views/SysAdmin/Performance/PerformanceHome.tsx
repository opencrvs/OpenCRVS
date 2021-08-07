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
import { messages } from '@client/i18n/messages/views/performance'
import { goToOperationalReport } from '@client/navigation'
import { IOfflineData } from '@client/offline/reducer'
import { getOfflineData } from '@client/offline/selectors'
import { IStoreState } from '@client/store'
import {
  generateLocations,
  generatePilotLocations
} from '@client/utils/locationUtils'
import {
  ISearchLocation,
  LocationSearch
} from '@opencrvs/components/lib/interface'
import * as React from 'react'
import { injectIntl, WrappedComponentProps } from 'react-intl'
import { connect } from 'react-redux'
import { RouteComponentProps } from 'react-router'
import styled from 'styled-components'
import { SysAdminContentWrapper } from '@client/views/SysAdmin/SysAdminContentWrapper'
import { Header } from './utils'
import { OPERATIONAL_REPORT_SECTION } from '@client/views/SysAdmin/Performance/OperationalReport'
import { LinkButton } from '@opencrvs/components/lib/buttons'

const MessageContainer = styled.div`
  margin-top: 50px;
`

export const MessageHeader = styled.div`
  ${({ theme }) => theme.fonts.bodyStyle};
  margin-bottom: 15px;
`

export const MessageRow = styled.div`
  margin-bottom: 10px;
`

interface BaseProps {
  goToOperationalReport: typeof goToOperationalReport
}

type Props = BaseProps &
  WrappedComponentProps &
  Pick<RouteComponentProps, 'history'> & {
    offlineResources: IOfflineData
  }

interface State {
  selectedLocation: ISearchLocation | undefined
}

class PerformanceHomeComponent extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    const historyState = props.history.location.state as any
    this.state = {
      selectedLocation:
        (historyState && historyState.selectedLocation) || undefined
    }
  }

  searchHandler = (item: ISearchLocation) => {
    this.setState({
      selectedLocation: item
    })
  }

  searchButtonHandler = () => {
    this.state.selectedLocation &&
      this.props.goToOperationalReport(
        this.state.selectedLocation.id,
        OPERATIONAL_REPORT_SECTION.OPERATIONAL
      )
  }

  renderPilotLocations() {
    return (
      (this.props.offlineResources.pilotLocations &&
        Object.keys(this.props.offlineResources.pilotLocations).length > 0 && (
          <MessageContainer>
            <MessageHeader>
              {this.props.intl.formatMessage(messages.pilotAreaListHeader)}
            </MessageHeader>
            {generatePilotLocations(
              this.props.offlineResources.pilotLocations,
              this.props.offlineResources.locations
            ).map((pilotLocation, index) => (
              <MessageRow key={index}>
                <LinkButton
                  id={`pilot-location-link-${index}`}
                  key={index}
                  textDecoration="none"
                  onClick={() =>
                    this.props.goToOperationalReport(
                      pilotLocation.id,
                      OPERATIONAL_REPORT_SECTION.OPERATIONAL
                    )
                  }
                >
                  {pilotLocation.displayLabel}
                </LinkButton>
              </MessageRow>
            ))}
          </MessageContainer>
        )) || <></>
    )
  }

  render() {
    const { intl, offlineResources } = this.props

    return (
      <SysAdminContentWrapper>
        <Header>
          {intl.formatMessage(messages.sysAdminPerformanceHomeHeader)}
        </Header>

        <LocationSearch
          selectedLocation={this.state.selectedLocation}
          locationList={generateLocations(offlineResources.locations)}
          searchHandler={this.searchHandler}
          searchButtonHandler={this.searchButtonHandler}
        />

        {this.renderPilotLocations()}
      </SysAdminContentWrapper>
    )
  }
}

function mapStateToProps(state: IStoreState) {
  return {
    offlineResources: getOfflineData(state)
  }
}

export const PerformanceHome = connect(mapStateToProps, {
  goToOperationalReport
})(injectIntl(PerformanceHomeComponent))
