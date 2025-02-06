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

import { EventStatus } from '@opencrvs/commons'
import { createTestClient, setupTestCase } from '@events/tests/utils'

test('Returns empty list when no events', async () => {
  const { user } = await setupTestCase()
  const client = createTestClient(user)

  const fetchedEvents = await client.event.list()

  expect(fetchedEvents).toEqual([])
})

test('Returns multiple events', async () => {
  const { user, generator } = await setupTestCase()
  const client = createTestClient(user)

  for (let i = 0; i < 10; i++) {
    await client.event.create(generator.event.create())
  }

  const events = await client.event.list()

  expect(events).toHaveLength(10)
})

test('Returns aggregated event with updated status and values', async () => {
  const { user, generator } = await setupTestCase()
  const client = createTestClient(user)

  const initialData = {
    'applicant.firstname': 'John',
    'applicant.surname': 'Doe',
    'applicant.dob': '2000-01-01',
    'recommender.firstname': 'Jane',
    'recommender.surname': 'Doer',
    'recommender.id': '123-124'
  }

  const event = await client.event.create(generator.event.create())
  await client.event.actions.declare(
    generator.event.actions.declare(event.id, {
      data: initialData
    })
  )

  const initialEvents = await client.event.list()

  expect(initialEvents).toHaveLength(1)
  expect(initialEvents[0].status).toBe(EventStatus.DECLARED)
  expect(initialEvents[0].data).toEqual(initialData)

  const updatedData = { ...initialData, 'recommender.firstname': 'Yane' }
  await client.event.actions.declare(
    generator.event.actions.declare(event.id, {
      data: updatedData
    })
  )

  const updatedEvents = await client.event.list()

  expect(updatedEvents).toHaveLength(1)

  expect(updatedEvents[0].status).toBe(EventStatus.DECLARED)
  expect(updatedEvents[0].data).toEqual(updatedData)
})
