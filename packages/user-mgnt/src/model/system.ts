/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * OpenCRVS is also distributed under the terms of the Civil Registration
 * & Healthcare Disclaimer located at http://opencrvs.org/license.
 *
 * Copyright (C) The OpenCRVS Authors located at https://github.com/opencrvs/opencrvs-core/blob/master/AUTHORS.
 */
import { model, Schema, Document } from 'mongoose'
import { statuses } from '@user-mgnt/utils/userUtils'
import { integratingSystemTypes, types } from '@user-mgnt/utils/system'

export interface ISystem {
  name: string
  createdBy: string
  username: string
  client_id: string
  secretHash: string
  salt: string
  sha_secret: string
  practitionerId: string
  scope: string[]
  status: string
  settings: {
    dailyQuota: number
    webhook: WebHook[]
  }
  creationDate?: number
  type: keyof typeof types
}

export enum EventType {
  Birth = 'birth',
  Death = 'death'
}

export interface WebHook {
  event: EventType
  permissions: WebhookPermissions[]
}

export enum WebhookPermissions {
  CHILDS_DETAILS = 'childs-details',
  MOTHERS_DETAILS = 'mothers-details',
  FATHERS_DETAILS = 'fathers-details',
  INFORMANT_DETAILS = 'informant-details',
  DISEASE_DETAILS = 'disease-details'
}

const WebhookSchema = new Schema({
  event: { type: String },
  permissions: { type: [String] }
})

export interface ISystemModel extends ISystem, Document {}

const systemSchema = new Schema({
  name: { type: String, required: true },
  createdBy: { type: String, required: true },
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
  settings: {
    webhook: { type: [WebhookSchema], required: false },
    dailyQuota: { type: Number, default: 0 }
  },
  creationDate: { type: Number, default: Date.now },
  type: {
    type: String,
    enum: [
      types.HEALTH,
      types.NATIONAL_ID,
      types.RECORD_SEARCH,
      types.WEBHOOK,
      types.SELF_SERVICE_PORTAL
    ]
  },
  integratingSystemType: {
    type: String,
    enum: [integratingSystemTypes.MOSIP, integratingSystemTypes.OTHER]
  }
})

export default model<ISystemModel>('System', systemSchema)
