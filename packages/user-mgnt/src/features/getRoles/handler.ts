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

import Role from '@user-mgnt/model/role'

interface IVerifyPayload {
  title?: string
  value?: string
  type?: string
  active?: boolean
  sortBy?: string
  sortOrder?: string
}

export default async function getRoles(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  const {
    title,
    value,
    type,
    active,
    sortBy = 'creationDate',
    sortOrder = 'asc'
  } = request.payload as IVerifyPayload
  let criteria = {}
  if (title) {
    criteria = { ...criteria, title }
  }
  if (value) {
    criteria = { ...criteria, value }
  }
  if (type) {
    criteria = { ...criteria, types: type }
  }
  if (active !== undefined) {
    criteria = { ...criteria, active }
  }

  // tslint:disable-next-line
  return await Role.find(criteria).sort({
    [sortBy]: sortOrder
  })
}

export const searchRoleSchema = Joi.object({
  title: Joi.string().optional(),
  value: Joi.string().optional(),
  type: Joi.string().optional(),
  active: Joi.boolean().optional(),
  sortBy: Joi.string().optional(),
  sortOrder: Joi.string()
    .only(['asc', 'desc'])
    .optional()
})
