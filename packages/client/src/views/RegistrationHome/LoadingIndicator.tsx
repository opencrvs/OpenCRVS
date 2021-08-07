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
import * as React from 'react'
import { Spinner } from '@opencrvs/components/lib/interface'
import { NoWifi } from '@opencrvs/components/lib/icons'
import { injectIntl, WrappedComponentProps as IntlShapeProps } from 'react-intl'
import styled from 'styled-components'
import { errorMessages } from '@client/i18n/messages'

const ErrorText = styled.div`
  color: ${({ theme }) => theme.colors.error};
  ${({ theme }) => theme.fonts.bodyStyle};
  text-align: center;
  margin-top: 100px;
`
const Loading = styled(Spinner)`
  width: 24px;
  margin-right: 13px;
`
const NoConnectivity = styled(NoWifi)`
  margin-right: 13px;
`
const Wrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 38px;
`
const Text = styled.span`
  ${({ theme }) => theme.fonts.bodyStyle};
  display: flex;
`

type IBaseLoadingProps = {
  loading: boolean
  hasError: boolean
  noApplication?: boolean
}

type IState = {
  intervalID: number | null
  isOnline: boolean
}

type IProps = IBaseLoadingProps & IntlShapeProps

export class LoadingIndicatorComp extends React.Component<IProps, IState> {
  ONLINE_CHECK_INTERVAL = 500
  constructor(props: IProps) {
    super(props)

    this.state = {
      intervalID: null,
      isOnline: navigator.onLine
    }
  }

  componentDidMount() {
    const intervalID: number = setInterval(() => {
      this.setState({
        isOnline: navigator.onLine,
        intervalID
      })
    }, this.ONLINE_CHECK_INTERVAL)
  }

  componentWillUnmount() {
    this.state.intervalID && clearInterval(this.state.intervalID)
  }

  render() {
    const { loading, noApplication, hasError, intl } = this.props

    return (
      <Wrapper>
        {this.state.isOnline && loading && (
          <>
            <Loading id="Spinner" baseColor="#4C68C1" />
            <Text id="loading-text">
              {intl.formatMessage(errorMessages.loadingApplications)}
            </Text>
          </>
        )}
        {this.state.isOnline && hasError && (
          <ErrorText id="search-result-error-text-count">
            {intl.formatMessage(errorMessages.queryError)}
          </ErrorText>
        )}
        {this.state.isOnline && noApplication && (
          <Text id="no-application-text">
            {intl.formatMessage(errorMessages.noApplication)}
          </Text>
        )}
        {!this.state.isOnline && (
          <>
            <NoConnectivity />
            <Text id="wait-connection-text">
              {intl.formatMessage(errorMessages.waitingForConnection)}
            </Text>
          </>
        )}
      </Wrapper>
    )
  }
}

export const LoadingIndicator = injectIntl(LoadingIndicatorComp)
