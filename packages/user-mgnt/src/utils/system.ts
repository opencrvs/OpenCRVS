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
import { ISystemModel } from '@user-mgnt/model/system'
import { pick } from 'lodash'
import { Types } from 'mongoose'

export const types = {
  NATIONAL_ID: 'NATIONAL_ID',
  HEALTH: 'HEALTH',
  RECORD_SEARCH: 'RECORD_SEARCH',
  WEBHOOK: 'WEBHOOK',
  SELF_SERVICE_PORTAL: 'SELF_SERVICE_PORTAL'
}

export const integratingSystemTypes = {
  OTHER: 'OTHER',
  MOSIP: 'MOSIP'
}

type MongooseQueriedSystem = ISystemModel & { _id: Types.ObjectId }

const pickSettings = (system: MongooseQueriedSystem) => {
  const webhook = system.settings.webhook.map((ite) => ({
    event: ite.event,
    permissions: ite.permissions
  }))

  return {
    webhook,
    dailyQuota: system.settings.dailyQuota
  }
}

/** Returns a curated `System` with only the params we want to expose */
export const pickSystem = (system: MongooseQueriedSystem) => {
  const directlyPassedParameters = pick(system, [
    'name',
    'status',
    'type',
    'integratingSystemType'
  ])

  return {
    ...directlyPassedParameters,
    _id: system._id.toString(),
    // TODO: client_id and sha_secret should be camelCased in the Mongoose-model
    shaSecret: system.sha_secret,
    clientId: system.client_id,
    settings: pickSettings(system)
  }
}
