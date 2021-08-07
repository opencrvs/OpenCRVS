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
import { messages } from '@client/i18n/messages/views/userSetup'
import { withTheme } from '@client/styledComponents'
import { goToTeamUserList, goToReviewUserDetails } from '@client/navigation'
import * as React from 'react'
import { injectIntl, WrappedComponentProps } from 'react-intl'
import { connect } from 'react-redux'
import { RouteComponentProps } from 'react-router'
import { Query } from '@client/components/Query'
import { GET_USER } from '@client/user/queries'
import {
  SysAdminContentWrapper,
  SysAdminPageVariant
} from '@client/views/SysAdmin/SysAdminContentWrapper'
import { GQLUser, GQLHumanName } from '@opencrvs/gateway/src/graphql/schema'
import { createNamesMap } from '@client/utils/data-formatting'
import {
  SearchRed,
  Avatar,
  VerticalThreeDots
} from '@opencrvs/components/lib/icons'
import styled from 'styled-components'
import { LinkButton } from '@opencrvs/components/lib/buttons'
import moment from 'moment'
import { userMessages } from '@client/i18n/messages'
import { LANG_EN } from '@client/utils/constants'
import {
  ISearchLocation,
  ToggleMenu,
  LoadingGrey,
  FloatingNotification,
  NOTIFICATION_TYPE as FLOATING_NOTIFICATION_TYPE
} from '@opencrvs/components/lib/interface'

import { Status } from '@client/views/SysAdmin/Team/user/UserList'
import { messages as sysMessages } from '@client/i18n/messages/views/sysAdmin'
import { getScope } from '@client/profile/profileSelectors'
import { IStoreState } from '@client/store'
import {
  NOTIFICATION_TYPE,
  ToastNotification
} from '@client/components/interface/ToastNotification'
import { ITheme } from '@opencrvs/components/lib/theme'
import { UserAuditActionModal } from '@client/views/SysAdmin/Team/user/UserAuditActionModal'
import { UserAuditList } from '@client/views/SysAdmin/Team/user/userProfilie/UserAuditList'
import { getJurisdictionLocationIdFromUserDetails } from '@client/views/SysAdmin/Performance/utils'
import { IUserDetails } from '@client/utils/userUtils'
import { userMutations } from '@client/user/mutations'

const ContentWrapper = styled.div`
  margin: 40px auto 0;
  color: ${({ theme }) => theme.colors.copy};
`

const UserAvatar = styled(Avatar)`
  @media (max-width: ${({ theme }) => theme.grid.breakpoints.md}px) {
    display: none;
  }
`

const NameHolder = styled.div`
  ${({ theme }) => theme.fonts.h2Style};
  margin: 20px auto 30px;
  @media (max-width: ${({ theme }) => theme.grid.breakpoints.md}px) {
    display: none;
  }
`

const InformationHolder = styled.div`
  display: flex;
  @media (max-width: ${({ theme }) => theme.grid.breakpoints.lg}px) {
    flex-direction: column;
  }
  margin-bottom: 14px;
`

export const InformationTitle = styled.div<{ paddingRight?: number }>`
  ${({ theme }) => theme.fonts.bodyBoldStyle};
  ${({ paddingRight }) => {
    return `padding-right: ${paddingRight ? paddingRight : 0}px`
  }}
`
const InformationValue = styled.div`
  ${({ theme }) => theme.fonts.bodyStyle};
`

const LoadingTitle = styled.span<{ width: number; marginRight: number }>`
  background: ${({ theme }) => theme.colors.background};
  display: inline-block;
  height: 24px;
  width: ${({ width }) => `${width}px`};
  margin-right: ${({ marginRight }) => `${marginRight}px`};
`

const LoadingValue = styled(LoadingGrey)`
  @media (max-width: ${({ theme }) => theme.grid.breakpoints.md}px) {
    display: none;
  }
`
const HeaderMenuHolder = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;

  & > :not(:last-child) {
    margin: auto 8px;
  }
`

interface ISearchParams {
  userId: string
}

interface IBaseProp {
  theme: ITheme
  viewOnlyMode: boolean
}

interface IDispatchProps {
  goToTeamUserList: typeof goToTeamUserList
  goToReviewUserDetails: typeof goToReviewUserDetails
}

type Props = WrappedComponentProps &
  RouteComponentProps<ISearchParams> &
  IDispatchProps &
  IBaseProp

type State = {
  modalVisible: boolean
  viewportWidth: number
  showResendSMSSuccess: boolean
  showResendSMSError: boolean
}

export interface IUserData {
  id?: string
  primaryOffice?: ISearchLocation
  name?: string
  role?: string
  type?: string
  number?: string
  status?: string
  underInvestigation?: boolean
  username?: string
  practitionerId?: string
  locationId?: string
  startDate?: string
}

class UserProfileComponent extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    moment.locale(props.intl.locale)
    this.state = {
      modalVisible: false,
      viewportWidth: 0,
      showResendSMSSuccess: false,
      showResendSMSError: false
    }
    this.updateViewPort = this.updateViewPort.bind(this)
  }

  componentDidMount() {
    this.updateViewPort()
    window.addEventListener('resize', this.updateViewPort)
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.updateViewPort)
  }

  updateViewPort() {
    this.setState({ viewportWidth: window.innerWidth })
  }

  toggleUserActivationModal() {
    this.setState({ modalVisible: !this.state.modalVisible })
  }

  async resendSMS(userId: string) {
    try {
      const res = await userMutations.resendSMSInvite(userId, [
        {
          query: GET_USER,
          variables: {
            userId: this.props.match.params.userId
          }
        }
      ])
      if (res && res.data && res.data.resendSMSInvite) {
        this.setState({ showResendSMSSuccess: true })
      }
    } catch (err) {
      this.setState({ showResendSMSError: true })
    }
  }

  getMenuItems(userId: string, status: string) {
    const menuItems: { label: string; handler: () => void }[] = [
      {
        label: this.props.intl.formatMessage(sysMessages.editUserDetailsTitle),
        handler: () => this.props.goToReviewUserDetails(userId)
      }
    ]

    if (status !== 'deactivated' && status !== 'disabled') {
      menuItems.push({
        label: this.props.intl.formatMessage(sysMessages.resendSMS),
        handler: () => {
          this.resendSMS(userId)
        }
      })
    }

    if (status === 'active') {
      menuItems.push({
        label: this.props.intl.formatMessage(sysMessages.deactivate),
        handler: () => this.toggleUserActivationModal()
      })
    }

    if (status === 'deactivated') {
      menuItems.push({
        label: this.props.intl.formatMessage(sysMessages.reactivate),
        handler: () => this.toggleUserActivationModal()
      })
    }
    return menuItems
  }

  transformUserQueryResult(userData?: GQLUser) {
    if (!userData) {
      return {}
    }

    const locale = this.props.intl.locale
    return {
      id: userData.id,
      primaryOffice: {
        id: (userData.primaryOffice && userData.primaryOffice.id) || '',
        searchableText: '',
        displayLabel:
          (userData.primaryOffice &&
            (locale === LANG_EN
              ? userData.primaryOffice.name
              : (userData.primaryOffice.alias &&
                  userData.primaryOffice.alias.join(' ')) ||
                '')) ||
          ''
      },
      name: createNamesMap(userData.name as GQLHumanName[])[locale],
      role: userData.role,
      type: userData.type,
      number: userData.mobile,
      status: userData.status,
      underInvestigation: userData.underInvestigation,
      username: userData.username,
      practitionerId: userData.practitionerId,
      locationId:
        getJurisdictionLocationIdFromUserDetails(userData as IUserDetails) ||
        '0',
      startDate:
        (userData.creationDate &&
          moment(new Date(Number(userData.creationDate))).format(
            'MMMM DD, YYYY'
          )) ||
        ''
    }
  }
  getLoadingUserProfileView(hasError?: boolean) {
    return (
      <SysAdminContentWrapper
        id="user-profile-loading"
        type={SysAdminPageVariant.SUBPAGE_CENTERED}
        backActionHandler={() => window.history.back()}
        loadingHeader={true}
      >
        <UserAvatar />
        <NameHolder>
          <LoadingGrey width={20} />
        </NameHolder>
        <InformationHolder>
          <LoadingTitle width={160} marginRight={70} />
          <LoadingValue width={15} />
        </InformationHolder>
        <InformationHolder>
          <LoadingTitle width={118} marginRight={113} />
          <LoadingValue width={15} />
        </InformationHolder>
        <InformationHolder>
          <LoadingTitle width={157} marginRight={74} />
          <LoadingValue width={15} />
        </InformationHolder>
        <InformationHolder>
          <LoadingTitle width={122} marginRight={110} />
          <LoadingValue width={15} />
        </InformationHolder>
        <InformationHolder>
          <LoadingTitle width={120} marginRight={112} />
          <LoadingValue width={15} />
        </InformationHolder>
        <UserAuditList isLoading={true} />
        {hasError && <ToastNotification type={NOTIFICATION_TYPE.ERROR} />}
      </SysAdminContentWrapper>
    )
  }

  render() {
    const { intl, viewOnlyMode, match, theme } = this.props
    const { showResendSMSSuccess, showResendSMSError } = this.state
    return (
      <>
        <Query
          query={GET_USER}
          variables={{
            userId: match.params.userId
          }}
          fetchPolicy={'cache-and-network'}
        >
          {({ data, loading, error }) => {
            if (loading || error) {
              return this.getLoadingUserProfileView(!!error)
            } else {
              const user = this.transformUserQueryResult(data && data.getUser)
              return (
                <SysAdminContentWrapper
                  id="user-profile"
                  type={SysAdminPageVariant.SUBPAGE_CENTERED}
                  backActionHandler={() => window.history.back()}
                  headerTitle={user.name}
                  menuComponent={
                    <HeaderMenuHolder>
                      {user.underInvestigation && <SearchRed />}
                      <Status status={user.status || 'pending'} />
                      <ToggleMenu
                        id={`sub-page-header-munu-button`}
                        toggleButton={<VerticalThreeDots />}
                        menuItems={this.getMenuItems(
                          user.id as string,
                          user.status as string
                        )}
                        hide={
                          viewOnlyMode ||
                          this.state.viewportWidth <= theme.grid.breakpoints.md
                        }
                      />
                    </HeaderMenuHolder>
                  }
                >
                  <ContentWrapper>
                    <UserAvatar />
                    <NameHolder>{user.name}</NameHolder>
                    <InformationHolder>
                      <InformationTitle paddingRight={70}>
                        {intl.formatMessage(messages.assignedOffice)}
                      </InformationTitle>
                      <InformationValue>
                        <LinkButton
                          id="office-link"
                          textDecoration={'none'}
                          onClick={() =>
                            this.props.goToTeamUserList(
                              user.primaryOffice as ISearchLocation
                            )
                          }
                        >
                          {user.primaryOffice &&
                            user.primaryOffice.displayLabel}
                        </LinkButton>
                      </InformationValue>
                    </InformationHolder>
                    <InformationHolder>
                      <InformationTitle paddingRight={208}>
                        {intl.formatMessage(messages.roleType)}
                      </InformationTitle>
                      <InformationValue>
                        {intl.formatMessage(userMessages[user.role as string])}{' '}
                        /{' '}
                        {intl.formatMessage(userMessages[user.type as string])}
                      </InformationValue>
                    </InformationHolder>
                    <InformationHolder>
                      <InformationTitle paddingRight={169}>
                        {intl.formatMessage(messages.phoneNumber)}
                      </InformationTitle>
                      <InformationValue>{user.number}</InformationValue>
                    </InformationHolder>
                    <InformationHolder>
                      <InformationTitle paddingRight={205}>
                        {intl.formatMessage(messages.userName)}
                      </InformationTitle>
                      <InformationValue>{user.username}</InformationValue>
                    </InformationHolder>
                    <InformationHolder>
                      <InformationTitle paddingRight={210}>
                        {intl.formatMessage(messages.startDate)}
                      </InformationTitle>
                      <InformationValue>{user.startDate}</InformationValue>
                    </InformationHolder>
                    <UserAuditActionModal
                      show={this.state.modalVisible}
                      user={data && data.getUser}
                      onClose={() => this.toggleUserActivationModal()}
                      onConfirmRefetchQueries={[
                        {
                          query: GET_USER,
                          variables: {
                            userId: match.params.userId
                          }
                        }
                      ]}
                    />
                    {showResendSMSSuccess && (
                      <FloatingNotification
                        id="resend_invite_success"
                        type={FLOATING_NOTIFICATION_TYPE.SUCCESS}
                        show={showResendSMSSuccess}
                        callback={() =>
                          this.setState({ showResendSMSSuccess: false })
                        }
                      >
                        {intl.formatMessage(sysMessages.resendSMSSuccess)}
                      </FloatingNotification>
                    )}
                    {showResendSMSError && (
                      <FloatingNotification
                        id="resend_invite_error"
                        type={FLOATING_NOTIFICATION_TYPE.ERROR}
                        show={showResendSMSError}
                        callback={() =>
                          this.setState({ showResendSMSError: false })
                        }
                      >
                        {intl.formatMessage(sysMessages.resendSMSError)}
                      </FloatingNotification>
                    )}
                    <UserAuditList user={user} />
                  </ContentWrapper>
                </SysAdminContentWrapper>
              )
            }
          }}
        </Query>
      </>
    )
  }
}

export const UserProfile = connect(
  (state: IStoreState) => {
    const scope = getScope(state)
    return {
      viewOnlyMode: (scope && !scope.includes('sysadmin')) || false
    }
  },
  {
    goToTeamUserList,
    goToReviewUserDetails
  }
)(withTheme(injectIntl(UserProfileComponent)))
