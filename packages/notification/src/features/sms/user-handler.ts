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
  buildAndSendSMS,
  getTranslations,
  ISMSPayload
} from '@notification/features/sms/utils'
import { logger } from '@notification/logger'
import { getDefaultLanguage } from '@notification/i18n/utils'
import { messageKeys } from '@notification/i18n/messages'

interface ICredentialsPayload extends ISMSPayload {
  username: string
  password: string
}

interface IRetrieveUserNamePayload extends ISMSPayload {
  username: string
}

interface IUserAuthCodePayload extends ISMSPayload {
  code: string
}

export async function sendUserCredentials(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  const payload = request.payload as ICredentialsPayload
  logger.info(`Username: ${payload.username}`)
  logger.info(`Password: ${payload.password}`)
  const authHeader = {
    Authorization: request.headers.authorization
  }
  const message = await getTranslations(
    authHeader,
    messageKeys.userCredentialsNotification,
    {
      username: payload.username,
      password: payload.password
    },
    getDefaultLanguage()
  )
  await buildAndSendSMS(request, payload.msisdn, message)
  return h.response().code(200)
}

export async function retrieveUserName(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  const payload = request.payload as IRetrieveUserNamePayload
  logger.info(`Username: ${payload.username}`)
  const authHeader = {
    Authorization: request.headers.authorization
  }
  const message = await getTranslations(
    authHeader,
    messageKeys.retieveUserNameNotification,
    {
      username: payload.username
    },
    getDefaultLanguage()
  )
  await buildAndSendSMS(request, payload.msisdn, message)
  return h.response().code(200)
}

export async function sendUserAuthenticationCode(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  const payload = request.payload as IUserAuthCodePayload
  logger.info(`Authentication Code: ${payload.code}`)
  const authHeader = {
    Authorization: request.headers.authorization
  }
  const message = await getTranslations(
    authHeader,
    messageKeys.authenticationCodeNotification,
    {
      authCode: payload.code
    },
    getDefaultLanguage()
  )
  await buildAndSendSMS(request, payload.msisdn, message)
  return h.response().code(200)
}

export async function updateUserName(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  const payload = request.payload as IRetrieveUserNamePayload
  logger.info(`Username: ${payload.username}`)
  const authHeader = {
    Authorization: request.headers.authorization
  }
  const message = await getTranslations(
    authHeader,
    messageKeys.updateUserNameNotification,
    {
      username: payload.username
    },
    getDefaultLanguage()
  )
  await buildAndSendSMS(request, payload.msisdn, message)
  return h.response().code(200)
}

export const userCredentialsNotificationSchema = Joi.object({
  msisdn: Joi.string().required(),
  username: Joi.string().required(),
  password: Joi.string().required()
})

export const retrieveUserNameNotificationSchema = Joi.object({
  msisdn: Joi.string().required(),
  username: Joi.string().required()
})

export const authCodeNotificationSchema = Joi.object({
  msisdn: Joi.string().required(),
  code: Joi.string().required()
})
