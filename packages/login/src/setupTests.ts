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
import { vi } from 'vitest'

const config = {
  AUTH_API_URL: 'http://localhost:4040',
  COUNTRY: 'FAR',
  LANGUAGES: 'en,fr',
  CLIENT_APP_URL: 'http://localhost:3000/',
  COUNTRY_CONFIG_URL: 'http://localhost:3040',
  CONFIG_API_URL: 'http://localhost:2021',
  USER_NOTIFICATION_DELIVERY_METHOD: 'sms',
  LIMIT_RECORD_PER_LOCATION: false
}

vi.stubGlobal('config', config)
