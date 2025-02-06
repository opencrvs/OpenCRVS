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

import {
  ActionInputWithType,
  ActionType,
  FieldConfig,
  FileFieldValue
} from '@opencrvs/commons'

import { z } from 'zod'
import { getActionFormFields } from '@events/service/config/config'
import { getEventTypeId } from '@events/service/events/events'
import { MiddlewareOptions } from '@events/router/middleware/utils'
import { TRPCError } from '@trpc/server'

type ActionMiddlewareOptions = Omit<MiddlewareOptions, 'input'> & {
  input: ActionInputWithType
}

function mapTypeToZod(type: FieldConfig['type'], required?: boolean) {
  let schema
  switch (type) {
    case 'DIVIDER':
    case 'TEXT':
    case 'BULLET_LIST':
    case 'PAGE_HEADER':
    case 'LOCATION':
    case 'SELECT':
    case 'COUNTRY':
    case 'RADIO_GROUP':
    case 'PARAGRAPH':
      schema = z.string()
      break
    case 'DATE':
      // YYYY-MM-DD
      schema = z.string().date()
      break
    case 'CHECKBOX':
      schema = z.boolean()
      break
    case 'FILE':
      schema = FileFieldValue
      break
  }

  return required ? schema : schema.optional()
}

type InputField = typeof FileFieldValue | z.ZodString | z.ZodBoolean

type OptionalInputField = z.ZodOptional<InputField>
function createValidationSchema(config: FieldConfig[]) {
  const shape: Record<string, InputField | OptionalInputField> = {}

  for (const field of config) {
    shape[field.id] = mapTypeToZod(field.type, field.required)
  }

  return z.object(shape)
}

export function validateAction(actionType: ActionType) {
  return async (opts: ActionMiddlewareOptions) => {
    const eventType = await getEventTypeId(opts.input.eventId)

    const formFields = await getActionFormFields({
      token: opts.ctx.token,
      action: actionType,
      eventType
    })

    const result = createValidationSchema(formFields).safeParse(opts.input.data)

    if (result.error) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: JSON.stringify(result.error.errors)
      })
    }

    return opts.next()
  }
}
