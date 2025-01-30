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
    APPLICATION_NAME: string
    API_GATEWAY_URL: string
    BIRTH: {
      REGISTRATION_TARGET: number
      LATE_REGISTRATION_TARGET: number
      FEE: {
        ON_TIME: number
        LATE: number
        DELAYED: number
      }
      PRINT_IN_ADVANCE: boolean
    }
    CONFIG_API_URL: string
    COUNTRY: string
    COUNTRY_LOGO: {
      fileName: string
      file: string
    }
    CURRENCY: {
      isoCode: string
      languagesAndCountry: string[]
    }
    DEATH: {
      REGISTRATION_TARGET: number
      FEE: {
        ON_TIME: number
        DELAYED: number
      }
      PRINT_IN_ADVANCE: boolean
    }
    MARRIAGE: {
      REGISTRATION_TARGET: number
      FEE: {
        ON_TIME: number
        DELAYED: number
      }
      PRINT_IN_ADVANCE: boolean
    }
    FEATURES: {
      DEATH_REGISTRATION: boolean
      MARRIAGE_REGISTRATION: boolean
      INFORMANT_SIGNATURE: boolean
      EXTERNAL_VALIDATION_WORKQUEUE: boolean
      PRINT_DECLARATION: boolean
      DATE_OF_BIRTH_UNKNOWN: boolean
      INFORMANT_SIGNATURE_REQUIRED: boolean
    }
    LANGUAGES: string
    LOGIN_URL: string
    AUTH_URL: string
    MINIO_BUCKET: string
    COUNTRY_CONFIG_URL: string
    SHOW_FARAJALAND_IN_COUNTRY_LISTS: boolean
    USER_NOTIFICATION_DELIVERY_METHOD: 'sms' | 'email'
    LIMIT_RECORD_PER_LOCATION: boolean
    INFORMANT_NOTIFICATION_DELIVERY_METHOD: 'sms' | 'email'
    FIELD_AGENT_AUDIT_LOCATIONS: string
    PHONE_NUMBER_PATTERN: RegExp
    NID_NUMBER_PATTERN: RegExp
    DECLARATION_AUDIT_LOCATIONS: string
    SENTRY: string
    REGISTRATIONS_DASHBOARD_URL: string
    STATISTICS_DASHBOARD_URL: string
    LEADERBOARDS_DASHBOARD_URL: string
    SIGNATURE_REQUIRED_FOR_ROLES: string[]
  }
  __localeId__: string
  __WB_MANIFEST: Array<{ url: string; revision: string }>
}
