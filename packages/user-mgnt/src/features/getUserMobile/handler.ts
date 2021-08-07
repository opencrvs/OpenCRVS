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

interface IVerifyPayload {
  userId: string
}

interface IVerifyResponse {
  mobile: string
}

export default async function getUserMobile(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  const { userId } = request.payload as IVerifyPayload
  // tslint:disable-next-line
  const user: IUserModel | null = await User.findById(userId)

  if (!user) {
    // Don't return a 404 as this gives away that this user account exists
    throw unauthorized()
  }

  const response: IVerifyResponse = { mobile: user.mobile }

  return response
}

export const requestSchema = Joi.object({
  userId: Joi.string().required()
})

export const responseSchema = Joi.object({
  mobile: Joi.string()
})
