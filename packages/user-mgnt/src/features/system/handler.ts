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

import { logger } from '@user-mgnt/logger'
import System, { ISystemModel } from '@user-mgnt/model/system'
import User, { IUserModel } from '@user-mgnt/model/user'
import { generateSaltedHash, generateHash } from '@user-mgnt/utils/hash'
import { statuses, systemScopeMapping } from '@user-mgnt/utils/userUtils'
import { QA_ENV } from '@user-mgnt/constants'
import * as Hapi from '@hapi/hapi'
import * as _ from 'lodash'
import * as Joi from 'joi'
import { getTokenPayload, ITokenPayload } from '@user-mgnt/utils/token'
import { unauthorized } from '@hapi/boom'
import * as uuid from 'uuid/v4'
import {
  createFhirPractitioner,
  createFhirPractitionerRole,
  postFhir
} from '@user-mgnt/features/createUser/service'

interface IRegisterSystemPayload {
  scope: string
}

interface IRegisterSystemResponse {
  client_id: string
  client_secret: string
  sha_secret: string
}

export async function registerSystemClient(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  const { scope } = request.payload as IRegisterSystemPayload
  try {
    const token: ITokenPayload = getTokenPayload(
      request.headers.authorization.split(' ')[1]
    )
    const userId = token.sub
    const systemAdminUser: IUserModel | null = await User.findById(userId)
    if (!systemAdminUser || systemAdminUser.status !== statuses.ACTIVE) {
      logger.error('active system admin user details cannot be found')
      throw unauthorized()
    }
    if (!systemScopeMapping[scope]) {
      logger.error('scope doesnt exist')
      return h.response().code(400)
    }
    const systemScopes: string[] = systemScopeMapping[scope]

    if (
      (process.env.NODE_ENV === 'development' || QA_ENV) &&
      !systemScopes.includes('demo')
    ) {
      systemScopes.push('demo')
    }
    /* tslint:disable */
    const client_id = uuid()
    const secret_id = uuid()
    const sha_secret = uuid()
    /* tslint:enable */
    const { hash, salt } = generateSaltedHash(secret_id)

    const practitioner = createFhirPractitioner(systemAdminUser, true)
    const practitionerId = await postFhir(
      request.headers.authorization,
      practitioner
    )
    if (!practitionerId) {
      throw new Error(
        'Practitioner resource not saved correctly, practitioner ID not returned'
      )
    }
    const role = createFhirPractitionerRole(
      systemAdminUser,
      practitionerId,
      true
    )
    const roleId = await postFhir(request.headers.authorization, role)
    if (!roleId) {
      throw new Error(
        'PractitionerRole resource not saved correctly, practitionerRole ID not returned'
      )
    }
    const system = {
      client_id,
      name: systemAdminUser.name,
      username: systemAdminUser.username,
      status: statuses.ACTIVE,
      scope: systemScopes,
      practitionerId,
      secretHash: hash,
      salt,
      sha_secret
    }

    await System.create(system)
    const response: IRegisterSystemResponse = {
      client_id,
      client_secret: secret_id,
      sha_secret
    }
    return h.response(response).code(201)
  } catch (err) {
    logger.error(err)
    // return 400 if there is a validation error when saving to mongo
    return h.response().code(400)
  }
}

export const reqRegisterSystemSchema = Joi.object({
  scope: Joi.string().required()
})

export const resRegisterSystemSchema = Joi.object({
  client_id: Joi.string(),
  client_secret: Joi.string(),
  sha_secret: Joi.string()
})

interface IAuditSystemPayload {
  client_id: string
}

export async function deactivateSystemClient(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  try {
    const token: ITokenPayload = getTokenPayload(
      request.headers.authorization.split(' ')[1]
    )
    const userId = token.sub
    const systemAdminUser: IUserModel | null = await User.findById(userId)
    if (!systemAdminUser || systemAdminUser.status !== statuses.ACTIVE) {
      logger.error('active system admin user details cannot be found')
      throw unauthorized()
    }

    const auditSystemPayload = request.payload as IAuditSystemPayload

    const system: ISystemModel | null = await System.findById(
      auditSystemPayload.client_id
    )
    if (!system) {
      logger.error(
        `No system details found for requested client_id: ${auditSystemPayload.client_id}`
      )
      throw unauthorized()
    }

    system.status = statuses.DEACTIVATED

    try {
      // tslint:disable-next-line
      await System.update({ _id: system._id }, system)
    } catch (err) {
      logger.error(err.message)
      return h.response().code(400)
    }
    return h.response().code(200)
  } catch (err) {
    logger.error(err)
    return h.response().code(400)
  }
}

export async function reactivateSystemClient(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  try {
    const token: ITokenPayload = getTokenPayload(
      request.headers.authorization.split(' ')[1]
    )
    const userId = token.sub
    const systemAdminUser: IUserModel | null = await User.findById(userId)
    if (!systemAdminUser || systemAdminUser.status !== statuses.ACTIVE) {
      logger.error('active system admin user details cannot be found')
      throw unauthorized()
    }

    const auditSystemPayload = request.payload as IAuditSystemPayload

    const system: ISystemModel | null = await System.findById(
      auditSystemPayload.client_id
    )
    if (!system) {
      logger.error(
        `No system details found for requested client_id: ${auditSystemPayload.client_id}`
      )
      throw unauthorized()
    }

    system.status = statuses.ACTIVE

    try {
      // tslint:disable-next-line
      await System.update({ _id: system._id }, system)
    } catch (err) {
      logger.error(err.message)
      return h.response().code(400)
    }
    return h.response().code(200)
  } catch (err) {
    logger.error(err)
    return h.response().code(400)
  }
}

export const auditSystemSchema = Joi.object({
  client_id: Joi.string().required()
})

interface IVerifyPayload {
  client_id: string
  client_secret: string
}

interface IVerifyResponse {
  scope: string[]
  status: string
  id: string
}

export async function verifySystemHandler(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  const { client_id, client_secret } = request.payload as IVerifyPayload

  // tslint:disable-next-line
  const system: ISystemModel | null = await System.findOne({ client_id })

  if (!system) {
    // Don't return a 404 as this gives away that this user account exists
    throw unauthorized()
  }

  if (generateHash(client_secret, system.salt) !== system.secretHash) {
    throw unauthorized()
  }

  const response: IVerifyResponse = {
    scope: system.scope,
    status: system.status,
    id: system.id
  }

  return response
}

export const verifySystemReqSchema = Joi.object({
  client_id: Joi.string().required(),
  client_secret: Joi.string().required()
})

export const verifySystemResSchema = Joi.object({
  scope: Joi.array().items(Joi.string()),
  status: Joi.string(),
  id: Joi.string()
})

interface IGetSystemPayload {
  systemId: string
}

export async function getSystemHandler(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  const { systemId } = request.payload as IGetSystemPayload

  // tslint:disable-next-line
  const system: ISystemModel | null = await System.findOne({ _id: systemId })

  if (!system) {
    // Don't return a 404 as this gives away that this user account exists
    throw unauthorized()
  }
  return {
    name: `${system.name[0].given} ${system.name[0].family}`,
    client_id: system.client_id,
    username: system.username,
    status: system.status,
    scope: system.scope,
    sha_secret: system.sha_secret,
    practitionerId: system.practitionerId
  }
}

export const getSystemRequestSchema = Joi.object({
  systemId: Joi.string()
})

export const getSystemResponseSchema = Joi.object({
  name: Joi.string(),
  username: Joi.string(),
  client_id: Joi.string(),
  status: Joi.string(),
  scope: Joi.array().items(Joi.string()),
  sha_secret: Joi.string(),
  practitionerId: Joi.string()
})
