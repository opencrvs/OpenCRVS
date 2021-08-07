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
import {
  createFhirPractitioner,
  createFhirPractitionerRole,
  generateUsername,
  postFhir,
  rollbackCreateUser,
  sendCredentialsNotification,
  getCatchmentAreaIdsByPrimaryOfficeId
} from '@user-mgnt/features/createUser/service'
import { logger } from '@user-mgnt/logger'
import User, { IUser } from '@user-mgnt/model/user'
import {
  generateSaltedHash,
  generateRandomPassword
} from '@user-mgnt/utils/hash'
import {
  statuses,
  roleScopeMapping,
  hasDemoScope
} from '@user-mgnt/utils/userUtils'
import { QA_ENV } from '@user-mgnt/constants'
import * as Hapi from '@hapi/hapi'
import * as _ from 'lodash'

export default async function createUser(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  const user = request.payload as IUser & { password: string }
  const token = request.headers.authorization

  // construct Practitioner resource and save them
  let practitionerId = null
  let roleId = null
  let autoGenPassword = null

  try {
    const practitioner = createFhirPractitioner(user, false)
    practitionerId = await postFhir(token, practitioner)
    if (!practitionerId) {
      throw new Error(
        'Practitioner resource not saved correctly, practitioner ID not returned'
      )
    }
    user.catchmentAreaIds = await getCatchmentAreaIdsByPrimaryOfficeId(
      user.primaryOfficeId,
      token
    )
    user.role = user.role ? user.role : 'FIELD_AGENT'
    const role = createFhirPractitionerRole(user, practitionerId, false)
    roleId = await postFhir(token, role)
    if (!roleId) {
      throw new Error(
        'PractitionerRole resource not saved correctly, practitionerRole ID not returned'
      )
    }
    const userScopes: string[] = roleScopeMapping[user.role]
    if (
      (process.env.NODE_ENV === 'development' || QA_ENV) &&
      !userScopes.includes('demo')
    ) {
      userScopes.push('demo')
    }
    user.status = statuses.PENDING
    user.scope = userScopes

    if (
      user.role === 'NOTIFICATION_API_USER' ||
      user.role === 'VALIDATOR_API_USER' ||
      user.role === 'CHATBOT_API_USER'
    ) {
      // Immediately active API users
      user.status = statuses.ACTIVE
    }

    autoGenPassword = generateRandomPassword(hasDemoScope(request))

    const { hash, salt } = generateSaltedHash(autoGenPassword)
    user.salt = salt
    user.passwordHash = hash

    user.practitionerId = practitionerId

    user.username = await generateUsername(user.name)
  } catch (err) {
    await rollbackCreateUser(token, practitionerId, roleId)
    logger.error(err)
    // cause an internal server error
    throw err
  }

  // save user in user-mgnt data store
  let userModelObject
  try {
    userModelObject = await User.create(user)
  } catch (err) {
    logger.error(err)
    await rollbackCreateUser(token, practitionerId, roleId)
    // return 400 if there is a validation error when saving to mongo
    return h.response().code(400)
  }

  sendCredentialsNotification(user.mobile, user.username, autoGenPassword, {
    Authorization: request.headers.authorization
  })

  const resUser = _.omit(userModelObject.toObject(), ['passwordHash', 'salt'])
  return h.response(resUser).code(201)
}
