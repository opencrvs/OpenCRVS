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
  IInProgressPayload,
  IDeclarationPayload,
  IRegistrationPayload,
  IRejectionPayload
} from '@notification/features/sms/birth-handler'
import {
  buildAndSendSMS,
  getTranslations
} from '@notification/features/sms/utils'
import { logger } from '@notification/logger'
import { getDefaultLanguage } from '@notification/i18n/utils'
import { messageKeys } from '@notification/i18n/messages'

export async function sendDeathInProgressConfirmation(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  const payload = request.payload as IInProgressPayload
  logger.info(
    `Notification service sendDeathInProgressConfirmation calling sendSMS: ${JSON.stringify(
      payload
    )}`
  )
  const authHeader = {
    Authorization: request.headers.authorization
  }
  const message = await getTranslations(
    authHeader,
    messageKeys.deathInProgressNotification,
    {
      trackingId: payload.trackingId,
      crvsOffice: payload.crvsOffice
    },
    getDefaultLanguage()
  )
  await buildAndSendSMS(request, payload.msisdn, message)
  return h.response().code(200)
}

export async function sendDeathDeclarationConfirmation(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  const payload = request.payload as IDeclarationPayload
  logger.info(
    `Notification service sendDeathDeclarationConfirmation calling sendSMS: ${JSON.stringify(
      payload
    )}`
  )
  const authHeader = {
    Authorization: request.headers.authorization
  }
  const message = await getTranslations(
    authHeader,
    messageKeys.deathDeclarationNotification,
    {
      name: payload.name,
      trackingId: payload.trackingId
    },
    getDefaultLanguage()
  )
  await buildAndSendSMS(request, payload.msisdn, message)
  return h.response().code(200)
}

export async function sendDeathRegistrationConfirmation(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  const payload = request.payload as IRegistrationPayload
  logger.info(
    `Notification service sendDeathRegistrationConfirmation calling sendSMS: ${JSON.stringify(
      payload
    )}`
  )
  const authHeader = {
    Authorization: request.headers.authorization
  }
  const message = await getTranslations(
    authHeader,
    messageKeys.deathRegistrationNotification,
    {
      name: payload.name,
      trackingId: payload.trackingId,
      registrationNumber: payload.registrationNumber
    },
    getDefaultLanguage()
  )
  await buildAndSendSMS(request, payload.msisdn, message)
  return h.response().code(200)
}

export async function sendDeathRejectionConfirmation(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  const payload = request.payload as IRejectionPayload
  logger.info(
    `Notification service sendDeathRejectionConfirmation calling sendSMS: ${JSON.stringify(
      payload
    )}`
  )
  const authHeader = {
    Authorization: request.headers.authorization
  }
  const message = await getTranslations(
    authHeader,
    messageKeys.deathRejectionNotification,
    {
      name: payload.name,
      trackingId: payload.trackingId
    },
    getDefaultLanguage()
  )
  await buildAndSendSMS(request, payload.msisdn, message)
  return h.response().code(200)
}
