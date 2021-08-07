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
  downloadApplication,
  DOWNLOAD_STATUS,
  IApplication,
  makeApplicationReadyToDownload
} from '@client/applications'
import {
  constantsMessages,
  dynamicConstantsMessages,
  formMessages
} from '@client/i18n/messages'
import { messages } from '@client/i18n/messages/views/duplicates'
import { goToPage as goToPageAction } from '@client/navigation'
import { REVIEW_EVENT_PARENT_FORM_PAGE } from '@client/navigation/routes'
import { IStoreState } from '@client/store'
import styled from '@client/styledComponents'
import { getRejectionReasonDisplayValue } from '@client/views/SearchResult/SearchResult'
import {
  DangerButton,
  PrimaryButton,
  SuccessButton
} from '@opencrvs/components/lib/buttons'
import {
  Cross,
  Download,
  StatusCollected,
  StatusGray,
  StatusGreen,
  StatusOrange,
  StatusRejected,
  TickLarge,
  Warning
} from '@opencrvs/components/lib/icons'
import { Box, Chip, Spinner } from '@opencrvs/components/lib/interface'
import { find, get, camelCase } from 'lodash'
import * as React from 'react'
import { withApollo, WithApolloClient } from 'react-apollo'
import { injectIntl, WrappedComponentProps as IntlShapeProps } from 'react-intl'
import Moment from 'react-moment'
import { connect } from 'react-redux'

export enum Event {
  BIRTH = 'BIRTH',
  DEATH = 'DEATH'
}

export enum Action {
  IN_PROGRESS = 'IN_PROGRESS',
  DECLARED = 'DECLARED',
  WAITING_VALIDATION = 'WAITING_VALIDATION',
  VALIDATED = 'VALIDATED',
  REJECTED = 'REJECTED',
  REGISTERED = 'REGISTERED',
  CERTIFIED = 'CERTIFIED',
  LOAD_REVIEW_APPLICATION = 'load application data for review'
}
interface IProps extends IntlShapeProps {
  id: string
  duplicateContextId: string
  data: {
    id: string
    dateOfApplication: string
    trackingId: string
    event: Event
    child: {
      name: string
      dob: string
      gender: string
    }
    mother?: {
      name: string
      dob: string
      id: string
    }
    father?: {
      name: string
      dob: string
      id: string
    }
    regStatusHistory: Array<{
      action: Action
      date: string
      usersName: string
      usersRole: string
      office: string
      reasons?: string
    }>
  }
  notDuplicateHandler?: () => void
  rejectHandler?: () => void
  goToPage: typeof goToPageAction
  outboxApplications: IApplication[]
  downloadApplication: typeof downloadApplication
}

const DetailsBox = styled(Box)<{ id: string; currentStatus: string }>`
  border-top: ${({ theme }) => ` 4px solid ${theme.colors.primary}`};
  ${({ currentStatus }) =>
    currentStatus === 'rejected' ? `box-shadow: none` : ''}
`

const Separator = styled.div`
  border-top: 1px solid ${({ theme }) => theme.colors.background};
  margin: 24px -25px 24px -25px;
`

const DetailTextContainer = styled.div`
  display: flex;
  justify-content: space-between;
`

const DetailText = styled.div`
  flex: 1;
  ${({ theme }) => theme.fonts.bodyStyle};
  color: ${({ theme }) => theme.colors.copy};
`

const TagContainer = styled.div`
  display: flex;
`

const ListContainer = styled.div`
  display: flex;
  flex-direction: column;
`

const ListItem = styled.div`
  display: flex;
  margin-bottom: 16px;
`

const ListStatusContainer = styled.span`
  margin: 4px 8px;
`
const ButtonContainer = styled.div`
  display: flex;
  button {
    margin-right: 10px;
  }
`

class DuplicateDetailsClass extends React.Component<
  IProps & WithApolloClient<{}>
> {
  normalizeAction(action: string) {
    if (action === 'DECLARED') {
      return 'application'
    }

    return action
  }

  renderStatusIcon(action: string) {
    switch (action) {
      case 'DECLARED':
        return <StatusOrange />
      case 'REGISTERED':
        return <StatusGreen />
      case 'REJECTED':
        return <StatusRejected />
      case 'CERTIFIED':
        return <StatusCollected />
      default:
        return <StatusGray />
    }
  }

  downloadApplication = (
    event: string,
    compositionId: string,
    action: Action
  ) => {
    const downloadableApplication = makeApplicationReadyToDownload(
      event.toLowerCase() as Event,
      compositionId,
      action
    )
    this.props.downloadApplication(downloadableApplication, this.props.client)
  }

  downloadAndReview = () => {
    const { intl, data, outboxApplications, duplicateContextId } = this.props

    const application = find(outboxApplications, { id: data.id })
    const downloadStatus = get(application, 'downloadStatus')

    if (
      downloadStatus === DOWNLOAD_STATUS.DOWNLOADING ||
      downloadStatus === DOWNLOAD_STATUS.READY_TO_DOWNLOAD
    ) {
      return <Spinner id="action-loading" size={24} />
    } else if (downloadStatus === DOWNLOAD_STATUS.DOWNLOADED) {
      return (
        <PrimaryButton
          id={`review_link_${data.id}`}
          onClick={() => {
            this.props.goToPage(
              REVIEW_EVENT_PARENT_FORM_PAGE,
              data.id,
              'review',
              'birth',
              '',
              { duplicate: true, duplicateContextId }
            )
          }}
        >
          {intl.formatMessage(constantsMessages.review)}
        </PrimaryButton>
      )
    }

    return (
      <>
        {(downloadStatus === DOWNLOAD_STATUS.FAILED ||
          downloadStatus === DOWNLOAD_STATUS.FAILED_NETWORK) && (
          <Warning id="download-error" />
        )}
        <Download
          onClick={() =>
            this.downloadApplication(
              data.event,
              data.id,
              Action.LOAD_REVIEW_APPLICATION
            )
          }
        />
      </>
    )
  }

  render() {
    const currentStatus = this.props.data.regStatusHistory.slice(-1)[0].action
    const { data, intl, notDuplicateHandler, rejectHandler } = this.props

    return (
      <DetailsBox id={`detail_box_${data.id}`} currentStatus={currentStatus}>
        <DetailTextContainer>
          <DetailText>
            <b>{intl.formatMessage(constantsMessages.name)}:</b>{' '}
            {data.child.name}
            <br />
            <b>{intl.formatMessage(constantsMessages.dob)}:</b> {data.child.dob}
            <br />
            <b>
              {intl.formatMessage(constantsMessages.dateOfApplication)}:
            </b>{' '}
            <Moment format="DD-MM-YYYY">{data.dateOfApplication}</Moment>
            <br />
            <b>{intl.formatMessage(constantsMessages.trackingId)}:</b>{' '}
            {data.trackingId}
            <br />
          </DetailText>
          {this.downloadAndReview()}
        </DetailTextContainer>
        <Separator />
        <DetailTextContainer>
          {data.mother && (
            <DetailText>
              <b>{intl.formatMessage(formMessages.mother)}:</b>{' '}
              {data.mother.name}
              <br />
              <b>{intl.formatMessage(constantsMessages.dob)}:</b>{' '}
              {data.mother.dob}
              <br />
              <b>{intl.formatMessage(constantsMessages.id)}:</b>{' '}
              {data.mother.id}
              <br />
              <br />
            </DetailText>
          )}
        </DetailTextContainer>
        <DetailTextContainer>
          {data.father && (
            <DetailText>
              <b>{intl.formatMessage(formMessages.father)}:</b>{' '}
              {data.father.name}
              <br />
              <b>{intl.formatMessage(constantsMessages.dob)}:</b>{' '}
              {data.father.dob}
              <br />
              <b>{intl.formatMessage(constantsMessages.id)}:</b>{' '}
              {data.father.id}
              <br />
            </DetailText>
          )}
        </DetailTextContainer>
        <Separator />
        <TagContainer>
          <Chip
            status={<StatusGray />}
            text={
              intl.formatMessage(
                dynamicConstantsMessages[data.event.toLowerCase()]
              ) as string
            }
          />
          <Chip
            status={this.renderStatusIcon(currentStatus)}
            text={this.normalizeAction(currentStatus)}
          />
        </TagContainer>
        <Separator />
        <ListContainer>
          {data.regStatusHistory.map((status, i) => (
            <ListItem key={i}>
              <ListStatusContainer>
                {this.renderStatusIcon(status.action)}
              </ListStatusContainer>
              <DetailText>
                <b>
                  {intl.formatMessage(constantsMessages.applicationState, {
                    action: intl.formatMessage(
                      dynamicConstantsMessages[camelCase(status.action)]
                    )
                  })}
                  :
                </b>{' '}
                {status.date}
                <br />
                <b>{intl.formatMessage(constantsMessages.by)}:</b>{' '}
                {status.usersName}
                <br />
                {status.usersRole}
                <br />
                {status.office}
                <br />
                {status.action === Action.REJECTED && status.reasons && (
                  <>
                    <b>{intl.formatMessage(constantsMessages.reason)}:</b>{' '}
                    {status.reasons
                      .split(',')
                      .map(reason =>
                        intl.formatMessage(
                          getRejectionReasonDisplayValue(reason)
                        )
                      )
                      .join(', ')}
                  </>
                )}
                <br />
              </DetailText>
            </ListItem>
          ))}
        </ListContainer>
        {currentStatus === Action.DECLARED && (
          <>
            <Separator />
            <ButtonContainer>
              {notDuplicateHandler && (
                <SuccessButton
                  id={`not_duplicate_link_${data.id}`}
                  onClick={notDuplicateHandler}
                >
                  <TickLarge />
                  &nbsp;
                  {intl.formatMessage(messages.keep)}
                </SuccessButton>
              )}

              {rejectHandler && (
                <DangerButton
                  id={`reject_link_${data.id}`}
                  onClick={rejectHandler}
                >
                  <Cross color="white" /> &nbsp;
                  {intl.formatMessage(messages.duplicate)}
                </DangerButton>
              )}
            </ButtonContainer>
          </>
        )}
      </DetailsBox>
    )
  }
}

const mapStateToProps = (state: IStoreState) => {
  return {
    outboxApplications: state.applicationsState.applications
  }
}

const mapDispatchToProps = {
  goToPage: goToPageAction,
  downloadApplication
}

export const DuplicateDetails = connect(
  mapStateToProps,
  mapDispatchToProps
)(injectIntl(withApollo(DuplicateDetailsClass)))
