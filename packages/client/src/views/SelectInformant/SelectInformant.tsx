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
  ICON_ALIGNMENT,
  PrimaryButton,
  TertiaryButton
} from '@opencrvs/components/lib/buttons'
import { IRadioOption as RadioComponentOption } from '@opencrvs/components/lib/forms'
import { ErrorText } from '@opencrvs/components/lib/forms/ErrorText'
import { BackArrow } from '@opencrvs/components/lib/icons'
import { EventTopBar, RadioButton } from '@opencrvs/components/lib/interface'
import { BodyContent, Container } from '@opencrvs/components/lib/layout'
import {
  deleteApplication,
  IApplication,
  modifyApplication
} from '@client/applications'
import {
  BirthSection,
  DeathSection,
  Event,
  IFormSection,
  IFormSectionData
} from '@client/forms'
import {
  getBirthSection,
  getDeathSection
} from '@client/forms/register/application-selectors'
import { buttonMessages, formMessages } from '@client/i18n/messages'
import { constantsMessages } from '@client/i18n/messages/constants'
import { messages } from '@client/i18n/messages/views/selectInformant'
import {
  goBack,
  goToBirthContactPoint,
  goToBirthRegistrationAsParent,
  goToDeathContactPoint,
  goToDeathRegistration,
  goToHome,
  goToPrimaryApplicant
} from '@client/navigation'
import { IStoreState } from '@client/store'
import styled from '@client/styledComponents'
import {
  INFORMANT_FIELD_STRING,
  RADIO_BUTTON_LARGE_STRING
} from '@client/utils/constants'
import * as React from 'react'
import {
  injectIntl,
  IntlShape,
  WrappedComponentProps as IntlShapeProps
} from 'react-intl'
import { connect } from 'react-redux'
import { RouteComponentProps, withRouter } from 'react-router'

const Title = styled.h4`
  ${({ theme }) => theme.fonts.h4Style};
  margin-top: 16px;
  margin-bottom: 24px;
`
const Actions = styled.div`
  padding-bottom: 24px;
  & > div {
    margin-bottom: 16px;
  }
  @media (max-width: ${({ theme }) => theme.grid.breakpoints.md}px) {
    padding-bottom: 16px;
  }
`

enum INFORMANT {
  FATHER = 'FATHER',
  MOTHER = 'MOTHER',
  BOTH_PARENTS = 'BOTH_PARENTS',
  SELF = 'SELF',
  SOMEONE_ELSE = 'OTHER',
  SPOUSE = 'SPOUSE',
  SON = 'SON',
  DAUGHTER = 'DAUGHTER',
  SON_IN_LAW = 'SON_IN_LAW',
  DAUGHTER_IN_LAW = 'DAUGHTER_IN_LAW',
  GRANDSON = 'GRANDSON',
  GRANDDAUGHTER = 'GRANDDAUGHTER',
  EXTENDED_FAMILY = 'EXTENDED_FAMILY'
}

export interface IInformantField {
  id: string
  option: RadioComponentOption
  disabled: boolean
}

const setInformantFields = (
  intl: IntlShape,
  event: string
): IInformantField[] => {
  if (event === Event.BIRTH) {
    return [
      {
        id: `select_informant_${INFORMANT.MOTHER}`,
        option: {
          label: intl.formatMessage(formMessages.mother),
          value: INFORMANT.MOTHER
        },
        disabled: false
      },
      {
        id: `select_informant_${INFORMANT.FATHER}`,
        option: {
          label: intl.formatMessage(formMessages.father),
          value: INFORMANT.FATHER
        },
        disabled: false
      },
      {
        id: `select_informant_${INFORMANT.BOTH_PARENTS}`,
        option: {
          label: intl.formatMessage(messages.parents),
          value: INFORMANT.BOTH_PARENTS
        },
        disabled: false
      },
      {
        id: `select_informant_${INFORMANT.SOMEONE_ELSE}`,
        option: {
          label: intl.formatMessage(formMessages.someoneElse),
          value: INFORMANT.SOMEONE_ELSE
        },
        disabled: false
      },
      {
        id: `select_informant_${INFORMANT.SELF}`,
        option: {
          label: intl.formatMessage(formMessages.self),
          value: INFORMANT.SELF
        },
        disabled: true
      }
    ]
  } else {
    return [
      {
        id: `select_informant_${INFORMANT.SPOUSE}`,
        option: {
          label: intl.formatMessage(formMessages.spouse),
          value: INFORMANT.SPOUSE
        },
        disabled: false
      },
      {
        id: `select_informant_${INFORMANT.SON}`,
        option: {
          label: intl.formatMessage(formMessages.son),
          value: INFORMANT.SON
        },
        disabled: false
      },
      {
        id: `select_informant_${INFORMANT.DAUGHTER}`,
        option: {
          label: intl.formatMessage(formMessages.daughter),
          value: INFORMANT.DAUGHTER
        },
        disabled: false
      },
      {
        id: `select_informant_${INFORMANT.SON_IN_LAW}`,
        option: {
          label: intl.formatMessage(formMessages.sonInLaw),
          value: INFORMANT.SON_IN_LAW
        },
        disabled: false
      },
      {
        id: `select_informant_${INFORMANT.DAUGHTER_IN_LAW}`,
        option: {
          label: intl.formatMessage(formMessages.daughterInLaw),
          value: INFORMANT.DAUGHTER_IN_LAW
        },
        disabled: false
      },
      {
        id: `select_informant_${INFORMANT.FATHER}`,
        option: {
          label: intl.formatMessage(formMessages.father),
          value: INFORMANT.FATHER
        },
        disabled: false
      },
      {
        id: `select_informant_${INFORMANT.MOTHER}`,
        option: {
          label: intl.formatMessage(formMessages.mother),
          value: INFORMANT.MOTHER
        },
        disabled: false
      },
      {
        id: `select_informant_${INFORMANT.GRANDSON}`,
        option: {
          label: intl.formatMessage(formMessages.grandson),
          value: INFORMANT.GRANDSON
        },
        disabled: false
      },
      {
        id: `select_informant_${INFORMANT.GRANDDAUGHTER}`,
        option: {
          label: intl.formatMessage(formMessages.granddaughter),
          value: INFORMANT.GRANDDAUGHTER
        },
        disabled: false
      },
      {
        id: `select_informant_${INFORMANT.SOMEONE_ELSE}`,
        option: {
          label: intl.formatMessage(formMessages.someoneElse),
          value: INFORMANT.SOMEONE_ELSE
        },
        disabled: false
      }
    ]
  }
}

interface IMatchProps {
  applicationId: string
}

type IFullProps = {
  application: IApplication
  modifyApplication: typeof modifyApplication
  deleteApplication: typeof deleteApplication
  goBack: typeof goBack
  goToHome: typeof goToHome
  goToBirthContactPoint: typeof goToBirthContactPoint
  goToDeathContactPoint: typeof goToDeathContactPoint
  goToBirthRegistrationAsParent: typeof goToBirthRegistrationAsParent
  goToDeathRegistration: typeof goToDeathRegistration
  goToPrimaryApplicant: typeof goToPrimaryApplicant
  registrationSection: IFormSection
  applicantsSection: IFormSection
} & IntlShapeProps &
  RouteComponentProps<IMatchProps>

interface IState {
  informant: string
  touched: boolean
  isError: boolean
}

export class SelectInformantView extends React.Component<IFullProps, IState> {
  constructor(props: IFullProps) {
    super(props)
    const { applicantsSection, registrationSection } = props
    this.state = {
      informant:
        (this.props.application &&
          this.props.application.data &&
          this.props.application.data[registrationSection.id] &&
          (this.props.application.data[registrationSection.id]
            .presentAtBirthRegistration as string)) ||
        (this.props.application &&
          this.props.application.data &&
          this.props.application.data[applicantsSection.id] &&
          (this.props.application.data[applicantsSection.id]
            .applicantsRelationToDeceased as string)) ||
        '',
      touched: false,
      isError: false
    }
  }

  handleContinue = () => {
    const event = this.props.location.pathname.includes(Event.BIRTH)
      ? Event.BIRTH
      : Event.DEATH

    if (
      this.state.informant &&
      this.state.informant !== 'error' &&
      this.state.informant === INFORMANT.BOTH_PARENTS
    ) {
      const {
        application,
        goToPrimaryApplicant,
        registrationSection,
        goToBirthRegistrationAsParent
      } = this.props
      this.props.modifyApplication({
        ...application,
        data: {
          ...application.data,
          registration: {
            ...application.data[registrationSection.id],
            ...{
              presentAtBirthRegistration: this.state.informant,
              applicant: {
                value:
                  (this.props.application &&
                    this.props.application.data &&
                    this.props.application.data[registrationSection.id] &&
                    this.props.application.data[registrationSection.id]
                      .applicant &&
                    (this.props.application.data[registrationSection.id]
                      .applicant as IFormSectionData).value) ||
                  '',
                nestedFields: {}
              }
            }
          }
        }
      })
      event === Event.BIRTH
        ? goToBirthRegistrationAsParent(this.props.match.params.applicationId)
        : goToPrimaryApplicant(this.props.match.params.applicationId)
    } else if (
      this.state.informant &&
      this.state.informant !== 'error' &&
      this.state.informant !== INFORMANT.SOMEONE_ELSE
    ) {
      const {
        application,
        goToBirthRegistrationAsParent,
        goToDeathRegistration,
        registrationSection,
        applicantsSection
      } = this.props
      const newApplication = {
        ...application,
        data: {
          ...application.data
        }
      }
      if (event === Event.BIRTH) {
        newApplication.data[registrationSection.id] = {
          ...application.data[registrationSection.id],
          ...{
            presentAtBirthRegistration: this.state.informant,
            applicant: {
              value: this.state.informant,
              nestedFields: {}
            }
          }
        }
      } else {
        newApplication.data[applicantsSection.id] = {
          ...application.data[applicantsSection.id],
          ...{
            // Need to empty those because next screen will fill this up
            // TODO: currently contact point is the informant,
            // need to define the difference between informant and contact point on death schema
            relationship: this.state.informant
          }
        }
      }
      this.props.modifyApplication(newApplication)

      this.props.location.pathname.includes(Event.BIRTH)
        ? goToBirthRegistrationAsParent(this.props.match.params.applicationId)
        : goToDeathRegistration(this.props.match.params.applicationId)
    } else if (
      event === Event.DEATH &&
      this.state.informant &&
      this.state.informant !== 'error' &&
      this.state.informant === INFORMANT.SOMEONE_ELSE
    ) {
      const {
        application,
        goToDeathRegistration,
        applicantsSection
      } = this.props
      this.props.modifyApplication({
        ...application,
        data: {
          ...application.data,
          [applicantsSection.id]: {
            ...application.data[applicantsSection.id],
            ...{
              relationship: this.state.informant
            }
          }
        }
      })

      goToDeathRegistration(this.props.match.params.applicationId)
    } else if (
      event === Event.BIRTH &&
      this.state.informant &&
      this.state.informant !== 'error' &&
      this.state.informant === INFORMANT.SOMEONE_ELSE
    ) {
      const {
        application,
        registrationSection,
        goToBirthRegistrationAsParent
      } = this.props

      const modifiedApplicationData = {
        ...application,
        data: {
          ...application.data,
          [registrationSection.id]: {
            ...application.data[registrationSection.id],
            ...{
              presentAtBirthRegistration: this.state.informant,
              applicant: {
                value:
                  (this.props.application &&
                    this.props.application.data &&
                    this.props.application.data[registrationSection.id] &&
                    this.props.application.data[registrationSection.id]
                      .applicant &&
                    (this.props.application.data[registrationSection.id]
                      .applicant as IFormSectionData).value) ||
                  '',
                nestedFields:
                  (this.props.application &&
                    this.props.application.data &&
                    this.props.application.data[registrationSection.id] &&
                    this.props.application.data[registrationSection.id]
                      .applicant &&
                    (this.props.application.data[registrationSection.id]
                      .applicant as IFormSectionData).nestedFields) ||
                  {}
              }
            }
          }
        }
      }
      this.props.modifyApplication(modifiedApplicationData)
      goToBirthRegistrationAsParent(this.props.match.params.applicationId)
    } else {
      this.setState({ informant: 'error' })
    }
  }
  render() {
    const { intl } = this.props
    const event = this.props.location.pathname.includes(Event.BIRTH)
      ? Event.BIRTH
      : Event.DEATH
    const informantFields = setInformantFields(intl, event)

    let titleMessage
    switch (event) {
      case Event.BIRTH:
        titleMessage = constantsMessages.newBirthRegistration
        break
      case Event.DEATH:
        titleMessage = constantsMessages.newDeathRegistration
        break
      default:
        titleMessage = constantsMessages.newBirthRegistration
    }

    return (
      <Container>
        <EventTopBar
          title={intl.formatMessage(titleMessage)}
          goHome={() => {
            this.props.deleteApplication(this.props.application)
            this.props.goToHome()
          }}
        />

        <BodyContent id="select_informant_view">
          <TertiaryButton
            align={ICON_ALIGNMENT.LEFT}
            icon={() => <BackArrow />}
            onClick={this.props.goBack}
          >
            {intl.formatMessage(buttonMessages.back)}
          </TertiaryButton>

          <Title>
            {event === Event.BIRTH
              ? intl.formatMessage(messages.birthInformantTitle)
              : intl.formatMessage(messages.deathInformantTitle)}
          </Title>
          {this.state.informant === 'error' && (
            <ErrorText id="error_text">
              {event === Event.BIRTH
                ? intl.formatMessage(messages.birthErrorMessage)
                : intl.formatMessage(messages.deathErrorMessage)}
            </ErrorText>
          )}
          <Actions id="select_parent_informant">
            {informantFields.map((informantField: IInformantField) => {
              return (
                <RadioButton
                  size={RADIO_BUTTON_LARGE_STRING}
                  key={informantField.id}
                  name={INFORMANT_FIELD_STRING}
                  label={informantField.option.label}
                  value={informantField.option.value}
                  id={informantField.id}
                  selected={
                    this.state.informant === informantField.option.value
                      ? informantField.option.value
                      : ''
                  }
                  onChange={() =>
                    this.setState({
                      informant: informantField.option.value as string
                    })
                  }
                  disabled={informantField.disabled}
                />
              )
            })}
          </Actions>
          <PrimaryButton id="continue" onClick={this.handleContinue}>
            {intl.formatMessage(buttonMessages.continueButton)}
          </PrimaryButton>
        </BodyContent>
      </Container>
    )
  }
}

const mapStateToProps = (
  store: IStoreState,
  props: RouteComponentProps<{ applicationId: string }>
) => {
  const { match } = props
  return {
    registrationSection: getBirthSection(store, BirthSection.Registration),
    applicantsSection: getDeathSection(store, DeathSection.Applicants),
    application: store.applicationsState.applications.find(
      ({ id }) => id === match.params.applicationId
    )!
  }
}

export const SelectInformant = withRouter(
  connect(mapStateToProps, {
    goBack,
    goToHome,
    goToBirthContactPoint,
    goToDeathContactPoint,
    goToBirthRegistrationAsParent,
    goToPrimaryApplicant,
    goToDeathRegistration,
    modifyApplication,
    deleteApplication
  })(injectIntl(SelectInformantView))
)
