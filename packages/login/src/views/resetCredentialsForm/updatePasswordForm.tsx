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
  goToPhoneNumberVerificationForm,
  goToSuccessPage
} from '@login/login/actions'
import { authApi } from '@login/utils/authApi'
import { PrimaryButton } from '@opencrvs/components/lib/buttons'
import {
  InputField,
  TextInput,
  WarningMessage
} from '@opencrvs/components/lib/forms'
import { TickOff, TickOn } from '@opencrvs/components/lib/icons'
import { ActionPageLight } from '@opencrvs/components/lib/interface'
import * as React from 'react'
import { injectIntl, WrappedComponentProps as IntlShapeProps } from 'react-intl'
import { connect } from 'react-redux'
import { RouteComponentProps, withRouter } from 'react-router'
import styled from 'styled-components'
import { messages } from './resetCredentialsForm'

const Header = styled.h4`
  ${({ theme }) => theme.fonts.h4Style};
  color: ${({ theme }) => theme.colors.black};
  margin: 0px;
`
const Instruction = styled.p`
  color: ${({ theme }) => theme.colors.copy};
  margin: 13px 64px 27px 0px;
`
const Action = styled.div`
  margin-top: 58px;
`

const GlobalError = styled.div`
  color: ${({ theme }) => theme.colors.error};
`
const PasswordMatch = styled.div`
  ${({ theme }) => theme.fonts.semiBoldFont};
  color: ${({ theme }) => theme.colors.success};
  margin-top: 8px;
`
const PasswordMismatch = styled.div`
  ${({ theme }) => theme.fonts.semiBoldFont};
  color: ${({ theme }) => theme.colors.error};
  margin-top: 8px;
`

const PasswordContents = styled.div`
  color: ${({ theme }) => theme.colors.copy};
  max-width: 416px;
`
const ValidationRulesSection = styled.div`
  background: ${({ theme }) => theme.colors.background};
  margin: 16px 0 24px;
  padding: 8px 24px;
  & div {
    padding: 8px 0;
    display: flex;
    align-items: center;
    & span {
      margin-left: 8px;
    }
  }
`

type State = {
  newPassword: string
  confirmPassword: string
  validLength: boolean
  hasNumber: boolean
  hasCases: boolean
  passwordMismatched: boolean
  passwordMatched: boolean
  continuePressed: boolean
}

interface IProps extends RouteComponentProps<{}, {}, { nonce: string }> {
  goToPhoneNumberVerificationForm: typeof goToPhoneNumberVerificationForm
  goToSuccessPage: typeof goToSuccessPage
}

type IFullProps = IProps & IntlShapeProps

class UpdatePasswordComponent extends React.Component<IFullProps, State> {
  constructor(props: IFullProps) {
    super(props)
    this.state = {
      newPassword: '',
      confirmPassword: '',
      validLength: false,
      hasNumber: false,
      hasCases: false,
      passwordMismatched: false,
      passwordMatched: false,
      continuePressed: false
    }
  }
  validateLength = (value: string) => {
    this.setState(() => ({
      validLength: value.length >= 8
    }))
  }
  validateNumber = (value: string) => {
    this.setState(() => ({
      hasNumber: /\d/.test(value)
    }))
  }
  validateCases = (value: string) => {
    this.setState(() => ({
      hasCases: /[a-z]/.test(value) && /[A-Z]/.test(value)
    }))
  }
  checkPasswordStrength = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    this.setState(() => ({
      newPassword: value,
      confirmPassword: '',
      passwordMatched: false,
      passwordMismatched: false,
      continuePressed: false
    }))
    this.validateLength(value)
    this.validateNumber(value)
    this.validateCases(value)
  }
  matchPassword = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = this.state.newPassword
    const value = event.target.value
    this.setState(() => ({
      confirmPassword: value,
      passwordMismatched: value.length > 0 && newPassword !== value,
      passwordMatched: value.length > 0 && newPassword === value,
      continuePressed: false
    }))
  }
  whatNext = async (event: React.FormEvent) => {
    event.preventDefault()
    this.setState(() => ({
      continuePressed: true,
      passwordMismatched:
        this.state.newPassword.length > 0 &&
        this.state.newPassword !== this.state.confirmPassword
    }))

    if (
      this.state.passwordMatched &&
      this.state.hasCases &&
      this.state.hasNumber &&
      this.state.validLength
    ) {
      await authApi.changePassword(
        this.props.location.state.nonce,
        this.state.newPassword
      )
      this.props.goToSuccessPage(FORGOTTEN_ITEMS.PASSWORD)
    }
  }
  render = () => {
    const { intl } = this.props
    const forgottenItem = FORGOTTEN_ITEMS.PASSWORD

    return (
      <>
        <ActionPageLight
          title={intl.formatMessage(messages.credentialsResetFormTitle, {
            forgottenItem
          })}
          goBack={() => goToPhoneNumberVerificationForm(forgottenItem)}
        >
          <form id="password-update-form" onSubmit={this.whatNext}>
            <Header>
              {intl.formatMessage(messages.passwordUpdateFormBodyHeader)}
            </Header>
            <Instruction>
              {intl.formatMessage(messages.passwordUpdateFormBodySubheader)}
            </Instruction>
            <GlobalError id="GlobalError">
              {this.state.continuePressed && this.state.passwordMismatched && (
                <WarningMessage>
                  {intl.formatMessage(messages.mismatchedPasswordMsg)}
                </WarningMessage>
              )}
              {this.state.continuePressed &&
                this.state.newPassword.length === 0 && (
                  <WarningMessage>
                    {intl.formatMessage(messages.passwordRequiredMsg)}
                  </WarningMessage>
                )}
            </GlobalError>
            <PasswordContents>
              <InputField
                id="newPassword"
                label={intl.formatMessage(messages.newPasswordLabel)}
                touched={true}
                required={false}
                optionalLabel=""
              >
                <TextInput
                  id="NewPassword"
                  type="password"
                  touched={true}
                  value={this.state.newPassword}
                  onChange={this.checkPasswordStrength}
                  error={
                    this.state.continuePressed &&
                    this.state.newPassword.length === 0
                  }
                />
              </InputField>
              <ValidationRulesSection>
                <div>
                  {intl.formatMessage(messages.passwordUpdateFormValidationMsg)}
                </div>
                <div>
                  {this.state.validLength && <TickOn />}
                  {!this.state.validLength && <TickOff />}
                  <span>
                    {intl.formatMessage(
                      messages.passwordLengthCharacteristicsForPasswordUpdateForm,
                      { min: 8 }
                    )}
                  </span>
                </div>
                <div>
                  {this.state.hasCases && <TickOn />}
                  {!this.state.hasCases && <TickOff />}
                  <span>
                    {intl.formatMessage(
                      messages.passwordCaseCharacteristicsForPasswordUpdateForm
                    )}
                  </span>
                </div>
                <div>
                  {this.state.hasNumber && <TickOn />}
                  {!this.state.hasNumber && <TickOff />}
                  <span>
                    {intl.formatMessage(
                      messages.passwordNumberCharacteristicsForPasswordUpdateForm
                    )}
                  </span>
                </div>
              </ValidationRulesSection>

              <InputField
                id="newPassword"
                label={intl.formatMessage(messages.confirmPasswordLabel)}
                touched={true}
                required={false}
                optionalLabel=""
              >
                <TextInput
                  id="ConfirmPassword"
                  type="password"
                  touched={true}
                  error={
                    this.state.continuePressed && this.state.passwordMismatched
                  }
                  value={this.state.confirmPassword}
                  onChange={this.matchPassword}
                />
              </InputField>
              {this.state.passwordMismatched && (
                <PasswordMismatch>
                  {intl.formatMessage(messages.mismatchedPasswordMsg)}
                </PasswordMismatch>
              )}
              {this.state.passwordMatched && (
                <PasswordMatch>
                  {intl.formatMessage(messages.matchedPasswordMsg)}
                </PasswordMatch>
              )}
            </PasswordContents>
            <Action>
              <PrimaryButton id="continue-button">
                {intl.formatMessage(messages.confirmButtonLabel)}
              </PrimaryButton>
            </Action>
          </form>
        </ActionPageLight>
      </>
    )
  }
}

export const UpdatePassword = connect(null, {
  goToPhoneNumberVerificationForm,
  goToSuccessPage
})(withRouter(injectIntl(UpdatePasswordComponent)))
