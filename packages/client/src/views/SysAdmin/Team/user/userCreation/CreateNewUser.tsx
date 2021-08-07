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
  IFormSection,
  IFormSectionData,
  IFormSectionGroup
} from '@client/forms'
import { getVisibleSectionGroupsBasedOnConditions } from '@client/forms/utils'
import { formMessages } from '@client/i18n/messages'
import { messages as sysAdminMessages } from '@client/i18n/messages/views/sysAdmin'
import { goBack } from '@client/navigation'
import { IStoreState } from '@client/store'
import styled from '@client/styledComponents'
import { GET_USER } from '@client/user/queries'
import {
  clearUserFormData,
  fetchAndStoreUserData,
  storeUserFormData,
  processRoles
} from '@client/user/userReducer'
import { replaceInitialValues } from '@client/views/RegisterForm/RegisterForm'
import { UserForm } from '@client/views/SysAdmin/Team/user/userCreation/UserForm'
import { UserReviewForm } from '@client/views/SysAdmin/Team/user/userCreation/UserReviewForm'
import { ActionPageLight, Spinner } from '@opencrvs/components/lib/interface'
import ApolloClient from 'apollo-client'
import * as React from 'react'
import { withApollo } from 'react-apollo'
import { injectIntl, WrappedComponentProps as IntlShapeProps } from 'react-intl'
import { connect } from 'react-redux'
import { RouteComponentProps } from 'react-router'
import { gqlToDraftTransformer } from '@client/transformer'

interface IMatchParams {
  userId?: string
  locationId?: string
  sectionId: string
  groupId: string
}

type IUserProps = {
  userId?: string
  section: IFormSection
  activeGroup: IFormSectionGroup
  nextSectionId: string
  nextGroupId: string
  formData: IFormSectionData
  submitting: boolean
  userDetailsStored?: boolean
  loadingRoles?: boolean
  client: ApolloClient<unknown>
}

interface IDispatchProps {
  goBack: typeof goBack
  storeUserFormData: typeof storeUserFormData
  clearUserFormData: typeof clearUserFormData
  fetchAndStoreUserData: typeof fetchAndStoreUserData
  processRoles: typeof processRoles
}

export type Props = RouteComponentProps<IMatchParams> &
  IUserProps &
  IntlShapeProps

const Container = styled.div`
  display: flex;
  min-height: 80vh;
  flex-grow: 1;
  align-items: center;
  justify-content: center;
`

class CreateNewUserComponent extends React.Component<Props & IDispatchProps> {
  async componentDidMount() {
    const { userId, client } = this.props
    if (userId) {
      this.props.fetchAndStoreUserData(client, GET_USER, { userId })
    }
    if (this.props.match.params.locationId) {
      this.props.processRoles(this.props.match.params.locationId)
    }
  }

  componentWillUnmount() {
    this.props.clearUserFormData()
  }

  renderLoadingPage = () => {
    const { intl, userId } = this.props
    return (
      <ActionPageLight
        title={
          userId
            ? intl.formatMessage(sysAdminMessages.editUserDetailsTitle)
            : intl.formatMessage(formMessages.userFormTitle)
        }
        goBack={this.props.goBack}
      >
        <Container>
          <Spinner id="user-form-submitting-spinner" />
        </Container>
      </ActionPageLight>
    )
  }

  render() {
    const {
      section,
      submitting,
      userDetailsStored,
      loadingRoles,
      userId,
      match
    } = this.props
    if (
      submitting ||
      (userId && !userDetailsStored) ||
      (match.params.locationId && loadingRoles)
    ) {
      return this.renderLoadingPage()
    }

    if (section.viewType === 'form') {
      return <UserForm {...this.props} />
    }

    if (section.viewType === 'preview') {
      return <UserReviewForm {...this.props} />
    }
  }
}

function getNextSectionIds(
  sections: IFormSection[],
  fromSection: IFormSection,
  fromSectionGroup: IFormSectionGroup,
  formData: IFormSectionData
) {
  const visibleGroups = getVisibleSectionGroupsBasedOnConditions(
    fromSection,
    formData || {}
  )
  const currentGroupIndex = visibleGroups.findIndex(
    (group: IFormSectionGroup) => group.id === fromSectionGroup.id
  )

  if (currentGroupIndex === visibleGroups.length - 1) {
    const visibleSections = sections.filter(
      section => section.viewType !== 'hidden'
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

const mapStateToProps = (state: IStoreState, props: Props) => {
  const sectionId =
    props.match.params.sectionId || state.userForm.userForm!.sections[0].id

  const section = state.userForm.userForm!.sections.find(
    section => section.id === sectionId
  ) as IFormSection

  if (!section) {
    throw new Error(`No section found ${sectionId}`)
  }

  let formData = { ...state.userForm.userFormData }
  if (props.match.params.locationId) {
    formData = {
      ...gqlToDraftTransformer(
        { sections: [section] },
        {
          [section.id]: {
            primaryOffice: { id: props.match.params.locationId }
          }
        }
      )[section.id],
      ...formData,
      skippedOfficeSelction: true
    }
  } else {
    formData = {
      ...formData,
      skippedOfficeSelction: false
    }
  }
  const groupId =
    props.match.params.groupId ||
    getVisibleSectionGroupsBasedOnConditions(section, formData)[0].id
  const group = section.groups.find(
    group => group.id === groupId
  ) as IFormSectionGroup

  const fields = replaceInitialValues(group.fields, formData)
  const nextGroupId = getNextSectionIds(
    state.userForm.userForm!.sections,
    section,
    group,
    formData
  ) || { sectionId: '', groupId: '' }

  return {
    userId: props.match.params.userId,
    sectionId,
    section,
    formData,
    submitting: state.userForm.submitting,
    userDetailsStored: state.userForm.userDetailsStored,
    loadingRoles: state.userForm.loadingRoles,
    activeGroup: {
      ...group,
      fields
    },
    nextSectionId: nextGroupId && nextGroupId.sectionId,
    nextGroupId: nextGroupId && nextGroupId.groupId
  }
}

export const CreateNewUser = connect(mapStateToProps, {
  goBack,
  storeUserFormData,
  clearUserFormData,
  fetchAndStoreUserData,
  processRoles
})(injectIntl(withApollo(CreateNewUserComponent)))
