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
import * as Hapi from '@hapi/hapi'
import { logger } from '@opencrvs/commons'
import { badData } from '@hapi/boom'
import * as Joi from 'joi'
import { pick } from 'lodash'
import getSystems from '@config/handlers/system/systemHandler'
import { COUNTRY_CONFIG_URL } from '@config/config/constants'
import fetch from 'node-fetch'
import { getToken } from '@config/utils/auth'
import { pipe } from 'fp-ts/lib/function'
import { verifyToken } from '@config/utils/verifyToken'
import { RouteScope } from '@config/config/routes'

export const SystemRoleType = [
  'FIELD_AGENT',
  'LOCAL_REGISTRAR',
  'LOCAL_SYSTEM_ADMIN',
  'NATIONAL_REGISTRAR',
  'REGISTRATION_AGENT'
]

export default async function configHandler(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  try {
    const [certificates, config, systems] = await Promise.all([
      getCertificates(request, h),
      getApplicationConfig(request, h),
      getSystems(request, h)
    ])
    return {
      config,
      certificates,
      systems
    }
  } catch (ex) {
    logger.error(ex)
    if (process.env.NODE_ENV === 'development') {
      throw ex
    }
    return {}
  }
}

async function getCertificates(request: Hapi.Request, h: Hapi.ResponseToolkit) {
  const authToken = getToken(request)
  const decodedOrError = pipe(authToken, verifyToken)
  if (decodedOrError._tag === 'Left') {
    return []
  }
  const { scope } = decodedOrError.right

  if (
    scope &&
    (scope.includes(RouteScope.CERTIFY) ||
      scope.includes(RouteScope.VALIDATE) ||
      scope.includes(RouteScope.NATLSYSADMIN))
  ) {
    return Promise.all(
      (['birth', 'death', 'marriage'] as const).map(async (event) => {
        const response = await getEventCertificate(event, getToken(request))
        return response
      })
    )
  }
  return []
}
async function getConfigFromCountry() {
  const url = new URL('application-config', COUNTRY_CONFIG_URL).toString()

  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Expected to get the application config from ${url}`)
  }
  return res.json()
}

async function getEventCertificate(
  event: 'birth' | 'death' | 'marriage',
  authToken: string
) {
  const url = new URL(
    `/certificates/${event}.svg`,
    COUNTRY_CONFIG_URL
  ).toString()

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${authToken}` }
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch ${event} certificate: ${res.statusText}`)
  }
  const responseText = await res.text()

  return { svgCode: responseText, event }
}

async function getApplicationConfig(
  request?: Hapi.Request,
  h?: Hapi.ResponseToolkit
) {
  const configFromCountryConfig = await getConfigFromCountry()
  const { error, value: updatedConfigFromCountryConfig } =
    applicationConfigResponseValidation.validate(configFromCountryConfig, {
      allowUnknown: true
    })
  if (error) {
    throw badData(error.details[0].message)
  }

  return updatedConfigFromCountryConfig
}

export async function getLoginConfigHandler(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  const refineConfigResponse = pick(await getApplicationConfig(), [
    'APPLICATION_NAME',
    'COUNTRY_LOGO',
    'PHONE_NUMBER_PATTERN',
    'LOGIN_BACKGROUND',
    'USER_NOTIFICATION_DELIVERY_METHOD',
    'LIMIT_RECORD_PER_LOCATION',
    'INFORMANT_NOTIFICATION_DELIVERY_METHOD'
  ])
  return { config: refineConfigResponse }
}

const applicationConfigResponseValidation = Joi.object({
  APPLICATION_NAME: Joi.string().required(),
  COUNTRY_LOGO: Joi.object()
    .keys({
      fileName: Joi.string().required(),
      file: Joi.string().required()
    })
    .required(),
  LOGIN_BACKGROUND: Joi.object({
    backgroundColor: Joi.string().allow('').optional(),
    backgroundImage: Joi.string().allow('').optional(),
    imageFit: Joi.string().allow('').optional()
  }).required(),
  CURRENCY: Joi.object()
    .keys({
      isoCode: Joi.string().required(),
      languagesAndCountry: Joi.array().items(Joi.string()).required()
    })
    .required(),
  PHONE_NUMBER_PATTERN: Joi.string().required(),
  NID_NUMBER_PATTERN: Joi.string().required(),
  BIRTH: Joi.object()
    .keys({
      REGISTRATION_TARGET: Joi.number().required(),
      LATE_REGISTRATION_TARGET: Joi.number().required(),
      FEE: Joi.object()
        .keys({
          ON_TIME: Joi.number().required(),
          LATE: Joi.number().required(),
          DELAYED: Joi.number().required()
        })
        .required(),
      PRINT_IN_ADVANCE: Joi.boolean().required()
    })
    .required(),
  DEATH: Joi.object()
    .keys({
      REGISTRATION_TARGET: Joi.number().required(),
      FEE: Joi.object()
        .keys({
          ON_TIME: Joi.number().required(),
          DELAYED: Joi.number().required()
        })
        .required(),
      PRINT_IN_ADVANCE: Joi.boolean().required()
    })
    .required(),
  MARRIAGE: Joi.object()
    .keys({
      REGISTRATION_TARGET: Joi.number().required(),
      FEE: Joi.object()
        .keys({
          ON_TIME: Joi.number().required(),
          DELAYED: Joi.number().required()
        })
        .required(),
      PRINT_IN_ADVANCE: Joi.boolean().required()
    })
    .required(),
  FIELD_AGENT_AUDIT_LOCATIONS: Joi.string().required(),
  DECLARATION_AUDIT_LOCATIONS: Joi.string().required(),
  FEATURES: {
    DEATH_REGISTRATION: Joi.boolean().required(),
    MARRIAGE_REGISTRATION: Joi.boolean().required(),
    EXTERNAL_VALIDATION_WORKQUEUE: Joi.boolean().required(),
    INFORMANT_SIGNATURE: Joi.boolean().required(),
    PRINT_DECLARATION: Joi.boolean().required(),
    DATE_OF_BIRTH_UNKNOWN: Joi.boolean().required(),
    INFORMANT_SIGNATURE_REQUIRED: Joi.boolean().required()
  },
  USER_NOTIFICATION_DELIVERY_METHOD: Joi.string().allow('').optional(),
  LIMIT_RECORD_PER_LOCATION: Joi.boolean().optional(),
  INFORMANT_NOTIFICATION_DELIVERY_METHOD: Joi.string().allow('').optional(),
  SIGNATURE_REQUIRED_FOR_ROLES: Joi.array().items(
    Joi.string().valid(...SystemRoleType)
  )
})
