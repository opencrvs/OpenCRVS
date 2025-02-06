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
  DeclareActionInput,
  EventInput,
  getUUID,
  ActionType,
  ValidateActionInput,
  RegisterActionInput,
  RequestCorrectionActionInput,
  findActiveActionFields,
  EventConfig,
  FieldConfig
} from '@opencrvs/commons'
import { Location } from '@events/service/locations/locations'
import { Db } from 'mongodb'
import { tennisClubMembershipEvent } from '@opencrvs/commons/fixtures'

/**
 * Quick-and-dirty mock data generator for event actions.
 */
function mapTypeToMockValue(field: FieldConfig, i: number) {
  switch (field.type) {
    case 'DIVIDER':
    case 'TEXT':
    case 'BULLET_LIST':
    case 'PAGE_HEADER':
    case 'LOCATION':
    case 'SELECT':
    case 'COUNTRY':
    case 'RADIO_GROUP':
    case 'PARAGRAPH':
      return `${field.id}-${field.type}-${i}`
    case 'DATE':
      return '2021-01-01'
    case 'CHECKBOX':
      return true
    case 'FILE':
      return null
  }
}

export function generateActionInput(
  configuration: EventConfig,
  action: ActionType
) {
  const fields = findActiveActionFields(configuration, action) ?? []

  return fields.reduce(
    (acc, field, i) => ({
      ...acc,
      [field.id]: mapTypeToMockValue(field, i)
    }),
    {}
  )
}

interface Name {
  use: string
  given: string[]
  family: string
}

export interface CreatedUser {
  id: string
  primaryOfficeId: string
  role: string
  name: Array<Name>
}

interface CreateUser {
  primaryOfficeId: string
  role?: string
  name?: Array<Name>
}

/**
 * @returns a payload generator for creating events and actions with sensible defaults.
 */
export function payloadGenerator() {
  const event = {
    create: (input: Partial<EventInput> = {}) => ({
      transactionId: input.transactionId ?? getUUID(),
      type: input.type ?? 'TENNIS_CLUB_MEMBERSHIP'
    }),
    patch: (id: string, input: Partial<EventInput> = {}) => ({
      transactionId: input.transactionId ?? getUUID(),
      type: input.type ?? 'TENNIS_CLUB_MEMBERSHIP',
      id
    }),
    actions: {
      declare: (
        eventId: string,
        input: Partial<Pick<DeclareActionInput, 'transactionId' | 'data'>> = {}
      ) => ({
        type: ActionType.DECLARE,
        transactionId: input.transactionId ?? getUUID(),
        data:
          input.data ??
          generateActionInput(tennisClubMembershipEvent, ActionType.DECLARE),
        eventId
      }),
      validate: (
        eventId: string,
        input: Partial<Pick<ValidateActionInput, 'transactionId' | 'data'>> = {}
      ) => ({
        type: ActionType.VALIDATE,
        transactionId: input.transactionId ?? getUUID(),
        data:
          input.data ??
          generateActionInput(tennisClubMembershipEvent, ActionType.VALIDATE),
        duplicates: [],
        eventId
      }),
      register: (
        eventId: string,
        input: Partial<Pick<RegisterActionInput, 'transactionId' | 'data'>> = {}
      ) => ({
        type: ActionType.REGISTER,
        transactionId: input.transactionId ?? getUUID(),
        data:
          input.data ??
          generateActionInput(tennisClubMembershipEvent, ActionType.REGISTER),
        eventId
      }),
      printCertificate: (
        eventId: string,
        input: Partial<Pick<RegisterActionInput, 'transactionId' | 'data'>> = {}
      ) => ({
        type: ActionType.PRINT_CERTIFICATE,
        transactionId: input.transactionId ?? getUUID(),
        data:
          input.data ??
          generateActionInput(
            tennisClubMembershipEvent,
            ActionType.PRINT_CERTIFICATE
          ),
        eventId
      }),
      correction: {
        request: (
          eventId: string,
          input: Partial<
            Pick<RequestCorrectionActionInput, 'transactionId' | 'data'>
          > = {}
        ) => ({
          type: ActionType.REQUEST_CORRECTION,
          transactionId: input.transactionId ?? getUUID(),
          data:
            input.data ??
            generateActionInput(
              tennisClubMembershipEvent,
              ActionType.REQUEST_CORRECTION
            ),
          metadata: {},
          eventId
        }),
        approve: (
          eventId: string,
          requestId: string,
          input: Partial<
            Pick<RequestCorrectionActionInput, 'transactionId' | 'data'>
          > = {}
        ) => ({
          type: ActionType.APPROVE_CORRECTION,
          transactionId: input.transactionId ?? getUUID(),
          data:
            input.data ??
            generateActionInput(
              tennisClubMembershipEvent,
              ActionType.APPROVE_CORRECTION
            ),
          eventId,
          requestId
        }),
        reject: (
          eventId: string,
          requestId: string,
          input: Partial<
            Pick<RequestCorrectionActionInput, 'transactionId' | 'data'>
          > = {}
        ) => ({
          type: ActionType.REJECT_CORRECTION,
          transactionId: input.transactionId ?? getUUID(),
          data:
            input.data ??
            generateActionInput(
              tennisClubMembershipEvent,
              ActionType.REJECT_CORRECTION
            ),
          eventId,
          requestId
        })
      }
    }
  }

  const user = {
    create: (input: CreateUser) => ({
      role: input.role ?? 'REGISTRATION_AGENT',
      name: input.name ?? [{ use: 'en', family: 'Doe', given: ['John'] }],
      primaryOfficeId: input.primaryOfficeId
    })
  }

  const locations = {
    /** Create test data by providing count or desired locations */
    set: (input: Array<Partial<Location>> | number) => {
      if (typeof input === 'number') {
        return Array.from({ length: input }).map((_, i) => ({
          id: getUUID(),
          name: `Location name ${i}`,
          externalId: getUUID(),
          partOf: null
        }))
      }

      return input.map((location, i) => ({
        id: location.id ?? getUUID(),
        name: location.name ?? `Location name ${i}`,
        externalId: location.externalId ?? getUUID(),
        partOf: null
      }))
    }
  }

  return { event, locations, user }
}

/**
 * Helper utility to seed data into the database.
 * Use with payloadGenerator for creating test data.
 */
export function seeder() {
  const seedUser = async (db: Db, user: Omit<CreatedUser, 'id'>) => {
    const createdUser = await db.collection('users').insertOne(user)

    return {
      primaryOfficeId: user.primaryOfficeId,
      name: user.name,
      role: user.role,
      id: createdUser.insertedId.toString()
    }
  }
  const seedLocations = async (db: Db, locations: Location[]) =>
    db.collection('locations').insertMany(locations)

  return {
    user: seedUser,
    locations: seedLocations
  }
}
