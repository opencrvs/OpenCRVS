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
import { resetServer as resetEventsMongoServer } from '@events/storage/mongodb/__mocks__/events'
import { resetServer as resetUserMgntMongoServer } from '@events/storage/mongodb/__mocks__/user-mgnt'
import { inject, vi } from 'vitest'

import { createIndex } from '@events/service/indexing/indexing'
import { tennisClubMembershipEvent } from '@opencrvs/commons/fixtures'
import { mswServer } from './msw'
import { getAllFields } from '@opencrvs/commons'

vi.mock('@events/storage/mongodb/events')
vi.mock('@events/storage/mongodb/user-mgnt')

vi.mock('@events/storage/elasticsearch')

async function resetESServer() {
  const { getEventIndexName, getEventAliasName } = await import(
    // @ts-ignore "Cannot find module '@events/storage/elasticsearch' or its corresponding type declarations."
    '@events/storage/elasticsearch'
  )
  const index = 'events_tennis_club_membership' + Date.now() + Math.random()
  getEventIndexName.mockReturnValue(index)
  getEventAliasName.mockReturnValue('events_' + +Date.now() + Math.random())
  await createIndex(index, getAllFields(tennisClubMembershipEvent))
}

beforeEach(async () =>
  Promise.all([
    resetEventsMongoServer(),
    resetUserMgntMongoServer(),
    resetESServer()
  ])
)

beforeAll(() =>
  mswServer.listen({
    onUnhandledRequest: (req) => {
      const isElasticResetCall =
        req.method === 'DELETE' && req.url.includes(inject('ELASTICSEARCH_URI'))

      if (!isElasticResetCall) {
        // eslint-disable-next-line no-console
        console.warn(`Unmocked request: ${req.method} ${req.url}`)
      }
    }
  })
)
afterEach(() => mswServer.resetHandlers())
afterAll(() => mswServer.close())
