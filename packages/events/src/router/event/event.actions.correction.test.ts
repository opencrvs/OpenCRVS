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
  ActionDocument,
  ActionType,
  EventDocument,
  getUUID
} from '@opencrvs/commons'
import { createTestClient, setupTestCase } from '@events/tests/utils'
import { generateActionInput } from '@events/tests/generators'
import { tennisClubMembershipEvent } from '@opencrvs/commons/fixtures'

test('a correction request can be added to a created event', async () => {
  const { user, generator } = await setupTestCase()
  const client = createTestClient(user)

  const originalEvent = await client.event.create(generator.event.create())

  const declareInput = generator.event.actions.declare(originalEvent.id)

  await client.event.actions.declare(declareInput)
  const registeredEvent = await client.event.actions.register(
    generator.event.actions.register(originalEvent.id)
  )

  const withCorrectionRequest = await client.event.actions.correction.request(
    generator.event.actions.correction.request(registeredEvent.id)
  )

  expect(
    withCorrectionRequest.actions[withCorrectionRequest.actions.length - 1].type
  ).toBe(ActionType.REQUEST_CORRECTION)
})

test(`${ActionType.REQUEST_CORRECTION} validation error message contains all the offending fields`, async () => {
  const { user, generator } = await setupTestCase()
  const client = createTestClient(user)

  const event = await client.event.create(generator.event.create())
  event.id

  const data = generator.event.actions.correction.request(event.id, {
    data: {
      'applicant.dob': '02-02'
    }
  })

  await expect(
    client.event.actions.correction.request(data)
  ).rejects.matchSnapshot()
})

test(`${ActionType.APPROVE_CORRECTION} validation error message contains all the offending fields`, async () => {
  const { user, generator } = await setupTestCase()
  const client = createTestClient(user)

  const event = await client.event.create(generator.event.create())

  const withCorrectionRequest = await client.event.actions.correction.request(
    generator.event.actions.correction.request(event.id)
  )

  const data = generator.event.actions.correction.approve(
    event.id,
    withCorrectionRequest.id,
    {
      data: {
        'applicant.dob': '02-02'
      }
    }
  )

  await expect(
    client.event.actions.correction.approve(data)
  ).rejects.matchSnapshot()
})

test('a correction request can be added to a created event', async () => {
  const { user, generator } = await setupTestCase()
  const client = createTestClient(user)

  const originalEvent = await client.event.create(generator.event.create())

  await client.event.actions.declare(
    generator.event.actions.declare(originalEvent.id)
  )
  const registeredEvent = await client.event.actions.register(
    generator.event.actions.register(originalEvent.id)
  )

  const withCorrectionRequest = await client.event.actions.correction.request(
    generator.event.actions.correction.request(registeredEvent.id)
  )

  expect(
    withCorrectionRequest.actions[withCorrectionRequest.actions.length - 1].type
  ).toBe(ActionType.REQUEST_CORRECTION)
})

describe('when a correction request exists', () => {
  let withCorrectionRequest: EventDocument
  let client: ReturnType<typeof createTestClient>

  beforeEach(async () => {
    const { user, generator } = await setupTestCase()
    client = createTestClient(user)

    const originalEvent = await client.event.create(generator.event.create())

    const declareInput = generator.event.actions.declare(originalEvent.id)

    await client.event.actions.declare(declareInput)

    const registeredEvent = await client.event.actions.register(
      generator.event.actions.register(originalEvent.id)
    )

    withCorrectionRequest = await client.event.actions.correction.request(
      generator.event.actions.correction.request(registeredEvent.id, {
        data: {
          ...generateActionInput(
            tennisClubMembershipEvent,
            ActionType.REQUEST_CORRECTION
          ),
          'applicant.firstName': 'Johnny'
        }
      })
    )
  })

  test('a correction request can be approved with correct request id', async () => {
    const { generator } = await setupTestCase()

    const requestId =
      withCorrectionRequest.actions[withCorrectionRequest.actions.length - 1].id

    const withApprovedCorrectionRequest =
      await client.event.actions.correction.approve(
        generator.event.actions.correction.approve(
          withCorrectionRequest.id,
          requestId
        )
      )

    const lastAction = withApprovedCorrectionRequest.actions[
      withApprovedCorrectionRequest.actions.length - 1
    ] as Extract<ActionDocument, { type: 'APPROVE_CORRECTION' }>

    expect(lastAction.type).toBe(ActionType.APPROVE_CORRECTION)

    expect(lastAction.requestId).toBe(requestId)
  })

  test('approving a request fails if request id is incorrect', async () => {
    const { generator } = await setupTestCase()

    const incorrectRequestId = getUUID()

    const request = client.event.actions.correction.approve(
      generator.event.actions.correction.approve(
        withCorrectionRequest.id,
        incorrectRequestId
      )
    )
    await expect(request).rejects.toThrow()
  })
})
