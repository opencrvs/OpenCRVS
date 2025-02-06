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

import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { getEventWithOnlyUserSpecificDrafts } from '@events/drafts'
import { getEventConfigurations } from '@events/service/config/config'
import {
  addAction,
  createEvent,
  deleteEvent,
  EventInputWithId,
  getEventById,
  patchEvent
} from '@events/service/events/events'
import { presignFilesInEvent } from '@events/service/files'
import { getIndexedEvents } from '@events/service/indexing/indexing'
import {
  EventConfig,
  getUUID,
  ApproveCorrectionActionInput,
  RejectCorrectionActionInput,
  RequestCorrectionActionInput,
  logger
} from '@opencrvs/commons'
import {
  ActionType,
  PrintCertificateActionInput,
  DeclareActionInput,
  EventIndex,
  EventInput,
  FieldValue,
  NotifyActionInput,
  RegisterActionInput,
  ValidateActionInput
} from '@opencrvs/commons/events'
import { router, publicProcedure } from '@events/router/trpc'
import { approveCorrection } from '@events/service/events/actions/approve-correction'
import { rejectCorrection } from '@events/service/events/actions/reject-correction'
import * as middleware from '@events/router/middleware'

function validateEventType({
  eventTypes,
  eventInputType
}: {
  eventTypes: string[]
  eventInputType: string
}) {
  if (!eventTypes.includes(eventInputType)) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `Invalid event type ${eventInputType}. Valid event types are: ${eventTypes.join(
        ', '
      )}`
    })
  }
}

export const eventRouter = router({
  config: router({
    get: publicProcedure.output(z.array(EventConfig)).query(async (options) => {
      return getEventConfigurations(options.ctx.token)
    })
  }),
  create: publicProcedure.input(EventInput).mutation(async (options) => {
    const config = await getEventConfigurations(options.ctx.token)
    const eventIds = config.map((c) => c.id)

    validateEventType({
      eventTypes: eventIds,
      eventInputType: options.input.type
    })

    return createEvent({
      eventInput: options.input,
      createdBy: options.ctx.user.id,
      createdAtLocation: options.ctx.user.primaryOfficeId,
      transactionId: options.input.transactionId
    })
  }),
  patch: publicProcedure.input(EventInputWithId).mutation(async (options) => {
    const config = await getEventConfigurations(options.ctx.token)
    const eventIds = config.map((c) => c.id)

    validateEventType({
      eventTypes: eventIds,
      eventInputType: options.input.type
    })

    return patchEvent(options.input)
  }),
  get: publicProcedure.input(z.string()).query(async ({ input, ctx }) => {
    const event = await getEventById(input)

    const eventWithSignedFiles = await presignFilesInEvent(event, ctx.token)
    const eventWithUserSpecificDrafts = getEventWithOnlyUserSpecificDrafts(
      eventWithSignedFiles,
      ctx.user.id
    )

    return eventWithUserSpecificDrafts
  }),
  delete: publicProcedure
    .input(z.object({ eventId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return deleteEvent(input.eventId, { token: ctx.token })
    }),
  actions: router({
    notify: publicProcedure
      .input(NotifyActionInput)
      .use(middleware.validateAction(ActionType.NOTIFY))
      .mutation(async (options) => {
        return addAction(options.input, {
          eventId: options.input.eventId,
          createdBy: options.ctx.user.id,
          createdAtLocation: options.ctx.user.primaryOfficeId,
          token: options.ctx.token,
          transactionId: options.input.transactionId
        })
      }),
    declare: publicProcedure
      .input(DeclareActionInput)
      .use(middleware.validateAction(ActionType.DECLARE))
      .mutation(async (options) => {
        return addAction(options.input, {
          eventId: options.input.eventId,
          createdBy: options.ctx.user.id,
          createdAtLocation: options.ctx.user.primaryOfficeId,
          token: options.ctx.token,
          transactionId: options.input.transactionId
        })
      }),
    validate: publicProcedure
      .input(ValidateActionInput)
      .use(middleware.validateAction(ActionType.VALIDATE))
      .mutation(async (options) => {
        return addAction(options.input, {
          eventId: options.input.eventId,
          createdBy: options.ctx.user.id,
          createdAtLocation: options.ctx.user.primaryOfficeId,
          token: options.ctx.token,
          transactionId: options.input.transactionId
        })
      }),
    register: publicProcedure
      // @TODO: Find out a way to dynamically modify the MiddlewareOptions type
      .input(RegisterActionInput.omit({ identifiers: true }))
      // @ts-expect-error
      .use(middleware.validateAction(ActionType.REGISTER))
      .mutation(async (options) => {
        return addAction(
          {
            ...options.input,
            identifiers: {
              trackingId: getUUID(),
              registrationNumber: getUUID()
            }
          },
          {
            eventId: options.input.eventId,
            createdBy: options.ctx.user.id,
            createdAtLocation: options.ctx.user.primaryOfficeId,
            token: options.ctx.token,
            transactionId: options.input.transactionId
          }
        )
      }),
    printCertificate: publicProcedure
      .input(PrintCertificateActionInput)
      .use(middleware.validateAction(ActionType.PRINT_CERTIFICATE))
      .mutation(async (options) => {
        return addAction(options.input, {
          eventId: options.input.eventId,
          createdBy: options.ctx.user.id,
          createdAtLocation: options.ctx.user.primaryOfficeId,
          token: options.ctx.token,
          transactionId: options.input.transactionId
        })
      }),
    correction: router({
      request: publicProcedure
        .input(RequestCorrectionActionInput)
        .use(middleware.validateAction(ActionType.REQUEST_CORRECTION))
        .mutation(async (options) => {
          return addAction(options.input, {
            eventId: options.input.eventId,
            createdBy: options.ctx.user.id,
            createdAtLocation: options.ctx.user.primaryOfficeId,
            token: options.ctx.token,
            transactionId: options.input.transactionId
          })
        }),
      approve: publicProcedure
        .input(ApproveCorrectionActionInput)
        .use(middleware.validateAction(ActionType.APPROVE_CORRECTION))
        .mutation(async (options) => {
          return approveCorrection(options.input, {
            eventId: options.input.eventId,
            createdBy: options.ctx.user.id,
            createdAtLocation: options.ctx.user.primaryOfficeId,
            token: options.ctx.token,
            transactionId: options.input.transactionId
          })
        }),
      reject: publicProcedure
        .input(RejectCorrectionActionInput)
        .mutation(async (options) => {
          return rejectCorrection(options.input, {
            eventId: options.input.eventId,
            createdBy: options.ctx.user.id,
            createdAtLocation: options.ctx.user.primaryOfficeId,
            token: options.ctx.token,
            transactionId: options.input.transactionId
          })
        })
    })
  }),
  list: publicProcedure.output(z.array(EventIndex)).query(getIndexedEvents),
  registration: router({
    confirm: publicProcedure
      .input(
        z.object({
          eventId: z.string(),
          data: z.record(z.string(), FieldValue)
        })
      )
      .mutation(async ({ input, ctx }) => {
        logger.info('Registration confirmed', { eventId: input.eventId })
        logger.info(input.data)
        return getEventById(input.eventId)
      })
  })
})
