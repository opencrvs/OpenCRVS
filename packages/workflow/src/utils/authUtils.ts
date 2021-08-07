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
import * as decode from 'jwt-decode'
import * as Hapi from '@hapi/hapi'

export enum USER_SCOPE {
  DECLARE = 'declare',
  VALIDATE = 'validate',
  REGISTER = 'register',
  CERTIFY = 'certify'
}

export interface ITokenPayload {
  sub: string
  exp: string
  algorithm: string
  scope: string[]
}

export const getTokenPayload = (token: string) => {
  let decoded: ITokenPayload
  try {
    decoded = decode(token)
  } catch (err) {
    throw new Error(
      `getTokenPayload: Error occurred during token decode : ${err}`
    )
  }
  return decoded
}

export const getToken = (request: Hapi.Request): string => {
  if (request.headers.authorization.indexOf('Bearer') > -1) {
    return request.headers.authorization.split(' ')[1]
  } else {
    return request.headers.authorization
  }
}

export const hasScope = (request: Hapi.Request, scope: string): boolean => {
  if (
    !request.auth ||
    !request.auth.credentials ||
    !request.auth.credentials.scope
  ) {
    return false
  }
  return request.auth.credentials.scope.includes(scope)
}

export function hasRegisterScope(request: Hapi.Request): boolean {
  return hasScope(request, USER_SCOPE.REGISTER)
}

export function hasValidateScope(request: Hapi.Request): boolean {
  return hasScope(request, USER_SCOPE.VALIDATE)
}
