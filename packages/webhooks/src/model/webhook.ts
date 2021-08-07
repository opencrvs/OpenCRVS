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

export enum TRIGGERS {
  BIRTH_REGISTERED,
  DEATH_REGISTERED,
  BIRTH_CERTIFIED,
  DEATH_CERTIFIED,
  BIRTH_CORRECTED,
  DEATH_CORRECTED
}
export interface IClient {
  client_id: string
  type: string
  username: string
  name: string
}

export interface IWebhook {
  webhookId: string
  address: string
  createdBy: IClient
  createdAt?: number | string
  sha_secret: string
  trigger: string
}
// tslint:disable-next-line
export const ClientSchema = new Schema(
  {
    client_id: String,
    type: String,
    username: String,
    name: String
  },
  { _id: false }
)

export interface IWebhookModel extends IWebhook, Document {}

const webhookSchema = new Schema({
  webhookId: { type: String, required: true },
  address: { type: String, required: true },
  createdBy: { type: ClientSchema, required: true },
  createdAt: { type: Number, default: Date.now },
  sha_secret: { type: String, required: true },
  trigger: { type: String, required: true }
})

export default model<IWebhookModel>('Webhook', webhookSchema)
