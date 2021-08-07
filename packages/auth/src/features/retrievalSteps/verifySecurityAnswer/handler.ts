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

import { verifySecurityAnswer, IVerifySecurityAnswerResponse } from './service'

import { unauthorized } from '@hapi/boom'
import {
  getRetrievalStepInformation,
  RetrievalSteps,
  storeRetrievalStepInformation
} from '@auth/features/retrievalSteps/verifyUser/service'

interface IPayload {
  answer: string
  nonce: string
}

interface IResponse {
  matched: boolean
  nonce: string
  securityQuestionKey?: string
}

export default async function verifySecurityQuestionHandler(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  const payload = request.payload as IPayload

  const retrievalStepInformation = await getRetrievalStepInformation(
    payload.nonce
  ).catch(() => {
    throw unauthorized()
  })

  if (
    retrievalStepInformation.status !==
    RetrievalSteps.NUMBER_VERIFIED.toString()
  ) {
    return unauthorized()
  }
  let verificationResult: IVerifySecurityAnswerResponse
  try {
    verificationResult = await verifySecurityAnswer(
      retrievalStepInformation.userId,
      retrievalStepInformation.securityQuestionKey,
      payload.answer
    )
  } catch (err) {
    return unauthorized()
  }

  // Updates nonce status
  await storeRetrievalStepInformation(
    payload.nonce,
    verificationResult.matched
      ? RetrievalSteps.SECURITY_Q_VERIFIED
      : RetrievalSteps.NUMBER_VERIFIED,
    {
      ...retrievalStepInformation,
      // in case of miss-match, updating the new key otherwise same key
      securityQuestionKey: verificationResult.questionKey
    }
  )

  const response: IResponse = {
    matched: verificationResult.matched,
    nonce: payload.nonce
  }
  if (!verificationResult.matched) {
    response.securityQuestionKey = verificationResult.questionKey
  }
  return response
}

export const verifySecurityQuestionSchema = Joi.object({
  answer: Joi.string().required(),
  nonce: Joi.string().required()
})

export const verifySecurityQuestionResSchema = Joi.object({
  matched: Joi.bool().required(),
  securityQuestionKey: Joi.string().optional(),
  nonce: Joi.string().required()
})
