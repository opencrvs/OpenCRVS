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

import { ActionType } from '@opencrvs/commons'
import { createTestClient, setupTestCase } from '@events/tests/utils'

test('actions can be added to created events', async () => {
  const { user, generator } = await setupTestCase()
  const client = createTestClient(user)

  const originalEvent = await client.event.create(generator.event.create())

  const event = await client.event.actions.declare(
    generator.event.actions.declare(originalEvent.id)
  )

  expect(event.actions).toEqual([
    expect.objectContaining({ type: ActionType.CREATE }),
    expect.objectContaining({ type: ActionType.DECLARE })
  ])
})

test('Action data can be retrieved', async () => {
  const { user, generator } = await setupTestCase()
  const client = createTestClient(user)

  const originalEvent = await client.event.create(generator.event.create())

  const generatedDeclaration = generator.event.actions.declare(originalEvent.id)
  await client.event.actions.declare(generatedDeclaration)

  const updatedEvent = await client.event.get(originalEvent.id)

  expect(updatedEvent.actions).toEqual([
    expect.objectContaining({ type: ActionType.CREATE }),
    expect.objectContaining({
      type: ActionType.DECLARE,
      data: generatedDeclaration.data
    })
  ])
})
