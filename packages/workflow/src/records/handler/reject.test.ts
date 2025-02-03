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
import { createServer } from '@workflow/server'
import * as jwt from 'jsonwebtoken'
import { readFileSync } from 'fs'
import { server as mswServer } from '@test/setupServer'
import { rest } from 'msw'
import {
  getStatusFromTask,
  getTaskFromSavedBundle,
  SavedTask,
  TransactionResponse,
  URLReference,
  ValidRecord
} from '@opencrvs/commons/types'
import { READY_FOR_REVIEW_BIRTH_RECORD } from '@test/mocks/records/readyForReview'
import { SCOPES } from '@opencrvs/commons/authentication'
import { invokeWebhooks } from '@workflow/records/webhooks'
import { getEventType } from '@workflow/features/registration/utils'

jest.mock('@workflow/records/webhooks')

function getReasonFromTask(task: SavedTask) {
  return task.statusReason?.text
}

describe('Reject record endpoint', () => {
  let server: Awaited<ReturnType<typeof createServer>>

  beforeAll(async () => {
    server = await createServer()
    await server.start()
  })

  afterAll(async () => {
    await server.stop()
  })

  it('returns OK for a correctly authenticated user rejecting a birth declaration', async () => {
    const token = jwt.sign(
      {
        scope: [SCOPES.RECORD_SUBMIT_FOR_UPDATES]
      },
      readFileSync('./test/cert.key'),
      {
        algorithm: 'RS256',
        issuer: 'opencrvs:auth-service',
        audience: 'opencrvs:workflow-user'
      }
    )

    // Gets record by id via getRecordById endpoint
    mswServer.use(
      rest.get(
        'http://localhost:9090/records/7c3af302-08c9-41af-8701-92de9a71a3e4',
        (_, res, ctx) => {
          return res(ctx.json(READY_FOR_REVIEW_BIRTH_RECORD))
        }
      )
    )

    // Mock response from hearth
    mswServer.use(
      rest.post('http://localhost:3447/fhir', (_, res, ctx) => {
        const responseBundle: TransactionResponse = {
          resourceType: 'Bundle',
          type: 'batch-response',
          entry: [
            {
              response: {
                status: '200',
                location:
                  '/fhir/Task/f00e742a-0900-488b-b7c1-9625d7b7e456/_history/dc39332f-a5d7-4422-ba7b-bc99a958e8cb' as URLReference
              }
            }
          ]
        }
        return res(ctx.json(responseBundle))
      })
    )

    const response = await server.server.inject({
      method: 'POST',
      url: '/records/7c3af302-08c9-41af-8701-92de9a71a3e4/reject',
      payload: {
        comment: 'Not enough data',
        reason: ''
      },
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    expect(invokeWebhooks).toHaveBeenCalledWith({
      bundle: READY_FOR_REVIEW_BIRTH_RECORD,
      token,
      event: getEventType(READY_FOR_REVIEW_BIRTH_RECORD),
      isNotRegistered: true,
      statusType: 'rejected'
    })

    const task = getTaskFromSavedBundle(
      JSON.parse(response.payload) as ValidRecord
    )
    const businessStatus = getStatusFromTask(task)
    const comment = getReasonFromTask(task)

    expect(response.statusCode).toBe(200)
    expect(comment).toBe('Not enough data')
    expect(businessStatus).toBe('REJECTED')
  })
})
