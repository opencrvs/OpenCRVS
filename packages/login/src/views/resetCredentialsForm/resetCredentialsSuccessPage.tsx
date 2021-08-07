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
import { goToHome, FORGOTTEN_ITEMS } from '@login/login/actions'
import { storage } from '@login/storage'
import { PrimaryButton } from '@opencrvs/components/lib/buttons'
import { LightLogo } from '@opencrvs/components/lib/icons'
import {
  Container,
  LogoContainer,
  Page
} from '@login/views/resetCredentialsForm/commons'
import * as React from 'react'
import { injectIntl, WrappedComponentProps as IntlShapeProps } from 'react-intl'
import { connect } from 'react-redux'
import styled from 'styled-components'
import { messages } from './resetCredentialsForm'
import { RouteComponentProps } from 'react-router'

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

export class ResetCredentialsSuccessView extends React.Component<
  { goToHome: typeof goToHome } & RouteComponentProps<
    {},
    {},
    { forgottenItem: FORGOTTEN_ITEMS }
  > &
    IntlShapeProps
> {
  async componentDidMount() {
    await storage.removeItem('USER_DETAILS')
  }
  render() {
    const { intl, goToHome } = this.props
    const { forgottenItem } = this.props.location.state
    return (
      <Page>
        <Container id="reset-credentials-success-page">
          <LogoContainer>
            <LightLogo />
          </LogoContainer>
          <TitleHolder>
            {intl.formatMessage(messages.successPageTitle, { forgottenItem })}
          </TitleHolder>
          <InstructionHolder>
            {intl.formatMessage(messages.successPageSubtitle, {
              forgottenItem
            })}
          </InstructionHolder>
          <LoginButton id="login-button" onClick={goToHome}>
            {intl.formatMessage(messages.loginButtonLabel)}
          </LoginButton>
        </Container>
      </Page>
    )
  }
}

export const ResetCredentialsSuccessPage = connect(null, {
  goToHome
})(injectIntl(ResetCredentialsSuccessView))
