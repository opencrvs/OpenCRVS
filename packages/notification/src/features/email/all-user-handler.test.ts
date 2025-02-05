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
import { readFileSync } from 'fs'
import * as jwt from 'jsonwebtoken'
import { createServer } from '@notification/server'
import {
  createServerWithEnvironment,
  emailUserMock
} from '@notification/tests/util'
import * as fetchAny from 'jest-fetch-mock'
import { SCOPES } from '@opencrvs/commons/authentication'
import mockingoose from 'mockingoose'
import NotificationQueue, {
  NotificationQueueRecord
} from '@notification/model/notificationQueue'

const fetch = fetchAny as any

describe('Email all users handler', () => {
  let server: any

  beforeEach(async () => {
    mockingoose.resetAll()
    server = await createServer()
    fetch.resetMocks()
  })

  const mockNotificationQueue: Partial<NotificationQueueRecord> = {
    subject: 'email all users',
    body: 'this is an email sent to all active users',
    bcc: [
      'o.admin@opencrvs.org',
      'kalush.abwalya17@gmail.com',
      'kalusha.bwalya17@gmail.com',
      'kalushab.walya17@gmail.com',
      'kalushabw.alya17@gmail.com',
      'kalushabwa.lya17@gmail.com',
      'kalushabwal.ya17@gmail.com',
      'kalushabwalya.17@gmail.com',
      'kalushabwalya1.7@gmail.com',
      'kalushabwalya17+@gmail.com',
      'kalushabwalya17@gmail.com'
    ],
    status: 'success',
    locale: 'en',
    requestId: '123-abcd-456'
  }

  it('returns OK if the email gets sent', async () => {
    mockingoose(NotificationQueue).toReturn(mockNotificationQueue, 'create')
    server = await createServerWithEnvironment()

    const token = jwt.sign(
      { scope: [SCOPES.CONFIG_UPDATE_ALL] },
      readFileSync('./test/cert.key'),
      {
        algorithm: 'RS256',
        issuer: 'opencrvs:auth-service',
        audience: 'opencrvs:notification-user'
      }
    )
    fetch.mockResponse(JSON.stringify(emailUserMock))

    const res = await server.server.inject({
      method: 'POST',
      url: '/allUsersEmail',
      payload: {
        subject: 'email all users',
        body: 'this is an email sent to all active users',
        bcc: [
          'o.admin@opencrvs.org',
          'kalush.abwalya17@gmail.com',
          'kalusha.bwalya17@gmail.com',
          'kalushab.walya17@gmail.com',
          'kalushabw.alya17@gmail.com',
          'kalushabwa.lya17@gmail.com',
          'kalushabwal.ya17@gmail.com',
          'kalushabwalya.17@gmail.com',
          'kalushabwalya1.7@gmail.com',
          'kalushabwalya17+@gmail.com',
          'kalushabwalya17@gmail.com'
        ],
        locale: 'en',
        requestId: '123-abcd-456'
      },
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    expect(res.statusCode).toBe(200)
  })
})
