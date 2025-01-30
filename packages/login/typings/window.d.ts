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
interface Window {
  config: {
    AUTH_API_URL: string
    CONFIG_API_URL: string
    COUNTRY_CONFIG_URL: string
    COUNTRY: string
    LANGUAGES: string
    USER_NOTIFICATION_DELIVERY_METHOD: 'sms' | 'email'
    LIMIT_RECORD_PER_LOCATION: boolean
    INFORMANT_NOTIFICATION_DELIVERY_METHOD: 'sms' | 'email'
    CLIENT_APP_URL: string
    PHONE_NUMBER_PATTERN: RegExp
    SENTRY: string
  }
}
