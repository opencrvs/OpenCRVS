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
  fetchLocationWiseEventEstimations,
  getTotalNumberOfRegistrations
} from '@metrics/features/metrics/metricsGenerator'
import {
  TIME_FROM,
  TIME_TO,
  LOCATION_ID,
  EVENT
} from '@metrics/features/metrics/constants'
import { IAuthHeader } from '@metrics/features/registration/'
import { fetchChildLocationsByParentId } from '@metrics/api'

interface ILocationWiseEstimation {
  actualTotalRegistration: number
  actual45DayRegistration: number
  estimatedRegistration: number
  estimated45DayPercentage: number
  locationId: string
  locationName: string
}

export async function locationWiseEventEstimationsHandler(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  const timeStart = request.query[TIME_FROM]
  const timeEnd = request.query[TIME_TO]
  const locationId = 'Location/' + request.query[LOCATION_ID]
  const event = request.query[EVENT]
  const authHeader: IAuthHeader = {
    Authorization: request.headers.authorization
  }
  const childLocations = await fetchChildLocationsByParentId(
    locationId,
    authHeader
  )

  const estimations: ILocationWiseEstimation[] = []
  for (const childLocation of childLocations) {
    if (!childLocation || !childLocation.id) {
      continue
    }

    const estimated45DayMetrics = await fetchLocationWiseEventEstimations(
      timeStart,
      timeEnd,
      `Location/${childLocation.id}`,
      event,
      authHeader
    )

    estimations.push({
      actualTotalRegistration: await getTotalNumberOfRegistrations(
        timeStart,
        timeEnd,
        `Location/${childLocation.id}`,
        event
      ),
      actual45DayRegistration: estimated45DayMetrics.actualRegistration,
      estimatedRegistration: estimated45DayMetrics.estimatedRegistration,
      estimated45DayPercentage: estimated45DayMetrics.estimatedPercentage,
      locationName: childLocation.name || '',
      locationId: childLocation.id
    })
  }
  return estimations
}
