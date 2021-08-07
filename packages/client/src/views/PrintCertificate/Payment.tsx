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
import { PrimaryButton, TertiaryButton } from '@opencrvs/components/lib/buttons'
import { Print } from '@opencrvs/components/lib/icons'
import { ActionPageLight } from '@opencrvs/components/lib/interface'
import { IPrintableApplication, modifyApplication } from '@client/applications'
import { Event } from '@client/forms'
import { buttonMessages } from '@client/i18n/messages'
import { messages } from '@client/i18n/messages/views/certificate'
import {
  goBack as goBackAction,
  goToReviewCertificate as goToReviewCertificateAction
} from '@client/navigation'
import { getUserDetails } from '@client/profile/profileSelectors'
import { IStoreState } from '@client/store'
import { ITheme } from '@client/styledComponents'
import { IUserDetails } from '@client/utils/userUtils'
import { printMoneyReceipt } from '@client/views/PrintCertificate/PDFUtils'
import * as React from 'react'
import { WrappedComponentProps as IntlShapeProps, injectIntl } from 'react-intl'
import { connect } from 'react-redux'
import { RouteComponentProps } from 'react-router'
import styled, { withTheme } from 'styled-components'
import { calculatePrice, getEventDate, getServiceMessage } from './utils'
import { IOfflineData } from '@client/offline/reducer'
import { getOfflineData } from '@client/offline/selectors'

const Header = styled.h4`
  ${({ theme }) => theme.fonts.h4Style};
  color: ${({ theme }) => theme.colors.black};
  margin-bottom: 16px;
  margin-top: 0;
`

const Instruction = styled.p`
  color: ${({ theme }) => theme.colors.copy};
`
const Action = styled.div`
  margin-top: 32px;
`
const GreyBody = styled.div`
  background: ${({ theme }) => theme.colors.background};
  padding: 16px 24px;

  & button {
    margin-top: 16px;
    padding: 0;
  }
`

const StyledLabel = styled.label`
  ${({ theme }) => theme.fonts.bodyBoldStyle};
  margin-right: 3px;
`
const StyledValue = styled.span`
  ${({ theme }) => theme.fonts.bodyStyle};
`

function LabelValue({
  id,
  label,
  value
}: {
  id: string
  label: string
  value: string
}) {
  return (
    <div id={id}>
      <StyledLabel>{label}</StyledLabel>
      <StyledValue>{value}</StyledValue>
    </div>
  )
}
interface IProps {
  event: Event
  registrationId: string
  language: string
  application: IPrintableApplication
  theme: ITheme
  modifyApplication: typeof modifyApplication
  goToReviewCertificate: typeof goToReviewCertificateAction
  goBack: typeof goBackAction
  userDetails: IUserDetails | null
  resources: IOfflineData
}

type IFullProps = IProps & IntlShapeProps

class PaymentComponent extends React.Component<IFullProps> {
  continue = (paymentAmount: string) => {
    const { application } = this.props
    const certificates =
      application && application.data.registration.certificates

    const certificate = (certificates && certificates[0]) || {}

    this.props.modifyApplication({
      ...application,
      data: {
        ...application.data,
        registration: {
          ...application.data.registration,
          certificates: [
            {
              ...certificate,
              payments: {
                type: 'MANUAL' as const,
                total: Number(paymentAmount),
                amount: Number(paymentAmount),
                outcome: 'COMPLETED' as const,
                date: Date.now()
              }
            }
          ]
        }
      }
    })

    this.props.goToReviewCertificate(
      this.props.registrationId,
      this.props.event
    )
  }

  render = () => {
    const { intl, application, event, goBack } = this.props
    const eventDate = getEventDate(application.data, event)

    const paymentAmount = calculatePrice(event, eventDate)

    const serviceMessage = getServiceMessage(event, eventDate)

    return (
      <>
        <ActionPageLight title={'Certificate collection'} goBack={goBack}>
          <Header>{intl.formatMessage(messages.payment)}</Header>
          <Instruction>
            {intl.formatMessage(messages.paymentInstruction)}
          </Instruction>
          <GreyBody>
            <LabelValue
              id="service"
              label={intl.formatMessage(messages.receiptService)}
              value={intl.formatMessage(serviceMessage)}
            />
            <LabelValue
              id="amountDue"
              label={intl.formatMessage(messages.amountDue)}
              value={intl.formatMessage(messages.paymentAmount, {
                paymentAmount
              })}
            />
            <TertiaryButton
              id="print-receipt"
              icon={() => <Print />}
              align={0}
              onClick={() =>
                printMoneyReceipt(
                  this.props.intl,
                  this.props.application,
                  this.props.userDetails,
                  this.props.resources
                )
              }
            >
              {intl.formatMessage(messages.printReceipt)}
            </TertiaryButton>
          </GreyBody>
          <Action>
            <PrimaryButton
              id="Continue"
              onClick={() => this.continue(paymentAmount)}
            >
              {intl.formatMessage(buttonMessages.continueButton)}
            </PrimaryButton>
          </Action>
        </ActionPageLight>
      </>
    )
  }
}

const getEvent = (eventType: string | undefined) => {
  switch (eventType && eventType.toLowerCase()) {
    case 'birth':
    default:
      return Event.BIRTH
    case 'death':
      return Event.DEATH
  }
}

function mapStatetoProps(
  state: IStoreState,
  props: RouteComponentProps<{ registrationId: string; eventType: string }>
) {
  const { registrationId, eventType } = props.match.params
  const event = getEvent(eventType)
  const application = state.applicationsState.applications.find(
    app => app.id === registrationId && app.event === event
  ) as IPrintableApplication | undefined

  if (!application) {
    throw new Error(`Application "${registrationId}" missing!`)
  }

  return {
    event: application.event,
    registrationId,
    language: state.i18n.language,
    application,
    userDetails: getUserDetails(state),
    resources: getOfflineData(state)
  }
}

export const Payment = connect(mapStatetoProps, {
  goBack: goBackAction,
  modifyApplication,
  goToReviewCertificate: goToReviewCertificateAction
})(injectIntl(withTheme(PaymentComponent)))
