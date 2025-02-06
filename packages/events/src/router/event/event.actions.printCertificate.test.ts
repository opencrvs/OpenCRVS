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

test('Validation error message contains all the offending fields', async () => {
  const { user, generator } = await setupTestCase()
  const client = createTestClient(user)

  const event = await client.event.create(generator.event.create())

  await expect(
    client.event.actions.printCertificate(
      generator.event.actions.printCertificate(event.id, {
        data: {
          'applicant.dob': '02-02'
        }
      })
    )
  ).rejects.matchSnapshot()
})

test('print certificate action can be added to a created event', async () => {
  const { user, generator } = await setupTestCase()
  const client = createTestClient(user)

  const originalEvent = await client.event.create(generator.event.create())

  await client.event.actions.declare(
    generator.event.actions.declare(originalEvent.id)
  )
  const registeredEvent = await client.event.actions.register(
    generator.event.actions.register(originalEvent.id)
  )

  const printCertificate = await client.event.actions.printCertificate(
    generator.event.actions.printCertificate(
      registeredEvent.id,
      generator.event.actions.printCertificate(registeredEvent.id)
    )
  )

  expect(
    printCertificate.actions[printCertificate.actions.length - 1].type
  ).toBe(ActionType.PRINT_CERTIFICATE)
})
