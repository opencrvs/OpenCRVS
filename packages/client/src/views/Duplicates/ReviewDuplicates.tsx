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
import {
  Box,
  Modal,
  Spinner,
  EventTopBar
} from '@opencrvs/components/lib/interface'
import { PrimaryButton } from '@opencrvs/components/lib/buttons'
import { Duplicate } from '@opencrvs/components/lib/icons'
import { Mutation } from 'react-apollo'
import styled from '@client/styledComponents'
import {
  injectIntl,
  WrappedComponentProps as IntlShapeProps,
  IntlShape
} from 'react-intl'
import { REGISTRAR_HOME } from '@client/navigation/routes'
import { DuplicateDetails, Action } from '@client/components/DuplicateDetails'
import { Event } from '@client/forms'
import { NotDuplicateConfirmation } from '@client/views/Duplicates/NotDuplicateConfirmation'
import { RouteComponentProps } from 'react-router'

import gql from 'graphql-tag'
import {
  createNamesMap,
  extractCommentFragmentValue
} from '@client/utils/data-formatting'
import { connect } from 'react-redux'
import { IStoreState } from '@client/store'
import {
  GQLBirthRegistration,
  GQLHumanName,
  GQLRegWorkflow,
  GQLUser,
  GQLIdentityType,
  GQLLocation,
  GQLRegStatus,
  GQLComment
} from '@opencrvs/gateway/src/graphql/schema'
import { formatLongDate } from '@client/utils/date-formatting'

import {
  userMessages,
  buttonMessages,
  errorMessages,
  dynamicConstantsMessages
} from '@client/i18n/messages'
import { messages } from '@client/i18n/messages/views/duplicates'
import { Query } from '@client/components/Query'

import { goToHome } from '@client/navigation'

import { Container } from '@opencrvs/components/lib/layout'

interface IMatchParams {
  applicationId: string
}

const StyledSpinner = styled(Spinner)`
  margin: 25% auto;
`

const Wrapper = styled.div`
  margin: 85px 250px 0px 250px;

  @media (max-width: ${({ theme }) => theme.grid.breakpoints.lg}px) {
    margin-left: 20px;
    margin-right: 20px;
  }
`

const TitleBox = styled(Box)`
  ${({ theme }) => theme.fonts.bigBodyStyle};
`

const Header = styled.span`
  ${({ theme }) => theme.fonts.bodyBoldStyle};
  display: flex;
  align-items: center;
`

const HeaderText = styled.span`
  margin-left: 14px;
`

const Grid = styled.div`
  margin-top: 24px;
  margin-bottom: 24px;
  display: grid;
  grid-gap: 20px;
  grid-template-columns: auto auto;

  @media (max-width: ${({ theme }) => theme.grid.breakpoints.md}px) {
    grid-template-columns: auto;
  }
`
const BackButton = styled.a`
  text-decoration: underline;
  color: ${({ theme }) => theme.colors.primary};
`

const ErrorText = styled.div`
  color: ${({ theme }) => theme.colors.error};
  ${({ theme }) => theme.fonts.bodyStyle};
  text-align: center;
  margin-top: 100px;
`

export const FETCH_DUPLICATES = gql`
  query fetchDuplicates($id: ID!) {
    fetchBirthRegistration(id: $id) {
      id
      registration {
        id
        duplicates
      }
    }
  }
`

export function createDuplicateDetailsQuery(ids: string[]) {
  const listQueryParams = () => {
    return ids.map((id, i) => `$duplicate${i}Id: ID!`).join(', ')
  }

  const writeQueryForId = (id: string, i: number) => `
    duplicate${i}: fetchBirthRegistration(id: $duplicate${i}Id) {
      createdAt
      id
      registration {
        id
        trackingId
        type
        status {
          type
          timestamp
          user {
            name {
              use
              firstNames
              familyName
            }
            role
          }
          office {
            name
          }
          comments {
            comment
          }
        }
      }
      child {
        id
        name {
          use
          firstNames
          familyName
        }
        birthDate
        gender
      }
      mother {
        id
        name {
          use
          firstNames
          familyName
        }
        birthDate
        gender
        identifier {
          id
          type
        }
      }
      father {
        id
        name {
          use
          firstNames
          familyName
        }
        birthDate
        gender
        identifier {
          id
          type
        }
      }
    }`

  return gql`
    query fetchDuplicateDetails(${listQueryParams()}) {
      ${ids.map((id, i) => writeQueryForId(id, i)).join(',\n')}
    }
  `
}
export const rejectMutation = gql`
  mutation submitEventAsRejected($id: String!, $reason: String!) {
    markEventAsVoided(id: $id, reason: $reason)
  }
`
export const notADuplicateMutation = gql`
  mutation submitNotADuplicateMutation($id: String!, $duplicateId: String!) {
    notADuplicate(id: $id, duplicateId: $duplicateId)
  }
`
interface IState {
  selectedCompositionID: string
  showRejectModal: boolean
  showNotDuplicateModal: boolean
}
type Props = IntlShapeProps &
  RouteComponentProps<IMatchParams> & {
    language: string
    goToHome: typeof goToHome
  }
class ReviewDuplicatesClass extends React.Component<Props, IState> {
  constructor(props: Props) {
    super(props)
    this.state = {
      selectedCompositionID: '',
      showRejectModal: false,
      showNotDuplicateModal: false
    }
  }

  formatData(
    data: { [key: string]: GQLBirthRegistration },
    language: string,
    intl: IntlShape
  ) {
    const { locale } = this.props.intl

    return Object.keys(data).map(key => {
      const rec = data[key]

      const childNamesMap =
        rec.child && rec.child.name
          ? createNamesMap(rec.child.name as GQLHumanName[])
          : {}
      const motherNamesMap =
        rec.mother && rec.mother.name
          ? createNamesMap(rec.mother.name as GQLHumanName[])
          : {}
      const fatherNamesMap =
        rec.father && rec.father.name
          ? createNamesMap(rec.father.name as GQLHumanName[])
          : {}
      const userNamesMap = (index: number) =>
        rec.registration &&
        rec.registration.status &&
        rec.registration.status[index] &&
        (rec.registration.status[index] as GQLRegWorkflow).user
          ? createNamesMap(
              ((rec.registration.status[index] as GQLRegWorkflow)
                .user as GQLUser).name as GQLHumanName[]
            )
          : {}

      return {
        id: rec.id,
        dateOfApplication: rec.createdAt,
        trackingId: (rec.registration && rec.registration.trackingId) || '',
        event:
          (rec.registration &&
            rec.registration.type &&
            Event[rec.registration.type]) ||
          Event.BIRTH,
        child: {
          name: childNamesMap[language],
          dob:
            (rec.child &&
              rec.child.birthDate &&
              formatLongDate(rec.child.birthDate, locale)) ||
            '',
          gender:
            (rec.child &&
              rec.child.gender &&
              intl.formatMessage(dynamicConstantsMessages[rec.child.gender])) ||
            ''
        },
        mother: {
          name: motherNamesMap[language],
          dob:
            (rec.mother &&
              rec.mother.birthDate &&
              formatLongDate(rec.mother.birthDate, locale)) ||
            '',
          id:
            (rec.mother &&
              rec.mother.identifier &&
              rec.mother.identifier[0] &&
              (rec.mother.identifier[0] as GQLIdentityType).id) ||
            ''
        },
        father: {
          name: fatherNamesMap[language],
          dob:
            (rec.father &&
              rec.father.birthDate &&
              formatLongDate(rec.father.birthDate, locale)) ||
            '',
          id:
            (rec.father &&
              rec.father.identifier &&
              rec.father.identifier[0] &&
              (rec.father.identifier[0] as GQLIdentityType).id) ||
            ''
        },
        regStatusHistory:
          (rec.registration &&
            rec.registration.status &&
            rec.registration.status
              // @ts-ignore
              .map((status: GQLRegWorkflow, index: number) => {
                let reasonString = ''
                if (status.comments) {
                  reasonString = extractCommentFragmentValue(
                    status.comments as GQLComment[],
                    'reason'
                  )
                }

                return {
                  action:
                    Action[status.type as GQLRegStatus] || Action.DECLARED,
                  date: formatLongDate(status.timestamp, locale) || '',
                  usersName: userNamesMap(index)[language],
                  usersRole:
                    (status.user &&
                      (status.user as GQLUser).role &&
                      intl.formatMessage(
                        userMessages[(status.user as GQLUser).role as string]
                      )) ||
                    '',
                  office:
                    (status.office && (status.office as GQLLocation).name) ||
                    '',
                  reasons: reasonString
                }
              })
              .reverse()) ||
          []
      }
    })
  }
  toggleRejectModal = (id: string = '') => {
    this.setState((prevState: IState) => ({
      selectedCompositionID: id,
      showRejectModal: !prevState.showRejectModal
    }))
  }
  toggleNotDuplicateModal = (id: string = '') => {
    this.setState((prevState: IState) => ({
      selectedCompositionID: id,
      showNotDuplicateModal: !prevState.showNotDuplicateModal
    }))
  }
  successfulRejection = (response: string) => {
    this.toggleRejectModal()
    window.location.reload()
  }

  successfulDuplicateRemoval = (response: string) => {
    this.toggleNotDuplicateModal()

    if (response === this.state.selectedCompositionID) {
      window.location.assign(REGISTRAR_HOME)
    } else {
      window.location.reload()
    }
  }

  render() {
    const { intl } = this.props
    const match = this.props.match
    const applicationId = match.params.applicationId

    return (
      <Container>
        <EventTopBar
          title={intl.formatMessage(messages.duplicateReview)}
          goHome={this.props.goToHome}
          pageIcon={<Duplicate />}
        />
        <Query
          query={FETCH_DUPLICATES}
          variables={{
            id: applicationId
          }}
        >
          {({
            loading,
            error,
            data
          }: {
            loading: any
            error?: any
            data: any
          }) => {
            if (loading) {
              return <StyledSpinner id="review-duplicates-spinner" />
            }

            if (
              error ||
              !data.fetchBirthRegistration ||
              !data.fetchBirthRegistration.registration
            ) {
              return (
                <ErrorText id="duplicates-error-text">
                  {this.props.intl.formatMessage(
                    errorMessages.duplicateQueryError
                  )}
                </ErrorText>
              )
            }

            if (
              !data.fetchBirthRegistration.registration.duplicates ||
              data.fetchBirthRegistration.registration.duplicates.length <= 0
            ) {
              window.location.assign(REGISTRAR_HOME)
            }

            let duplicateIds = [applicationId]
            if (data.fetchBirthRegistration.registration.duplicates) {
              duplicateIds = duplicateIds.concat(
                data.fetchBirthRegistration.registration.duplicates
              )
            }

            const gqlVars = duplicateIds.reduce(
              (vars: { [key: string]: string }, id, i) => {
                vars[`duplicate${i}Id`] = id
                return vars
              },
              {}
            )
            return (
              <Query
                query={createDuplicateDetailsQuery(duplicateIds)}
                variables={gqlVars}
              >
                {({
                  loading: loadingDetails,
                  error: errorDetails,
                  data: dataDetails
                }: {
                  loading: any
                  error?: any
                  data: any
                }) => {
                  if (loadingDetails) {
                    return <StyledSpinner id="review-duplicates-spinner" />
                  }

                  if (errorDetails) {
                    return (
                      <ErrorText id="duplicates-error-text">
                        {this.props.intl.formatMessage(
                          errorMessages.duplicateQueryError
                        )}
                      </ErrorText>
                    )
                  }

                  return (
                    <Wrapper>
                      <TitleBox>
                        <Header id="review-duplicates-header">
                          <Duplicate />
                          <HeaderText>
                            {this.props.intl.formatMessage(
                              messages.duplicateFoundTitle
                            )}
                          </HeaderText>
                        </Header>
                        <p>
                          {this.props.intl.formatMessage(
                            messages.duplicateFoundDescription
                          )}
                        </p>
                      </TitleBox>
                      <Grid id="review-duplicates-grid">
                        {this.formatData(
                          dataDetails,
                          this.props.language,
                          this.props.intl
                        ).map((duplicateData, i: number) => (
                          <DuplicateDetails
                            id={`duplicate-details-item-${i}`}
                            key={i}
                            duplicateContextId={applicationId}
                            data={duplicateData}
                            notDuplicateHandler={() =>
                              this.toggleNotDuplicateModal(duplicateData.id)
                            }
                            rejectHandler={() =>
                              this.toggleRejectModal(duplicateData.id)
                            }
                          />
                        ))}
                      </Grid>
                    </Wrapper>
                  )
                }}
              </Query>
            )
          }}
        </Query>
        <Mutation
          mutation={rejectMutation}
          variables={{
            id: this.state.selectedCompositionID,
            reason: 'duplicate'
          }}
          onCompleted={(data: any) =>
            this.successfulRejection(data.markEventAsVoided)
          }
        >
          {(submitEventAsRejected: any) => {
            return (
              <Modal
                title={intl.formatMessage(messages.rejectDescription)}
                actions={[
                  <PrimaryButton
                    key="reject"
                    id="reject_confirm"
                    onClick={() => submitEventAsRejected()}
                  >
                    {intl.formatMessage(buttonMessages.reject)}
                  </PrimaryButton>,
                  <BackButton
                    key="back"
                    id="back_link"
                    onClick={() => {
                      this.toggleRejectModal()
                      if (document.documentElement) {
                        document.documentElement.scrollTop = 0
                      }
                    }}
                  >
                    {intl.formatMessage(buttonMessages.back)}
                  </BackButton>
                ]}
                show={this.state.showRejectModal}
                handleClose={this.toggleRejectModal}
              />
            )
          }}
        </Mutation>
        <Mutation
          mutation={notADuplicateMutation}
          variables={{
            id: applicationId,
            duplicateId: this.state.selectedCompositionID
          }}
          onCompleted={(data: any) => {
            this.successfulDuplicateRemoval(data.notADuplicate)
          }}
        >
          {(submitNotADuplicateMutation: any, { data }: { data?: any }) => {
            return (
              <NotDuplicateConfirmation
                handleYes={() => submitNotADuplicateMutation()}
                show={this.state.showNotDuplicateModal}
                handleClose={this.toggleNotDuplicateModal}
              />
            )
          }}
        </Mutation>
      </Container>
    )
  }
}

const mapStateToProps = (state: IStoreState) => ({
  language: state.i18n.language
})
const mapDispatchToProps = {
  goToHome
}
export const ReviewDuplicates = connect(
  mapStateToProps,
  mapDispatchToProps
)(injectIntl(ReviewDuplicatesClass))
