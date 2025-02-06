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
import { http, HttpResponse, PathParams } from 'msw'
import { env } from '@events/environment'
import { setupServer } from 'msw/node'
import { tennisClubMembershipEvent } from '@opencrvs/commons/fixtures'

const handlers = [
  http.post<PathParams<never>, { filenames: string[] }>(
    `${env.DOCUMENTS_URL}/presigned-urls`,
    async (info) => {
      const request = await info.request.json()
      return HttpResponse.json(request.filenames)
    }
  ),
  http.get(`${env.COUNTRY_CONFIG_URL}/events`, (info) => {
    return HttpResponse.json([
      tennisClubMembershipEvent,
      { ...tennisClubMembershipEvent, id: 'TENNIS_CLUB_MEMBERSHIP_PREMIUM' }
    ])
  })
]

export const mswServer = setupServer(...handlers)
