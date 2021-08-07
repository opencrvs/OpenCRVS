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
import { logger } from '@webhooks/logger'
import { internal } from '@hapi/boom'
import * as Hapi from '@hapi/hapi'
import Webhook, { TRIGGERS, IWebhookModel } from '@webhooks/model/webhook'
import { getQueue } from '@webhooks/queue'
import { Queue } from 'bullmq'
import * as ShortUIDGen from 'short-uid'
import {
  createRequestSignature,
  transformBirthBundle
} from '@webhooks/features/event/service'

export interface IAuthHeader {
  Authorization: string
}

export async function birthRegisteredHandler(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  const bundle = request.payload as fhir.Bundle
  const authHeader: IAuthHeader = {
    Authorization: request.headers.authorization
  }

  let webhookQueue: Queue

  try {
    webhookQueue = getQueue()
  } catch (error) {
    logger.error(`Can't get webhook queue: ${error}`)
    return internal(error)
  }

  try {
    const webhooks: IWebhookModel[] | null = await Webhook.find()
    if (!webhooks) {
      throw internal('Failed to find webhooks')
    }
    logger.info(`Subscribed webhooks: ${JSON.stringify(webhooks)}`)
    if (webhooks) {
      for (const webhookToNotify of webhooks) {
        logger.info(
          `Queueing webhook ${webhookToNotify.trigger} ${
            TRIGGERS[TRIGGERS.BIRTH_REGISTERED]
          }`
        )
        const transformedBundle = await transformBirthBundle(
          bundle,
          webhookToNotify.createdBy.type,
          authHeader
        )
        if (webhookToNotify.trigger === TRIGGERS[TRIGGERS.BIRTH_REGISTERED]) {
          const payload = {
            timestamp: new Date().toISOString(),
            id: webhookToNotify.webhookId,
            event: {
              hub: {
                topic: TRIGGERS[TRIGGERS.BIRTH_REGISTERED]
              },
              context: [transformedBundle]
            }
          }
          const hmac = createRequestSignature(
            'sha256',
            webhookToNotify.sha_secret,
            JSON.stringify(payload)
          )
          webhookQueue.add(
            `${webhookToNotify.webhookId}_${
              TRIGGERS[TRIGGERS.BIRTH_REGISTERED]
            }`,
            {
              payload,
              url: webhookToNotify.address,
              hmac
            },
            {
              jobId: `WEBHOOK_${new ShortUIDGen().randomUUID().toUpperCase()}_${
                webhookToNotify.webhookId
              }`,
              attempts: 3
            }
          )
        }
      }
    } else {
      logger.info(`No webhooks subscribed to birth registration trigger`)
    }
  } catch (error) {
    logger.error(`Webhooks/birthRegisteredHandler: error: ${error}`)
    return internal(error)
  }

  return h.response().code(200)
}
