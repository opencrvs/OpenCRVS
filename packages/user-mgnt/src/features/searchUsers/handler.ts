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

import User, { IUserModel } from '@user-mgnt/model/user'

interface IVerifyPayload {
  username?: string
  mobile?: string
  role?: string
  status?: string
  primaryOfficeId?: string
  locationId?: string
  count: number
  skip: number
  sortOrder: string
}

export default async function searchUsers(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  const {
    username,
    mobile,
    role,
    status,
    primaryOfficeId,
    locationId,
    count,
    skip,
    sortOrder
  } = request.payload as IVerifyPayload
  let criteria = {}
  if (username) {
    criteria = { ...criteria, username }
  }
  if (mobile) {
    criteria = { ...criteria, mobile }
  }
  if (role) {
    criteria = { ...criteria, role }
  }
  if (primaryOfficeId) {
    criteria = { ...criteria, primaryOfficeId }
  }
  if (locationId) {
    criteria = { ...criteria, catchmentAreaIds: locationId }
  }
  if (status) {
    criteria = { ...criteria, status }
  }

  // tslint:disable-next-line
  const userList: IUserModel[] = await User.find(criteria)
    .skip(skip)
    .limit(count)
    .sort({
      creationDate: sortOrder
    })

  return {
    // tslint:disable-next-line
    totalItems: await User.find(criteria).count(),
    results: userList
  }
}

export const searchSchema = Joi.object({
  username: Joi.string().optional(),
  mobile: Joi.string().optional(),
  role: Joi.string().optional(),
  status: Joi.string().optional(),
  primaryOfficeId: Joi.string().optional(),
  locationId: Joi.string().optional(),
  count: Joi.number()
    .min(0)
    .required(),
  skip: Joi.number()
    .min(0)
    .required(),
  sortOrder: Joi.string()
    .only(['asc', 'desc'])
    .required()
})
