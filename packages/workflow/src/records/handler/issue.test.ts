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
import { rest } from 'msw'
import { server as mswServer } from '@test/setupServer'
import {
  getStatusFromTask,
  getTaskFromSavedBundle,
  URLReference,
  IssuedRecord,
  TransactionResponse
} from '@opencrvs/commons/types'
import { CERTIFIED_BIRTH_RECORD } from '@test/mocks/records/certify'
import { SCOPES } from '@opencrvs/commons/authentication'
import { invokeWebhooks } from '@workflow/records/webhooks'
import { getEventType } from '@workflow/features/registration/utils'

jest.mock('@workflow/records/webhooks')

describe('Issue record endpoint', () => {
  let server: Awaited<ReturnType<typeof createServer>>

  beforeAll(async () => {
    server = await createServer()
    await server.start()
  })

  afterAll(async () => {
    await server.stop()
  })

  it('returns OK for informant issuing a birth declaration', async () => {
    const token = jwt.sign(
      { scope: [SCOPES.RECORD_PRINT_ISSUE_CERTIFIED_COPIES] },
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
          return res(ctx.json(CERTIFIED_BIRTH_RECORD))
        }
      )
    )

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
                  '/fhir/Composition/9d377df7-8e18-46ce-b7c2-99393ddf3410/_history/2707745b-5e16-4cc0-bcbc-a4a85c5e64df' as URLReference
              }
            },
            {
              response: {
                status: '200',
                location:
                  '/fhir/Task/8c80cb66-6068-4ae8-97cb-bb65b75788b9/_history/dc39332f-a5d7-4422-ba7b-bc99a958e8cb' as URLReference
              }
            },
            {
              response: {
                status: '201',
                location:
                  '/fhir/RelatedPerson/a09caca5-e202-45e1-afc7-3604c7416ef7/_history/197e802e-f3c6-4fc1-90f8-8ec5a1e78d52' as URLReference
              }
            },
            {
              response: {
                status: '201',
                location:
                  '/fhir/PaymentReconciliation/e6201b53-6f39-40f8-b057-00bbf583173d/_history/dad4487b-143a-4b8a-88de-a706aef550a6' as URLReference
              }
            },
            {
              response: {
                status: '201',
                location:
                  '/fhir/DocumentReference/60be834a-ae5c-4f5b-a164-f67b4b9422ab/_history/294f98bf-d62b-480e-8858-8f4f7e746ada' as URLReference
              }
            }
          ]
        }
        return res(ctx.json(responseBundle))
      })
    )

    const response = await server.server.inject({
      method: 'POST',
      url: '/records/7c3af302-08c9-41af-8701-92de9a71a3e4/issue-record',
      payload: {
        event: 'BIRTH',
        certificate: {
          hasShowedVerifiedDocument: true,
          collector: {
            relationship: 'INFORMANT'
          },
          certificateTemplateId: 'birth-certificate',
          payment: {
            type: 'MANUAL',
            amount: 100,
            outcome: 'COMPLETED',
            date: '2021-08-10T10:00:00.000Z'
          }
        }
      },
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    expect(invokeWebhooks).toHaveBeenCalledWith({
      bundle: CERTIFIED_BIRTH_RECORD,
      token,
      event: getEventType(CERTIFIED_BIRTH_RECORD),
      isNotRegistered: true,
      statusType: 'issued'
    })

    const issuedRecord = JSON.parse(response.payload) as IssuedRecord
    const task = getTaskFromSavedBundle(issuedRecord)
    const businessStatus = getStatusFromTask(task)

    expect(response.statusCode).toBe(200)
    expect(businessStatus).toBe('ISSUED')
  })
})
