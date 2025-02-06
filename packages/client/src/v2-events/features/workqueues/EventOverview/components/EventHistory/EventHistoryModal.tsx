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
import { defineMessages, useIntl } from 'react-intl'
import format from 'date-fns/format'
import { ResponsiveModal, Stack } from '@opencrvs/components'
import { Text } from '@opencrvs/components/lib/Text'
import { ActionDocument } from '@opencrvs/commons/client'
import { ResolvedUser } from '@opencrvs/commons'
import { getUsersFullName, joinValues } from '@client/v2-events/utils'

const messages = defineMessages({
  'event.history.modal.timeFormat': {
    defaultMessage: 'MMMM dd, yyyy · hh.mm a',
    id: 'v2.event.history.timeFormat',
    description: 'Time format for timestamps in event history'
  }
})

/**
 * Detailed view of single Action, showing the history of the event.
 *
 * @TODO: Add more details to the modal and ability to diff changes when more events are specified.
 */
export function EventHistoryModal({
  history,
  user,
  close
}: {
  history: ActionDocument
  user: ResolvedUser
  close: () => void
}) {
  const intl = useIntl()

  const name = getUsersFullName(user.name, intl.locale)
  return (
    <ResponsiveModal
      autoHeight
      actions={[]}
      handleClose={close}
      responsive={true}
      show={true}
      title={history.type}
      width={1024}
    >
      <Stack>
        <Text color="grey500" element="p" variant="reg19">
          {joinValues(
            [
              name,
              format(
                new Date(history.createdAt),
                intl.formatMessage(messages['event.history.modal.timeFormat'])
              )
            ],
            ' — '
          )}
        </Text>
      </Stack>
    </ResponsiveModal>
  )
}
