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
import { createServer } from '@webhooks/server'
import Webhook, { IWebhook } from '@webhooks/model/webhook'
import { readFileSync } from 'fs'
import * as fetchMock from 'jest-fetch-mock'
import { sign } from 'jsonwebtoken'
import * as mockingoose from 'mockingoose'
import * as service from '@webhooks/features/manage/service'
import { SCOPES } from '@opencrvs/commons/authentication'

const fetch = fetchMock as fetchMock.FetchMock

const token = sign(
  { scope: [SCOPES.SEARCH_BIRTH] },
  readFileSync('./test/cert.key'),
  {
    subject: '123',
    algorithm: 'RS256',
    issuer: 'opencrvs:auth-service',
    audience: 'opencrvs:webhooks-user'
  }
)

const mockActiveSystem = {
  name: 'John William',
  username: 'j.doe1',
  client_id: '123',
  status: 'active',
  scope: ['nationalId'],
  sha_secret: '123'
}

const mockInactiveSystem = {
  name: 'John William',
  username: 'j.doe1',
  client_id: '123',
  status: 'deactivated',
  sha_secret: '123'
}

const mockWebhook = {
  webhookId: '123',
  createdBy: {
    client_id: '123',
    name: 'John William',
    type: 'api',
    username: 'j.doe1'
  },
  callback: 'https://www.your-great-domain.com/webhooks',
  mode: 'subscribe',
  secret: '123',
  topic: 'BIRTH_REGISTERED'
} as unknown as IWebhook

const mockWebhooks = [
  {
    webhookId: '123',
    createdBy: {
      client_id: '123',
      name: 'John William',
      type: 'api',
      username: 'j.doe1'
    },
    callback: 'https://www.your-great-domain.com/webhooks',
    mode: 'subscribe',
    secret: '123',
    topic: 'BIRTH_REGISTERED'
  } as unknown,
  {
    webhookId: '456',
    createdBy: {
      client_id: '123',
      name: 'John William',
      type: 'api',
      username: 'j.doe1'
    },
    callback: 'https://www.your-great-domain.com/webhooks',
    mode: 'subscribe',
    secret: '123',
    topic: 'DEATH_CERTIFIED'
  } as unknown
] as IWebhook[]

describe('subscribeWebhooksHandler handler', () => {
  let server: any

  beforeEach(async () => {
    mockingoose.resetAll()
    server = await createServer()
    fetch.resetMocks()
  })

  it('creates and saves a webhook using mongoose', async () => {
    fetch.mockResponses(
      [JSON.stringify(mockActiveSystem), { status: 200 }],
      [JSON.stringify({ challenge: '123' }), { status: 200 }]
    )

    jest.spyOn(service, 'generateChallenge').mockImplementation(() => '123')
    mockingoose(Webhook).toReturn(mockWebhook, 'save')

    const res = await server.server.inject({
      method: 'POST',
      url: '/webhooks',
      payload: {
        hub: {
          callback: 'https://www.your-great-domain.com/webhooks',
          mode: 'subscribe',
          secret: '123',
          topic: 'BIRTH_REGISTERED'
        }
      },
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    expect(res.statusCode).toBe(202)
  })

  it('return unauthoried error if system not active', async () => {
    fetch.mockResponseOnce(JSON.stringify(mockInactiveSystem))

    const res = await server.server.inject({
      method: 'POST',
      url: '/webhooks',
      payload: {
        hub: {
          callback: 'https://www.your-great-domain.com/webhooks',
          mode: 'subscribe',
          secret: '123',
          topic: 'BIRTH_REGISTERED'
        }
      },
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    expect(res.result.hub.reason).toEqual(
      'Active system details cannot be found.  This system is no longer authorized'
    )
    expect(res.statusCode).toBe(400)
  })

  it('return an error if a topic is undefined', async () => {
    fetch.mockResponses(
      [JSON.stringify(mockActiveSystem), { status: 200 }],
      [JSON.stringify({ challenge: '123' }), { status: 200 }]
    )

    jest.spyOn(service, 'generateChallenge').mockImplementation(() => '123')
    mockingoose(Webhook).toReturn(mockWebhook, 'save')

    const res = await server.server.inject({
      method: 'POST',
      url: '/webhooks',
      payload: {
        hub: {
          callback: 'https://www.your-great-domain.com/webhooks',
          mode: 'subscribe',
          secret: '123',
          topic: undefined
        }
      },
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    expect(res.result.hub.reason).toEqual('hub.topic is required')
    expect(res.statusCode).toBe(400)
  })

  it('return an error if a mode is incorrect', async () => {
    fetch.mockResponses(
      [JSON.stringify(mockActiveSystem), { status: 200 }],
      [JSON.stringify({ challenge: '123' }), { status: 200 }]
    )

    jest.spyOn(service, 'generateChallenge').mockImplementation(() => '123')
    mockingoose(Webhook).toReturn(mockWebhook, 'save')

    const res = await server.server.inject({
      method: 'POST',
      url: '/webhooks',
      payload: {
        hub: {
          callback: 'https://www.your-great-domain.com/webhooks',
          mode: 'unsubscribe',
          secret: '123',
          topic: 'BIRTH_REGISTERED'
        }
      },
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    expect(res.result.hub.reason).toEqual('hub.mode must be set to subscribe')
    expect(res.statusCode).toBe(400)
  })

  it('return an error if secret is incorrect', async () => {
    fetch.mockResponses(
      [JSON.stringify(mockActiveSystem), { status: 200 }],
      [JSON.stringify({ challenge: '123' }), { status: 200 }]
    )

    jest.spyOn(service, 'generateChallenge').mockImplementation(() => '123')
    mockingoose(Webhook).toReturn(mockWebhook, 'save')

    const res = await server.server.inject({
      method: 'POST',
      url: '/webhooks',
      payload: {
        hub: {
          callback: 'https://www.your-great-domain.com/webhooks',
          mode: 'subscribe',
          secret: 'XXX',
          topic: 'BIRTH_REGISTERED'
        }
      },
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    expect(res.result.hub.reason).toEqual('hub.secret is incorrect')
    expect(res.statusCode).toBe(400)
  })
})

describe('listWebhooksHandler handler', () => {
  let server: any

  beforeEach(async () => {
    mockingoose.resetAll()
    server = await createServer()
    fetch.resetMocks()
  })

  it('lists all webhooks for this client', async () => {
    fetch.mockResponseOnce(JSON.stringify(mockActiveSystem))
    mockingoose(Webhook).toReturn(mockWebhooks, 'find')

    const res = await server.server.inject({
      method: 'GET',
      url: '/webhooks',
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    expect(res.statusCode).toBe(200)
  })

  it('return unauthoried error if system not active', async () => {
    fetch.mockResponseOnce(JSON.stringify(mockInactiveSystem))

    const res = await server.server.inject({
      method: 'GET',
      url: '/webhooks',
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    expect(res.result).toEqual(
      'Active system details cannot be found.  This system is no longer authorized'
    )
    expect(res.statusCode).toBe(400)
  })
})

describe('deleteWebhooksHandler handler', () => {
  let server: any

  beforeEach(async () => {
    mockingoose.resetAll()
    server = await createServer()
    fetch.resetMocks()
  })

  it('deletes a webhook for this client', async () => {
    mockingoose(Webhook).toReturn(mockWebhook, 'findOneAndRemove')

    const res = await server.server.inject({
      method: 'DELETE',
      url: '/webhooks/123',
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    expect(res.statusCode).toBe(204)
  })
})
