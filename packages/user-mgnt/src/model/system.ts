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
import { model, Schema, Document } from 'mongoose'
// tslint:disable-next-line
import { statuses } from '../utils/userUtils'
import { IUserName, UserNameSchema } from '@user-mgnt/model/user'

export interface ISystem {
  name: IUserName[]
  username: string
  client_id: string
  secretHash: string
  salt: string
  sha_secret: string
  practitionerId: string
  scope: string[]
  status: string
  creationDate?: number
}

export interface ISystemModel extends ISystem, Document {}

const systemSchema = new Schema({
  name: { type: [UserNameSchema], required: true },
  username: { type: String, required: true },
  client_id: { type: String, required: true },
  secretHash: { type: String, required: true },
  salt: { type: String, required: true },
  practitionerId: { type: String, required: true },
  sha_secret: { type: String, required: true },
  scope: { type: [String], required: true },
  status: {
    type: String,
    enum: [statuses.PENDING, statuses.ACTIVE, statuses.DISABLED],
    default: statuses.PENDING
  },
  creationDate: { type: Number, default: Date.now }
})

export default model<ISystemModel>('System', systemSchema)
