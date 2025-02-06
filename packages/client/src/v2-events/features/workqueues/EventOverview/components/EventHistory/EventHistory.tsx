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
import React from 'react'
import { format } from 'date-fns'
import styled from 'styled-components'
import { defineMessages, useIntl } from 'react-intl'
import { useNavigate } from 'react-router-dom'
import { stringify } from 'query-string'
import { Link } from '@opencrvs/components'
import { ColumnContentAlignment } from '@opencrvs/components/lib/common-types'
import { Divider } from '@opencrvs/components/lib/Divider'
import { Text } from '@opencrvs/components/lib/Text'
import { Table } from '@opencrvs/components/lib/Table'
import { ActionDocument } from '@opencrvs/commons/client'
import { ResolvedUser } from '@opencrvs/commons'
import { useModal } from '@client/v2-events/hooks/useModal'
import { constantsMessages } from '@client/v2-events/messages'
import * as routes from '@client/navigation/routes'
import { formatUrl } from '@client/navigation'
import { useEventOverviewContext } from '@client/v2-events/features/workqueues/EventOverview/EventOverviewContext'
import { EventHistoryModal } from './EventHistoryModal'
import { UserAvatar } from './UserAvatar'

/**
 * Based on packages/client/src/views/RecordAudit/History.tsx
 */

const TableDiv = styled.div`
  overflow: auto;
`

const DEFAULT_HISTORY_RECORD_PAGE_SIZE = 10

const messages = defineMessages({
  'event.history.timeFormat': {
    defaultMessage: 'MMMM dd, yyyy · hh.mm a',
    id: 'v2.event.history.timeFormat',
    description: 'Time format for timestamps in event history'
  },
  'events.history.status': {
    id: `v2.events.history.status`,
    defaultMessage:
      '{status, select, CREATE {Draft} VALIDATE {Validated} DRAFT {Draft} DECLARE {Declared} REGISTER {Registered} PRINT_CERTIFICATE {Print certificate} other {Unknown}}'
  },
  'event.history.role': {
    id: 'v2.event.history.role',
    defaultMessage:
      '{role, select, LOCAL_REGISTRAR{Local Registrar} other{Unknown}}',
    description: 'Role of the user in the event history'
  }
})

/**
 *  Renders the event history table. Used for audit trail.
 */
export function EventHistory({ history }: { history: ActionDocument[] }) {
  const intl = useIntl()
  const navigate = useNavigate()
  const [modal, openModal] = useModal()
  const { getUser, getLocation } = useEventOverviewContext()

  const onHistoryRowClick = (item: ActionDocument, user: ResolvedUser) => {
    void openModal<void>((close) => (
      <EventHistoryModal close={close} history={item} user={user} />
    ))
  }

  const historyRows = history.map((item) => {
    const user = getUser(item.createdBy)

    const location = getLocation(item.createdAtLocation)

    return {
      date: format(
        new Date(item.createdAt),
        intl.formatMessage(messages['event.history.timeFormat'])
      ),
      action: (
        <Link
          font="bold14"
          onClick={() => {
            onHistoryRowClick(item, user)
          }}
        >
          {intl.formatMessage(messages['events.history.status'], {
            status: item.type
          })}
        </Link>
      ),
      user: (
        <Link
          font="bold14"
          id="profile-link"
          onClick={() =>
            navigate(
              formatUrl(routes.USER_PROFILE, {
                userId: item.createdBy
              })
            )
          }
        >
          <UserAvatar
            // @TODO: extend v2-events User to include avatar
            avatar={undefined}
            locale={intl.locale}
            names={user.name}
          />
        </Link>
      ),
      role: intl.formatMessage(messages['event.history.role'], {
        role: user.role
      }),
      location: (
        <Link
          font="bold14"
          onClick={() => {
            navigate({
              pathname: routes.TEAM_USER_LIST,
              search: stringify({
                locationId: item.createdAtLocation
              })
            })
          }}
        >
          {location.name}
        </Link>
      )
    }
  })

  const columns = [
    {
      label: intl.formatMessage(constantsMessages.action),
      width: 22,
      key: 'action'
    },
    {
      label: intl.formatMessage(constantsMessages.date),
      width: 22,
      key: 'date'
    },
    {
      label: intl.formatMessage(constantsMessages.by),
      width: 22,
      key: 'user',
      isIconColumn: true,
      ICON_ALIGNMENT: ColumnContentAlignment.LEFT
    },
    {
      label: intl.formatMessage(constantsMessages.labelRole),
      width: 15,
      key: 'role'
    },
    {
      label: intl.formatMessage(constantsMessages.location),
      width: 20,
      key: 'location'
    }
  ]
  return (
    <>
      <Divider />
      <Text color="copy" element="h3" variant="h3">
        {intl.formatMessage(constantsMessages.history)}
      </Text>
      <TableDiv>
        <Table
          highlightRowOnMouseOver
          columns={columns}
          content={historyRows}
          fixedWidth={1088}
          id="task-history"
          noResultText=""
          pageSize={DEFAULT_HISTORY_RECORD_PAGE_SIZE}
        />
      </TableDiv>
      {modal}
    </>
  )
}
