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
import { fetchLocationWiseEventEstimations } from '@metrics/features/metrics/metricsGenerator'

import {
  TIME_FROM,
  TIME_TO,
  LOCATION_ID
} from '@metrics/features/metrics/constants'
import { EVENT_TYPE } from '@metrics/features/metrics/utils'
import { IAuthHeader } from '@metrics/features/registration/'

export async function eventEstimationsHandler(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  const timeStart = request.query[TIME_FROM]
  const timeEnd = request.query[TIME_TO]
  const locationId = 'Location/' + request.query[LOCATION_ID]
  const authHeader: IAuthHeader = {
    Authorization: request.headers.authorization
  }
  let estimated45DayBirthMetrics
  try {
    estimated45DayBirthMetrics = await fetchLocationWiseEventEstimations(
      timeStart,
      timeEnd,
      locationId,
      EVENT_TYPE.BIRTH,
      authHeader
    )
  } catch (error) {
    return {
      birth45DayMetrics: {
        actualRegistration: 0,
        estimatedRegistration: 0,
        estimatedPercentage: 0,
        malePercentage: 0,
        femalePercentage: 0
      },
      death45DayMetrics: {
        actualRegistration: 0,
        estimatedRegistration: 0,
        estimatedPercentage: 0,
        malePercentage: 0,
        femalePercentage: 0
      }
    }
  }
  let estimated45DayDeathMetrics
  try {
    estimated45DayDeathMetrics = await fetchLocationWiseEventEstimations(
      timeStart,
      timeEnd,
      locationId,
      EVENT_TYPE.DEATH,
      authHeader
    )
  } catch (error) {
    return {
      birth45DayMetrics: {
        ...estimated45DayBirthMetrics
      },
      death45DayMetrics: {
        actualRegistration: 0,
        estimatedRegistration: 0,
        estimatedPercentage: 0,
        malePercentage: 0,
        femalePercentage: 0
      }
    }
  }

  return {
    locationId,
    birth45DayMetrics: {
      ...estimated45DayBirthMetrics
    },
    death45DayMetrics: {
      ...estimated45DayDeathMetrics
    }
  }
}
