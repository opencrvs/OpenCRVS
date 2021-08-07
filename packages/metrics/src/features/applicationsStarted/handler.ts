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
  TIME_FROM,
  TIME_TO,
  LOCATION_ID
} from '@metrics/features/metrics/constants'
import {
  fetchLocationWiseApplicationsStarted,
  getNumberOfAppStartedByPractitioners,
  getNumberOfRejectedAppStartedByPractitioners,
  getAvgTimeSpentOnAppByPractitioners
} from '@metrics/features/applicationsStarted/service'
import { EVENT_TYPE } from '@metrics/features/metrics/utils'

export async function applicationsStartedHandler(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  const timeStart = request.query[TIME_FROM]
  const timeEnd = request.query[TIME_TO]
  const locationId = 'Location/' + request.query[LOCATION_ID]
  let applicationsStartedMetrics
  try {
    applicationsStartedMetrics = await fetchLocationWiseApplicationsStarted(
      timeStart,
      timeEnd,
      locationId
    )
  } catch (error) {
    applicationsStartedMetrics = {
      fieldAgentApplications: 0,
      hospitalApplications: 0,
      officeApplications: 0
    }
  }

  return applicationsStartedMetrics
}

interface IApplicationStartedMetricsPayload {
  timeStart: string
  timeEnd: string
  locationId: string
  practitionerIds: string[]
  event?: EVENT_TYPE
}
interface IApplicationStartedMetricsByPractitioner {
  practitionerId: string
  locationId: string
  totalNumberOfApplicationStarted: number
  averageTimeForDeclaredApplications: number
  totalNumberOfInProgressAppStarted: number
  totalNumberOfRejectedApplications: number
}

export async function applicationStartedMetricsByPractitionersHandler(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  const {
    timeStart,
    timeEnd,
    locationId,
    practitionerIds,
    event
  } = request.payload as IApplicationStartedMetricsPayload
  const locId = `Location/${locationId}`
  let applicationStartedMetricsByPractitioners: IApplicationStartedMetricsByPractitioner[] = []
  try {
    const totalStarted = await getNumberOfAppStartedByPractitioners(
      timeStart,
      timeEnd,
      locId,
      event
    )
    const totalInProgressStarted = await getNumberOfAppStartedByPractitioners(
      timeStart,
      timeEnd,
      locId,
      event,
      'IN_PROGRESS'
    )
    const totalRejectedStarted = await getNumberOfRejectedAppStartedByPractitioners(
      timeStart,
      timeEnd,
      locId,
      event
    )
    const avgTimesForCompleteApplications = await getAvgTimeSpentOnAppByPractitioners(
      timeStart,
      timeEnd,
      locId,
      'DECLARED',
      event
    )

    applicationStartedMetricsByPractitioners = practitionerIds.map(
      practitionerId => {
        const avgTimeSpentRecord = avgTimesForCompleteApplications?.find(
          applicationStartedCount =>
            applicationStartedCount.practitionerId === practitionerId
        )
        let averageTimeForDeclaredApplications = 0
        if (
          avgTimeSpentRecord &&
          avgTimeSpentRecord.totalTimeSpent &&
          avgTimeSpentRecord.totalTimeSpent > 0 &&
          avgTimeSpentRecord.totalApplications &&
          avgTimeSpentRecord.totalApplications > 0
        ) {
          averageTimeForDeclaredApplications = Math.round(
            avgTimeSpentRecord.totalTimeSpent /
              avgTimeSpentRecord.totalApplications
          )
        }
        return {
          practitionerId,
          locationId,
          totalNumberOfApplicationStarted:
            totalStarted?.find(
              applicationStartedCount =>
                applicationStartedCount.practitionerId === practitionerId
            )?.totalStarted || 0,
          totalNumberOfInProgressAppStarted:
            totalInProgressStarted?.find(
              applicationStartedCount =>
                applicationStartedCount.practitionerId === practitionerId
            )?.totalStarted || 0,
          totalNumberOfRejectedApplications:
            totalRejectedStarted?.find(
              applicationStartedCount =>
                applicationStartedCount.startedBy === practitionerId
            )?.totalStarted || 0,
          averageTimeForDeclaredApplications
        }
      }
    )
  } catch (error) {
    applicationStartedMetricsByPractitioners = practitionerIds.map(
      practitionerId => ({
        practitionerId,
        locationId,
        totalNumberOfApplicationStarted: 0,
        averageTimeForDeclaredApplications: 0,
        totalNumberOfInProgressAppStarted: 0,
        totalNumberOfRejectedApplications: 0
      })
    )
  }
  return applicationStartedMetricsByPractitioners
}
