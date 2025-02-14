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
import { messages } from '@client/i18n/messages/views/performance'
import { messages as messagesSearch } from '@client/i18n/messages/views/search'
import { getOfflineData } from '@client/offline/selectors'
import { SysAdminContentWrapper } from '@client/views/SysAdmin/SysAdminContentWrapper'
import { Header } from '@client/views/SysAdmin/Performance/utils'
import {
  ISearchLocation,
  LocationSearch
} from '@opencrvs/components/lib/LocationSearch'
import * as React from 'react'
import { useIntl } from 'react-intl'
import { useSelector } from 'react-redux'
import styled from 'styled-components'
import { NoWifi } from '@opencrvs/components/lib/icons'
import { constantsMessages } from '@client/i18n/messages/constants'
import { buttonMessages } from '@client/i18n/messages/buttons'
import * as routes from '@client/navigation/routes'
import { stringify } from 'query-string'
import { useLocation, useNavigate } from 'react-router-dom'
import { useOnlineStatus } from '@client/utils'
import { usePermissions } from '@client/hooks/useAuthorization'

const ConnectivityContainer = styled.div`
  justify-content: center;
  gap: 8px;
  display: flex;
  margin-top: 5vh;
  @media (max-width: ${({ theme }) => theme.grid.breakpoints.md}px) {
    margin-top: 12px;
  }
`
const NoConnectivity = styled(NoWifi)`
  width: 24px;
`
const Text = styled.div`
  ${({ theme }) => theme.fonts.reg16};
  text-align: center;
`

export function TeamSearch() {
  const location = useLocation()
  const navigate = useNavigate()
  const [selectedLocation, setSelectedLocation] = React.useState(
    location.state.selectedLocation
  )
  const intl = useIntl()
  const offlineCountryConfiguration = useSelector(getOfflineData)
  const isOnline = useOnlineStatus()
  const { canAccessOffice } = usePermissions()

  const searchHandler = (item: ISearchLocation) => {
    setSelectedLocation(item)
  }

  const searchButtonHandler = () => {
    if (selectedLocation) {
      navigate({
        pathname: routes.TEAM_USER_LIST,
        search: stringify({
          locationId: selectedLocation.id
        })
      })
    }
  }

  return (
    <SysAdminContentWrapper>
      {isOnline ? (
        <>
          <Header>{intl.formatMessage(messages.sysAdminTeamHomeHeader)}</Header>

          <LocationSearch
            selectedLocation={selectedLocation}
            buttonLabel={intl.formatMessage(buttonMessages.search)}
            locationList={Object.values(offlineCountryConfiguration.offices)
              .filter(canAccessOffice)
              .map((location) => {
                return {
                  id: location.id,
                  searchableText: location.name,
                  displayLabel: location.name
                }
              })}
            searchHandler={searchHandler}
            searchButtonHandler={searchButtonHandler}
            errorMessage={intl.formatMessage(messagesSearch.locationNotFound)}
          />
        </>
      ) : (
        <ConnectivityContainer>
          <NoConnectivity />
          <Text id="no-connection-text">
            {intl.formatMessage(constantsMessages.noConnection)}
          </Text>
        </ConnectivityContainer>
      )}
    </SysAdminContentWrapper>
  )
}
