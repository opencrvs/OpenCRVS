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
  storeRetrievalStepInformation,
  getRetrievalStepInformation,
  RetrievalSteps,
  IRetrievalStepInformation
} from '@auth/features/retrievalSteps/verifyUser/service'
import { checkVerificationCode } from '@auth/features/verifyCode/service'
import { unauthorized } from '@hapi/boom'
import { logger } from '@auth/logger'

interface IVerifyNumberPayload {
  nonce: string
  code: string
}

interface IVerifyNumberResponse {
  nonce: string
  securityQuestionKey: string
}

export default async function verifyNumberHandler(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
): Promise<IVerifyNumberResponse> {
  const payload = request.payload as IVerifyNumberPayload
  let retrievalStepInfo: IRetrievalStepInformation
  // Looks for step1 data. Throws exception if not found
  retrievalStepInfo = await getRetrievalStepInformation(payload.nonce).catch(
    () => {
      throw unauthorized()
    }
  )
  // Throws exception if not ready for step2
  if (
    retrievalStepInfo.status !==
    RetrievalSteps.WAITING_FOR_VERIFICATION.toString()
  ) {
    throw unauthorized()
  }
  try {
    // Matchs verification code. Throws exception if doesn't
    await checkVerificationCode(payload.nonce, payload.code)
  } catch (err) {
    logger.error(err)
    throw unauthorized()
  }
  // Update retrievalstep info with new status NUMBER_VERIFIED
  await storeRetrievalStepInformation(
    payload.nonce,
    RetrievalSteps.NUMBER_VERIFIED,
    retrievalStepInfo
  )
  // Returns the securityQuestionKey with nonce
  const response: IVerifyNumberResponse = {
    securityQuestionKey: retrievalStepInfo.securityQuestionKey,
    nonce: payload.nonce
  }
  return response
}

export const requestSchema = Joi.object({
  nonce: Joi.string().required(),
  code: Joi.string().required()
})

export const responseSchema = Joi.object({
  nonce: Joi.string(),
  securityQuestionKey: Joi.string()
})
