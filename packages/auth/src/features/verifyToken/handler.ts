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
import { verifyToken } from '@auth/features/verifyToken/service'
import { internal } from '@hapi/boom'

interface IVerifyTokenPayload {
  token: string
}

export default async function verifyTokenHandler(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  const { token } = request.payload as IVerifyTokenPayload

  let valid = false
  try {
    valid = await verifyToken(token)
  } catch (err) {
    throw internal('Failed to verifyToken token', err)
  }

  return { valid }
}

export const reqVerifyTokenSchema = Joi.object({
  token: Joi.string()
})

export const resVerifyTokenSchema = Joi.object({
  valid: Joi.boolean()
})
