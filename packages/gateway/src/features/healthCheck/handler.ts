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
import * as Joi from 'joi'
import { badRequest, internal } from '@hapi/boom'
import {
  AUTH_URL,
  SEARCH_URL,
  USER_MANAGEMENT_URL,
  METRICS_URL,
  NOTIFICATION_URL,
  RESOURCES_URL,
  WORKFLOW_URL
} from '@gateway/constants'
import fetch from 'node-fetch'

export async function checkServiceHealth(url: string) {
  const res = await fetch(url, {
    method: 'GET'
  })

  const body = await res.json()

  if (body.success === true) {
    return true
  }

  return false
}

enum Services {
  AUTH = 'auth',
  USER_MGNT = 'user-mgnt',
  METRICS = 'metrics',
  NOTIFICATION = 'notification',
  RESOURCES = 'resources',
  SEARCH = 'search',
  WORKFLOW = 'workflow',
  GATEWAY = 'gateway'
}

export default async function healthCheckHandler(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  let service
  if (request.query['service'] && request.query['service'][0]) {
    service = request.query['service'][0]
  } else {
    throw badRequest('Received no service to check')
  }

  let response

  switch (service) {
    case Services.GATEWAY:
      response = true
      break
    case Services.AUTH:
      response = await checkServiceHealth(`${AUTH_URL}/ping`)
      break
    case Services.SEARCH:
      response = await checkServiceHealth(`${SEARCH_URL}ping`)
      break
    case Services.USER_MGNT:
      response = await checkServiceHealth(`${USER_MANAGEMENT_URL}ping`)
      break
    case Services.METRICS:
      response = await checkServiceHealth(`${METRICS_URL}/ping`)
      break
    case Services.NOTIFICATION:
      response = await checkServiceHealth(`${NOTIFICATION_URL}ping`)
      break
    case Services.RESOURCES:
      response = await checkServiceHealth(`${RESOURCES_URL}/ping`)
      break
    case Services.WORKFLOW:
      response = await checkServiceHealth(`${WORKFLOW_URL}ping`)
      break
    default:
      response = false
  }

  if (!response) {
    throw internal('Service health check failed for: ', service)
  } else {
    return {
      success: response
    }
  }
}

export const querySchema = Joi.object({
  service: Joi.array()
    .items(
      Joi.string().valid(
        Services.AUTH,
        Services.USER_MGNT,
        Services.METRICS,
        Services.NOTIFICATION,
        Services.RESOURCES,
        Services.SEARCH,
        Services.WORKFLOW,
        Services.GATEWAY
      )
    )
    .single()
})
export const responseSchema = Joi.object({
  success: Joi.boolean()
})
