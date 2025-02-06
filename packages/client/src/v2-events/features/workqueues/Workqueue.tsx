/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * OpenCRVS is also distributed under the terms of the Civil Registration
 * & Healthcare Disclaimer located at http://opencrvs.org/license.
 *
 * Copyright (C) The OpenCRVS Authors located at https://github.com/opencrvs/opencrvs-core/blob/master/AUTHORS.
 */

import React, { useState } from 'react'
import { mapKeys, orderBy } from 'lodash'
import { defineMessages, useIntl } from 'react-intl'
import ReactTooltip from 'react-tooltip'
import styled, { useTheme } from 'styled-components'

import { Link } from 'react-router-dom'
import { useTypedSearchParams } from 'react-router-typesafe-routes/dom'

import {
  defaultColumns,
  EventConfig,
  EventIndex,
  getAllFields,
  getOrThrow,
  RootWorkqueueConfig,
  workqueues
} from '@opencrvs/commons/client'
import { useWindowSize } from '@opencrvs/components/lib/hooks'
import {
  ColumnContentAlignment,
  SORT_ORDER,
  Workqueue as WorkqueueComponent
} from '@opencrvs/components/lib/Workqueue'
import { IconWithName } from '@client/v2-events/components/IconWithName'
import { useEventConfigurations } from '@client/v2-events/features/events/useEventConfiguration'
import { useEvents } from '@client/v2-events/features/events/useEvents/useEvents'

import { formattedDuration } from '@client/utils/date-formatting'
import { getInitialValues } from '@client/v2-events/components/forms/utils'
import { ROUTES } from '@client/v2-events/routes'
import { WQContentWrapper } from './components/ContentWrapper'
import { useIntlFormatMessageWithFlattenedParams } from './utils'

const messages = defineMessages({
  empty: {
    defaultMessage: 'Empty message',
    description: 'Label for workqueue tooltip',
    id: 'v2.regHome.issued'
  }
})

/**
 * Based on packages/client/src/views/OfficeHome/requiresUpdate/RequiresUpdate.tsx and others in the same directory.
 * Ideally we could use a single component for a workqueue.
 */

const ToolTipContainer = styled.span`
  text-align: center;
`

const NondecoratedLink = styled(Link)`
  text-decoration: none;
  color: 'primary';
`

function changeSortedColumn(
  columnName: string,
  presentSortedCol: string,
  presentSortOrder: SORT_ORDER
) {
  const initialSortOrder = SORT_ORDER.ASCENDING
  const isInitialSortOrder = presentSortOrder === initialSortOrder
  const isSameColumn = columnName === presentSortedCol

  function toggle() {
    if (isSameColumn) {
      return isInitialSortOrder ? SORT_ORDER.DESCENDING : SORT_ORDER.ASCENDING
    }

    return initialSortOrder
  }

  return {
    newSortedCol: columnName,
    newSortOrder: toggle()
  }
}

export function WorkqueueIndex({ workqueueId }: { workqueueId: string }) {
  const { getEvents } = useEvents()
  const [searchParams] = useTypedSearchParams(ROUTES.V2.WORKQUEUES.WORKQUEUE)

  const events = (getEvents.useQuery().data ?? []) satisfies EventIndex[]
  const eventConfigs = useEventConfigurations()

  const workqueueConfig =
    workqueueId in workqueues
      ? workqueues[workqueueId as keyof typeof workqueues]
      : null

  if (!workqueueConfig) {
    return null
  }

  return (
    <Workqueue
      events={events}
      workqueueConfig={workqueueConfig}
      {...searchParams}
      eventConfigs={eventConfigs}
    />
  )
}

interface Column {
  label?: string
  width: number
  key: string
  sortFunction?: (columnName: string) => void
  isActionColumn?: boolean
  isSorted?: boolean
  alignment?: ColumnContentAlignment
}
/**
 * A Workqueue that displays a table of events based on search criteria.
 */
function Workqueue({
  events,
  workqueueConfig,
  limit,
  offset,
  eventConfigs
}: {
  events: EventIndex[]
  workqueueConfig: RootWorkqueueConfig
  limit: number
  offset: number
  eventConfigs: EventConfig[]
}) {
  const intl = useIntl()
  const flattenedIntl = useIntlFormatMessageWithFlattenedParams()
  const theme = useTheme()
  const { getOutbox, getDrafts } = useEvents()
  const outbox = getOutbox()
  const drafts = getDrafts()

  const validEvents = events.filter((event) =>
    eventConfigs.some((e) => e.id === event.type)
  )

  if (validEvents.length !== events.length) {
    // eslint-disable-next-line
    console.log('Fields without proper configuration found. Ignoring them')
  }

  const workqueue = validEvents
    .map((event) => {
      const { data, ...rest } = event
      return { ...rest, ...mapKeys(data, (_, key) => `${key}`) }
    })
    .filter((event) => eventConfigs.some((e) => e.id === event.type))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((event: Omit<EventIndex, 'data'> & { [key: string]: any }) => {
      /** We already filtered invalid events, this should never happen. */
      const eventConfig = getOrThrow(
        eventConfigs.find((e) => e.id === event.type),
        `Could not find event config for ${event.id}`
      )

      const isInOutbox = outbox.some(
        (outboxEvent) => outboxEvent.id === event.id
      )
      const isInDrafts = drafts.some((draft) => draft.id === event.id)

      const getEventStatus = () => {
        if (isInOutbox) {
          return 'OUTBOX'
        }
        if (isInDrafts) {
          return 'DRAFT'
        }
        return event.status
      }

      const initialValues = getInitialValues(getAllFields(eventConfig))

      const eventWorkqueue = getOrThrow(
        eventConfig.workqueues.find((wq) => wq.id === workqueueConfig.id),
        `Could not find workqueue config for ${workqueueConfig.id}`
      )

      const fieldsWithPopulatedValues: Record<string, string> =
        eventWorkqueue.fields.reduce(
          (acc, field) => ({
            ...acc,
            [field.column]: flattenedIntl.formatMessage(field.label, {
              ...initialValues,
              ...event
            })
          }),
          {}
        )

      const titleColumnId = workqueueConfig.columns[0].id

      return {
        ...fieldsWithPopulatedValues,
        ...event,
        event: intl.formatMessage(eventConfig.label),
        createdAt: formattedDuration(new Date(event.createdAt)),
        modifiedAt: formattedDuration(new Date(event.modifiedAt)),

        status: intl.formatMessage(
          {
            id: `events.status`,
            defaultMessage:
              '{status, select, OUTBOX {Syncing..} CREATED {Draft} VALIDATED {Validated} DRAFT {Draft} DECLARED {Declared} REGISTERED {Registered} other {Unknown}}'
          },
          {
            status: getEventStatus()
          }
        ),
        [titleColumnId]: isInOutbox ? (
          <IconWithName
            name={fieldsWithPopulatedValues[titleColumnId]}
            status={'OUTBOX'}
          />
        ) : (
          <NondecoratedLink
            to={ROUTES.V2.EVENTS.OVERVIEW.buildPath({
              eventId: event.id
            })}
          >
            <IconWithName
              name={fieldsWithPopulatedValues[titleColumnId]}
              status={event.status}
            />
          </NondecoratedLink>
        )
      }
    })

  const { width } = useWindowSize()
  const [sortedCol, setSortedCol] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState(SORT_ORDER.DESCENDING)

  function onColumnClick(columnName: string) {
    const { newSortedCol, newSortOrder } = changeSortedColumn(
      columnName,
      sortedCol,
      sortOrder
    )
    setSortedCol(newSortedCol)
    setSortOrder(newSortOrder)
  }

  function getDefaultColumns(): Array<Column> {
    return workqueueConfig.defaultColumns.map(
      (column): Column => ({
        label:
          column in defaultColumns
            ? intl.formatMessage(
                defaultColumns[column as keyof typeof defaultColumns].label
              )
            : '',
        width: 25,
        key: column,
        sortFunction: onColumnClick,
        isSorted: sortedCol === column
      })
    )
  }

  // @TODO: separate types for action button vs other columns
  function getColumns(): Array<Column> {
    if (width > theme.grid.breakpoints.lg) {
      return workqueueConfig.columns.map((column) => ({
        label: intl.formatMessage(column.label),
        width: 35,
        key: column.id,
        sortFunction: onColumnClick,
        isSorted: sortedCol === column.id
      }))
    } else {
      return workqueueConfig.columns
        .map((column) => ({
          label: intl.formatMessage(column.label),
          width: 35,
          key: column.id,
          sortFunction: onColumnClick,
          isSorted: sortedCol === column.id
        }))
        .slice(0, 2)
    }
  }

  const totalPages = workqueue.length ? Math.round(workqueue.length / limit) : 0

  const isShowPagination = totalPages >= 1
  return (
    <WQContentWrapper
      error={false}
      isMobileSize={width < theme.grid.breakpoints.lg}
      isShowPagination={isShowPagination}
      loading={false} // @TODO: Handle these on top level
      noContent={workqueue.length === 0}
      noResultText={'No results'}
      paginationId={Math.round(offset / limit)}
      // eslint-disable-next-line
      title={intl.formatMessage(workqueueConfig.title)}
      totalPages={totalPages}
    >
      <ReactTooltip id="validateTooltip">
        <ToolTipContainer>
          {intl.formatMessage(messages.empty)}
        </ToolTipContainer>
      </ReactTooltip>
      <WorkqueueComponent
        columns={getColumns().concat(getDefaultColumns())}
        content={orderBy(workqueue, sortedCol, sortOrder)}
        hideLastBorder={!isShowPagination}
        loading={false} // @TODO: Handle these on top level
        sortOrder={sortOrder}
      />
    </WQContentWrapper>
  )
}
