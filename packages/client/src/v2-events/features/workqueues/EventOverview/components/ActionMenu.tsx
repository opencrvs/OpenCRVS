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
import { useIntl } from 'react-intl'

import { useNavigate } from 'react-router-dom'
import { formatISO } from 'date-fns'
import { validate, ActionType } from '@opencrvs/commons/client'
import { type ActionConfig } from '@opencrvs/commons'
import { CaretDown } from '@opencrvs/components/lib/Icon/all-icons'
import { PrimaryButton } from '@opencrvs/components/lib/buttons'
import { DropdownMenu } from '@opencrvs/components/lib/Dropdown'
import { useAuthentication } from '@client/utils/userUtils'
import { useEvents } from '@client/v2-events/features/events/useEvents/useEvents'
import { useEventConfiguration } from '@client/v2-events/features/events/useEventConfiguration'
import { ROUTES } from '@client/v2-events/routes'
import { messages } from '@client/i18n/messages/views/action'

export function ActionMenu({ eventId }: { eventId: string }) {
  const intl = useIntl()
  const events = useEvents()
  const navigate = useNavigate()
  const authentication = useAuthentication()
  const [event] = events.getEvent.useSuspenseQuery(eventId)

  const { eventConfiguration: configuration } = useEventConfiguration(
    event.type
  )

  function isActionVisible(action: ActionConfig) {
    if (action.conditionals.length === 0) {
      return true
    }
    const params = {
      $event: event,
      $user: authentication,
      $now: formatISO(new Date(), { representation: 'date' })
    }
    return action.conditionals.reduce((acc, conditional) => {
      if (conditional.type === 'SHOW') {
        return acc && validate(conditional.conditional, params)
      }
      if (conditional.type === 'HIDE') {
        return acc && !validate(conditional.conditional, params)
      }
      return acc
    }, true)
  }

  return (
    <>
      <DropdownMenu id="action">
        <DropdownMenu.Trigger>
          <PrimaryButton icon={() => <CaretDown />}>
            {intl.formatMessage(messages.action)}
          </PrimaryButton>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content>
          {configuration.actions.filter(isActionVisible).map((action) => {
            return (
              <DropdownMenu.Item
                key={action.type}
                onClick={() => {
                  if (
                    action.type === ActionType.CREATE ||
                    action.type === ActionType.APPROVE_CORRECTION ||
                    action.type === ActionType.REJECT_CORRECTION ||
                    action.type === ActionType.CUSTOM
                  ) {
                    alert(`Action ${action.type} is not implemented yet.`)
                    return
                  }

                  navigate(ROUTES.V2.EVENTS[action.type].buildPath({ eventId }))
                }}
              >
                {intl.formatMessage(action.label)}
              </DropdownMenu.Item>
            )
          })}
        </DropdownMenu.Content>
      </DropdownMenu>
    </>
  )
}
