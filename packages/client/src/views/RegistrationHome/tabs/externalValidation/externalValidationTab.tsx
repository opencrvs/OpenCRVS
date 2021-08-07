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
  GridTable,
  ColumnContentAlignment
} from '@opencrvs/components/lib/interface'
import { ITheme, withTheme } from '@client/styledComponents'
import { HomeContent } from '@opencrvs/components/lib/layout'
import { GQLEventSearchResultSet } from '@opencrvs/gateway/src/graphql/schema'
import { transformData } from '@client/search/transformer'
import { injectIntl, WrappedComponentProps as IntlShapeProps } from 'react-intl'
import {
  dynamicConstantsMessages,
  constantsMessages
} from '@client/i18n/messages'
import { messages } from '@client/i18n/messages/views/registrarHome'
import moment from 'moment'
import { connect } from 'react-redux'
import { goToPage, goToApplicationDetails } from '@client/navigation'
import { RowHistoryView } from '@client/views/RegistrationHome/RowHistoryView'
import { LoadingIndicator } from '@client/views/RegistrationHome/LoadingIndicator'
import { formattedDuration } from '@client/utils/date-formatting'

const { useState, useEffect } = React

interface IBaseProps {
  theme: ITheme
  queryData: {
    data: GQLEventSearchResultSet
  }
  registrarLocationId: string | null
  page: number
  onPageChange: (newPageNumber: number) => void
  showPaginated?: boolean
  loading?: boolean
  error?: boolean
}

interface IDispatchProps {
  goToPage: typeof goToPage
  goToApplicationDetails: typeof goToApplicationDetails
}

type IProps = IBaseProps & IntlShapeProps & IDispatchProps

function ExternalValidationTabComponent(props: IProps) {
  const pageSize = 10
  const transformWaitingValidationContent = (data: GQLEventSearchResultSet) => {
    const { intl } = props
    if (!data || !data.results) {
      return []
    }
    const transformedData = transformData(data, props.intl)

    return transformedData.map(reg => {
      const event =
        (reg.event &&
          intl.formatMessage(
            dynamicConstantsMessages[reg.event.toLowerCase()]
          )) ||
        ''
      return {
        ...reg,
        event,
        actions: [],
        eventTimeElapsed:
          (reg.dateOfEvent &&
            formattedDuration(
              moment(reg.dateOfEvent.toString(), 'YYYY-MM-DD')
            )) ||
          '',
        waitingTimeElapsed:
          (reg.modifiedAt &&
            formattedDuration(
              moment(
                moment(reg.modifiedAt, 'x').format('YYYY-MM-DD HH:mm:ss'),
                'YYYY-MM-DD HH:mm:ss'
              )
            )) ||
          '',

        rowClickHandler: [
          {
            label: 'rowClickHandler',
            handler: () => props.goToApplicationDetails(reg.id)
          }
        ]
      }
    })
  }

  const [viewportWidth, setViewportWidth] = useState<number>(window.innerWidth)

  useEffect(() => {
    function recordWindowWidth() {
      setViewportWidth(window.innerWidth)
    }

    window.addEventListener('resize', recordWindowWidth)

    return () => window.removeEventListener('resize', recordWindowWidth)
  }, [])

  const columns =
    viewportWidth > props.theme.grid.breakpoints.lg
      ? [
          {
            label: props.intl.formatMessage(constantsMessages.type),
            width: 14,
            key: 'event'
          },
          {
            label: props.intl.formatMessage(constantsMessages.name),
            width: 25,
            key: 'name'
          },
          {
            label: props.intl.formatMessage(messages.sentForExternalValidation),
            width: 28,
            key: 'waitingTimeElapsed'
          },
          {
            label: props.intl.formatMessage(constantsMessages.eventDate),
            width: 28,
            key: 'eventTimeElapsed'
          },
          {
            width: 5,
            key: 'actions',
            isActionColumn: true,
            alignment: ColumnContentAlignment.CENTER
          }
        ]
      : [
          {
            label: props.intl.formatMessage(constantsMessages.type),
            width: 30,
            key: 'event'
          },
          {
            label: props.intl.formatMessage(constantsMessages.name),
            width: 70,
            key: 'name'
          }
        ]

  const renderExpandedComponent = (itemId: string) => {
    const { results } = props.queryData && props.queryData.data
    const eventDetails =
      results && results.find(result => result && result.id === itemId)
    return <RowHistoryView eventDetails={eventDetails} />
  }

  const isExpandable = viewportWidth > props.theme.grid.breakpoints.lg

  const { intl, queryData, page, onPageChange } = props
  const { data } = queryData

  return (
    <HomeContent>
      <GridTable
        content={transformWaitingValidationContent(data)}
        renderExpandedComponent={renderExpandedComponent}
        noResultText={intl.formatMessage(constantsMessages.noResults)}
        onPageChange={onPageChange}
        pageSize={pageSize}
        totalItems={(data && data.totalItems) || 0}
        currentPage={page}
        expandable={isExpandable}
        clickable={!isExpandable}
        showPaginated={props.showPaginated}
        loading={props.loading}
        loadMoreText={intl.formatMessage(constantsMessages.loadMore)}
        columns={columns}
      />
      <LoadingIndicator
        loading={Boolean(props.loading)}
        hasError={Boolean(props.error)}
      />
    </HomeContent>
  )
}

export const ExternalValidationTab = connect(null, {
  goToPage,
  goToApplicationDetails
})(injectIntl(withTheme(ExternalValidationTabComponent)))
