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
import { RouteComponentProps } from 'react-router'
import { WrappedComponentProps as IntlShapeProps, injectIntl } from 'react-intl'
import styled, { withTheme, ITheme } from '@client/styledComponents'
import { Spinner } from '@opencrvs/components/lib/interface'
import {
  RegisterForm,
  FullProps
} from '@opencrvs/client/src/views/RegisterForm/RegisterForm'

import { IStoreState } from '@opencrvs/client/src/store'
import { connect } from 'react-redux'
import { getReviewForm } from '@opencrvs/client/src/forms/register/review-selectors'
import {
  storeApplication,
  IApplication,
  createReviewApplication
} from '@opencrvs/client/src/applications'
import { Dispatch } from 'redux'
import { getScope } from '@client/profile/profileSelectors'
import { Scope } from '@opencrvs/client/src/utils/authUtils'
import { gqlToDraftTransformer } from '@client/transformer'
import { IFormData, Event, Action } from '@client/forms'
import {
  QueryProvider,
  QueryContext
} from '@client/views/DataProvider/QueryProvider'

import { REVIEW_EVENT_PARENT_FORM_PAGE_GROUP } from '@client/navigation/routes'
import { errorMessages } from '@client/i18n/messages'

interface IReviewProps {
  theme: ITheme
  dispatch: Dispatch
  scope: Scope | null
  event: Event
}
interface IApplicationProp {
  application: IApplication | undefined
  applicationId: string
}

type IProps = IReviewProps &
  IApplicationProp &
  FullProps &
  IntlShapeProps &
  RouteComponentProps<{}>

export interface IReviewSectionDetails {
  [key: string]: any
}

const StyledSpinner = styled(Spinner)`
  margin: 50% auto;
`

const ErrorText = styled.div`
  color: ${({ theme }) => theme.colors.error};
  ${({ theme }) => theme.fonts.bodyStyle};
  text-align: center;
  margin-top: 100px;
`

export class ReviewFormView extends React.Component<IProps> {
  userHasRegisterScope() {
    return this.props.scope && this.props.scope.includes('register')
  }

  userHasValidateScope() {
    return this.props.scope && this.props.scope.includes('validate')
  }

  render() {
    const { intl, theme, application, applicationId, dispatch } = this.props
    if (!this.userHasRegisterScope() && !this.userHasValidateScope()) {
      return (
        <ErrorText id="review-unauthorized-error-text">
          {intl.formatMessage(errorMessages.unauthorized)}
        </ErrorText>
      )
    }
    if (!application) {
      return (
        <QueryProvider
          event={this.props.event}
          action={Action.LOAD_REVIEW_APPLICATION}
          payload={{ id: this.props.applicationId }}
        >
          <QueryContext.Consumer>
            {({ loading, error, data, dataKey }) => {
              if (loading) {
                return (
                  <StyledSpinner
                    id="review-spinner"
                    baseColor={theme.colors.background}
                  />
                )
              }
              if (error) {
                return (
                  <ErrorText id="review-error-text">
                    {intl.formatMessage(errorMessages.registrationQueryError)}
                  </ErrorText>
                )
              }
              // @ts-ignore
              const eventData = data && data[dataKey]
              const transData: IFormData = gqlToDraftTransformer(
                this.props.registerForm,
                eventData
              )
              const status: string =
                (eventData &&
                  eventData.registration &&
                  eventData.registration.status &&
                  eventData.registration.status[0].type) ||
                ''
              const reviewDraft = createReviewApplication(
                applicationId,
                transData,
                this.props.event,
                status
              )
              dispatch(storeApplication(reviewDraft))

              return <RegisterForm {...this.props} application={reviewDraft} />
            }}
          </QueryContext.Consumer>
        </QueryProvider>
      )
    } else {
      return <RegisterForm {...this.props} />
    }
  }
}
function getEvent(eventType: string) {
  switch (eventType && eventType.toLocaleLowerCase()) {
    case 'birth':
      return Event.BIRTH
    case 'death':
      return Event.DEATH
    default:
      return Event.BIRTH
  }
}

interface IReviewFormState {
  [key: string]: any
}

function mapStatetoProps(
  state: IStoreState,
  props: RouteComponentProps<{
    pageRoute: string
    pageId: string
    groupId: string
    applicationId: string
    event: string
  }>
) {
  const { match, history } = props
  if (!match.params.event) {
    throw new Error('Event is not provided as path param')
  }
  const reviewFormState: IReviewFormState = getReviewForm(
    state
  ) as IReviewFormState
  const form = reviewFormState[match.params.event.toLowerCase()]

  const application = state.applicationsState.applications.find(
    ({ id, review }) => id === match.params.applicationId && review === true
  )
  const historyState = history.location.state as any
  return {
    application,
    scope: getScope(state),
    applicationId: match.params.applicationId,
    event: getEvent(match.params.event),
    registerForm: form,
    pageRoute: REVIEW_EVENT_PARENT_FORM_PAGE_GROUP,
    duplicate: historyState && historyState.duplicate
  }
}

export const ReviewForm = connect<any, {}, any, IStoreState>(mapStatetoProps)(
  injectIntl(withTheme(ReviewFormView))
)
