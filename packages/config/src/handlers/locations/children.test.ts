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
import { UUID } from '@opencrvs/commons'
import { resolveLocationChildren } from './locationTreeSolver'
import * as fixtures from '@opencrvs/commons/fixtures'
import { resolveChildren } from './children'
import { fetchFromHearth, fetchLocations } from '@config/services/hearth'

jest.mock('@config/services/hearth', () => ({
  fetchFromHearth: jest.fn(),
  fetchLocations: jest.fn()
}))

const fetchFromHearthMock = fetchFromHearth as jest.Mock

describe('resolveChildren', () => {
  describe('given a location of type office', () => {
    test('does not fetch location hierarchy', async () => {
      const office = fixtures.savedLocation({
        id: 'uuid1' as UUID,
        type: { coding: [{ code: 'CRVS_OFFICE' }] }
      })

      fetchFromHearthMock.mockResolvedValue(office)

      const req = { params: { locationId: office.id } } as any

      // Cast handler to make it callable
      const handler = resolveChildren as unknown as (
        req: Request
      ) => Promise<any>

      const res = await handler(req)

      expect(fetchLocations).not.toHaveBeenCalled()
      expect(res).toEqual([office])
    })
  })
})

describe('resolveLocationChildren', () => {
  test('empty locations', () => {
    const uuid1 = fixtures.savedLocation({
      id: 'uuid1' as UUID,
      partOf: undefined
    })
    const result = resolveLocationChildren(uuid1, [])
    expect(result).toEqual([])
  })

  test('parent with no children', () => {
    const uuid1 = fixtures.savedLocation({
      id: 'uuid1' as UUID,
      partOf: undefined
    })
    const result = resolveLocationChildren(uuid1, [uuid1])
    expect(result).toEqual([])
  })

  test('single level hierarchy', () => {
    const uuid1 = fixtures.savedLocation({
      id: 'uuid1' as UUID,
      partOf: undefined
    })
    const uuid2 = fixtures.savedLocation({
      id: 'uuid2' as UUID,
      partOf: { reference: `Location/${uuid1.id}` }
    })
    const result = resolveLocationChildren(uuid1, [uuid1, uuid2])

    expect(result).toContainEqual(uuid2)
    expect(result).toHaveLength(1)
  })

  test('multi-level hierarchy', () => {
    const uuid1 = fixtures.savedLocation({
      id: 'uuid1' as UUID,
      partOf: undefined
    })
    const uuid2 = fixtures.savedLocation({
      id: 'uuid2' as UUID,
      partOf: { reference: `Location/${uuid1.id}` }
    })
    const uuid3 = fixtures.savedLocation({
      id: 'uuid3' as UUID,
      partOf: { reference: `Location/${uuid2.id}` }
    })

    const result = resolveLocationChildren(uuid1, [uuid1, uuid2, uuid3])
    expect(result).toEqual([uuid2, uuid3])
  })
})
