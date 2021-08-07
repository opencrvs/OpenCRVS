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
import { BodyContent } from '@opencrvs/components/lib/layout'
import {
  GridTable,
  ColumnContentAlignment,
  Spinner
} from '@opencrvs/components/lib/interface'
import { injectIntl, WrappedComponentProps as IntlShapeProps } from 'react-intl'
import {
  constantsMessages,
  dynamicConstantsMessages
} from '@client/i18n/messages'
import { StatusWaiting } from '@opencrvs/components/lib/icons'
import { messages } from '@client/i18n/messages/views/notifications'
import { getTheme } from '@opencrvs/components/lib/theme'
import styled from '@client/styledComponents'
import { IApplication, SUBMISSION_STATUS } from '@client/applications'
import { getDefaultLanguage } from '@client/i18n/utils'
const Container = styled(BodyContent)`
  padding-top: 32px;
`

interface IState {
  sentForReviewPageNo: number
}
interface IProps {
  application: IApplication[]
  showPaginated?: boolean
}
type IFullProps = IProps & IntlShapeProps
class Outbox extends React.Component<IFullProps, IState> {
  submissionStatusMap = (status: string, index: number) => {
    const { formatMessage } = this.props.intl
    const {
      statusWaitingToRegister,
      statusWaitingToValidate,
      statusRegistering,
      statusWaitingToReject,
      statusRejecting,
      statusWaitingToSubmit,
      statusSubmitting,
      waitingToRetry
    } = messages

    let icon: () => React.ReactNode
    let statusText: string
    let iconId: string

    switch (status) {
      case SUBMISSION_STATUS.READY_TO_SUBMIT:
        iconId = `waiting${index}`
        icon = () => <StatusWaiting id={iconId} key={iconId} />
        statusText = formatMessage(statusWaitingToSubmit)
        break
      case SUBMISSION_STATUS.READY_TO_APPROVE:
        iconId = `waiting${index}`
        icon = () => <StatusWaiting id={iconId} key={iconId} />
        statusText = formatMessage(statusWaitingToValidate)
        break
      case SUBMISSION_STATUS.APPROVING:
        iconId = `registering${index}`
        icon = () => <Spinner id={iconId} key={iconId} size={24} />
        statusText = formatMessage(statusSubmitting)
        break
      case SUBMISSION_STATUS.SUBMITTING:
        iconId = `registering${index}`
        icon = () => <Spinner id={iconId} key={iconId} size={24} />
        statusText = formatMessage(statusSubmitting)
        break
      case SUBMISSION_STATUS.REGISTERING:
        iconId = `registering${index}`
        icon = () => <Spinner id={iconId} key={iconId} size={24} />
        statusText = formatMessage(statusRegistering)
        break
      case SUBMISSION_STATUS.READY_TO_REJECT:
        iconId = `waiting${index}`
        icon = () => <StatusWaiting id={iconId} key={iconId} />
        statusText = formatMessage(statusWaitingToReject)
        break
      case SUBMISSION_STATUS.REJECTING:
        iconId = `rejecting${index}`
        icon = () => <Spinner id={iconId} key={iconId} size={24} />
        statusText = formatMessage(statusRejecting)
        break
      case SUBMISSION_STATUS.FAILED_NETWORK:
        iconId = `failed${index}`
        icon = () => <StatusWaiting id={iconId} key={iconId} />
        statusText = formatMessage(waitingToRetry)
        break
      default:
        // default act as  SUBMISSION_STATUS[SUBMISSION_STATUS.READY_TO_REGISTER]:
        iconId = `waiting${index}`
        icon = () => <StatusWaiting id={iconId} key={iconId} />
        statusText = formatMessage(statusWaitingToRegister)
    }

    return {
      icon,
      statusText
    }
  }

  transformApplicationsReadyToSend = () => {
    const { intl } = this.props
    const allapplications = this.props.application || []
    return allapplications.map((application, index) => {
      let name
      if (application.event && application.event.toString() === 'birth') {
        name =
          (application.data &&
            application.data.child &&
            application.data.child.familyNameEng &&
            (!application.data.child.firstNamesEng
              ? ''
              : application.data.child.firstNamesEng + ' ') +
              application.data.child.familyNameEng) ||
          (application.data &&
            application.data.child &&
            application.data.child.familyName &&
            (!application.data.child.firstNames
              ? ''
              : application.data.child.firstNames + ' ') +
              application.data.child.familyName) ||
          ''
      } else if (
        application.event &&
        application.event.toString() === 'death'
      ) {
        name =
          (application.data &&
            application.data.deceased &&
            application.data.deceased.familyNameEng &&
            (!application.data.deceased.firstNamesEng
              ? ''
              : application.data.deceased.firstNamesEng + ' ') +
              application.data.deceased.familyNameEng) ||
          (application.data &&
            application.data.deceased &&
            application.data.deceased.familyName &&
            (!application.data.deceased.firstNames
              ? ''
              : application.data.deceased.firstNames + ' ') +
              application.data.deceased.familyName) ||
          ''
      }

      const { statusText, icon } = this.submissionStatusMap(
        application.submissionStatus || '',
        index
      )

      return {
        id: application.id,
        event:
          (application.event &&
            intl.formatMessage(
              dynamicConstantsMessages[application.event.toLowerCase()]
            )) ||
          '',
        name,
        submissionStatus: statusText || '',
        statusIndicator: icon ? [icon()] : null
      }
    })
  }

  onPageChange = (pageNumber: number) => {
    this.setState({ sentForReviewPageNo: pageNumber })
  }

  render() {
    const { intl, application } = this.props

    return (
      <Container>
        <GridTable
          hideTableHeader={true}
          content={this.transformApplicationsReadyToSend()}
          columns={[
            {
              label: this.props.intl.formatMessage(constantsMessages.type),
              width: 15,
              key: 'event'
            },
            {
              width: 45,
              label: this.props.intl.formatMessage(constantsMessages.name),
              key: 'name'
            },
            {
              label: this.props.intl.formatMessage(
                messages.statusWaitingToRegister
              ),
              width: 35,
              key: 'submissionStatus',
              color: getTheme(getDefaultLanguage()).colors.secondaryLabel
            },
            {
              label: '',
              width: 5,
              alignment: ColumnContentAlignment.CENTER,
              key: 'statusIndicator'
            }
          ]}
          noResultText={intl.formatMessage(constantsMessages.noResults)}
          totalItems={application.length}
          onPageChange={this.onPageChange}
          pageSize={10}
          showPaginated={this.props.showPaginated}
          loadMoreText={intl.formatMessage(constantsMessages.loadMore)}
        />
      </Container>
    )
  }
}

export default injectIntl(Outbox)
