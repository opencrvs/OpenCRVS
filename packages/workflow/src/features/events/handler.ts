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
import { HEARTH_URL, OPENHIM_URL } from '@workflow/constants'
import { isUserAuthorized } from '@workflow/features/events/auth'
import { EVENT_TYPE } from '@workflow/features/registration/fhir/constants'
import {
  hasBirthRegistrationNumber,
  hasDeathRegistrationNumber
} from '@workflow/features/registration/fhir/fhir-utils'
import {
  createRegistrationHandler,
  markEventAsCertifiedHandler,
  markEventAsValidatedHandler,
  markEventAsWaitingValidationHandler
} from '@workflow/features/registration/handler'
import {
  getEventType,
  isInProgressApplication
} from '@workflow/features/registration/utils'
import updateTaskHandler from '@workflow/features/task/handler'
import { logger } from '@workflow/logger'
import { hasRegisterScope, hasValidateScope } from '@workflow/utils/authUtils'
import * as Hapi from '@hapi/hapi'
import fetch, { RequestInit } from 'node-fetch'

// TODO: Change these event names to be closer in definition to the comments
// https://jembiprojects.jira.com/browse/OCRVS-2767
export enum Events {
  BIRTH_IN_PROGRESS_DEC = '/events/birth/in-progress-declaration', // Field agent or DHIS2in progress application
  BIRTH_NEW_DEC = '/events/birth/new-declaration', // Field agent completed application
  BIRTH_UPDATE_DEC = '/events/birth/update-declaration',
  BIRTH_WAITING_VALIDATION = '/events/birth/waiting-validation',
  BIRTH_NEW_WAITING_VALIDATION = '/events/birth/new-waiting-validation', // Registrar new registration application
  BIRTH_MARK_REG = '/events/birth/mark-registered',
  BIRTH_MARK_VALID = '/events/birth/mark-validated',
  BIRTH_MARK_CERT = '/events/birth/mark-certified',
  BIRTH_MARK_VOID = '/events/birth/mark-voided',
  DEATH_IN_PROGRESS_DEC = '/events/death/in-progress-declaration', /// Field agent or DHIS2in progress application
  DEATH_NEW_DEC = '/events/death/new-declaration', // Field agent completed application
  DEATH_UPDATE_DEC = '/events/death/update-declaration',
  DEATH_WAITING_VALIDATION = '/events/death/waiting-validation',
  DEATH_NEW_WAITING_VALIDATION = '/events/death/new-waiting-validation', // Registrar new registration application
  DEATH_MARK_REG = '/events/death/mark-registered',
  DEATH_MARK_VALID = '/events/death/mark-validated',
  DEATH_MARK_CERT = '/events/death/mark-certified',
  DEATH_MARK_VOID = '/events/death/mark-voided',
  BIRTH_NEW_VALIDATE = '/events/birth/new-validation', // Registration agent new application
  DEATH_NEW_VALIDATE = '/events/death/new-validation', // Registration agent new application
  EVENT_NOT_DUPLICATE = '/events/not-duplicate',
  UNKNOWN = 'unknown'
}

function detectEvent(request: Hapi.Request): Events {
  if (
    request.method === 'post' &&
    (request.path === '/fhir' || request.path === '/fhir/')
  ) {
    const fhirBundle = request.payload as fhir.Bundle
    if (
      fhirBundle.entry &&
      fhirBundle.entry[0] &&
      fhirBundle.entry[0].resource
    ) {
      const firstEntry = fhirBundle.entry[0].resource
      if (firstEntry.resourceType === 'Composition') {
        const eventType = getEventType(fhirBundle)
        if (eventType === EVENT_TYPE.BIRTH) {
          if (firstEntry.id) {
            if (!hasBirthRegistrationNumber(fhirBundle)) {
              if (hasValidateScope(request)) {
                return Events.BIRTH_MARK_VALID
              }
              if (hasRegisterScope(request)) {
                return Events.BIRTH_WAITING_VALIDATION
              }
            } else {
              return Events.BIRTH_MARK_CERT
            }
          } else {
            if (hasRegisterScope(request)) {
              return Events.BIRTH_NEW_WAITING_VALIDATION
            }

            if (hasValidateScope(request)) {
              return Events.BIRTH_NEW_VALIDATE
            }

            return isInProgressApplication(fhirBundle)
              ? Events.BIRTH_IN_PROGRESS_DEC
              : Events.BIRTH_NEW_DEC
          }
        } else if (eventType === EVENT_TYPE.DEATH) {
          if (firstEntry.id) {
            if (!hasDeathRegistrationNumber(fhirBundle)) {
              if (hasValidateScope(request)) {
                return Events.DEATH_MARK_VALID
              }
              if (hasRegisterScope(request)) {
                return Events.DEATH_WAITING_VALIDATION
              }
            } else {
              return Events.DEATH_MARK_CERT
            }
          } else {
            if (hasRegisterScope(request)) {
              return Events.DEATH_NEW_WAITING_VALIDATION
            }

            if (hasValidateScope(request)) {
              return Events.DEATH_NEW_VALIDATE
            }

            return isInProgressApplication(fhirBundle)
              ? Events.DEATH_IN_PROGRESS_DEC
              : Events.DEATH_NEW_DEC
          }
        }
      }
      if (firstEntry.resourceType === 'Task' && firstEntry.id) {
        const eventType = getEventType(fhirBundle)
        if (eventType === EVENT_TYPE.BIRTH) {
          if (hasValidateScope(request)) {
            return Events.BIRTH_MARK_VALID
          }
          if (hasRegisterScope(request)) {
            return Events.BIRTH_MARK_REG
          }
        } else if (eventType === EVENT_TYPE.DEATH) {
          if (hasValidateScope(request)) {
            return Events.DEATH_MARK_VALID
          }
          if (hasRegisterScope(request)) {
            return Events.DEATH_MARK_REG
          }
        }
      }
    }
  }

  if (request.method === 'put' && request.path.includes('/fhir/Task')) {
    const eventType = getEventType(request.payload as fhir.Bundle)
    if (eventType === EVENT_TYPE.BIRTH) {
      return Events.BIRTH_MARK_VOID
    } else if (eventType === EVENT_TYPE.DEATH) {
      return Events.DEATH_MARK_VOID
    }
  }

  if (request.method === 'put' && request.path.includes('/fhir/Composition')) {
    return Events.EVENT_NOT_DUPLICATE
  }

  return Events.UNKNOWN
}

async function forwardToHearth(request: Hapi.Request, h: Hapi.ResponseToolkit) {
  logger.info(
    `Forwarding to Hearth unchanged: ${request.method} ${request.path}`
  )

  const requestOpts: RequestInit = {
    method: request.method,
    headers: {
      'Content-Type': 'application/fhir+json'
    }
  }

  let path = request.path
  if (request.method === 'post' || request.method === 'put') {
    requestOpts.body = JSON.stringify(request.payload)
  } else if (request.method === 'get' && request.url.pathname) {
    path = request.url.pathname
  }
  const res = await fetch(HEARTH_URL + path.replace('/fhir', ''), requestOpts)
  const resBody = await res.text()
  const response = h.response(resBody)

  response.code(res.status)
  res.headers.forEach((headerVal, headerName) => {
    response.header(headerName, headerVal)
  })

  return response
}

export async function fhirWorkflowEventHandler(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  const event = detectEvent(request)
  logger.info(`Event detected: ${event}`)

  // Unknown event are allowed through to Hearth by default.
  // We can restrict what resources can be used in Hearth directly if necessary
  if (
    event !== Events.UNKNOWN &&
    !isUserAuthorized(request.auth.credentials.scope, event)
  ) {
    return h.response().code(401)
  }

  let response

  switch (event) {
    case Events.BIRTH_IN_PROGRESS_DEC:
      response = await createRegistrationHandler(request, h, event)
      await triggerEvent(
        Events.BIRTH_IN_PROGRESS_DEC,
        request.payload,
        request.headers.authorization
      )
      break
    case Events.BIRTH_NEW_DEC:
      response = await createRegistrationHandler(request, h, event)
      await triggerEvent(
        Events.BIRTH_NEW_DEC,
        request.payload,
        request.headers.authorization
      )
      break
    case Events.BIRTH_NEW_VALIDATE:
      response = await createRegistrationHandler(request, h, event)
      await triggerEvent(
        Events.BIRTH_NEW_VALIDATE,
        request.payload,
        request.headers.authorization
      )
      break
    case Events.BIRTH_WAITING_VALIDATION:
      response = await markEventAsWaitingValidationHandler(request, h, event)
      await triggerEvent(
        Events.BIRTH_WAITING_VALIDATION,
        request.payload,
        request.headers.authorization
      )
      break
    case Events.DEATH_WAITING_VALIDATION:
      response = await markEventAsWaitingValidationHandler(request, h, event)
      await triggerEvent(
        Events.DEATH_WAITING_VALIDATION,
        request.payload,
        request.headers.authorization
      )
      break
    case Events.DEATH_NEW_VALIDATE:
      response = await createRegistrationHandler(request, h, event)
      await triggerEvent(
        Events.DEATH_NEW_VALIDATE,
        request.payload,
        request.headers.authorization
      )
      break
    case Events.BIRTH_NEW_WAITING_VALIDATION:
      response = await createRegistrationHandler(request, h, event)
      await triggerEvent(
        Events.BIRTH_NEW_WAITING_VALIDATION,
        request.payload,
        request.headers.authorization
      )
      break
    case Events.DEATH_IN_PROGRESS_DEC:
      response = await createRegistrationHandler(request, h, event)
      await triggerEvent(
        Events.DEATH_IN_PROGRESS_DEC,
        request.payload,
        request.headers.authorization
      )
      break
    case Events.DEATH_NEW_DEC:
      response = await createRegistrationHandler(request, h, event)
      await triggerEvent(
        Events.DEATH_NEW_DEC,
        request.payload,
        request.headers.authorization
      )
      break
    case Events.DEATH_NEW_WAITING_VALIDATION:
      response = await createRegistrationHandler(request, h, event)
      await triggerEvent(
        Events.DEATH_NEW_WAITING_VALIDATION,
        request.payload,
        request.headers.authorization
      )
      break
    case Events.BIRTH_MARK_VALID:
      response = await markEventAsValidatedHandler(request, h, event)
      await triggerEvent(
        Events.BIRTH_MARK_VALID,
        request.payload,
        request.headers.authorization
      )
      break
    case Events.DEATH_MARK_VALID:
      response = await markEventAsValidatedHandler(request, h, event)
      await triggerEvent(
        Events.DEATH_MARK_VALID,
        request.payload,
        request.headers.authorization
      )
      break
    case Events.BIRTH_MARK_REG:
      response = await markEventAsWaitingValidationHandler(request, h, event)
      await triggerEvent(
        Events.BIRTH_MARK_REG,
        request.payload,
        request.headers.authorization
      )
      break
    case Events.DEATH_MARK_REG:
      response = await markEventAsWaitingValidationHandler(request, h, event)
      await triggerEvent(
        Events.DEATH_MARK_REG,
        request.payload,
        request.headers.authorization
      )
      break
    case Events.BIRTH_MARK_CERT:
      response = await markEventAsCertifiedHandler(request, h)
      await triggerEvent(
        Events.BIRTH_MARK_CERT,
        request.payload,
        request.headers.authorization
      )
      break
    case Events.DEATH_MARK_CERT:
      response = await markEventAsCertifiedHandler(request, h)
      await triggerEvent(
        Events.DEATH_MARK_CERT,
        request.payload,
        request.headers.authorization
      )
      break
    case Events.BIRTH_MARK_VOID:
      response = await updateTaskHandler(request, h, event)
      await triggerEvent(
        Events.BIRTH_MARK_VOID,
        request.payload,
        request.headers.authorization
      )
      break
    case Events.DEATH_MARK_VOID:
      response = await updateTaskHandler(request, h, event)
      await triggerEvent(
        Events.DEATH_MARK_VOID,
        request.payload,
        request.headers.authorization
      )
      break
    case Events.EVENT_NOT_DUPLICATE:
      response = await forwardToHearth(request, h)
      await triggerEvent(
        Events.EVENT_NOT_DUPLICATE,
        request.payload,
        request.headers.authorization
      )
      break
    default:
      // forward as-is to hearth
      response = await forwardToHearth(request, h)
  }

  return response
}

export async function triggerEvent(
  event: Events,
  payload: string | object,
  authHeader: string
) {
  try {
    await fetch(`${OPENHIM_URL}${event}`, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader
      }
    })
  } catch (err) {
    logger.error(`Unable to forward to openhim for error : ${err}`)
  }
}
