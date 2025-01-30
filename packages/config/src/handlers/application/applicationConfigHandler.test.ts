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
import { createServer } from '@config/server'
import ApplicationConfig, {
  IApplicationConfigurationModel
} from '@config/models/config'
import * as fetchMock from 'jest-fetch-mock'
import * as mockingoose from 'mockingoose'
import * as jwt from 'jsonwebtoken'
import { readFileSync } from 'fs'

const token = jwt.sign(
  { scope: ['natlsysadmin'] },
  readFileSync('./test/cert.key'),
  {
    algorithm: 'RS256',
    issuer: 'opencrvs:auth-service',
    audience: 'opencrvs:config-user'
  }
)

const fetch = fetchMock as fetchMock.FetchMock

export const validImageB64String =
  'iVBORw0KGgoAAAANSUhEUgAAAAgAAAACCAYAAABllJ3tAAAABHNCSVQICAgIfAhkiAAAABl0RVh0U29mdHdhcmUAZ25vbWUtc2NyZWVuc2hvdO8Dvz4AAAAXSURBVAiZY1RWVv7PgAcw4ZNkYGBgAABYyAFsic1CfAAAAABJRU5ErkJggg=='

const mockConfig = {
  APPLICATION_NAME: 'Farajaland CRVS',
  BIRTH: {
    REGISTRATION_TARGET: 45,
    LATE_REGISTRATION_TARGET: 365,
    FEE: {
      ON_TIME: 0,
      LATE: 0,
      DELAYED: 0
    },
    PRINT_IN_ADVANCE: true
  },
  COUNTRY_LOGO: {
    fileName: 'logo.png',
    file: `data:image;base64,${validImageB64String}`
  },
  CURRENCY: {
    isoCode: 'ZMW',
    languagesAndCountry: ['en-ZM']
  },
  DEATH: {
    REGISTRATION_TARGET: 45,
    FEE: {
      ON_TIME: 0,
      DELAYED: 0
    },
    PRINT_IN_ADVANCE: true
  },
  MARRIAGE: {
    REGISTRATION_TARGET: 45,
    FEE: {
      ON_TIME: 0,
      DELAYED: 0
    },
    PRINT_IN_ADVANCE: true
  },
  PHONE_NUMBER_PATTERN: '^0(7|9)[0-9]{8}$',
  NID_NUMBER_PATTERN: '^[0-9]{10}$',
  LOGIN_BACKGROUND: {
    backgroundColor: '36304E'
  },
  MARRIAGE_REGISTRATION: false,
  DATE_OF_BIRTH_UNKNOWN: false,
  INFORMANT_SIGNATURE: true,
  INFORMANT_SIGNATURE_REQUIRED: true,
  HEALTH_FACILITY_FILTER: 'UPAZILA',
  LOGIN_URL: 'http://localhost:3020',
  AUTH_URL: 'http://localhost:4040',
  MINIO_URL: 'http://localhost:3535',
  API_GATEWAY_URL: 'http://localhost:7070/',
  PERFORMANCE_URL: 'http://localhost:3001',
  RESOURCES_URL: 'http://localhost:3040',
  FIELD_AGENT_AUDIT_LOCATIONS:
    'WARD,UNION,CITY_CORPORATION,MUNICIPALITY,UPAZILA',
  DECLARATION_AUDIT_LOCATIONS: 'WARD,UNION,MUNICIPALITY',
  EXTERNAL_VALIDATION_WORKQUEUE: true, // this flag will decide whether to show external validation workqueue on registrar home
  USER_NOTIFICATION_DELIVERY_METHOD: 'email',
  LIMIT_RECORD_PER_LOCATION: false,
  INFORMANT_NOTIFICATION_DELIVERY_METHOD: 'email'
} as unknown as IApplicationConfigurationModel

describe('applicationHandler', () => {
  let server: any

  beforeEach(async () => {
    mockingoose.resetAll()
    server = await createServer()
    fetch.resetMocks()
  })

  it('get all config using mongoose', async () => {
    mockingoose(ApplicationConfig).toReturn(mockConfig, 'findOne')

    const res = await server.server.inject({
      method: 'GET',
      url: '/config',
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    expect(res.statusCode).toBe(200)
  })

  it('get application config using mongoose', async () => {
    mockingoose(ApplicationConfig).toReturn(mockConfig, 'findOne')
    fetch.mockResponse(JSON.stringify(mockConfig))

    const res = await server.server.inject({
      method: 'GET',
      url: '/publicConfig'
    })
    expect(res.statusCode).toBe(200)
  })

  it('return error when tries to save invalid data', async () => {
    mockingoose(ApplicationConfig).toReturn(null, 'findOne')
    mockingoose(ApplicationConfig).toReturn({}, 'update')

    const res = await server.server.inject({
      method: 'POST',
      url: '/getCertificate',
      payload: {
        APPLICATION_NAME: 1234
      },
      headers: {
        Authorization: `${token}`
      }
    })

    expect(res.statusCode).toBe(400)
  })
})
