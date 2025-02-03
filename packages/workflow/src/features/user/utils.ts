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
import { USER_MANAGEMENT_URL } from '@workflow/constants'
import fetch from 'node-fetch'
import { getTokenPayload } from '@workflow/utils/auth-utils'
import { getFromFhir } from '@workflow/features/registration/fhir/fhir-utils'
import {
  Practitioner,
  PractitionerRole,
  resourceIdentifierToUUID,
  SavedPractitioner
} from '@opencrvs/commons/types'
import { UUID } from '@opencrvs/commons'

type UserSearchCriteria = 'userId' | 'practitionerId' | 'mobile' | 'email'
export type SearchCriteria = {
  [K in UserSearchCriteria]?: string
}

export async function getUser(
  userId: string,
  authHeader: { Authorization: string }
) {
  const res = await fetch(`${USER_MANAGEMENT_URL}getUser`, {
    method: 'POST',
    body: JSON.stringify({ userId }),
    headers: {
      'Content-Type': 'application/json',
      ...authHeader
    }
  })

  if (!res.ok) {
    throw new Error(
      `Unable to retrieve user in workflow. Error: ${res.status} status received`
    )
  }

  const body = await res.json()

  return body
}

export async function getSystem(
  systemId: string,
  authHeader: { Authorization: string }
) {
  const res = await fetch(`${USER_MANAGEMENT_URL}getSystem`, {
    method: 'POST',
    body: JSON.stringify({ systemId }),
    headers: {
      'Content-Type': 'application/json',
      ...authHeader
    }
  })

  if (!res.ok) {
    throw new Error(
      `Unable to retrieve system in workflow. Error: ${res.status} status received`
    )
  }

  const body = await res.json()

  return body
}

export async function getUserByCriteria(
  authHeader: { Authorization: string },
  criteria: SearchCriteria
) {
  const res = await fetch(`${USER_MANAGEMENT_URL}getUser`, {
    method: 'POST',
    body: JSON.stringify(criteria),
    headers: {
      'Content-Type': 'application/json',
      ...authHeader
    }
  })

  if (!res.ok) {
    throw new Error(
      `Unable to retrieve user in workflow. Error: ${res.status} status received`
    )
  }

  const body = await res.json()

  return body
}

export async function getSystemByCriteria(
  authHeader: { Authorization: string },
  criteria: SearchCriteria
) {
  const res = await fetch(`${USER_MANAGEMENT_URL}getSystem`, {
    method: 'POST',
    body: JSON.stringify(criteria),
    headers: {
      'Content-Type': 'application/json',
      ...authHeader
    }
  })

  if (!res.ok) {
    throw new Error(
      `Unable to retrieve system in workflow. Error: ${res.status} status received`
    )
  }

  const body = await res.json()

  return body
}

/** Find the office location of a given practitioner */
export const getPractitionerOfficeId = async (practitionerId: string) => {
  const roleResponse = await getFromFhir(
    `/PractitionerRole?practitioner=${practitionerId}`
  )
  const roleEntry = roleResponse.entry[0].resource as PractitionerRole
  return resourceIdentifierToUUID(roleEntry.location[0].reference)
}

export async function getLoggedInPractitionerResource(
  token: string
): Promise<SavedPractitioner> {
  const tokenPayload = getTokenPayload(token)
  const isNotificationAPIUser =
    tokenPayload.scope.indexOf('notification-api') > -1
  const isRecordSearchAPIUser = tokenPayload.scope.indexOf('recordsearch') > -1
  const isSelfServicePortalAPIUser =
    tokenPayload.scope.indexOf('self-service-portal') > -1
  let userResponse
  if (
    isNotificationAPIUser ||
    isRecordSearchAPIUser ||
    isSelfServicePortalAPIUser
  ) {
    userResponse = await getSystem(tokenPayload.sub, {
      Authorization: `Bearer ${token}`
    })
  } else {
    userResponse = await getUser(tokenPayload.sub, {
      Authorization: `Bearer ${token}`
    })
  }

  return await getFromFhir(`/Practitioner/${userResponse.practitionerId}`)
}

export function getPractitionerRef(practitioner: Practitioner) {
  if (!practitioner || !practitioner.id) {
    throw new Error('Invalid practitioner data found')
  }
  return `Practitioner/${
    practitioner.id as UUID /* @todo move to practitioner */
  }` as const
}

export function getPractitionerRoleByPractitionerId(practitionerId: UUID) {
  return getFromFhir(`/PractitionerRole?practitioner=${practitionerId}`)
}
