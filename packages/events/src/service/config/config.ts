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

import { env } from '@events/environment'
import {
  ActionInput,
  ActionType,
  EventConfig,
  EventDocument,
  FieldConfig,
  findActiveActionFields,
  getOrThrow,
  logger
} from '@opencrvs/commons'
import fetch from 'node-fetch'
import { array } from 'zod'

export async function getEventConfigurations(token: string) {
  const res = await fetch(new URL('/events', env.COUNTRY_CONFIG_URL), {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    }
  })

  if (!res.ok) {
    throw new Error('Failed to fetch events config')
  }

  return array(EventConfig).parse(await res.json())
}

async function findEventConfigurationById({
  token,
  eventType
}: {
  token: string
  eventType: string
}) {
  const configurations = await getEventConfigurations(token)

  return configurations.find((config) => config.id === eventType)
}

export async function getActionFormFields({
  token,
  eventType,
  action
}: {
  token: string
  eventType: string
  action: ActionType
}): Promise<FieldConfig[]> {
  const configuration = getOrThrow(
    await findEventConfigurationById({
      token,
      eventType
    }),
    `No configuration found for event type: ${eventType}`
  )

  return getOrThrow(
    findActiveActionFields(configuration, action),
    `No fields found for action: ${action}`
  )
}

export async function notifyOnAction(
  action: ActionInput,
  event: EventDocument,
  token: string
) {
  try {
    await fetch(
      new URL(
        `/events/${event.type}/actions/${action.type}`,
        env.COUNTRY_CONFIG_URL
      ),
      {
        method: 'POST',
        body: JSON.stringify(event),
        headers: {
          'Content-Type': 'application/json',
          Authorization: token
        }
      }
    )
  } catch (error) {
    logger.error(error)
  }
}
