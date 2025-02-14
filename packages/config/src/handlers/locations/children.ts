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
import { ServerRoute } from '@hapi/hapi'
import { resolveLocationChildren } from './locationTreeSolver'
import { fetchFromHearth, fetchLocations } from '@config/services/hearth'
import { SavedLocation } from '@opencrvs/commons/types'

export const resolveChildren: ServerRoute['handler'] = async (req) => {
  const { locationId } = req.params as { locationId: UUID }

  const location = await fetchFromHearth<SavedLocation>(
    `Location/${locationId}`
  )
  if (isTypeOf(location, 'CRVS_OFFICE')) {
    return [location]
  }

  const locations = await fetchLocations()

  return [location, ...resolveLocationChildren(location, locations)]
}

function isTypeOf(location: SavedLocation, type: string) {
  return location.type?.coding?.some((x) => x.code === type)
}
