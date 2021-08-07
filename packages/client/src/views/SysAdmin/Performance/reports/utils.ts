import { IOfflineData } from '@client/offline/reducer'

/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * OpenCRVS is also distributed under the terms of the Civil Registration
 * & Healthcare Disclaimer located at http://opencrvs.org/license.
 *
 * Copyright (C) The OpenCRVS Authors. OpenCRVS and the OpenCRVS
 * graphic logo are (registered/a) trademark(s) of Plan International.
 */
export function getValueWithPercentageString(value: number, total: number) {
  return `${value} (${total ? Math.floor((value / total) * 100) : 0}%)`
}

export function getLocationFromPartOfLocationId(
  locationId: string,
  offlineResources: IOfflineData
) {
  const id = (locationId && locationId.split('/')[1]) || ''
  return (
    Object.values(offlineResources.locations).find(
      location => location.id === id
    ) || {
      name: ''
    }
  )
}
