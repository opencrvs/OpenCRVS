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
import fetch from 'node-fetch'
import {
  USER_MANAGEMENT_URL,
  CERT_PRIVATE_KEY_PATH,
  CERT_PUBLIC_KEY_PATH,
  CONFIG_TOKEN_EXPIRY_SECONDS,
  CONFIG_SYSTEM_TOKEN_EXPIRY_SECONDS,
  PRODUCTION,
  QA_ENV
} from '@auth/constants'
import { resolve } from 'url'
import { readFileSync } from 'fs'
import { promisify } from 'util'
import * as jwt from 'jsonwebtoken'
import { get, set } from '@auth/database'
import * as t from 'io-ts'
import { ThrowReporter } from 'io-ts/lib/ThrowReporter'
import {
  generateVerificationCode,
  sendVerificationCode,
  storeVerificationCode
} from '@auth/features/verifyCode/service'
import { logger } from '@auth/logger'
import { unauthorized } from '@hapi/boom'

const cert = readFileSync(CERT_PRIVATE_KEY_PATH)
const publicCert = readFileSync(CERT_PUBLIC_KEY_PATH)

const sign = promisify(jwt.sign) as (
  payload: string | Buffer | object,
  secretOrPrivateKey: jwt.Secret,
  options?: jwt.SignOptions
) => Promise<string>

export interface IAuthentication {
  mobile: string
  userId: string
  status: string
  scope: string[]
}

export interface ISystemAuthentication {
  systemId: string
  status: string
  scope: string[]
}

export class UserInfoNotFoundError extends Error {}

export function isUserInfoNotFoundError(err: Error) {
  return err instanceof UserInfoNotFoundError
}

export async function authenticate(
  username: string,
  password: string
): Promise<IAuthentication> {
  const url = resolve(USER_MANAGEMENT_URL, '/verifyPassword')

  const res = await fetch(url, {
    method: 'POST',
    body: JSON.stringify({ username, password })
  })

  if (res.status !== 200) {
    throw Error(res.statusText)
  }

  const body = await res.json()
  return {
    userId: body.id,
    scope: body.scope,
    status: body.status,
    mobile: body.mobile
  }
}

export async function authenticateSystem(
  /* tslint:disable */
  client_id: string,
  client_secret: string
  /* tslint:enable */
): Promise<ISystemAuthentication> {
  const url = resolve(USER_MANAGEMENT_URL, '/verifySystem')

  const res = await fetch(url, {
    method: 'POST',
    body: JSON.stringify({ client_id, client_secret })
  })

  if (res.status !== 200) {
    throw Error(res.statusText)
  }

  const body = await res.json()
  return {
    systemId: body.id,
    scope: body.scope,
    status: body.status
  }
}

export async function createToken(
  userId: string,
  scope: string[],
  audience: string[],
  issuer: string,
  system?: boolean
): Promise<string> {
  if (typeof userId === undefined) {
    throw new Error('Invalid userId found for token creation')
  }
  return sign({ scope }, cert, {
    subject: userId,
    algorithm: 'RS256',
    expiresIn: system
      ? CONFIG_SYSTEM_TOKEN_EXPIRY_SECONDS
      : CONFIG_TOKEN_EXPIRY_SECONDS,
    audience,
    issuer
  })
}

export async function storeUserInformation(
  nonce: string,
  userId: string,
  scope: string[],
  mobile: string
) {
  return set(
    `user_information_${nonce}`,
    JSON.stringify({ userId, scope, mobile })
  )
}

export async function getStoredUserInformation(nonce: string) {
  const record = await get(`user_information_${nonce}`)
  if (record === null) {
    throw new UserInfoNotFoundError('user not found')
  }
  return JSON.parse(record)
}

export async function generateAndSendVerificationCode(
  nonce: string,
  mobile: string,
  scope: string[]
) {
  const isDemoUser = scope.indexOf('demo') > -1
  logger.info('isDemoUser', {
    isDemoUser: isDemoUser
  })
  let verificationCode
  if (isDemoUser) {
    verificationCode = '000000'
    await storeVerificationCode(nonce, verificationCode)
  } else {
    verificationCode = await generateVerificationCode(nonce, mobile)
  }
  if (!PRODUCTION || QA_ENV) {
    logger.info('Sending a verification SMS', {
      mobile: mobile,
      verificationCode
    })
  } else {
    if (isDemoUser) {
      throw unauthorized()
    } else {
      await sendVerificationCode(mobile, verificationCode)
    }
  }
}

/* tslint:disable */
const TokenPayload = t.type({
  sub: t.string,
  scope: t.array(t.string),
  iat: t.number,
  exp: t.number,
  aud: t.array(t.string)
})

export type ITokenPayload = t.TypeOf<typeof TokenPayload>

export function verifyToken(token: string): ITokenPayload {
  const decoded = jwt.verify(token, publicCert, {
    issuer: 'opencrvs:auth-service',
    audience: 'opencrvs:auth-user'
  })
  const result = TokenPayload.decode(decoded)
  ThrowReporter.report(result)
  return result.value as ITokenPayload
}
/* tslint:enable */
