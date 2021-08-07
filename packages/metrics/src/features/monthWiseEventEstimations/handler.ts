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
  getMonthRangeFilterListFromTimeRage,
  IMonthRangeFilter
} from '@metrics/features/metrics/utils'
import {
  TIME_FROM,
  TIME_TO,
  LOCATION_ID,
  EVENT
} from '@metrics/features/metrics/constants'
import { IAuthHeader } from '@metrics/features/registration/'

interface IMonthWiseEstimation {
  actualTotalRegistration: number
  actual45DayRegistration: number
  estimatedRegistration: number
  estimated45DayPercentage: number
  month: string
  year: string
  startOfMonth: string
  endOfMonth: string
}

export async function monthWiseEventEstimationsHandler(
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
  const monthFilters: IMonthRangeFilter[] = getMonthRangeFilterListFromTimeRage(
    timeStart,
    timeEnd
  )
  const estimations: IMonthWiseEstimation[] = []
  for (const monthFilter of monthFilters) {
    const estimated45DayMetrics = await fetchLocationWiseEventEstimations(
      monthFilter.startOfMonthTime,
      monthFilter.endOfMonthTime,
      locationId,
      event,
      authHeader
    )

    estimations.push({
      startOfMonth: monthFilter.startOfMonthTime,
      endOfMonth: monthFilter.endOfMonthTime,
      actualTotalRegistration: await getTotalNumberOfRegistrations(
        monthFilter.startOfMonthTime,
        monthFilter.endOfMonthTime,
        locationId,
        event
      ),
      actual45DayRegistration: estimated45DayMetrics.actualRegistration,
      estimatedRegistration: estimated45DayMetrics.estimatedRegistration,
      estimated45DayPercentage: estimated45DayMetrics.estimatedPercentage,
      month: monthFilter.month,
      year: monthFilter.year
    })
  }
  return estimations
}
