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

import { z } from 'zod'
import { ActionFormData, EventDocument } from '../events'
import { ITokenPayload } from '../authentication'

/** @knipignore */
export type JSONSchema = {
  readonly __nominal__type: 'JSONSchema'
}

export function defineConditional(schema: any) {
  return schema as JSONSchema
}

export function Conditional() {
  /*
   * Using JSONSchema directly here would cause a
   * "The inferred type of this node exceeds the maximum length the compiler will serialize."
   * error, so I've copied the type here
   */
  return z.custom<JSONSchema>((val) => typeof val === 'object' && val !== null)
}

export const ConditionalTypes = {
  SHOW: 'SHOW',
  HIDE: 'HIDE',
  ENABLE: 'ENABLE'
} as const

export const ShowConditional = z.object({
  type: z.literal(ConditionalTypes.SHOW),
  conditional: Conditional()
})

export const HideConditional = z.object({
  type: z.literal(ConditionalTypes.HIDE),
  conditional: Conditional()
})

export const EnableConditional = z.object({
  type: z.literal(ConditionalTypes.ENABLE),
  conditional: Conditional()
})

export const ConditionalOperation = z.discriminatedUnion('type', [
  ShowConditional,
  HideConditional,
  EnableConditional
])

export type ConditionalTypes =
  (typeof ConditionalTypes)[keyof typeof ConditionalTypes]

export type ConditionalParameters = { $now: string } & (
  | {
      $event: EventDocument
    }
  | {
      $event: EventDocument
      $form: ActionFormData
      $user: ITokenPayload
    }
  | {
      $form: ActionFormData
    }
)
