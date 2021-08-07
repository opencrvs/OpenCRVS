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
  practitionerId: string
}

export default async function getUser(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  const { userId, practitionerId } = request.payload as IVerifyPayload
  let criteria = {}
  if (userId) {
    criteria = { ...criteria, _id: userId }
  }
  if (practitionerId) {
    criteria = { ...criteria, practitionerId }
  }
  // tslint:disable-next-line
  const user: IUserModel | null = await User.findOne(criteria)

  if (!user) {
    // Don't return a 404 as this gives away that this user account exists
    throw unauthorized()
  }
  return user
}

export const getUserRequestSchema = Joi.object({
  userId: Joi.string().optional(),
  practitionerId: Joi.string().optional()
})
