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
import { FormikTouched, FormikValues } from 'formik'
import { WrappedComponentProps as IntlShapeProps, injectIntl } from 'react-intl'
import { connect } from 'react-redux'
import { RouteComponentProps } from 'react-router'
import { isNull, isUndefined, merge, flatten } from 'lodash'
import debounce from 'lodash/debounce'
import {
  ICON_ALIGNMENT,
  PrimaryButton,
  TertiaryButton,
  LinkButton
} from '@opencrvs/components/lib/buttons'
import { BackArrow } from '@opencrvs/components/lib/icons'
import {
  EventTopBar,
  IEventTopBarProps,
  IEventTopBarMenuAction,
  ResponsiveModal,
  Spinner
} from '@opencrvs/components/lib/interface'
import { BodyContent, Container } from '@opencrvs/components/lib/layout'
import {
  deleteApplication,
  IApplication,
  IPayload,
  modifyApplication,
  SUBMISSION_STATUS,
  writeApplication
} from '@client/applications'
import {
  FormFieldGenerator,
  ITouchedNestedFields
} from '@client/components/form'
import { RejectRegistrationForm } from '@client/components/review/RejectRegistrationForm'
import {
  Event,
  IForm,
  IFormField,
  IFormSection,
  IFormSectionData,
  IFormSectionGroup,
  IFormData
} from '@client/forms'
import {
  goBack as goBackAction,
  goToHome,
  goToHomeTab,
  goToPageGroup as goToPageGroupAction
} from '@client/navigation'
import { toggleDraftSavedNotification } from '@client/notification/actions'
import { HOME } from '@client/navigation/routes'
import { getScope } from '@client/profile/profileSelectors'
import { IStoreState } from '@client/store'
import styled, { keyframes } from '@client/styledComponents'
import { Scope } from '@client/utils/authUtils'
import { ReviewSection } from '@client/views/RegisterForm/review/ReviewSection'
import {
  getVisibleSectionGroupsBasedOnConditions,
  getVisibleGroupFields,
  hasFormError,
  getSectionFields
} from '@client/forms/utils'
import { messages } from '@client/i18n/messages/views/register'
import { buttonMessages, formMessages } from '@client/i18n/messages'
import {
  PAGE_TRANSITIONS_ENTER_TIME,
  PAGE_TRANSITIONS_CLASSNAME,
  PAGE_TRANSITIONS_TIMING_FUNC_N_FILL_MODE,
  PAGE_TRANSITIONS_EXIT_TIME,
  DECLARED,
  REJECTED,
  VALIDATED
} from '@client/utils/constants'
import { TimeMounted } from '@client/components/TimeMounted'
import { getValueFromApplicationDataByKey } from '@client/pdfRenderer/transformer/utils'

const FormSectionTitle = styled.h4`
  ${({ theme }) => theme.fonts.h4Style};
  color: ${({ theme }) => theme.colors.copy};
  margin-top: 16px;
  margin-bottom: 24px;
`
const FooterArea = styled.div`
  padding-top: 6px;
  @media (max-width: ${({ theme }) => theme.grid.breakpoints.md}px) {
    padding-top: 0px;
  }
`

const Notice = styled.div`
  background: ${({ theme }) => theme.colors.primary};
  box-shadow: 0 0 12px 0 rgba(0, 0, 0, 0.11);
  padding: 25px;
  color: ${({ theme }) => theme.colors.white};
  ${({ theme }) => theme.fonts.bigBodyStyle};
  margin: 30px -25px;
`

const StyledLinkButton = styled(LinkButton)`
  margin-left: 32px;
`
const Required = styled.span<
  { disabled?: boolean } & React.LabelHTMLAttributes<HTMLLabelElement>
>`
  ${({ theme }) => theme.fonts.bigBodyStyle};
  color: ${({ disabled, theme }) =>
    disabled ? theme.colors.disabled : theme.colors.error};
  flex-grow: 0;
`

const Optional = styled.span<
  { disabled?: boolean } & React.LabelHTMLAttributes<HTMLLabelElement>
>`
  ${({ theme }) => theme.fonts.bigBodyStyle};
  color: ${({ disabled, theme }) =>
    disabled ? theme.colors.disabled : theme.colors.placeholder};
  flex-grow: 0;
`
const SpinnerWrapper = styled.div`
  height: 80vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 20px;
`

const ErrorText = styled.div`
  color: ${({ theme }) => theme.colors.error};
  ${({ theme }) => theme.fonts.bodyStyle};
  text-align: center;
  margin-top: 100px;
`
const VIEW_TYPE = {
  FORM: 'form',
  REVIEW: 'review',
  PREVIEW: 'preview',
  HIDDEN: 'hidden'
}

function getNextSectionIds(
  sections: IFormSection[],
  fromSection: IFormSection,
  fromSectionGroup: IFormSectionGroup,
  application: IApplication
): { [key: string]: string } | null {
  const visibleGroups = getVisibleSectionGroupsBasedOnConditions(
    fromSection,
    application.data[fromSection.id] || {},
    application.data
  )
  const currentGroupIndex = visibleGroups.findIndex(
    (group: IFormSectionGroup) => group.id === fromSectionGroup.id
  )

  if (currentGroupIndex === visibleGroups.length - 1) {
    const visibleSections = sections.filter(
      section =>
        section.viewType !== VIEW_TYPE.HIDDEN &&
        getVisibleSectionGroupsBasedOnConditions(
          section,
          application.data[fromSection.id] || {},
          application.data
        ).length > 0
    )

    const currentIndex = visibleSections.findIndex(
      (section: IFormSection) => section.id === fromSection.id
    )
    if (currentIndex === visibleSections.length - 1) {
      return null
    }

    return {
      sectionId: visibleSections[currentIndex + 1].id,
      groupId: visibleSections[currentIndex + 1].groups[0].id
    }
  }
  return {
    sectionId: fromSection.id,
    groupId: visibleGroups[currentGroupIndex + 1].id
  }
}

export interface IFormProps {
  application: IApplication
  registerForm: IForm
  pageRoute: string
  duplicate?: boolean
}

type DispatchProps = {
  goToPageGroup: typeof goToPageGroupAction
  goBack: typeof goBackAction
  goToHome: typeof goToHome
  goToHomeTab: typeof goToHomeTab
  writeApplication: typeof writeApplication
  modifyApplication: typeof modifyApplication
  deleteApplication: typeof deleteApplication
  toggleDraftSavedNotification: typeof toggleDraftSavedNotification
}

type Props = {
  activeSection: IFormSection
  activeSectionGroup: IFormSectionGroup
  setAllFieldsDirty: boolean
  fieldsToShowValidationErrors?: IFormField[]
  isWritingDraft: boolean
}

export type FullProps = IFormProps &
  Props &
  DispatchProps &
  IntlShapeProps & { scope: Scope } & RouteComponentProps<{
    pageId: string
    groupId?: string
    applicationId: string
  }>

type State = {
  isDataAltered: boolean
  rejectFormOpen: boolean
  hasError: boolean
  showConfirmationModal: boolean
}

const fadeFromTop = keyframes`
  to {
    -webkit-transform: translateY(100vh);
    transform: translateY(100vh);
  }
`
const StyledContainer = styled(Container)`
  &.${PAGE_TRANSITIONS_CLASSNAME}-exit {
    top: 0;
    z-index: 999;
    animation: ${fadeFromTop} ${PAGE_TRANSITIONS_EXIT_TIME}ms
      ${PAGE_TRANSITIONS_TIMING_FUNC_N_FILL_MODE};
  }

  &.${PAGE_TRANSITIONS_CLASSNAME}-exit-active {
    z-index: 999;
  }
`
class RegisterFormView extends React.Component<FullProps, State> {
  constructor(props: FullProps) {
    super(props)
    this.state = {
      isDataAltered: false,
      rejectFormOpen: false,
      hasError: false,
      showConfirmationModal: false
    }
  }
  setAllFormFieldsTouched!: (touched: FormikTouched<FormikValues>) => void

  showAllValidationErrors = () => {
    const touched = getSectionFields(
      this.props.activeSection,
      this.props.application.data[this.props.activeSection.id],
      this.props.application.data
    ).reduce((memo, field) => {
      let fieldTouched: boolean | ITouchedNestedFields = true
      if (field.nestedFields) {
        fieldTouched = {
          value: true,
          nestedFields: flatten(Object.values(field.nestedFields)).reduce(
            (nestedMemo, nestedField) => ({
              ...nestedMemo,
              [nestedField.name]: true
            }),
            {}
          )
        }
      }
      return { ...memo, [field.name]: fieldTouched }
    }, {})
    this.setAllFormFieldsTouched(touched)
  }

  userHasRegisterScope() {
    return this.props.scope && this.props.scope.includes('register')
  }

  userHasValidateScope() {
    return this.props.scope && this.props.scope.includes('validate')
  }

  componentDidUpdate(prevProps: FullProps) {
    const oldHash = prevProps.location && prevProps.location.hash
    const newHash = this.props.location && this.props.location.hash

    if (newHash && oldHash !== newHash && !newHash.match('form-input')) {
      this.props.history.replace({
        pathname: this.props.history.location.pathname,
        hash: newHash + '-form-input'
      })
    }
  }

  modifyApplication = (
    sectionData: IFormSectionData,
    activeSection: IFormSection,
    application: IApplication
  ) => {
    if (application.review && !this.state.isDataAltered) {
      this.setState({ isDataAltered: true })
    }
    this.props.modifyApplication({
      ...application,
      data: {
        ...application.data,
        [activeSection.id]: {
          ...application.data[activeSection.id],
          ...sectionData
        }
      }
    })
  }

  logTime(timeMs: number) {
    const application = this.props.application
    if (!application.timeLoggedMS) {
      application.timeLoggedMS = 0
    }
    application.timeLoggedMS += timeMs
    this.props.modifyApplication(application)
  }

  confirmSubmission = (
    application: IApplication,
    submissionStatus: string,
    action: string,
    payload?: IPayload,
    downloadStatus?: string
  ) => {
    application.submissionStatus = submissionStatus
    application.action = action
    application.payload = payload
    application.downloadStatus = downloadStatus
    this.props.writeApplication(application)
    this.props.history.push(HOME)
  }

  generateSectionListForReview = (
    disabled: boolean,
    sections: IFormSection[]
  ) => {
    const result: IFormSection[] = sections.map((section: IFormSection) => {
      return merge(
        {
          disabled: section.viewType !== VIEW_TYPE.REVIEW && disabled
        },
        section
      )
    })
    return result
  }

  toggleRejectForm = () => {
    this.setState(state => ({
      rejectFormOpen: !state.rejectFormOpen
    }))
  }

  toggleConfirmationModal = () => {
    this.setState(prevState => ({
      showConfirmationModal: !prevState.showConfirmationModal
    }))
  }

  getEvent() {
    const eventType = this.props.application.event || 'BIRTH'
    switch (eventType.toLocaleLowerCase()) {
      case 'birth':
        return Event.BIRTH
      case 'death':
        return Event.DEATH
      default:
        return Event.BIRTH
    }
  }

  onSaveAsDraftClicked = async () => {
    const { application } = this.props
    const isRegistrarOrRegistrationAgent =
      this.userHasRegisterScope() || this.userHasValidateScope()
    const isConfirmationModalApplicable =
      application.registrationStatus === DECLARED ||
      application.registrationStatus === VALIDATED ||
      application.registrationStatus === REJECTED
    if (isRegistrarOrRegistrationAgent && isConfirmationModalApplicable) {
      this.toggleConfirmationModal()
    } else {
      this.writeApplicationAndGoToHome()
    }
  }

  writeApplicationAndGoToHome = () => {
    this.props.writeApplication(this.props.application)
    this.props.goToHomeTab(this.getRedirectionTabOnSaveOrExit())
  }

  onDeleteApplication = (application: IApplication) => {
    this.props.goToHomeTab('progress')

    setTimeout(
      () => this.props.deleteApplication(application),
      PAGE_TRANSITIONS_ENTER_TIME + 200
    )
  }

  onCloseApplication = () => {
    this.props.goToHomeTab(this.getRedirectionTabOnSaveOrExit())
  }

  continueButtonHandler = async (
    pageRoute: string,
    applicationId: string,
    pageId: string,
    groupId: string,
    event: string
  ) => {
    const { preventContinueIfError } = this.props.activeSectionGroup
    let groupHasError = false
    if (preventContinueIfError) {
      if (!this.props.application.data[this.props.activeSection.id]) {
        groupHasError = true
      } else {
        const activeSectionFields = this.props.activeSectionGroup.fields
        const activeSectionValues = this.props.application.data[
          this.props.activeSection.id
        ]
        groupHasError = hasFormError(activeSectionFields, activeSectionValues)
      }
      if (groupHasError) {
        this.showAllValidationErrors()
        return
      }
    }

    this.props.writeApplication(this.props.application, () => {
      this.updateVisitedGroups()
      this.props.goToPageGroup(pageRoute, applicationId, pageId, groupId, event)
    })
  }

  updateVisitedGroups = () => {
    const visitedGroups = this.props.application.visitedGroupIds || []
    if (
      visitedGroups.findIndex(
        visitedGroup =>
          visitedGroup.sectionId === this.props.activeSection.id &&
          visitedGroup.groupId === this.props.activeSectionGroup.id
      ) === -1
    ) {
      visitedGroups.push({
        sectionId: this.props.activeSection.id,
        groupId: this.props.activeSectionGroup.id
      })
    }
    this.props.application.visitedGroupIds = visitedGroups
  }

  getRedirectionTabOnSaveOrExit = () => {
    const status =
      this.props.application.submissionStatus ||
      this.props.application.registrationStatus ||
      ''
    switch (status) {
      case 'DECLARED':
        return 'review'
      case 'DRAFT':
        return 'progress'
      case 'IN_PROGRESS':
        return 'progress/field-agents'
      case 'REJECTED':
        return 'updates'
      case 'VALIDATED':
        return 'review'
      default:
        return 'progress'
    }
  }

  getEventTopBarPropsForForm = (menuOption: IEventTopBarMenuAction) => {
    const { intl, application, activeSectionGroup, goToHomeTab } = this.props

    let eventTopBarProps: IEventTopBarProps = {
      title: intl.formatMessage(messages.newVitalEventRegistration, {
        event: application.event
      }),
      iconColor:
        application.submissionStatus === SUBMISSION_STATUS.DRAFT
          ? 'violet'
          : 'orange'
    }

    if (!!activeSectionGroup.showExitButtonOnly) {
      eventTopBarProps = {
        ...eventTopBarProps,
        exitAction: {
          handler: () => {
            application.submissionStatus === SUBMISSION_STATUS.DRAFT
              ? this.onDeleteApplication(application)
              : goToHomeTab(this.getRedirectionTabOnSaveOrExit())
          },
          label: intl.formatMessage(buttonMessages.exitButton)
        }
      }
    } else {
      eventTopBarProps = {
        ...eventTopBarProps,
        saveAction: {
          handler: this.onSaveAsDraftClicked,
          label: intl.formatMessage(buttonMessages.saveExitButton)
        },
        menuItems: [menuOption]
      }
    }
    return eventTopBarProps
  }

  render() {
    const {
      intl,
      setAllFieldsDirty,
      fieldsToShowValidationErrors,
      application,
      registerForm,

      duplicate,
      activeSection,
      activeSectionGroup
    } = this.props

    const nextSectionGroup = getNextSectionIds(
      registerForm.sections,
      activeSection,
      activeSectionGroup,
      application
    )

    const isErrorOccured = this.state.hasError
    const debouncedModifyApplication = debounce(this.modifyApplication, 300)

    const menuItemDeleteOrClose =
      application.submissionStatus === SUBMISSION_STATUS.DRAFT
        ? {
            label: intl.formatMessage(buttonMessages.deleteApplication),
            handler: () => this.onDeleteApplication(application)
          }
        : {
            label: intl.formatMessage(buttonMessages.closeApplication),
            handler: () => this.onCloseApplication()
          }

    return (
      <>
        <TimeMounted
          onUnmount={(duration: number) => {
            this.logTime(duration)
          }}
        ></TimeMounted>
        <StyledContainer
          className={PAGE_TRANSITIONS_CLASSNAME}
          id="informant_parent_view"
        >
          {isErrorOccured && (
            <ErrorText id="error_message_section">
              {intl.formatMessage(messages.registerFormQueryError)}
            </ErrorText>
          )}
          {!isErrorOccured && (
            <>
              {activeSection.viewType === VIEW_TYPE.PREVIEW && (
                <>
                  <EventTopBar
                    title={intl.formatMessage(
                      messages.newVitalEventRegistration,
                      {
                        event: application.event
                      }
                    )}
                    iconColor={
                      application.submissionStatus === SUBMISSION_STATUS.DRAFT
                        ? 'violet'
                        : 'orange'
                    }
                    saveAction={{
                      handler: this.onSaveAsDraftClicked,
                      label: intl.formatMessage(buttonMessages.saveExitButton)
                    }}
                    menuItems={[menuItemDeleteOrClose]}
                  />
                  <ReviewSection
                    pageRoute={this.props.pageRoute}
                    draft={application}
                    submitClickEvent={this.confirmSubmission}
                    onChangeReviewForm={this.modifyApplication}
                  />
                </>
              )}
              {activeSection.viewType === VIEW_TYPE.REVIEW && (
                <>
                  <EventTopBar
                    title={intl.formatMessage(
                      messages.newVitalEventRegistration,
                      {
                        event: application.event
                      }
                    )}
                    iconColor={
                      application.submissionStatus === SUBMISSION_STATUS.DRAFT
                        ? 'violet'
                        : 'orange'
                    }
                    saveAction={{
                      handler: () =>
                        this.props.goToHomeTab(
                          this.getRedirectionTabOnSaveOrExit()
                        ),
                      label: intl.formatMessage(buttonMessages.exitButton)
                    }}
                  />
                  <ReviewSection
                    pageRoute={this.props.pageRoute}
                    draft={application}
                    rejectApplicationClickEvent={this.toggleRejectForm}
                    submitClickEvent={this.confirmSubmission}
                    onChangeReviewForm={this.modifyApplication}
                  />
                </>
              )}

              {activeSection.viewType === VIEW_TYPE.FORM && (
                <>
                  <EventTopBar
                    {...this.getEventTopBarPropsForForm(menuItemDeleteOrClose)}
                  />
                  <BodyContent id="register_form">
                    {this.props.isWritingDraft ? (
                      <SpinnerWrapper>
                        <Spinner id="draft_write_loading" />
                      </SpinnerWrapper>
                    ) : (
                      <>
                        <TertiaryButton
                          align={ICON_ALIGNMENT.LEFT}
                          icon={() => <BackArrow />}
                          onClick={this.props.goBack}
                        >
                          {intl.formatMessage(buttonMessages.back)}
                        </TertiaryButton>
                        <FormSectionTitle
                          id={`form_section_title_${activeSectionGroup.id}`}
                        >
                          {(!activeSectionGroup.ignoreSingleFieldView &&
                            activeSectionGroup.fields.length === 1 && (
                              <>
                                {
                                  (activeSectionGroup.fields[0].hideHeader = true)
                                }
                                {intl.formatMessage(
                                  activeSectionGroup.fields[0].label
                                )}
                                {activeSectionGroup.fields[0].required && (
                                  <Required
                                    disabled={
                                      activeSectionGroup.disabled ||
                                      activeSection.disabled ||
                                      false
                                    }
                                  >
                                    &nbsp;*
                                  </Required>
                                )}
                              </>
                            )) || (
                            <>
                              {intl.formatMessage(
                                activeSectionGroup.title || activeSection.title
                              )}
                              {activeSection.optional && (
                                <Optional
                                  id={`form_section_opt_label_${activeSectionGroup.id}`}
                                  disabled={
                                    activeSectionGroup.disabled ||
                                    activeSection.disabled
                                  }
                                >
                                  &nbsp;&nbsp;•&nbsp;
                                  {intl.formatMessage(
                                    formMessages.optionalLabel
                                  )}
                                </Optional>
                              )}
                            </>
                          )}
                        </FormSectionTitle>
                        {activeSection.notice && (
                          <Notice
                            id={`form_section_notice_${activeSectionGroup.id}`}
                          >
                            {intl.formatMessage(activeSection.notice)}
                          </Notice>
                        )}
                        <form
                          id={`form_section_id_${activeSectionGroup.id}`}
                          onSubmit={(event: React.FormEvent) =>
                            event.preventDefault()
                          }
                        >
                          <FormFieldGenerator
                            id={activeSectionGroup.id}
                            onChange={values => {
                              debouncedModifyApplication(
                                values,
                                activeSection,
                                application
                              )
                            }}
                            setAllFieldsDirty={setAllFieldsDirty}
                            fieldsToShowValidationErrors={
                              fieldsToShowValidationErrors
                            }
                            fields={getVisibleGroupFields(activeSectionGroup)}
                            draftData={application.data}
                            onSetTouched={setTouchedFunc => {
                              this.setAllFormFieldsTouched = setTouchedFunc
                            }}
                          />
                        </form>
                        {nextSectionGroup && (
                          <FooterArea>
                            <PrimaryButton
                              id="next_section"
                              onClick={() => {
                                this.continueButtonHandler(
                                  this.props.pageRoute,
                                  application.id,
                                  nextSectionGroup.sectionId,
                                  nextSectionGroup.groupId,
                                  application.event.toLowerCase()
                                )
                              }}
                            >
                              {intl.formatMessage(
                                buttonMessages.continueButton
                              )}
                            </PrimaryButton>
                            {application.review && (
                              <StyledLinkButton
                                id="back-to-review-button"
                                className="item"
                                onClick={() => {
                                  this.continueButtonHandler(
                                    this.props.pageRoute,
                                    application.id,
                                    application.submissionStatus &&
                                      application.submissionStatus ===
                                        SUBMISSION_STATUS.DRAFT
                                      ? 'preview'
                                      : 'review',
                                    application.submissionStatus &&
                                      application.submissionStatus ===
                                        SUBMISSION_STATUS.DRAFT
                                      ? 'preview-view-group'
                                      : 'review-view-group',
                                    application.event.toLowerCase()
                                  )
                                }}
                              >
                                {intl.formatMessage(
                                  messages.backToReviewButton
                                )}
                              </StyledLinkButton>
                            )}
                          </FooterArea>
                        )}
                      </>
                    )}
                  </BodyContent>
                </>
              )}
            </>
          )}
          {this.state.rejectFormOpen && (
            <RejectRegistrationForm
              onClose={this.toggleRejectForm}
              confirmRejectionEvent={this.confirmSubmission}
              duplicate={duplicate}
              draftId={application.id}
              event={this.getEvent()}
              application={application}
            />
          )}
          <ResponsiveModal
            id="save_application_confirmation"
            title={intl.formatMessage(
              messages.saveApplicationConfirmModalTitle
            )}
            show={this.state.showConfirmationModal}
            handleClose={this.toggleConfirmationModal}
            responsive={false}
            contentHeight={80}
            actions={[
              <TertiaryButton
                id="cancel_save"
                key="cancel_save"
                onClick={this.toggleConfirmationModal}
              >
                {intl.formatMessage(buttonMessages.cancel)}
              </TertiaryButton>,
              <PrimaryButton
                id="confirm_save"
                key="confirm_save"
                onClick={this.writeApplicationAndGoToHome}
              >
                {intl.formatMessage(buttonMessages.save)}
              </PrimaryButton>
            ]}
          >
            {intl.formatMessage(
              messages.saveApplicationConfirmModalDescription
            )}
          </ResponsiveModal>
        </StyledContainer>
      </>
    )
  }
}

function getInitialValue(field: IFormField, data: IFormData) {
  let fieldInitialValue = field.initialValue
  if (field.initialValueKey) {
    fieldInitialValue =
      getValueFromApplicationDataByKey(data, field.initialValueKey) || ''
  }
  return fieldInitialValue
}

export function replaceInitialValues(
  fields: IFormField[],
  sectionValues: any,
  data?: IFormData
) {
  return fields.map(field => ({
    ...field,
    initialValue:
      isUndefined(sectionValues[field.name]) ||
      isNull(sectionValues[field.name])
        ? getInitialValue(field, data || {})
        : sectionValues[field.name]
  }))
}

function firstVisibleSection(form: IForm) {
  return form.sections.filter(({ viewType }) => viewType !== 'hidden')[0]
}

function mapStateToProps(
  state: IStoreState,
  props: IFormProps &
    Props &
    RouteComponentProps<{
      pageId: string
      groupId?: string
      applicationId: string
    }>
) {
  const { match, registerForm, application } = props

  const sectionId = match.params.pageId || firstVisibleSection(registerForm).id

  const activeSection = registerForm.sections.find(
    section => section.id === sectionId
  )
  if (!activeSection) {
    throw new Error(`Configuration for tab "${match.params.pageId}" missing!`)
  }
  const groupId =
    match.params.groupId ||
    getVisibleSectionGroupsBasedOnConditions(
      activeSection,
      application.data[activeSection.id] || {},
      application.data
    )[0].id
  const activeSectionGroup = activeSection.groups.find(
    group => group.id === groupId
  )
  if (!activeSectionGroup) {
    throw new Error(
      `Configuration for group "${match.params.groupId}" missing!`
    )
  }

  if (!application) {
    throw new Error(`Draft "${match.params.applicationId}" missing!`)
  }

  const setAllFieldsDirty =
    (application.visitedGroupIds &&
      application.visitedGroupIds.findIndex(
        visitedGroup =>
          visitedGroup.sectionId === activeSection.id &&
          visitedGroup.groupId === activeSectionGroup.id
      ) > -1) ||
    false

  const fields = replaceInitialValues(
    activeSectionGroup.fields,
    application.data[activeSection.id] || {},
    application.data
  )

  let updatedFields: IFormField[] = []

  if (!setAllFieldsDirty) {
    updatedFields = activeSectionGroup.fields.filter(
      (field, index) => fields[index].initialValue !== field.initialValue
    )
  }

  return {
    registerForm,
    scope: getScope(state),
    isWritingDraft: state.applicationsState.isWritingDraft,
    setAllFieldsDirty,
    fieldsToShowValidationErrors: updatedFields,
    activeSection,
    activeSectionGroup: {
      ...activeSectionGroup,
      fields
    },
    application
  }
}

export const RegisterForm = connect<
  Props,
  DispatchProps,
  FullProps,
  IStoreState
>(mapStateToProps, {
  writeApplication,
  modifyApplication,
  deleteApplication,
  goToPageGroup: goToPageGroupAction,
  goBack: goBackAction,
  goToHome,
  goToHomeTab,
  toggleDraftSavedNotification
})(injectIntl<'intl', FullProps>(RegisterFormView))
