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
import { storage } from '@client/storage'
import { IUserData } from './declarations'
import * as CommonUtils from '@client/utils/commonUtils'
import { referenceApi } from './utils/referenceApi'
import { authApi } from './utils/authApi'
// eslint-disable-next-line import/no-unassigned-import
import 'core-js/features/array/flat'
// eslint-disable-next-line import/no-unassigned-import
import 'jsdom-worker'
import { roleQueries } from './forms/user/query/queries'
import { userQueries } from './user/queries'
import { mockOfflineData } from './tests/mock-offline-data'
// eslint-disable-next-line import/no-unassigned-import
import './tests/queryMock'
import { vi } from 'vitest'
import createFetchMock from 'vitest-fetch-mock'

/*
 * Navigator & Window
 */
window.HTMLElement.prototype.scrollIntoView = vi.fn()
const config = {
  API_GATEWAY_URL: 'http://localhost:7070/',
  CONFIG_API_URL: 'http://localhost:2021',
  LOGIN_URL: 'http://localhost:3020',
  AUTH_URL: 'http://localhost:4040',
  MINIO_BUCKET: 'ocrvs',
  COUNTRY_CONFIG_URL: 'http://localhost:3040',
  APPLICATION_NAME: 'Farajaland CRVS',
  BIRTH: {
    REGISTRATION_TARGET: 45,
    LATE_REGISTRATION_TARGET: 365,
    FEE: {
      ON_TIME: 0,
      LATE: 0,
      DELAYED: 0
    }
  },
  COUNTRY: 'BGD',
  CURRENCY: {
    isoCode: 'ZMW',
    languagesAndCountry: ['en-ZM']
  },
  DEATH: {
    REGISTRATION_TARGET: 45,
    FEE: {
      ON_TIME: 0,
      DELAYED: 0
    }
  },
  FEATURES: {
    DEATH_REGISTRATION: true,
    MARRIAGE_REGISTRATION: true,
    EXTERNAL_VALIDATION_WORKQUEUE: false,
    INFORMANT_SIGNATURE: true,
    PRINT_DECLARATION: true
  },
  LANGUAGES: 'en,bn,fr',
  USER_NOTIFICATION_DELIVERY_METHOD: 'sms',
  LIMIT_RECORD_PER_LOCATION: false,
  INFORMANT_NOTIFICATION_DELIVERY_METHOD: 'sms',
  SENTRY: 'https://2ed906a0ba1c4de2ae3f3f898ec9df0b@sentry.io/1774551',
  NID_NUMBER_PATTERN: /^[0-9]{9}$/,
  PHONE_NUMBER_PATTERN: /^01[1-9][0-9]{8}$/
}

vi.stubGlobal('config', config)

/*
 * GraphQL Queries
 */
/* eslint-disable import/first */
import { queries } from './profile/queries'

/*
 * Country configuration
 */
/* eslint-disable import/first */
import {
  mockUserResponse,
  mockConfigResponse,
  userDetails,
  validToken,
  getItem,
  setItem
} from './tests/util'

vi.doMock('@client/forms/user/fieldDefinitions/createUser', () => ({
  createUserForm: mockOfflineData.forms.userForm
}))

vi.mock('@client/forms/handlebarHelpers', async () => {
  return {
    initHandlebarHelpers: () => Promise.resolve(),
    getHandlebarHelpers: () => ({})
  }
})

vi.mock('@client/forms/conditionals', async () => {
  const actual = (await vi.importActual('@client/forms/conditionals')) as any
  return {
    ...actual,
    conditionals: actual.builtInConditionals,
    initConditionals: () => Promise.resolve()
  }
})

vi.mock('@client/forms/validators', async () => {
  const actual = (await vi.importActual('@client/forms/validators')) as any
  return {
    ...actual,
    validators: await vi.importActual('@client/utils/validate'),
    initValidators: () => Promise.resolve()
  }
})

vi.mock('@client/forms/handlebarHelpers', async () => {
  const actual = (await vi.importActual(
    '@client/forms/handlebarHelpers'
  )) as any
  return {
    ...actual,
    handlebarHelpers: {},
    initHandlebarHelpers: () => Promise.resolve()
  }
})

/*
 * Initialize mocks
 */
const fetchMock = createFetchMock(vi)
fetchMock.enableMocks()

const localStorageMock = {
  getItem,
  setItem,
  removeItem: vi.fn(),
  clear: vi.fn()
}

vi.stubGlobal('localStorage', localStorageMock)

/*
 * Page Visibility
 */

const hiddenMock = vi.fn()
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

const storageGetItemMock = vi.fn()
const storageSetItemMock = vi.fn()
storage.getItem = storageGetItemMock
storage.setItem = storageSetItemMock

/*
 * Console
 */

const warn = vi.fn()
const error = vi.fn()
const debug = vi.fn()
/* eslint-disable no-console */
console.warn = warn
console.error = error
console.debug = debug
queries.fetchUserDetails = vi.fn()
roleQueries.fetchRoles = vi.fn()

userQueries.searchUsers = vi.fn()

vi.doMock(
  '@client/utils/referenceApi',
  (): {
    referenceApi: typeof referenceApi
  } => ({
    referenceApi: {
      loadLocations: () => Promise.resolve(mockOfflineData.locations),
      loadFacilities: () => Promise.resolve(mockOfflineData.facilities),
      loadContent: () =>
        Promise.resolve({
          languages: mockOfflineData.languages
        }),
      loadConfig: () => Promise.resolve(mockConfigResponse),
      loadCertificateConfiguration: () => Promise.resolve({}),
      loadConfigAnonymousUser: () => Promise.resolve(mockConfigResponse),
      loadForms: () => Promise.resolve(mockOfflineData.forms.forms),
      importConditionals: () => Promise.resolve({}),
      importValidators: () => Promise.resolve({}),
      importHandlebarHelpers: () => Promise.resolve({})
    }
  })
)

vi.doMock(
  '@client/utils/authApi',
  (): {
    authApi: typeof authApi
  } => ({
    authApi: {
      invalidateToken: () => Promise.resolve()
    }
  })
)

beforeEach(() => {
  /*
   * Reset all mocks
   */

  getItem.mockReturnValue(validToken)
  storageGetItemMock.mockReset()
  storageSetItemMock.mockReset()
  warn.mockReset()
  error.mockReset()
  debug.mockReset()
  hiddenMock.mockReset()

  Date.now = vi.fn(() => 1487076708000) // 2017-02-14

  /*
   * Assign sane defaults for everything
   * These should cover 99% of use cases, but can be overwritten
   * in the test suite
   */

  vi.spyOn(CommonUtils, 'isMobileDevice').mockReturnValue(true)
  window.history.replaceState({}, '', '/')

  queries.fetchUserDetails = vi.fn().mockReturnValue(mockUserResponse)

  const userData: IUserData[] = [
    {
      userID: userDetails.userMgntUserID,
      userPIN: '$2a$10$xQBLcbPgGQNu9p6zVchWuu6pmCrQIjcb6k2W1PIVUxVTE/PumWM82',
      declarations: []
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
vi.mock('lodash/debounce', () => ({
  default: vi.fn().mockImplementation((arg) => arg)
}))

vi.mock('./utils', async () => ({
  useOnlineStatus: () => true,
  isNavigatorOnline: () => true,
  getUserRole: vi.fn().mockImplementation((lang, role) => 'ENTREPENEUR')
}))

vi.mock('react-router', async () => ({
  ...((await vi.importActual('react-router')) as any),
  useParams: vi.fn().mockImplementation(() => ({
    event: 'birth',
    section: 'child'
  }))
}))

vi.mock('@client/views/OIDPVerificationCallback/utils', async () => ({
  ...((await vi.importActual(
    '@client/views/OIDPVerificationCallback/utils'
  )) as any),
  useExtractCallBackState: vi.fn(),
  useQueryParams: vi.fn()
}))
