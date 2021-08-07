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
import * as Hapi from '@hapi/hapi'
import {
  fetchRegWithinTimeFrames,
  getCurrentAndLowerLocationLevels,
  fetchCertificationPayments,
  fetchGenderBasisMetrics,
  fetchEstimated45DayMetrics
} from '@metrics/features/metrics/metricsGenerator'

import {
  TIME_FROM,
  TIME_TO,
  LOCATION_ID,
  EVENT
} from '@metrics/features/metrics/constants'
import {
  EVENT_TYPE,
  fetchChildLocationIdsByParentId
} from '@metrics/features/metrics/utils'
import { IAuthHeader } from '@metrics/features/registration/'

export async function metricsHandler(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  const timeStart = request.query[TIME_FROM]
  const timeEnd = request.query[TIME_TO]
  const locationId = 'Location/' + request.query[LOCATION_ID]
  const event = request.query[EVENT].toUpperCase() as EVENT_TYPE
  let currentLocationLevel
  let lowerLocationLevel

  try {
    const levels = await getCurrentAndLowerLocationLevels(
      timeStart,
      timeEnd,
      locationId,
      event
    )
    currentLocationLevel = levels.currentLocationLevel
    lowerLocationLevel = levels.lowerLocationLevel
  } catch (err) {
    return {
      timeFrames: [],
      payments: [],
      genderBasisMetrics: [],
      estimated45DayMetrics: []
    }
  }

  const authHeader: IAuthHeader = {
    Authorization: request.headers.authorization
  }

  const childLocationIds = await fetchChildLocationIdsByParentId(
    request.query[LOCATION_ID],
    currentLocationLevel,
    lowerLocationLevel,
    authHeader
  )

  const timeFrames = await fetchRegWithinTimeFrames(
    timeStart,
    timeEnd,
    locationId,
    currentLocationLevel,
    lowerLocationLevel,
    event,
    childLocationIds
  )

  const payments = await fetchCertificationPayments(
    timeStart,
    timeEnd,
    locationId,
    currentLocationLevel,
    lowerLocationLevel,
    event,
    childLocationIds
  )

  const genderBasisMetrics = await fetchGenderBasisMetrics(
    timeStart,
    timeEnd,
    locationId,
    currentLocationLevel,
    lowerLocationLevel,
    event,
    childLocationIds
  )

  const estimated45DayMetrics = await fetchEstimated45DayMetrics(
    timeStart,
    timeEnd,
    locationId,
    currentLocationLevel,
    lowerLocationLevel,
    event,
    childLocationIds,
    authHeader
  )

  return { timeFrames, payments, genderBasisMetrics, estimated45DayMetrics }
}
