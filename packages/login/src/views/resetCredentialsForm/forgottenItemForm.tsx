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
import { goToHome, goToPhoneNumberVerificationForm } from '@login/login/actions'
import { PrimaryButton } from '@opencrvs/components/lib/buttons'
import { ErrorText } from '@opencrvs/components/lib/forms/ErrorText'
import {
  ActionPageLight,
  RadioButton
} from '@opencrvs/components/lib/interface'
import * as React from 'react'
import { injectIntl, WrappedComponentProps } from 'react-intl'
import { connect } from 'react-redux'
import styled from 'styled-components'
import { Title } from './commons'
import { messages } from './resetCredentialsForm'

const Actions = styled.div`
  padding: 32px 0;
  & > div {
    margin-bottom: 16px;
  }
`

interface BaseProps {
  goToHome: typeof goToHome
  goToPhoneNumberVerificationForm: typeof goToPhoneNumberVerificationForm
}
interface State {
  forgottenItem: string
  error: boolean
}

type Props = BaseProps & WrappedComponentProps

class ForgottenItemComponent extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      forgottenItem: '',
      error: false
    }
  }

  handleContinue = (event: React.FormEvent) => {
    event.preventDefault()
    if (this.state.forgottenItem === '') {
      this.setState({ error: true })
    } else {
      this.props.goToPhoneNumberVerificationForm(this.state.forgottenItem)
    }
  }

  render() {
    const { intl, goToHome } = this.props
    const forgottenItems = [
      {
        id: 'usernameOption',
        option: {
          label: intl.formatMessage(messages.usernameOptionLabel),
          value: 'username'
        }
      },
      {
        id: 'passwordOption',
        option: {
          label: intl.formatMessage(messages.passwordOptionLabel),
          value: 'password'
        }
      }
    ]

    return (
      <>
        <ActionPageLight
          title={intl.formatMessage(messages.forgottenItemFormTitle)}
          goBack={goToHome}
        >
          <form id="forgotten-item-form" onSubmit={this.handleContinue}>
            <Title>
              {intl.formatMessage(messages.forgottenItemFormBodyHeader)}
            </Title>

            <Actions id="forgotten-item-options">
              {this.state.error && (
                <ErrorText id="error-text">
                  {intl.formatMessage(messages.error)}
                </ErrorText>
              )}
              {forgottenItems.map(item => {
                return (
                  <RadioButton
                    id={item.id}
                    size="large"
                    key={item.id}
                    name="forgottenItemOptions"
                    label={item.option.label}
                    value={item.option.value}
                    selected={
                      this.state.forgottenItem === item.option.value
                        ? item.option.value
                        : ''
                    }
                    onChange={() =>
                      this.setState({ forgottenItem: item.option.value })
                    }
                  />
                )
              })}
            </Actions>

            <PrimaryButton id="continue">
              {intl.formatMessage(messages.continueButtonLabel)}
            </PrimaryButton>
          </form>
        </ActionPageLight>
      </>
    )
  }
}

export const ForgottenItem = connect(null, {
  goToHome,
  goToPhoneNumberVerificationForm
})(injectIntl(ForgottenItemComponent))
