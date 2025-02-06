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
import React from 'react'
import { useSelector } from 'react-redux'
import { LocationSearch as LocationSearchComponent } from '@opencrvs/components'
import { LocationFieldValue, FieldProps } from '@opencrvs/commons/client'
// eslint-disable-next-line no-restricted-imports
import { getFacilityLocations } from '@client/offline/selectors'
import { ILocation } from './Location'

interface SearchLocation {
  id: string
  searchableText: string
  displayLabel: string
}

interface Facility extends ILocation {
  type: 'HEALTH_FACILITY'
  physicalType: 'Building'
}

function toSearchOption(facility: Facility) {
  return {
    id: facility.id,
    searchableText: facility.name,
    displayLabel: facility.alias
  }
}

function useAdminLocations(value?: LocationFieldValue) {
  const locationMap = useSelector(getFacilityLocations)

  const locations = Object.values(locationMap)
  const initialLocation =
    // @TODO: Should disappear when restarting. Otherwise ignore and let markus fix the thing
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    value && locationMap[value] ? toSearchOption(locationMap[value]) : undefined
  const options = locations.map(toSearchOption)
  return { options, initialLocation }
}

export function LocationSearch({
  setFieldValue,
  value,
  ...props
}: FieldProps<'LOCATION'> & {
  setFieldValue: (name: string, val: LocationFieldValue | undefined) => void
  value?: LocationFieldValue
}) {
  const { options, initialLocation } = useAdminLocations()

  return (
    <LocationSearchComponent
      buttonLabel="Health facility"
      locationList={options}
      searchHandler={(location: SearchLocation) =>
        setFieldValue(props.id, location.id)
      }
      selectedLocation={initialLocation}
      {...props}
    />
  )
}
