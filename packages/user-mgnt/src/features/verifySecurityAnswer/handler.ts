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
import { unauthorized, conflict } from '@hapi/boom'
import User, { IUserModel } from '@user-mgnt/model/user'
import { generateHash } from '@user-mgnt/utils/hash'
import { logger } from '@user-mgnt/logger'
import { getRandomQuestionKey } from '@user-mgnt/features/verifyUser/handler'
import { isNonEmptyArray } from '@user-mgnt/utils/non-empty-array'

interface IVerifySecurityAnswer {
  userId: string
  questionKey: string
  answer: string
}

export default async function verifySecurityAnswer(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  const payload = request.payload as IVerifySecurityAnswer

  const user: IUserModel | null = await User.findById(payload.userId)
  if (!user) {
    logger.error(`No user details found by given userid: ${payload.userId}`)
    // Don't return a 404 as this gives away that this user account exists
    throw unauthorized()
  }

  const questionAnswers = user.securityQuestionAnswers || []

  const isCorrect = questionAnswers.some(
    securityQNA =>
      securityQNA.questionKey === payload.questionKey &&
      generateHash(payload.answer.toLowerCase(), user.salt) ===
        securityQNA.answerHash
  )

  if (
    !user.securityQuestionAnswers ||
    !isNonEmptyArray(user.securityQuestionAnswers)
  ) {
    logger.error(`Unable to get security questions for user: ${payload.userId}`)
    throw conflict("User doesn't have security questions")
  }

  return {
    matched: isCorrect,
    questionKey: isCorrect
      ? payload.questionKey
      : getRandomQuestionKey(user.securityQuestionAnswers, payload.questionKey)
  }
}

export const verifySecurityRequestSchema = Joi.object({
  userId: Joi.string().required(),
  questionKey: Joi.string().required(),
  answer: Joi.string().required()
})

export const verifySecurityResponseSchema = Joi.object({
  matched: Joi.bool(),
  questionKey: Joi.string()
})
