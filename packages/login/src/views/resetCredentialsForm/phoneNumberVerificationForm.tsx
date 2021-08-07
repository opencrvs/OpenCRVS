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
import {
  FORGOTTEN_ITEMS,
  goToForgottenItemForm,
  goToRecoveryCodeEntryForm,
  goToSecurityQuestionForm
} from '@login/login/actions'
import { authApi } from '@login/utils/authApi'
import { phoneNumberFormat } from '@login/utils/validate'
import { PrimaryButton } from '@opencrvs/components/lib/buttons'
import { InputField, TextInput } from '@opencrvs/components/lib/forms'
import { ActionPageLight } from '@opencrvs/components/lib/interface'
import * as React from 'react'
import { injectIntl, WrappedComponentProps } from 'react-intl'
import { connect } from 'react-redux'
import { RouteComponentProps, withRouter } from 'react-router'
import styled from 'styled-components'
import { Title } from './commons'
import { messages } from './resetCredentialsForm'
import { convertToMSISDN } from '@login/utils/dataCleanse'

const Actions = styled.div`
  padding: 32px 0;
  & > div {
    margin-bottom: 16px;
  }
`

interface BaseProps {
  goToForgottenItemForm: typeof goToForgottenItemForm
  goToRecoveryCodeEntryForm: typeof goToRecoveryCodeEntryForm
  goToSecurityQuestionForm: typeof goToSecurityQuestionForm
}
interface State {
  phone: string
  touched: boolean
  error: boolean
  errorMessage: string
}

type Props = BaseProps &
  RouteComponentProps<{}, {}, { forgottenItem: FORGOTTEN_ITEMS }> &
  WrappedComponentProps

class PhoneNumberVerificationComponent extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      phone: '',
      touched: false,
      error: false,
      errorMessage: ''
    }
  }

  handleChange = (value: string) => {
    this.setState({
      error: phoneNumberFormat(value) ? true : false,
      phone: value,
      touched: true
    })
  }

  handleContinue = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!this.state.phone || this.state.error) {
      this.setState({ error: true })
      return
    }
    try {
      const { nonce, securityQuestionKey } = await authApi.verifyUser(
        convertToMSISDN(this.state.phone, window.config.COUNTRY),
        this.props.location.state.forgottenItem
      )
      if (securityQuestionKey) {
        this.props.goToSecurityQuestionForm(
          nonce,
          securityQuestionKey,
          this.props.location.state.forgottenItem
        )
      } else {
        this.props.goToRecoveryCodeEntryForm(
          nonce,
          this.state.phone,
          this.props.location.state.forgottenItem
        )
      }
    } catch (err) {
      this.setState({
        error: true,
        errorMessage: this.props.intl.formatMessage(
          messages.errorPhoneNumberNotFound
        )
      })
    }
  }

  render() {
    const { error: responseError, errorMessage } = this.state
    const { intl, goToForgottenItemForm } = this.props
    const validationError =
      this.state.error && phoneNumberFormat(this.state.phone)

    return (
      <>
        <ActionPageLight
          id="page-title"
          title={intl.formatMessage(messages.credentialsResetFormTitle, {
            forgottenItem: this.props.location.state.forgottenItem
          })}
          goBack={goToForgottenItemForm}
        >
          <form
            id="phone-number-verification-form"
            onSubmit={this.handleContinue}
          >
            <Title>
              {intl.formatMessage(
                messages.phoneNumberConfirmationFormBodyHeader
              )}
            </Title>
            {intl.formatMessage(
              messages.phoneNumberConfirmationFormBodySubheader
            )}

            <Actions id="phone-number-verification">
              <InputField
                id="phone-number"
                key="phoneNumberFieldContainer"
                label={this.props.intl.formatMessage(
                  messages.phoneNumberFieldLabel
                )}
                touched={this.state.touched}
                error={
                  validationError
                    ? this.props.intl.formatMessage(
                        validationError.message,
                        validationError.props
                      )
                    : responseError
                    ? errorMessage
                    : ''
                }
                hideAsterisk={true}
              >
                <TextInput
                  id="phone-number-input"
                  type="tel"
                  key="phoneNumberInputField"
                  name="phoneNumberInput"
                  isSmallSized={true}
                  value={this.state.phone}
                  onChange={e => this.handleChange(e.target.value)}
                  touched={this.state.touched}
                  error={responseError}
                />
              </InputField>
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

export const PhoneNumberVerification = connect(null, {
  goToForgottenItemForm,
  goToRecoveryCodeEntryForm,
  goToSecurityQuestionForm
})(withRouter(injectIntl(PhoneNumberVerificationComponent)))
