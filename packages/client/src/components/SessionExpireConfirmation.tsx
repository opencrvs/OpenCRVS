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
import { connect } from 'react-redux'
import { injectIntl, WrappedComponentProps as IntlShapeProps } from 'react-intl'
import styled from '@client/styledComponents'
import { Modal } from '@opencrvs/components/lib/interface'
import { PrimaryButton } from '@opencrvs/components/lib/buttons'
import { IStoreState } from '@client/store'
import { redirectToAuthentication } from '@client/profile/profileActions'
import { messages } from '@client/i18n/messages/views/session'
import { buttonMessages } from '@client/i18n/messages'

const StyledModal = styled(Modal)`
  z-index: 4;
`
type SessionExpireProps = {
  sessionExpired: boolean
}
interface IProps {
  redirectToAuthentication: typeof redirectToAuthentication
}

class SessionExpireComponent extends React.Component<
  SessionExpireProps & IProps & IntlShapeProps
> {
  handleLogin = () => {}
  render() {
    const { intl, sessionExpired } = this.props
    return (
      <>
        {sessionExpired && (
          <StyledModal
            title={intl.formatMessage(messages.sessionExpireTxt)}
            actions={[
              <PrimaryButton
                key="login"
                id="login"
                onClick={this.props.redirectToAuthentication}
              >
                {intl.formatMessage(buttonMessages.login)}
              </PrimaryButton>
            ]}
            show={true}
          />
        )}
      </>
    )
  }
}

const mapStateToProps = (store: IStoreState) => {
  return {
    sessionExpired: store.notification.sessionExpired
  }
}

export const SessionExpireConfirmation = connect<
  SessionExpireProps,
  IProps,
  SessionExpireProps & IProps,
  IStoreState
>(mapStateToProps, {
  redirectToAuthentication
})(injectIntl(SessionExpireComponent)) as any
