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
  resourceIdentifierToUUID,
  SavedLocation
} from '@opencrvs/commons/types'
import { UUID } from '@opencrvs/commons'
import { fetchFromHearth } from '@config/services/hearth'

/**
 * Creates a new Map<SavedLocation.partOf, SavedLocation[]>
 * It sets the first-level children under their parents
 */
const resolveParentChildrenMap = (locations: SavedLocation[]) => {
  const parentChildrenMap = new Map<UUID, SavedLocation[]>()

  for (const child of locations) {
    if (!child.partOf) continue

    const parentId = resourceIdentifierToUUID(child.partOf.reference)
    const parentChildrenRelationship = parentChildrenMap.get(parentId)

    if (!parentChildrenRelationship) {
      parentChildrenMap.set(parentId, [child])
    } else {
      parentChildrenRelationship.push(child)
    }
  }

  return parentChildrenMap
}
/** Resolves any given location's children multi-level down to the leaf node */
export const resolveLocationChildren = (
  location: SavedLocation,
  locations: SavedLocation[]
) => {
  const parentChildrenMap = resolveParentChildrenMap(locations)
  const children: SavedLocation[] = []
  const stack = parentChildrenMap.get(location.id) ?? []

  while (stack.length) {
    const child = stack.pop()!
    children.push(child)
    if (parentChildrenMap.get(child.id)) {
      stack.push(...(parentChildrenMap.get(child.id) ?? []))
    }
  }

  return children
}

/** Resolves any given location's parents multi-level up to the root node */
export const resolveLocationParents = async (
  locationId: UUID
): Promise<SavedLocation[]> => {
  const current = await fetchFromHearth<SavedLocation>(`Location/${locationId}`)

  if (!current) {
    return []
  }

  const id = current.partOf?.reference
    ? resourceIdentifierToUUID(current.partOf.reference)
    : null

  // Handle case where top level location is Location/0
  if (!id || id === '0') {
    return [current]
  }

  const parents = await resolveLocationParents(id)

  return [...parents, current]
}
