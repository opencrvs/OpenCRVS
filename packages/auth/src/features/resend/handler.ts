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
import { unauthorized } from '@hapi/boom'
import {
  getStoredUserInformation,
  generateAndSendVerificationCode
} from '@auth/features/authenticate/service'
import { getRetrievalStepInformation } from '@auth/features/retrievalSteps/verifyUser/service'

interface IRefreshPayload {
  nonce: string
  retrievalFlow?: boolean
}

export default async function refreshHandler(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  const { nonce, retrievalFlow } = request.payload as IRefreshPayload

  let userInformation
  try {
    userInformation = retrievalFlow
      ? await getRetrievalStepInformation(nonce)
      : await getStoredUserInformation(nonce)
  } catch (err) {
    return unauthorized()
  }

  const { mobile, scope } = userInformation

  await generateAndSendVerificationCode(nonce, mobile, scope)

  return { nonce }
}

export const requestSchema = Joi.object({
  nonce: Joi.string(),
  retrievalFlow: Joi.boolean().optional()
})
export const responseSchma = Joi.object({
  nonce: Joi.string()
})
