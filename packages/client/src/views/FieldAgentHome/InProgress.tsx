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
import { HomeContent } from '@opencrvs/components/lib/layout'
import { GridTable } from '@opencrvs/components/lib/interface'
import { IApplication } from '@client/applications'
import { WrappedComponentProps as IntlShapeProps, injectIntl } from 'react-intl'
import { connect } from 'react-redux'
import moment from 'moment'
import { goToApplicationDetails } from '@client/navigation'
import { withTheme, ITheme } from '@client/styledComponents'
import {
  constantsMessages as messages,
  dynamicConstantsMessages
} from '@client/i18n/messages'
import { getDraftApplicantFullName } from '@client/utils/draftUtils'
import { LoadingIndicator } from '@client/views/RegistrationHome/LoadingIndicator'
import { formattedDuration } from '@client/utils/date-formatting'

interface IInProgressProps {
  theme: ITheme
  draftApplications: IApplication[]
  goToApplicationDetails: typeof goToApplicationDetails
  showPaginated?: boolean
  loading?: boolean
  error?: boolean
}

type IFullProps = IInProgressProps & IntlShapeProps

interface IState {
  inProgressPageNo: number
  width: number
}

class InProgressComponent extends React.Component<IFullProps, IState> {
  pageSize: number

  constructor(props: IFullProps) {
    super(props)

    this.pageSize = 10
    this.state = {
      width: window.innerWidth,
      inProgressPageNo: 1
    }
  }

  transformDraftContent = () => {
    if (
      !this.props.draftApplications ||
      this.props.draftApplications.length <= 0
    ) {
      return []
    }

    return this.props.draftApplications.map((draft: IApplication) => {
      const { intl } = this.props
      const { locale } = intl
      const lastModificationDate = draft.modifiedOn || draft.savedOn
      moment.locale(locale)
      const event =
        (draft.event &&
          intl.formatMessage(
            dynamicConstantsMessages[draft.event.toLowerCase()]
          )) ||
        ''
      const name = getDraftApplicantFullName(draft, locale)
      return {
        id: draft.id,
        event: event,
        name: name || '',
        dateOfModification:
          `${intl.formatMessage(messages.lastUpdated)} ${lastModificationDate &&
            formattedDuration(moment(lastModificationDate))}` || '',
        rowClickHandler: [
          {
            label: 'rowClickHandler',
            handler: () => this.props.goToApplicationDetails(draft.id)
          }
        ]
      }
    })
  }

  componentDidMount() {
    window.addEventListener('resize', this.recordWindowWidth)
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.recordWindowWidth)
  }

  recordWindowWidth = () => {
    this.setState({ width: window.innerWidth })
  }

  onPageChange = (newPageNumber: number) => {
    this.setState({ inProgressPageNo: newPageNumber })
  }

  getColumns = () => {
    if (this.state.width > this.props.theme.grid.breakpoints.lg) {
      return [
        {
          label: this.props.intl.formatMessage(messages.type),
          width: 20,
          key: 'event'
        },
        {
          label: this.props.intl.formatMessage(messages.name),
          width: 40,
          key: 'name',
          errorValue: this.props.intl.formatMessage(messages.noNameProvided)
        },
        {
          label: this.props.intl.formatMessage(messages.lastEdited),
          width: 40,
          key: 'dateOfModification'
        }
      ]
    } else {
      return [
        {
          label: this.props.intl.formatMessage(messages.type),
          width: 30,
          key: 'event'
        },
        {
          label: this.props.intl.formatMessage(messages.name),
          width: 70,
          key: 'name',
          errorValue: this.props.intl.formatMessage(messages.noNameProvided)
        }
      ]
    }
  }

  render() {
    const { draftApplications, intl } = this.props

    return (
      <HomeContent>
        <GridTable
          content={this.transformDraftContent()}
          columns={this.getColumns()}
          noResultText={intl.formatMessage(messages.noResults)}
          onPageChange={(currentPage: number) => {
            this.onPageChange(currentPage)
          }}
          pageSize={this.pageSize}
          totalItems={draftApplications && draftApplications.length}
          currentPage={this.state.inProgressPageNo}
          expandable={false}
          clickable={true}
          showPaginated={this.props.showPaginated}
          loadMoreText={intl.formatMessage(messages.loadMore)}
        />
        <LoadingIndicator loading={false} hasError={false} />
      </HomeContent>
    )
  }
}

export const InProgress = connect(null, { goToApplicationDetails })(
  injectIntl(withTheme(InProgressComponent))
)
