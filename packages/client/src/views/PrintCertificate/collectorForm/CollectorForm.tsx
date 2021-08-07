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
import { ErrorText } from '@opencrvs/components/lib/forms/ErrorText'
import {
  ActionPageLight,
  ResponsiveModal
} from '@opencrvs/components/lib/interface'
import {
  createReviewApplication,
  modifyApplication,
  storeApplication,
  writeApplication,
  IPrintableApplication,
  ICertificate
} from '@client/applications'
import { FormFieldGenerator } from '@client/components/form'
import {
  Action,
  Event,
  IForm,
  IFormData,
  IFormField,
  IFormSection,
  IFormSectionData,
  IFormSectionGroup
} from '@client/forms'
import { getVisibleSectionGroupsBasedOnConditions } from '@client/forms/utils'
import {
  getValidationErrorsForForm,
  IFieldErrors
} from '@client/forms/validation'
import { buttonMessages, errorMessages } from '@client/i18n/messages'
import { messages as certificateMessages } from '@client/i18n/messages/views/certificate'
import {
  goBack,
  goToPrintCertificate,
  goToPrintCertificatePayment,
  goToReviewCertificate,
  goToVerifyCollector
} from '@client/navigation'
import { CERTIFICATE_COLLECTOR } from '@client/navigation/routes'
import { IStoreState } from '@client/store'
import styled, { ITheme } from '@client/styledComponents'
import { gqlToDraftTransformer } from '@client/transformer'
import {
  QueryContext,
  QueryProvider
} from '@client/views/DataProvider/QueryProvider'
import {
  getEvent,
  getEventDate,
  isFreeOfCost,
  isCertificateForPrintInAdvance
} from '@client/views/PrintCertificate/utils'
import { StyledSpinner } from '@client/views/RegistrationHome/RegistrationHome'
// eslint-disable-next-line no-restricted-imports
import * as Sentry from '@sentry/browser'
import { flatten, cloneDeep, get, isEqual } from 'lodash'
import * as React from 'react'
import { WrappedComponentProps as IntlShapeProps, injectIntl } from 'react-intl'
import { connect } from 'react-redux'
import { RouteComponentProps } from 'react-router'
import { withTheme } from 'styled-components'
import { IValidationResult } from '@client/utils/validate'
import { getRegisterForm } from '@client/forms/register/application-selectors'
import {
  certCollectorGroupForBirthAppWithParentDetails,
  certCollectorGroupForBirthAppWithoutFatherDetails,
  certCollectorGroupForBirthAppWithoutParentDetails,
  certCollectorGroupForBirthAppWithoutMotherDetails
} from '@client/forms/certificate/fieldDefinitions/collectorSection'
import { replaceInitialValues } from '@client/views/RegisterForm/RegisterForm'

const FormSectionTitle = styled.h4`
  ${({ theme }) => theme.fonts.h4Style};
  color: ${({ theme }) => theme.colors.copy};
  margin-top: 0px;
  margin-bottom: 16px;
`

const ErrorWrapper = styled.div`
  margin-top: -3px;
  margin-bottom: 16px;
`

interface IBaseProps {
  registerForm: IForm
  event: Event
  pageRoute: string
  applicationId: string
  application: IPrintableApplication | undefined
  formSection: IFormSection
  formGroup: IFormSectionGroup
  theme: ITheme
  goBack: typeof goBack
  storeApplication: typeof storeApplication
  writeApplication: typeof writeApplication
  modifyApplication: typeof modifyApplication
  goToPrintCertificate: typeof goToPrintCertificate
  goToVerifyCollector: typeof goToVerifyCollector
  goToReviewCertificate: typeof goToReviewCertificate
  goToPrintCertificatePayment: typeof goToPrintCertificatePayment
}

type IProps = IBaseProps & IntlShapeProps

function getNextSectionIds(
  formSection: IFormSection,
  formSectionGroup: IFormSectionGroup,
  application?: IPrintableApplication
) {
  const certificates = application && application.data.registration.certificates

  const certificate = (certificates && certificates[0]) || {}
  const visibleGroups = getVisibleSectionGroupsBasedOnConditions(
    formSection,
    (certificate[
      formSection.id as keyof typeof certificate
    ] as IFormSectionData) || {}
  )
  const currentGroupIndex = visibleGroups.findIndex(
    (group: IFormSectionGroup) => group.id === formSectionGroup.id
  )

  if (currentGroupIndex === visibleGroups.length - 1) {
    return null
  }
  return {
    sectionId: formSection.id,
    groupId: visibleGroups[currentGroupIndex + 1].id
  }
}

const getErrorsOnFieldsBySection = (
  sectionId: keyof IPrintableApplication['data'],
  fields: IFormField[],
  draft: IPrintableApplication
) => {
  const certificates = draft.data.registration.certificates
  const certificate = (certificates && certificates[0]) || {}
  const errors = getValidationErrorsForForm(
    fields,
    (certificate[sectionId as keyof typeof certificate] as IFormSectionData) ||
      {}
  )

  return {
    [sectionId]: fields.reduce((fields, field) => {
      const validationErrors: IValidationResult[] = (errors[
        field.name as keyof typeof errors
      ] as IFieldErrors).errors

      const value = draft.data[sectionId]
        ? draft.data[sectionId][field.name]
        : null

      const informationMissing =
        validationErrors.length > 0 || value === null ? validationErrors : []

      return { ...fields, [field.name]: informationMissing }
    }, {})
  }
}

interface IState {
  showError: boolean
  showModalForNoSignedAffidavit: boolean
}

class CollectorFormComponent extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props)
    this.state = {
      showError: false,
      showModalForNoSignedAffidavit: false
    }
  }
  modifyApplication = (
    sectionData: ICertificate['collector'],
    application: IPrintableApplication
  ) => {
    const certificates = application.data.registration.certificates
    const certificate = (certificates && certificates[0]) || {}
    const collector = { ...(certificate.collector || {}), ...sectionData }

    this.props.modifyApplication({
      ...application,
      data: {
        ...application.data,
        registration: {
          ...application.data.registration,
          certificates: [
            {
              collector: collector,
              hasShowedVerifiedDocument: false
            }
          ]
        }
      }
    })
  }

  continueButtonHandler = (
    applicationId: string,
    currentGroup: string,
    nextGroup: string | undefined,
    event: Event,
    sectionId: keyof IPrintableApplication['data'],
    fields: IFormField[],
    draft: IPrintableApplication | undefined
  ) => {
    if (!draft) return

    const errors = getErrorsOnFieldsBySection(sectionId, fields, draft)
    const errorValues = Object.values(errors).map(Object.values)
    const errLength = flatten(errorValues).filter(errs => errs.length > 0)
      .length

    const certificates = draft.data.registration.certificates
    const certificate = (certificates && certificates[0]) || {}
    const collector = certificate[
      sectionId as keyof typeof certificate
    ] as IFormSectionData

    if (errLength > 0) {
      this.setState({
        showError: true
      })

      return
    }

    if (currentGroup === 'affidavit') {
      if (
        collector.affidavitFile &&
        (collector.affidavitFile as IFormSectionData).data
      ) {
        this.props.writeApplication(draft)
        this.goToNextFormForSomeoneElse(applicationId, draft, event)

        return
      }
      if (
        !(
          collector.noAffidavitAgreement &&
          (collector.noAffidavitAgreement as string[]).length > 0
        )
      ) {
        this.setState({
          showError: true
        })

        return
      }

      this.props.writeApplication(draft)
      this.setState({ showModalForNoSignedAffidavit: true })

      return
    }

    this.setState({
      showError: false,
      showModalForNoSignedAffidavit: false
    })
    if (!nextGroup) {
      this.props.writeApplication(draft)

      if (isCertificateForPrintInAdvance(draft)) {
        this.props.goToReviewCertificate(applicationId, event)
      } else {
        this.props.goToVerifyCollector(
          applicationId,
          event,
          collector.type as string
        )
      }
    } else {
      this.props.goToPrintCertificate(applicationId, event, nextGroup)
    }
  }

  goToNextFormForSomeoneElse = (
    applicationId: string,
    application: IPrintableApplication,
    event: Event
  ) => {
    if (isFreeOfCost(event, getEventDate(application.data, event))) {
      this.props.goToReviewCertificate(applicationId, event)
    } else {
      this.props.goToPrintCertificatePayment(applicationId, event)
    }
  }

  toggleSubmitModalOpen = () => {
    this.setState(prevState => ({
      showModalForNoSignedAffidavit: !prevState.showModalForNoSignedAffidavit
    }))
  }

  resetCertificatesInformation = () => {
    const application = Object.assign({}, this.props.application)
    application.data.registration.certificates = []
    this.props.modifyApplication(application)
  }

  render() {
    const {
      intl,
      event,
      applicationId,
      application,
      formSection,
      formGroup,
      goBack,
      registerForm
    } = this.props

    const { showError, showModalForNoSignedAffidavit } = this.state

    const nextSectionGroup = getNextSectionIds(
      formSection,
      formGroup,
      application
    )
    const applicationToBeCertified = application

    if (
      !applicationToBeCertified ||
      !applicationToBeCertified.data.registration.regStatus
    ) {
      return (
        <QueryProvider
          event={event}
          action={Action.LOAD_CERTIFICATE_APPLICATION}
          payload={{ id: applicationId }}
          fetchPolicy="no-cache"
        >
          <QueryContext.Consumer>
            {({ loading, error, data, dataKey }) => {
              if (loading) {
                return <StyledSpinner id="print-certificate-spinner" />
              }
              if (error) {
                Sentry.captureException(error)

                return (
                  <ErrorText id="print-certificate-queue-error-text">
                    {intl.formatMessage(errorMessages.printQueryError)}
                  </ErrorText>
                )
              }
              if (data) {
                const retrievedData = data[dataKey as keyof typeof data]
                const transformedData: IFormData = gqlToDraftTransformer(
                  registerForm,
                  retrievedData
                )

                const newApplicationToBeCertified = createReviewApplication(
                  applicationId,
                  transformedData,
                  event
                )

                if (applicationToBeCertified) {
                  this.props.modifyApplication(newApplicationToBeCertified)
                } else {
                  this.props.storeApplication(newApplicationToBeCertified)
                }
              }
            }}
          </QueryContext.Consumer>
        </QueryProvider>
      )
    }
    return (
      <>
        <ActionPageLight
          id="collector_form"
          title={intl.formatMessage(formSection.title)}
          goBack={goBack}
        >
          <FormSectionTitle>
            {formGroup.fields.length === 1 &&
              (formGroup.fields[0].hideHeader = true)}
            <>
              {(formGroup.title && intl.formatMessage(formGroup.title)) || ''}
            </>
          </FormSectionTitle>
          {showError && (
            <ErrorWrapper>
              <ErrorText id="form_error" ignoreMediaQuery={true}>
                {(formGroup.error && intl.formatMessage(formGroup.error)) || ''}
              </ErrorText>
            </ErrorWrapper>
          )}
          <FormFieldGenerator
            id={formGroup.id}
            onChange={values => {
              if (values && values.affidavitFile) {
                this.setState({
                  showError: false
                })
              }
              this.modifyApplication(values, applicationToBeCertified)
            }}
            setAllFieldsDirty={false}
            fields={formGroup.fields}
            draftData={applicationToBeCertified.data}
          />
          <PrimaryButton
            id="confirm_form"
            onClick={() => {
              this.continueButtonHandler(
                applicationToBeCertified.id,
                formGroup.id,
                nextSectionGroup ? nextSectionGroup.groupId : undefined,
                event,
                formSection.id,
                formGroup.fields,
                applicationToBeCertified
              )
            }}
          >
            {intl.formatMessage(buttonMessages.continueButton)}
          </PrimaryButton>
        </ActionPageLight>
        {showModalForNoSignedAffidavit && (
          <ResponsiveModal
            id="noAffidavitAgreementConfirmationModal"
            title={intl.formatMessage(
              certificateMessages.noAffidavitModalTitle
            )}
            contentHeight={96}
            actions={[
              <TertiaryButton
                id="cancel-btn"
                key="cancel"
                onClick={this.toggleSubmitModalOpen}
              >
                {intl.formatMessage(buttonMessages.cancel)}
              </TertiaryButton>,
              <PrimaryButton
                key="submit"
                id="submit_confirm"
                onClick={() =>
                  this.goToNextFormForSomeoneElse(
                    applicationId,
                    applicationToBeCertified,
                    event
                  )
                }
              >
                {intl.formatMessage(buttonMessages.continueButton)}
              </PrimaryButton>
            ]}
            show={showModalForNoSignedAffidavit}
            handleClose={this.toggleSubmitModalOpen}
          >
            {intl.formatMessage(
              certificateMessages.noAffidavitModalDescription
            )}
          </ResponsiveModal>
        )}
      </>
    )
  }
}

const getCollectCertificateForm = (event: Event, state: IStoreState) => {
  switch (event) {
    case Event.BIRTH:
    default:
      return state.printCertificateForm.collectBirthCertificateForm
    case Event.DEATH:
      return state.printCertificateForm.collectDeathCertificateForm
  }
}

const mapStateToProps = (
  state: IStoreState,
  props: RouteComponentProps<{
    registrationId: string
    eventType: string
    groupId: string
  }>
) => {
  const { registrationId, eventType, groupId } = props.match.params
  const event = getEvent(eventType)

  const application = state.applicationsState.applications.find(
    application => application.id === registrationId
  ) as IPrintableApplication | undefined

  const formSection = getCollectCertificateForm(event, state)
  const clonedFormSection = cloneDeep(formSection)
  if (event === Event.BIRTH && groupId === 'certCollector') {
    const applicationData = application && application.data

    const isMotherDeceased = isEqual(
      get(applicationData, 'primaryCaregiver.motherIsDeceased'),
      ['deceased']
    )
    const isFatherDeceased = isEqual(
      get(applicationData, 'primaryCaregiver.fatherIsDeceased'),
      ['deceased']
    )

    const motherDataExist =
      applicationData && applicationData.mother && !isMotherDeceased
    let fatherDataExist =
      applicationData && applicationData.father && !isFatherDeceased

    //TODO: This needs to be dynamic.
    // We shouldn't hardcode 'fathersDetailsExist' field check here
    // As it's part of the form definition so we can't ensure
    // that all countries will have this field in their definition
    if (
      applicationData &&
      applicationData.father &&
      applicationData.father.fathersDetailsExist !== undefined
    ) {
      fatherDataExist =
        fatherDataExist && applicationData.father.fathersDetailsExist
    }

    if (motherDataExist && fatherDataExist) {
      //  !!applicationData.father.fathersDetailsExist &&

      clonedFormSection.groups.unshift(
        certCollectorGroupForBirthAppWithParentDetails
      )
    } else if (fatherDataExist && !motherDataExist) {
      clonedFormSection.groups.unshift(
        certCollectorGroupForBirthAppWithoutMotherDetails
      )
    } else if (motherDataExist && !fatherDataExist) {
      clonedFormSection.groups.unshift(
        certCollectorGroupForBirthAppWithoutFatherDetails
      )
    } else if (!motherDataExist && !fatherDataExist) {
      clonedFormSection.groups.unshift(
        certCollectorGroupForBirthAppWithoutParentDetails
      )
    }
  }
  const formGroup =
    clonedFormSection.groups.find(group => group.id === groupId) ||
    clonedFormSection.groups[0]

  const fields = replaceInitialValues(
    formGroup.fields,
    (application &&
      application.data.registration.certificates &&
      application.data.registration.certificates[
        application.data.registration.certificates.length - 1
      ].collector) ||
      {},
    application && application.data
  )

  return {
    registerForm: getRegisterForm(state)[event],
    event,
    pageRoute: CERTIFICATE_COLLECTOR,
    applicationId: registrationId,
    application,
    formSection: clonedFormSection,
    formGroup: {
      ...formGroup,
      fields
    }
  }
}

export const CollectorForm = connect(mapStateToProps, {
  goBack,
  storeApplication,
  writeApplication,
  modifyApplication,
  goToPrintCertificate,
  goToVerifyCollector,
  goToReviewCertificate,
  goToPrintCertificatePayment
})(injectIntl(withTheme(CollectorFormComponent)))
