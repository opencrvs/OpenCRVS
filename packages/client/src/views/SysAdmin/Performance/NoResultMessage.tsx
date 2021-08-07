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
import styled from '@client/styledComponents'
import { goToOperationalReport } from '@client/navigation'
import { IOfflineData } from '@client/offline/reducer'
import { getOfflineData } from '@client/offline/selectors'
import { IStoreState } from '@client/store'
import * as React from 'react'
import { injectIntl, WrappedComponentProps } from 'react-intl'
import { connect } from 'react-redux'
import { generatePilotLocations } from '@client/utils/locationUtils'
import { LinkButton } from '@opencrvs/components/lib/buttons'
import { MessageRow } from '@client/views/SysAdmin/Performance/PerformanceHome'
import { OPERATIONAL_REPORT_SECTION } from '@client/views/SysAdmin/Performance/OperationalReport'

const MessageContainer = styled.div`
  margin: 0;
`
const StyledHeader = styled.h5`
  color: ${({ theme }) => theme.colors.menuBackground};
  ${({ theme }) => theme.fonts.h5Style};
  margin: 16px 0;
`
interface NoResultMessageProps {
  id?: string
  searchedLocation: string
}

interface DispatchProps {
  goToOperationalReport: typeof goToOperationalReport
}

type Props = NoResultMessageProps &
  WrappedComponentProps &
  DispatchProps & {
    offlineResources: IOfflineData
  }

class NoResultMessageComponent extends React.Component<Props> {
  render() {
    const { id, intl, searchedLocation, offlineResources } = this.props
    return (
      (offlineResources.pilotLocations &&
        Object.keys(offlineResources.pilotLocations).length > 0 && (
          <MessageContainer>
            <StyledHeader id={`noResults-${id}`}>
              {intl.formatMessage(messages.noResultForLocation, {
                searchedLocation
              })}
            </StyledHeader>
            {generatePilotLocations(
              offlineResources.pilotLocations,
              offlineResources.locations
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
        )) || (
        <MessageContainer>
          <StyledHeader id={`noResults-${id}`}>
            {intl.formatMessage(messages.noResultForLocationWithoutPilotAreas, {
              searchedLocation
            })}
          </StyledHeader>
        </MessageContainer>
      )
    )
  }
}

function mapStateToProps(state: IStoreState) {
  return {
    offlineResources: getOfflineData(state)
  }
}

export const NoResultMessage = connect(mapStateToProps, {
  goToOperationalReport
})(injectIntl(NoResultMessageComponent))
