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

export const TextValue = z.string()

export const DateValue = z
  .string()
  .date()
  .describe('Date in the format YYYY-MM-DD')

export const EmailValue = z.string().email()

export const FileFieldValue = z.object({
  filename: z.string(),
  originalFilename: z.string(),
  type: z.string()
})

export type FileFieldValue = z.infer<typeof FileFieldValue>

export const AddressFieldValue = z
  .object({
    country: z.string(),
    province: z.string(),
    district: z.string(),
    urbanOrRural: z.string(),
    town: z.string(),
    residentialArea: z.string(),
    street: z.string(),
    number: z.string(),
    zipCode: z.string(),
    village: z.string()
  })
  .partial()

export type AddressFieldValue = z.infer<typeof AddressFieldValue>

export const CheckboxFieldValue = z.boolean()
export type CheckboxFieldValue = z.infer<typeof CheckboxFieldValue>

export const FieldValue = z.union([
  TextValue,
  DateValue,
  FileFieldValue,
  CheckboxFieldValue,
  AddressFieldValue
])

export type FieldValue = z.infer<typeof FieldValue>

/**
 * NOTE: This is an exception. We need schema as a type in order to generate schema dynamically.
 * */
export type FieldValueSchema =
  | typeof FileFieldValue
  | typeof CheckboxFieldValue
  | typeof AddressFieldValue
  | z.ZodString
  | z.ZodBoolean

export type OptionalFieldValueSchema = z.ZodOptional<FieldValueSchema>
