/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * OpenCRVS is also distributed under the terms of the Civil Registration
 * & Healthcare Disclaimer located at http://opencrvs.org/license.
 *
 * Copyright (C) The OpenCRVS Authors. OpenCRVS and the OpenCRVS
 * graphic logo are (registered/a) trademark(s) of Plan International.
 */
/* eslint-disable @typescript-eslint/no-var-requires */
import { GlobalWithFetchMock } from 'jest-fetch-mock'
import { storage } from '@client/storage'
import { IUserData } from './applications'
import { noop } from 'lodash'
import * as CommonUtils from '@client/utils/commonUtils'
import { referenceApi } from './utils/referenceApi'
import { authApi } from './utils/authApi'
import 'core-js/features/array/flat'
import 'jsdom-worker'
import { roleQueries } from './forms/user/fieldDefinitions/query/queries'
import { userQueries } from './user/queries'

if (process.env.CI) {
  jest.setTimeout(30000)
}

/*
 * Initialize mocks
 */

const customGlobal: GlobalWithFetchMock = global as GlobalWithFetchMock
customGlobal.fetch = require('jest-fetch-mock')
customGlobal.fetchMock = customGlobal.fetch
jest.mock('lodash/debounce', () => jest.fn(fn => fn))

/*
 * Local storage
 */

const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
})

/*
 * Page Visibility
 */

const hiddenMock = jest.fn()
Object.defineProperty(document, 'hidden', {
  get() {
    return hiddenMock()
  },
  set(bool) {
    hiddenMock.mockReturnValue(Boolean(bool))
  }
})

/*
 * Storage module
 */

const storageGetItemMock = jest.fn()
const storageSetItemMock = jest.fn()
storage.getItem = storageGetItemMock
storage.setItem = storageSetItemMock

/*
 * Console
 */

const warn = jest.fn()
const error = jest.fn()
const debug = jest.fn()
/* eslint-disable no-console */
console.warn = warn
console.error = error
console.debug = debug

const log = console.log.bind(console)

const BLOCKED_MESSAGES = ['Warning: Setting up fake worker.']
console.log = jest.fn().mockImplementation((...messages) => {
  if (BLOCKED_MESSAGES.includes(messages.join(' '))) {
    return
  }
  log(...messages)
})
/* eslint-enable no-console */
/*
 * GraphQL Queries
 */

const { queries } = require('./profile/queries')
queries.fetchUserDetails = jest.fn()
roleQueries.fetchRoles = jest.fn()
userQueries.searchUsers = jest.fn()

/*
 * Navigator & Window
 */

const navigatorMock = {
  onLine: true
}
;(window as any).location.assign = jest.fn()
;(window as any).navigator = navigatorMock
;(window as any).location.reload = jest.fn()
;(window as any).scrollTo = noop
;(window as any).config = {
  API_GATEWAY_URL: 'http://localhost:7070/',
  AUTH_URL: 'http://localhost:4040',
  BACKGROUND_SYNC_BROADCAST_CHANNEL: 'backgroundSynBroadCastChannel',
  COUNTRY: 'bgd',
  COUNTRY_LOGO_FILE: 'logo.png',
  LANGUAGES: 'en,bn',
  HIDE_EVENT_REGISTER_INFORMATION: false,
  EXTERNAL_VALIDATION_WORKQUEUE: true,
  FIELD_AGENT_AUDIT_LOCATIONS:
    'WARD,UNION,CITY_CORPORATION,MUNICIPALITY,UPAZILA',
  APPLICATION_AUDIT_LOCATIONS: 'WARD,UNION',
  LOGIN_URL: 'http://localhost:3020',
  RESOURCES_URL: 'http://localhost:3040/bgd',
  HEALTH_FACILITY_FILTER: 'UPAZILA',
  CERTIFICATE_PRINT_CHARGE_FREE_PERIOD: 45,
  CERTIFICATE_PRINT_CHARGE_UP_LIMIT: 1825,
  CERTIFICATE_PRINT_LOWEST_CHARGE: 25,
  CERTIFICATE_PRINT_HIGHEST_CHARGE: 50,
  SENTRY: 'https://2ed906a0ba1c4de2ae3f3f898ec9df0b@sentry.io/1774551',
  LOGROCKET: 'opencrvs-foundation/opencrvs-bangladesh'
}

/*
 * Country configuration
 */

const {
  mockUserResponse,
  mockOfflineData,
  userDetails,
  validToken,
  getItem,
  assign
} = require('./tests/util')

jest.mock('@client/utils/referenceApi', (): {
  referenceApi: typeof referenceApi
} => ({
  referenceApi: {
    loadLocations: () => Promise.resolve(mockOfflineData.locations),
    loadFacilities: () => Promise.resolve(mockOfflineData.facilities),
    loadPilotLocations: () => Promise.resolve(mockOfflineData.pilotLocations),
    loadDefinitions: () =>
      Promise.resolve({
        languages: mockOfflineData.languages,
        forms: mockOfflineData.forms,
        templates: mockOfflineData.templates
      }),
    loadAssets: () => Promise.resolve(mockOfflineData.assets)
  }
}))

jest.mock('@client/utils/authApi', (): {
  authApi: typeof authApi
} => ({
  authApi: {
    invalidateToken: () => Promise.resolve()
  }
}))

beforeEach(() => {
  /*
   * Reset all mocks
   */

  storageGetItemMock.mockReset()
  storageSetItemMock.mockReset()
  assign.mockClear()
  warn.mockReset()
  error.mockReset()
  debug.mockReset()
  hiddenMock.mockReset()

  /*
   * Assign sane defaults for everything
   * These should cover 99% of use cases, but can be overwritten
   * in the test suite
   */

  jest.spyOn(CommonUtils, 'isMobileDevice').mockReturnValue(true)
  window.history.replaceState({}, '', '/')

  getItem.mockReturnValue(validToken)
  queries.fetchUserDetails.mockReturnValue(mockUserResponse)

  const userData: IUserData[] = [
    {
      userID: userDetails.userMgntUserID,
      userPIN: '$2a$10$xQBLcbPgGQNu9p6zVchWuu6pmCrQIjcb6k2W1PIVUxVTE/PumWM82',
      applications: []
    }
  ]

  const indexedDB = {
    USER_DETAILS: JSON.stringify(userDetails),
    USER_DATA: JSON.stringify(userData)
  }

  storageGetItemMock.mockImplementation((key: keyof typeof indexedDB) =>
    Promise.resolve(indexedDB[key])
  )

  storageSetItemMock.mockImplementation(
    (key: keyof typeof indexedDB, value: string) => (indexedDB[key] = value)
  )
})
