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
import {
  authenticateSystem,
  createToken
} from '@auth/features/authenticate/service'
import { unauthorized } from '@hapi/boom'
import {
  WEB_USER_JWT_AUDIENCES,
  JWT_ISSUER,
  NOTIFICATION_API_USER_AUDIENCE,
  VALIDATOR_API_USER_AUDIENCE,
  CHATBOT_API_USER_AUDIENCE,
  NATIONAL_ID_USER_AUDIENCE,
  USER_MANAGEMENT_URL
} from '@auth/constants'
import fetch from 'node-fetch'
import { resolve } from 'url'

interface ISystemAuthPayload {
  client_id: string
  client_secret: string
}

interface ISystemAuthResponse {
  token?: string
}

export async function authenticateSystemClientHandler(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
): Promise<ISystemAuthResponse> {
  const payload = request.payload as ISystemAuthPayload

  let result
  try {
    result = await authenticateSystem(payload.client_id, payload.client_secret)
  } catch (err) {
    throw unauthorized()
  }

  const isNotificationAPIUser = result.scope.indexOf('notification-api') > -1
  const isValidatorAPIUser = result.scope.indexOf('validator-api') > -1
  const isChatbotAPIUser = result.scope.indexOf('chatbot-api') > -1
  const isNationalIDAPIUser = result.scope.indexOf('nationalId') > -1

  const response: ISystemAuthResponse = {}
  response.token = await createToken(
    result.systemId,
    result.scope,
    isNotificationAPIUser
      ? WEB_USER_JWT_AUDIENCES.concat([NOTIFICATION_API_USER_AUDIENCE])
      : isValidatorAPIUser
      ? WEB_USER_JWT_AUDIENCES.concat([VALIDATOR_API_USER_AUDIENCE])
      : isChatbotAPIUser
      ? WEB_USER_JWT_AUDIENCES.concat([CHATBOT_API_USER_AUDIENCE])
      : isNationalIDAPIUser
      ? WEB_USER_JWT_AUDIENCES.concat([NATIONAL_ID_USER_AUDIENCE])
      : WEB_USER_JWT_AUDIENCES,
    JWT_ISSUER,
    true
  )

  return response
}

export const requestSchema = Joi.object({
  client_id: Joi.string(),
  client_secret: Joi.string()
})

export const responseSchema = Joi.object({
  token: Joi.string().optional()
})

export async function registerSystemClient(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
): Promise<any> {
  const authHeader = {
    Authorization: request.headers.authorization
  }

  const url = resolve(USER_MANAGEMENT_URL, '/registerSystemClient')

  const res = await fetch(url, {
    method: 'POST',
    body: JSON.stringify(request.payload),
    headers: {
      'Content-Type': 'application/json',
      ...authHeader
    }
  })
    .then(response => {
      return response.json()
    })
    .catch(error => {
      return Promise.reject(new Error(` request failed: ${error.message}`))
    })

  return res
}
export const registerRquestSchema = Joi.object({
  scope: Joi.string()
})
