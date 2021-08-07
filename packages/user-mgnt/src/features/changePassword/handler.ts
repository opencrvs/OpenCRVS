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
import { logger } from '@user-mgnt/logger'
import { statuses } from '@user-mgnt/utils/userUtils'

interface IChangePasswordPayload {
  userId: string
  existingPassword?: string
  password: string
}

export default async function changePasswordHandler(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  const userUpdateData = request.payload as IChangePasswordPayload

  const user: IUserModel | null = await User.findById(userUpdateData.userId)
  if (!user) {
    logger.error(
      `No user details found by given userid: ${userUpdateData.userId}`
    )
    // Don't return a 404 as this gives away that this user account exists
    throw unauthorized()
  }

  if (userUpdateData.existingPassword) {
    if (user.status !== statuses.ACTIVE) {
      logger.error(
        `User is not in active state for given userid: ${userUpdateData.userId}`
      )
      // Don't return a 404 as this gives away that this user account exists
      throw unauthorized()
    }
    if (
      generateHash(userUpdateData.existingPassword, user.salt) !==
      user.passwordHash
    ) {
      logger.error(
        `Password didn't match for given userid: ${userUpdateData.userId}`
      )
      // Don't return a 404 as this gives away that this user account exists
      throw unauthorized()
    }
  }
  user.passwordHash = generateHash(userUpdateData.password, user.salt)

  try {
    await User.update({ _id: user._id }, user)
  } catch (err) {
    logger.error(err.message)
    // return 400 if there is a validation error when updating to mongo
    return h.response().code(400)
  }
  return h.response().code(200)
}

export const changePasswordRequestSchema = Joi.object({
  userId: Joi.string().required(),
  existingPassword: Joi.string().optional(),
  password: Joi.string().required()
})
