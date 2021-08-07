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
import { COMPOSITION_ID } from '@metrics/features/getTimeLogged/constants'
import { query } from '@metrics/influxdb/client'
import * as Hapi from '@hapi/hapi'

export async function getEventDurationHandler(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  const compositionId = request.query[COMPOSITION_ID]
  const eventDurationData = await query(
    `SELECT previousStatus as status, durationInSeconds
          FROM application_event_duration
        WHERE compositionId = '${compositionId}'`
  )
  return eventDurationData && eventDurationData.length > 0
    ? eventDurationData
    : []
}
