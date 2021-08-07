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
import styled from 'styled-components'
import { injectIntl, WrappedComponentProps as IntlShapeProps } from 'react-intl'
import { connect } from 'react-redux'
import { LightLogo } from '@opencrvs/components/lib/icons'
import { PrimaryButton } from '@opencrvs/components/lib/buttons'
import { redirectToAuthentication } from '@client/profile/profileActions'
import {
  Page,
  Container,
  LogoContainer
} from '@client/views/UserSetup/UserSetupPage'
import { storage } from '@client/storage'
import { USER_DETAILS } from '@client/utils/userUtils'
import { messages } from '@client/i18n/messages/views/userSetup'
import { buttonMessages } from '@client/i18n/messages'

const TitleHolder = styled.div`
  ${({ theme }) => theme.fonts.h2Style};
  padding: 50px 65px 0px 65px;
`
const InstructionHolder = styled.div`
  ${({ theme }) => theme.fonts.bodyStyle};
  padding: 40px 60px 30px 60px;
`
const LoginButton = styled(PrimaryButton)`
  box-shadow: 0 0 13px 0 rgba(0, 0, 0, 0.27);
`

export class SetupConfirmationView extends React.Component<
  {
    redirectToAuthentication: typeof redirectToAuthentication
  } & IntlShapeProps
> {
  async componentDidMount() {
    await storage.removeItem(USER_DETAILS)
  }
  render() {
    const { intl } = this.props
    return (
      <Page>
        <Container id="user-setup-complete-page">
          <LogoContainer>
            <LightLogo />
          </LogoContainer>
          <TitleHolder>
            {intl.formatMessage(messages.setupCompleteTitle)}
          </TitleHolder>
          <InstructionHolder>
            {intl.formatMessage(messages.userSetupInstruction)}
          </InstructionHolder>
          <LoginButton
            id="setup-login-button"
            onClick={() => this.props.redirectToAuthentication()}
          >
            {intl.formatMessage(buttonMessages.login)}
          </LoginButton>
        </Container>
      </Page>
    )
  }
}

export const SetupConfirmationPage = connect(null, {
  redirectToAuthentication
})(injectIntl(SetupConfirmationView))
