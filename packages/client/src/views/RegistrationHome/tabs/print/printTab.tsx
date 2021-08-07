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
  goToApplicationDetails,
  goToPrintCertificate
} from '@client/navigation'
import { transformData } from '@client/search/transformer'
import { ITheme } from '@client/styledComponents'
import {
  ColumnContentAlignment,
  GridTable,
  IAction
} from '@opencrvs/components/lib/interface'
import { HomeContent } from '@opencrvs/components/lib/layout'
import { GQLEventSearchResultSet } from '@opencrvs/gateway/src/graphql/schema'
import moment from 'moment'
import * as React from 'react'
import { injectIntl, WrappedComponentProps as IntlShapeProps } from 'react-intl'
import { connect } from 'react-redux'
import { withTheme } from 'styled-components'
import { LoadingIndicator } from '@client/views/RegistrationHome/LoadingIndicator'
import { RowHistoryView } from '@client/views/RegistrationHome/RowHistoryView'
import {
  buttonMessages,
  constantsMessages,
  dynamicConstantsMessages
} from '@client/i18n/messages'
import { messages } from '@client/i18n/messages/views/registrarHome'
import { IStoreState } from '@client/store'
import { IApplication, DOWNLOAD_STATUS } from '@client/applications'
import { Action } from '@client/forms'
import { DownloadButton } from '@client/components/interface/DownloadButton'
import { formattedDuration } from '@client/utils/date-formatting'

interface IBasePrintTabProps {
  theme: ITheme
  goToPrintCertificate: typeof goToPrintCertificate
  registrarLocationId: string | null
  goToApplicationDetails: typeof goToApplicationDetails
  outboxApplications: IApplication[]
  queryData: {
    data: GQLEventSearchResultSet
  }
  page: number
  onPageChange: (newPageNumber: number) => void
  showPaginated?: boolean
  loading?: boolean
  error?: boolean
}

interface IPrintTabState {
  width: number
}

type IPrintTabProps = IntlShapeProps & IBasePrintTabProps

class PrintTabComponent extends React.Component<
  IPrintTabProps,
  IPrintTabState
> {
  pageSize = 10
  constructor(props: IPrintTabProps) {
    super(props)
    this.state = {
      width: window.innerWidth
    }
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

  getExpandable = () => {
    return this.state.width > this.props.theme.grid.breakpoints.lg
      ? true
      : false
  }

  getColumns = () => {
    if (this.state.width > this.props.theme.grid.breakpoints.lg) {
      return [
        {
          label: this.props.intl.formatMessage(constantsMessages.type),
          width: 14,
          key: 'event'
        },
        {
          label: this.props.intl.formatMessage(constantsMessages.name),
          width: 25,
          key: 'name'
        },
        {
          label: this.props.intl.formatMessage(messages.listItemRegisteredDate),
          width: 16,
          key: 'dateOfRegistration'
        },
        {
          label: this.props.intl.formatMessage(messages.registrationNumber),
          width: 25,
          key: 'registrationNumber'
        },
        {
          label: this.props.intl.formatMessage(messages.listItemAction),
          width: 20,
          key: 'actions',
          alignment: ColumnContentAlignment.CENTER,
          isActionColumn: true
        }
      ]
    } else {
      return [
        {
          label: this.props.intl.formatMessage(constantsMessages.type),
          width: 30,
          key: 'event'
        },
        {
          label: this.props.intl.formatMessage(constantsMessages.name),
          width: 70,
          key: 'name'
        }
      ]
    }
  }

  transformRegisteredContent = (data: GQLEventSearchResultSet) => {
    const { intl } = this.props
    if (!data || !data.results) {
      return []
    }

    const transformedData = transformData(data, this.props.intl)
    return transformedData.map((reg, index) => {
      const foundApplication = this.props.outboxApplications.find(
        application => application.id === reg.id
      )
      const actions: IAction[] = []
      const downloadStatus =
        (foundApplication && foundApplication.downloadStatus) || undefined

      if (downloadStatus !== DOWNLOAD_STATUS.DOWNLOADED) {
        actions.push({
          actionComponent: (
            <DownloadButton
              downloadConfigs={{
                event: reg.event,
                compositionId: reg.id,
                action: Action.LOAD_CERTIFICATE_APPLICATION
              }}
              key={`DownloadButton-${index}`}
              status={downloadStatus as DOWNLOAD_STATUS}
            />
          )
        })
      } else {
        actions.push({
          label: this.props.intl.formatMessage(buttonMessages.print),
          handler: () =>
            this.props.goToPrintCertificate(
              reg.id,
              reg.event.toLocaleLowerCase() || ''
            )
        })
      }
      const event =
        (reg.event &&
          intl.formatMessage(
            dynamicConstantsMessages[reg.event.toLowerCase()]
          )) ||
        ''
      return {
        ...reg,
        event,
        dateOfRegistration:
          (reg.modifiedAt &&
            formattedDuration(
              moment(
                moment(reg.modifiedAt, 'x').format('YYYY-MM-DD HH:mm:ss'),
                'YYYY-MM-DD HH:mm:ss'
              )
            )) ||
          '',
        actions,
        rowClickHandler: [
          {
            label: 'rowClickHandler',
            handler: () => this.props.goToApplicationDetails(reg.id)
          }
        ]
      }
    })
  }

  renderExpandedComponent = (itemId: string) => {
    const { results } = this.props.queryData && this.props.queryData.data
    const eventDetails =
      results && results.find(result => result && result.id === itemId)
    return <RowHistoryView eventDetails={eventDetails} />
  }

  render() {
    const { intl, queryData, page, onPageChange } = this.props
    const { data } = queryData

    return (
      <HomeContent>
        <GridTable
          content={this.transformRegisteredContent(data)}
          columns={this.getColumns()}
          renderExpandedComponent={this.renderExpandedComponent}
          noResultText={intl.formatMessage(constantsMessages.noResults)}
          onPageChange={onPageChange}
          pageSize={this.pageSize}
          totalItems={(data && data.totalItems) || 0}
          currentPage={page}
          expandable={this.getExpandable()}
          clickable={!this.getExpandable()}
          showPaginated={this.props.showPaginated}
          loading={this.props.loading}
          loadMoreText={intl.formatMessage(constantsMessages.loadMore)}
        />
        <LoadingIndicator
          loading={this.props.loading ? true : false}
          hasError={this.props.error ? true : false}
        />
      </HomeContent>
    )
  }
}

function mapStateToProps(state: IStoreState) {
  return {
    outboxApplications: state.applicationsState.applications
  }
}

export const PrintTab = connect(mapStateToProps, {
  goToPrintCertificate,
  goToApplicationDetails
})(injectIntl(withTheme(PrintTabComponent)))
