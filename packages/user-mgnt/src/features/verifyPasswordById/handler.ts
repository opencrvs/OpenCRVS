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
import User, { IUserModel } from '@user-mgnt/model/user'
import { generateHash } from '@user-mgnt/utils/hash'

interface IVerifyPayload {
  id: string
  password: string
}

interface IVerifyResponse {
  mobile: string
  scope: string[]
  status: string
  username: string
  id: string
}

export default async function verifyPassByIdHandler(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  const { id, password } = request.payload as IVerifyPayload

  // tslint:disable-next-line
  const user: IUserModel | null = await User.findOne({ _id: id })

  if (!user) {
    // Don't return a 404 as this gives away that this user account exists
    throw unauthorized()
  }

  if (generateHash(password, user.salt) !== user.passwordHash) {
    throw unauthorized()
  }

  const response: IVerifyResponse = {
    mobile: user.mobile,
    scope: user.scope,
    status: user.status,
    username: user.username,
    id: user.id
  }

  return response
}

export const requestSchema = Joi.object({
  id: Joi.string().required(),
  password: Joi.string().required()
})

export const responseSchema = Joi.object({
  username: Joi.string(),
  mobile: Joi.string(),
  scope: Joi.array().items(Joi.string()),
  status: Joi.string(),
  id: Joi.string()
})
