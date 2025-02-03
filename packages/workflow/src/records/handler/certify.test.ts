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
  CertifiedRecord,
  TransactionResponse
} from '@opencrvs/commons/types'
import { REGISTERED_BIRTH_RECORD } from '@test/mocks/records/register'
import { SCOPES } from '@opencrvs/commons/authentication'
import { invokeWebhooks } from '@workflow/records/webhooks'
import { getEventType } from '@workflow/features/registration/utils'

jest.mock('@workflow/records/webhooks')

describe('Certify record endpoint', () => {
  let server: Awaited<ReturnType<typeof createServer>>

  beforeAll(async () => {
    server = await createServer()
    await server.start()
  })

  afterAll(async () => {
    await server.stop()
  })

  it('returns OK for informant certifying a birth declaration', async () => {
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
          return res(ctx.json(REGISTERED_BIRTH_RECORD))
        }
      )
    )

    // Upload certificate to minio
    mswServer.use(
      rest.post('http://localhost:9050/upload-svg', (_, res, ctx) => {
        return res(
          ctx.json({ refUrl: '/ocrvs/6e964d7a-25d0-4524-bdc2-b1f29d1e816c' })
        )
      })
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
                  '/fhir/Composition/7a790b68-9433-47b8-b595-66aae80d044a/_history/2707745b-5e16-4cc0-bcbc-a4a85c5e64df' as URLReference
              }
            },
            {
              response: {
                status: '200',
                location:
                  '/fhir/Task/df49e854-25b3-46b0-b6ea-e2f7f82ea297/_history/dc39332f-a5d7-4422-ba7b-bc99a958e8cb' as URLReference
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
      url: '/records/7c3af302-08c9-41af-8701-92de9a71a3e4/certify-record',
      payload: {
        event: 'BIRTH',
        certificate: {
          hasShowedVerifiedDocument: true,
          certificateTemplateId: 'birth-certificate',
          collector: {
            relationship: 'INFORMANT'
          }
        }
      },
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    const certifiedRecord = JSON.parse(response.payload) as CertifiedRecord
    const task = getTaskFromSavedBundle(certifiedRecord)
    const businessStatus = getStatusFromTask(task)

    expect(response.statusCode).toBe(200)
    expect(businessStatus).toBe('CERTIFIED')
  })

  it('returns OK for other collector certifying a birth declaration', async () => {
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
          return res(ctx.json(REGISTERED_BIRTH_RECORD))
        }
      )
    )

    // Upload certificate to minio
    mswServer.use(
      rest.post('http://localhost:9050/upload-svg', (_, res, ctx) => {
        return res(
          ctx.json({ refUrl: '/ocrvs/6e964d7a-25d0-4524-bdc2-b1f29d1e816c' })
        )
      })
    )

    mswServer.use(
      rest.post('http://localhost:3447/fhir', async (_, res, ctx) => {
        const responseBundle: TransactionResponse = {
          resourceType: 'Bundle',
          type: 'batch-response',
          entry: [
            {
              response: {
                status: '200',
                location:
                  '/fhir/Composition/7a790b68-9433-47b8-b595-66aae80d044a/_history/2707745b-5e16-4cc0-bcbc-a4a85c5e64df' as URLReference
              }
            },
            {
              response: {
                status: '200',
                location:
                  '/fhir/Task/df49e854-25b3-46b0-b6ea-e2f7f82ea297/_history/dc39332f-a5d7-4422-ba7b-bc99a958e8cb' as URLReference
              }
            },
            {
              response: {
                status: '201',
                location:
                  '/fhir/Patient/14221fbe-2a8e-4579-852f-c2644a50d75b/_history/b9686e98-a324-4a2b-a3f0-b4a32ac62005' as URLReference
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
      url: '/records/7c3af302-08c9-41af-8701-92de9a71a3e4/certify-record',
      payload: {
        id: '7c3af302-08c9-41af-8701-92de9a71a3e4',
        event: 'BIRTH',
        certificate: {
          hasShowedVerifiedDocument: true,
          certificateTemplateId: 'birth-certificate',
          collector: {
            relationship: 'Other',
            otherRelationship: 'Uncle',
            name: [
              {
                use: 'en',
                firstNames: 'Jhon',
                familyName: 'Doe'
              }
            ],
            identifier: [
              {
                id: '1234123421',
                type: 'NATIONAL_ID'
              }
            ]
          }
        }
      },
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    expect(invokeWebhooks).toHaveBeenCalledWith({
      bundle: REGISTERED_BIRTH_RECORD,
      token,
      event: getEventType(REGISTERED_BIRTH_RECORD),
      isNotRegistered: true,
      statusType: 'certified'
    })

    const certifiedRecord = JSON.parse(response.payload) as CertifiedRecord
    const task = getTaskFromSavedBundle(certifiedRecord)
    const businessStatus = getStatusFromTask(task)

    expect(response.statusCode).toBe(200)
    expect(businessStatus).toBe('CERTIFIED')
  })
})
