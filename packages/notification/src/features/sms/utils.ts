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
import { NON_UNICODED_LANGUAGES, RESOURCES_URL } from '@notification/constants'
import { internal } from '@hapi/boom'
import { sendSMS } from '@notification/features/sms/service'
import fetch from 'node-fetch'
import * as Handlebars from 'handlebars'
import * as Hapi from '@hapi/hapi'
import { getDefaultLanguage } from '@notification/i18n/utils'
interface ISendSMSPayload {
  name?: string
  authCode?: string
  trackingId?: string
  username?: string
  password?: string
  crvsOffice?: string
  registrationNumber?: string
}

interface IMessageIdentifier {
  [key: string]: string
}
export interface ILanguage {
  lang: string
  displayName: string
  messages: IMessageIdentifier
}

interface ITranslationsResponse {
  languages: ILanguage[]
}

export interface ISMSPayload {
  msisdn: string
}

export interface IAuthHeader {
  Authorization: string
}

export async function getTranslations(
  authHeader: IAuthHeader,
  messageKey: string,
  messagePayload: ISendSMSPayload,
  locale: string
): Promise<string> {
  const url = `${RESOURCES_URL}/definitions/notification`
  const res: ITranslationsResponse = await fetch(url, {
    method: 'GET',
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

  const language: ILanguage = res.languages.filter(obj => {
    return obj.lang === locale
  })[0]
  const template = Handlebars.compile(language.messages[messageKey])
  return template(messagePayload)
}

export async function buildAndSendSMS(
  request: Hapi.Request,
  msisdn: string,
  message: string
) {
  try {
    return await sendSMS(
      msisdn,
      message,
      /* send unicoded sms if provided local is not in non unicoded set */
      NON_UNICODED_LANGUAGES.indexOf(getDefaultLanguage()) < 0
    )
  } catch (err) {
    return internal(err)
  }
}
