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
import { server as mswServer } from '@test/setupServer'
import { createServer } from '@workflow/server'
import { readFileSync } from 'fs'
import { rest } from 'msw'
import * as jwt from 'jsonwebtoken'
import {
  getStatusFromTask,
  getTaskFromSavedBundle,
  TransactionResponse,
  URLReference,
  ValidRecord
} from '@opencrvs/commons/types'
import { READY_FOR_REVIEW_BIRTH_RECORD } from '@test/mocks/records/readyForReview'
import { SCOPES } from '@opencrvs/commons/authentication'
import { invokeWebhooks } from '@workflow/records/webhooks'
import { getEventType } from '@workflow/features/registration/utils'

jest.mock('@workflow/records/webhooks')

describe('archive record endpoint', () => {
  let server: Awaited<ReturnType<typeof createServer>>

  beforeAll(async () => {
    server = await createServer()
    await server.start()
  })

  afterAll(async () => {
    await server.stop()
  })

  it('returns OK after archiving a birth declaration', async () => {
    const token = jwt.sign(
      { scope: [SCOPES.RECORD_DECLARATION_ARCHIVE] },
      readFileSync('./test/cert.key'),
      {
        algorithm: 'RS256',
        issuer: 'opencrvs:auth-service',
        audience: 'opencrvs:workflow-user'
      }
    )

    // Fetches a record from search
    mswServer.use(
      rest.get(
        'http://localhost:9090/records/3bd79ffd-5bd7-489f-b0d2-3c6133d36e1e',
        (_, res, ctx) => {
          return res(ctx.json(READY_FOR_REVIEW_BIRTH_RECORD))
        }
      )
    )

    mswServer.use(
      rest.post('http://localhost:3447/fhir', (_, res, ctx) => {
        const responseBundle: TransactionResponse = {
          resourceType: 'Bundle',
          type: 'transaction-response',
          entry: [
            {
              response: {
                status: '201',
                location:
                  '/fhir/Task/f00e742a-0900-488b-b7c1-9625d7b7e456/_history/919495a1-56ed-4fa1-b045-2670b2c6ed63' as URLReference
              }
            }
          ]
        }

        return res(ctx.json(responseBundle))
      })
    )

    const res = await server.server.inject({
      method: 'POST',
      url: '/records/3bd79ffd-5bd7-489f-b0d2-3c6133d36e1e/archive',
      payload: {},
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    expect(invokeWebhooks).toHaveBeenCalledWith({
      bundle: READY_FOR_REVIEW_BIRTH_RECORD,
      token,
      event: getEventType(READY_FOR_REVIEW_BIRTH_RECORD),
      isNotRegistered: true,
      statusType: 'archived'
    })

    const task = getTaskFromSavedBundle(JSON.parse(res.payload) as ValidRecord)
    const businessStatus = getStatusFromTask(task)

    expect(res.statusCode).toBe(200)
    expect(businessStatus).toBe('ARCHIVED')
  })
})
