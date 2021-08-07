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
import { PDFViewer } from '@opencrvs/components/lib/forms'
import { Check } from '@opencrvs/components/lib/icons'
import {
  ResponsiveModal,
  ActionPageLight
} from '@opencrvs/components/lib/interface'
import {
  IPrintableApplication,
  IApplicationsState,
  modifyApplication,
  writeApplication,
  storeApplication,
  SUBMISSION_STATUS
} from '@opencrvs/client/src/applications'
import { Action, Event, IForm } from '@client/forms'
import { constantsMessages } from '@client/i18n/messages'
import { buttonMessages } from '@client/i18n/messages/buttons'
import { messages as certificateMessages } from '@client/i18n/messages/views/certificate'
import {
  goToRegistrarHomeTab as goToRegistrarHomeTabAction,
  goBack
} from '@client/navigation'
import { IStoreState } from '@client/store'
import styled from '@client/styledComponents'
import { TAB_ID } from '@client/views/RegistrationHome/tabs/inProgress/inProgressTab'
import * as React from 'react'
import { WrappedComponentProps as IntlShapeProps, injectIntl } from 'react-intl'
import { connect } from 'react-redux'
import { RouteComponentProps } from 'react-router'
import { getUserDetails } from '@client/profile/profileSelectors'
import { IUserDetails } from '@client/utils/userUtils'
import {
  previewCertificate,
  printCertificate
} from '@client/views/PrintCertificate/PDFUtils'
import { getEventRegisterForm } from '@client/forms/register/application-selectors'
import { IOfflineData } from '@client/offline/reducer'
import {
  getCountryTranslations,
  IAvailableCountries,
  isCertificateForPrintInAdvance,
  getEventDate,
  isFreeOfCost,
  calculatePrice
} from './utils'
import { getOfflineData } from '@client/offline/selectors'
import { countries } from '@client/forms/countries'

export const ActionPageWrapper = styled.div`
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  background: ${({ theme }) => theme.colors.background};
  z-index: 4;
  width: 100%;
  height: 100%;
  overflow-y: scroll;
`

const CustomTertiaryButton = styled(TertiaryButton)`
  height: 48px;
  &:disabled {
    background: ${({ theme }) => theme.colors.white};
    color: ${({ theme }) => theme.colors.scrollBarGrey};
  }
`
const ButtonWrapper = styled.div`
  display: flex;

  button {
    margin-right: 10px;
  }
  button:last-child {
    margin-right: 0px;
  }
`
const PdfWrapper = styled.div`
  ${({ theme }) => theme.shadows.mistyShadow};
  background: ${({ theme }) => theme.colors.blueDeepSeaLight};
  display: flex;
  height: 100%;
  align-items: center;
  justify-content: center;
  margin-bottom: 32px;
`

const Info = styled.div`
  ${({ theme }) => theme.fonts.bodyStyle};
  margin-bottom: 30px;
  color: ${({ theme }) => theme.colors.menuBackground};
  width: 80%;
`
const Title = styled.h4`
  ${({ theme }) => theme.fonts.h4Style};
  margin: 0 0 20px 0;
`

type State = {
  certificatePdf: string | null
  showConfirmationModal: boolean
}
type IProps = {
  event: Event
  registrationId: string
  draft: IPrintableApplication
  userDetails: IUserDetails | null
  countries: IAvailableCountries[]
  registerForm: IForm
  resources: IOfflineData
  goBack: typeof goBack
  modifyApplication: typeof modifyApplication
  writeApplication: typeof writeApplication
  goToRegistrarHomeTabAction: typeof goToRegistrarHomeTabAction
  storeApplication: typeof storeApplication
}

type IFullProps = IntlShapeProps &
  RouteComponentProps<{}> &
  IProps & { drafts: IApplicationsState }

class ReviewCertificateActionComponent extends React.Component<
  IFullProps,
  State
> {
  constructor(props: IFullProps) {
    super(props)
    this.state = {
      certificatePdf: null,
      showConfirmationModal: false
    }
  }
  componentDidMount() {
    if (this.state.certificatePdf === null) {
      previewCertificate(
        this.props.intl,
        this.props.draft,
        this.props.userDetails,
        this.props.resources,
        (base64PDF: string) => {
          this.setState({
            certificatePdf: base64PDF
          })
        },
        this.props.countries
      )
    }
  }

  toggleModal = () => {
    this.setState({
      showConfirmationModal: !this.state.showConfirmationModal
    })
  }

  readyToCertify = () => {
    const { draft } = this.props
    draft.submissionStatus = SUBMISSION_STATUS.READY_TO_CERTIFY
    draft.action = Action.COLLECT_CERTIFICATE

    const certificate = draft.data.registration.certificates[0]
    const eventDate = getEventDate(draft.data, draft.event)
    let submittableCertificate
    if (isCertificateForPrintInAdvance(draft)) {
      if (isFreeOfCost(draft.event, eventDate)) {
        submittableCertificate = {}
      } else {
        const paymentAmount = calculatePrice(draft.event, eventDate)
        submittableCertificate = {
          payments: {
            type: 'MANUAL' as const,
            total: Number(paymentAmount),
            amount: Number(paymentAmount),
            outcome: 'COMPLETED' as const,
            date: Date.now()
          }
        }
      }
    } else {
      submittableCertificate = certificate
    }
    draft.data.registration = {
      ...draft.data.registration,
      certificates: [
        {
          ...submittableCertificate,
          data:
            this.state.certificatePdf === null ? '' : this.state.certificatePdf
        }
      ]
    }
    printCertificate(
      this.props.intl,
      draft,
      this.props.userDetails,
      this.props.resources,
      this.props.countries
    )
    this.props.modifyApplication(draft)
    this.props.writeApplication(draft)
    this.toggleModal()
    this.props.goToRegistrarHomeTabAction(TAB_ID.readyForPrint)
  }

  getTitle = () => {
    const { intl, event } = this.props
    let eventName = intl.formatMessage(constantsMessages.birth).toLowerCase()

    switch (event) {
      case Event.BIRTH:
        return intl.formatMessage(certificateMessages.retiewTitle, {
          event: eventName
        })
      case Event.DEATH:
        eventName = intl.formatMessage(constantsMessages.death).toLowerCase()
        return intl.formatMessage(certificateMessages.reviewTitle, {
          event: eventName
        })
      default:
        return intl.formatMessage(certificateMessages.retiewTitle, {
          event: eventName
        })
    }
  }

  goBack = () => {
    const historyState = this.props.location.state as any
    const naviagatedFromInsideApp = Boolean(
      historyState && historyState.isNavigatedInsideApp
    )
    if (naviagatedFromInsideApp) {
      this.props.goBack()
    } else {
      this.props.goToRegistrarHomeTabAction(TAB_ID.readyForPrint)
    }
  }

  render = () => {
    const { intl } = this.props

    return (
      <ActionPageLight
        id="collector_form"
        title={intl.formatMessage(
          certificateMessages.certificateCollectionTitle
        )}
        goBack={this.goBack}
      >
        <Title>{this.getTitle()}</Title>
        <Info>{intl.formatMessage(certificateMessages.retiewDescription)}</Info>

        <PdfWrapper id="pdfwrapper">
          <PDFViewer id="pdfholder" pdfSource={this.state.certificatePdf} />
        </PdfWrapper>

        <ButtonWrapper>
          <PrimaryButton
            align={0}
            id="confirm-print"
            onClick={this.toggleModal}
            icon={() => <Check />}
          >
            {intl.formatMessage(certificateMessages.confirmAndPrint)}
          </PrimaryButton>

          <CustomTertiaryButton disabled>
            {intl.formatMessage(buttonMessages.editRecord)}
          </CustomTertiaryButton>
        </ButtonWrapper>

        <ResponsiveModal
          id="confirm-print-modal"
          title={intl.formatMessage(certificateMessages.modalTitle)}
          actions={[
            <CustomTertiaryButton onClick={this.toggleModal} id="close-modal">
              {intl.formatMessage(buttonMessages.cancel)}
            </CustomTertiaryButton>,
            <PrimaryButton onClick={this.readyToCertify} id="print-certificate">
              {intl.formatMessage(buttonMessages.print)}
            </PrimaryButton>
          ]}
          show={this.state.showConfirmationModal}
          handleClose={this.toggleModal}
          contentHeight={100}
        >
          {intl.formatMessage(certificateMessages.modalBody)}
        </ResponsiveModal>
      </ActionPageLight>
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

const getDraft = (
  drafts: IPrintableApplication[],
  registrationId: string,
  eventType: string
) =>
  drafts.find(draftItem => draftItem.id === registrationId) ||
  ({
    id: '',
    data: {},
    event: getEvent(eventType)
  } as IPrintableApplication)

function mapStatetoProps(
  state: IStoreState,
  props: RouteComponentProps<{ registrationId: string; eventType: string }>
) {
  const { registrationId, eventType } = props.match.params
  const applications = state.applicationsState
    .applications as IPrintableApplication[]

  const draft = getDraft(applications, registrationId, eventType)
  const event = getEvent(draft.event)

  return {
    event,
    registrationId,
    draft,
    countries: getCountryTranslations(state.i18n.languages, countries),
    drafts: state.applicationsState,
    userDetails: getUserDetails(state),
    resources: getOfflineData(state),
    registerForm: getEventRegisterForm(state, event)
  }
}
const mapDispatchToProps = {
  modifyApplication,
  writeApplication,
  goToRegistrarHomeTabAction,
  storeApplication,
  goBack
}
export const ReviewCertificateAction = connect(
  mapStatetoProps,
  mapDispatchToProps
)(injectIntl<'intl', IFullProps>(ReviewCertificateActionComponent))
