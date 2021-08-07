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
import { goToTeamUserList } from '@client/navigation'
import { IOfflineData, ILocation } from '@client/offline/reducer'
import { getOfflineData } from '@client/offline/selectors'
import { IStoreState } from '@client/store'
import { SysAdminContentWrapper } from '@client/views/SysAdmin/SysAdminContentWrapper'
import { Header } from '@client/views/SysAdmin/Performance/utils'
import {
  ISearchLocation,
  LocationSearch
} from '@opencrvs/components/lib/interface'
import * as React from 'react'
import { injectIntl, WrappedComponentProps } from 'react-intl'
import { connect } from 'react-redux'
import { RouteComponentProps } from 'react-router'

interface BaseProps {
  goToTeamUserList: typeof goToTeamUserList
}

type Props = BaseProps &
  WrappedComponentProps &
  Pick<RouteComponentProps, 'history'> & {
    offlineResources: IOfflineData
  }

interface State {
  selectedLocation: ISearchLocation | undefined
}

class TeamSearchComponent extends React.Component<Props, State> {
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
      this.props.goToTeamUserList(this.state.selectedLocation)
  }

  render() {
    const { intl, offlineResources } = this.props

    return (
      <SysAdminContentWrapper>
        <Header>{intl.formatMessage(messages.sysAdminTeamHomeHeader)}</Header>

        <LocationSearch
          selectedLocation={this.state.selectedLocation}
          locationList={Object.values(offlineResources.offices).map(
            (location: ILocation) => {
              return {
                id: location.id,
                searchableText: location.name,
                displayLabel: location.name
              }
            }
          )}
          searchHandler={this.searchHandler}
          searchButtonHandler={this.searchButtonHandler}
        />
      </SysAdminContentWrapper>
    )
  }
}

function mapStateToProps(state: IStoreState) {
  return {
    offlineResources: getOfflineData(state)
  }
}

export const TeamSearch = connect(mapStateToProps, {
  goToTeamUserList
})(injectIntl(TeamSearchComponent))
