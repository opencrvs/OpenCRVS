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
  fetchAllFromSearch,
  fetchParentLocationByLocationID,
  fetchPractitionerRole,
  fetchTaskIdByCompositionID
} from '@metrics/api'
import {
  IAuthHeader,
  IApplicationsStartedFields,
  IApplicationsStartedPoints,
  IPointLocation,
  IDurationPoints,
  IDurationFields,
  IDurationTags
} from '@metrics/features/registration'
import { writePoints, query } from '@metrics/influxdb/client'
import * as moment from 'moment'

interface ISearchResult {
  _index: string
  _type: string
  _id: string
  _score: number
  _source: {
    event: string
    createdAt: string
    operationHistories: [
      {
        operationType: string
        operatedOn: string
        operatorRole: string
        operatorFirstNames: string
        operatorFamilyName: string
        operatorFirstNamesLocale: string
        operatorFamilyNameLocale: string
        operatorOfficeName: string
        operatorOfficeAlias: string[]
        notificationFacilityName: string
        notificationFacilityAlias: string[]
      }
    ]
    childFirstNames: string
    childFamilyName: string
    childFirstNamesLocal: string
    childFamilyNameLocal: string
    childDoB: string
    gender: string
    eventLocationId: string
    motherFirstNames: string
    motherFamilyName: string
    motherFirstNamesLocal: string
    motherFamilyNameLocal: string
    motherDoB: string
    motherIdentifier: string
    fatherFirstNames: string
    fatherFamilyName: string
    fatherFirstNamesLocal: string
    fatherFamilyNameLocal: string
    fatherDoB: string
    contactNumber: string
    type: string
    dateOfApplication: string
    trackingId: string
    applicationLocationId: string
    compositionType: string
    createdBy: string
    updatedBy: string
  }
  sort: number[]
}

export async function generateLegacyMetricsHandler(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  let result: any
  const authHeader = {
    Authorization: request.headers.authorization
  }
  try {
    await query('DROP MEASUREMENT applications_started')
  } catch (err) {
    throw new Error('Could not clear influx')
  }
  try {
    result = await fetchAllFromSearch(authHeader)
  } catch (err) {
    throw new Error('Could not resolve values from search')
  }
  const totalPoints: IApplicationsStartedPoints[] = []
  if (result.body.hits.total !== result.body.hits.hits.length) {
    throw new Error(
      'Not all results returned in search results.  Need to implement Elastic pagination for more than 10,000 records'
    )
  }
  const searchResults: ISearchResult[] = result.body.hits.hits
  for (const searchResult of searchResults) {
    const points: IApplicationsStartedPoints = await generateApplicationStartedPoint(
      searchResult,
      authHeader
    )
    totalPoints.push(points)
  }
  await writePoints(totalPoints)
  return h.response(totalPoints).code(200)
}

const generatePointLocationsFromID = async (
  applicationLocationId: string,
  authHeader: IAuthHeader
): Promise<IPointLocation> => {
  const locations: IPointLocation = {}

  const officeUnion = await fetchParentLocationByLocationID(
    applicationLocationId,
    authHeader
  )

  if (officeUnion === undefined) {
    throw new Error('Office union cannot be found')
  }

  locations.locationLevel5 = officeUnion
  let locationID: string = locations.locationLevel5 as string
  // tslint:disable-next-line no-increment-decrement
  for (let index = 4; index > 1; index--) {
    locationID = await fetchParentLocationByLocationID(locationID, authHeader)
    if (!locationID) {
      break
    }
    locations[`locationLevel${index}`] = locationID
  }

  return locations
}

export async function generateApplicationStartedPoint(
  searchResult: ISearchResult,
  authHeader: IAuthHeader
): Promise<any> {
  let role = await fetchPractitionerRole(
    searchResult._source.createdBy,
    authHeader
  )

  if (role.includes('REGISTRAR')) {
    role = 'REGISTRAR'
  }

  const fields: IApplicationsStartedFields = {
    role,
    compositionId: searchResult._id
  }

  const tags = {
    eventType: searchResult._source.event.toUpperCase(),
    ...(await generatePointLocationsFromID(
      `Location/${searchResult._source.applicationLocationId}`,
      authHeader
    ))
  }

  return {
    measurement: 'applications_started',
    tags,
    fields,
    timestamp: `${parseInt(searchResult._source.createdAt, 10) * 1000000}`
  }
}

export async function generateLegacyEventDurationHandler(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  let result: any
  const authHeader = {
    Authorization: request.headers.authorization
  }
  try {
    await query('DROP MEASUREMENT application_event_duration')
  } catch (err) {
    throw new Error('Could not clear influx')
  }
  try {
    result = await fetchAllFromSearch(authHeader)
  } catch (err) {
    throw new Error('Could not resolve values from search')
  }
  let totalPoints: IDurationPoints[] = []
  if (result.body.hits.total !== result.body.hits.hits.length) {
    throw new Error(
      'Not all results returned in search results.  Need to implement Elastic pagination for more than 10,000 records'
    )
  }
  const searchResults: ISearchResult[] = result.body.hits.hits
  for (const searchResult of searchResults) {
    const points: IDurationPoints[] = await generateEventDurationPoint(
      searchResult,
      authHeader
    )
    totalPoints = totalPoints.concat(points)
  }
  await writePoints(totalPoints)
  return h.response({ totalRecords: searchResults.length }).code(200)
}

async function generateEventDurationPoint(
  searchResult: ISearchResult,
  authHeader: IAuthHeader
): Promise<any> {
  const taskId = await fetchTaskIdByCompositionID(searchResult._id, authHeader)
  return (
    (searchResult._source &&
      searchResult._source.operationHistories &&
      searchResult._source.operationHistories
        .filter((history, index) => index !== 0)
        .map((history, index) => {
          const previousHistory = searchResult._source.operationHistories[index]
          const fields: IDurationFields = {
            durationInSeconds: moment(new Date(history.operatedOn)).diff(
              moment(new Date(previousHistory.operatedOn)),
              'seconds'
            ),
            compositionId: searchResult._id,
            currentTaskId: taskId,
            previousTaskId: taskId
          }

          const tags: IDurationTags = {
            eventType: searchResult._source.event.toUpperCase(),
            currentStatus: history.operationType,
            previousStatus: previousHistory.operationType
          }

          return {
            measurement: 'application_event_duration',
            tags,
            fields,
            timestamp: `${parseInt(searchResult._source.createdAt, 10) *
              1000000}`
          }
        })) ||
    []
  )
}
