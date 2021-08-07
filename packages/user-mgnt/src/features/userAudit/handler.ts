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
import User, {
  AUDIT_ACTION,
  AUDIT_REASON,
  IAuditHistory,
  IUserModel
} from '@user-mgnt/model/user'
import { statuses } from '@user-mgnt/utils/userUtils'
import { unauthorized } from '@hapi/boom'
import * as Hapi from '@hapi/hapi'
import * as Joi from 'joi'

interface IAuditUserPayload {
  userId: string
  auditedBy: string
  action: string
  reason: string
  comment: string
}

export async function userAuditHandler(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  const auditUserPayload = request.payload as IAuditUserPayload

  const user: IUserModel | null = await User.findById(auditUserPayload.userId)
  if (!user) {
    logger.error(
      `No user details found for requested userId: ${auditUserPayload.userId}`
    )
    // Don't return a 404 as this gives away that this user account exists
    throw unauthorized()
  }

  let updatedUserStatus
  if (AUDIT_ACTION[auditUserPayload.action] === AUDIT_ACTION.REACTIVATE) {
    updatedUserStatus = statuses.ACTIVE
  } else if (
    AUDIT_ACTION[auditUserPayload.action] === AUDIT_ACTION.DEACTIVATE
  ) {
    updatedUserStatus = statuses.DEACTIVATED
  } else {
    updatedUserStatus = user.status
  }

  if (updatedUserStatus !== user.status) {
    user.status = updatedUserStatus

    const auditData: IAuditHistory = {
      auditedBy: auditUserPayload.auditedBy,
      auditedOn: Date.now(),
      action: AUDIT_ACTION[AUDIT_ACTION[auditUserPayload.action]],
      reason: AUDIT_REASON[AUDIT_REASON[auditUserPayload.reason]],
      comment: auditUserPayload.comment
    }

    if (user.auditHistory) {
      user.auditHistory.push(auditData)
    } else {
      user.auditHistory = [auditData]
    }

    try {
      // tslint:disable-next-line
      await User.update({ _id: user._id }, user)
    } catch (err) {
      logger.error(err.message)
      // return 400 if there is a validation error when updating to mongo
      return h.response().code(400)
    }
  }
  return h.response().code(200)
}

export const requestSchema = Joi.object({
  userId: Joi.string().required(),
  auditedBy: Joi.string().required(),
  action: Joi.string().required(),
  reason: Joi.string().required(),
  comment: Joi.string().allow('')
})
