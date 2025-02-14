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
import * as elasticsearch from '@elastic/elasticsearch'
import { env } from '@events/environment'

let client: elasticsearch.Client | undefined

/** @knipignore */
export const getOrCreateClient = () => {
  if (!client) {
    client = new elasticsearch.Client({
      node: env.ES_URL
    })

    return client
  }

  return client
}

export function getEventAliasName() {
  return `events`
}

export function getEventIndexName(eventType: string) {
  return `events_${eventType}`.toLowerCase()
}
