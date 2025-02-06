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

import React, { useCallback } from 'react'
import { defineMessages, useIntl } from 'react-intl'
import { useTypedParams } from 'react-router-typesafe-routes/dom'
import { isUndeclaredDraft } from '@opencrvs/commons/client'
import type { TranslationConfig } from '@opencrvs/commons/events'
import { AppBar, Button, Icon, ToggleMenu } from '@opencrvs/components'
import { useEvents } from '@client/v2-events//features/events/useEvents/useEvents'
import { useEventFormNavigation } from '@client/v2-events//features/events/useEventFormNavigation'
import { AllowedRouteWithEventId } from './utils'

const messages = defineMessages({
  saveExitButton: {
    id: 'v2.buttons.saveExit',
    defaultMessage: 'Save & Exit',
    description: 'The label for the save and exit button'
  },
  exitButton: {
    id: 'v2.buttons.exit',
    defaultMessage: 'Exit',
    description: 'The label for the exit button'
  }
})

export function FormHeader({
  label,
  onSaveAndExit,
  route,
  appbarIcon
}: {
  label: TranslationConfig
  onSaveAndExit?: () => void
  route: AllowedRouteWithEventId
  appbarIcon?: React.ReactNode
}) {
  const intl = useIntl()
  const { modal, exit, goToHome, deleteDeclaration } = useEventFormNavigation()

  const { eventId } = useTypedParams(route)

  if (!eventId) {
    throw new Error('Event id is required')
  }
  const events = useEvents()
  const [event] = events.getEvent.useSuspenseQuery(eventId)

  const onExit = useCallback(async () => {
    await exit(event)
  }, [event, exit])

  const onDelete = useCallback(async () => {
    await deleteDeclaration(eventId)
  }, [eventId, deleteDeclaration])

  return (
    <AppBar
      desktopLeft={appbarIcon}
      desktopRight={
        <>
          {onSaveAndExit ? (
            <>
              <Button
                disabled={false}
                id="save-exit-btn"
                size="small"
                type="primary"
                onClick={onSaveAndExit}
              >
                <Icon name="DownloadSimple" />
                {intl.formatMessage(messages.saveExitButton)}
              </Button>

              <Button size="small" type="secondary" onClick={onExit}>
                <Icon name="X" />
                {intl.formatMessage(messages.exitButton)}
              </Button>
              <ToggleMenu
                id={'event-menu'}
                menuItems={
                  isUndeclaredDraft(event)
                    ? [
                        {
                          label: 'Delete declaration',
                          icon: <Icon name="Trash" />,
                          handler: onDelete
                        }
                      ]
                    : []
                }
                toggleButton={
                  <Icon color="primary" name="DotsThreeVertical" size="large" />
                }
              />
            </>
          ) : (
            <Button size="small" type="icon" onClick={goToHome}>
              <Icon name="X" />
            </Button>
          )}
          {modal}
        </>
      }
      desktopTitle={intl.formatMessage(label)}
      mobileLeft={appbarIcon}
      mobileRight={
        <>
          {onSaveAndExit ? (
            <>
              <Button
                disabled={false}
                size="small"
                type="icon"
                onClick={onSaveAndExit}
              >
                <Icon name="DownloadSimple" />
              </Button>

              <Button size="small" type="icon" onClick={onExit}>
                <Icon name="X" />
              </Button>
              <ToggleMenu
                id={'event-menu'}
                menuItems={[
                  {
                    label: 'Delete declaration',
                    icon: <Icon name="Trash" />,
                    handler: onDelete
                  }
                ]}
                toggleButton={
                  <Icon color="primary" name="DotsThreeVertical" size="large" />
                }
              />
            </>
          ) : (
            <Button size="small" type="icon" onClick={goToHome}>
              <Icon name="X" />
            </Button>
          )}
          {modal}
        </>
      }
      mobileTitle={intl.formatMessage(label)}
    />
  )
}
