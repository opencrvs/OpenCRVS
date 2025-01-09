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

import { Db, MongoClient, ObjectId } from 'mongodb'
import { isEmpty } from 'lodash-es'

function derivePartOfFromAddress(address: fhir.Address) {
  let partOf = address.state

  if (!isEmpty(address.district)) {
    partOf = address.district
  }

  if (!isEmpty(address.line?.[10])) {
    partOf = address.line?.[10]
  }

  if (!isEmpty(address.line?.[11])) {
    partOf = address.line?.[11]
  }

  if (!isEmpty(address.line?.[12])) {
    partOf = address.line?.[12]
  }

  return partOf
}

export const up = async (db: Db, client: MongoClient) => {
  const patients = db.collection('Patient')
  const patientCursor = patients.find<fhir.Patient>({
    address: { $exists: true }
  })
  await patientCursor.forEach((patient) => {
    const updatedAddresses = patient.address!.map((address) => {
      const partOf = derivePartOfFromAddress(address)

      if (partOf) {
        address.extension ??= []
        address.extension.push({
          url: 'http://opencrvs.org/specs/extension/part-of',
          valueReference: {
            reference: `Location/${partOf}`
          }
        })
      }

      return address
    })

    patients.updateOne(
      { _id: new ObjectId(patient._id as string) },
      { $set: { address: updatedAddresses } }
    )
  })

  const locations = db.collection('Location')
  const locationCursor = locations.find<fhir.Location>({
    // Asserts that `partOf` doesn't exist for any fhir.Locations that have an address
    address: { $exists: true },
    partOf: { $exists: false }
  })
  await locationCursor.forEach((location) => {
    const partOf = derivePartOfFromAddress(location.address!)

    if (partOf) {
      locations.updateOne(
        { _id: new ObjectId(location._id as string) },
        { $set: { partOf: { reference: `Location/${partOf}` } } }
      )
    }
  })
}

export const down = async (db: Db, client: MongoClient) => {
  const patients = db.collection('Patient')
  const patientCursor = patients.find<fhir.Patient>({
    address: { $exists: true }
  })
  await patientCursor.forEach((patient) => {
    const updatedAddresses = patient.address?.map((address) => {
      const extensionsWithoutAddressLocation = address.extension?.filter(
        ({ url }) => url !== 'http://opencrvs.org/specs/extension/part-of'
      )

      if ((extensionsWithoutAddressLocation?.length ?? 0) > 0) {
        return {
          ...address,
          extension: extensionsWithoutAddressLocation
        }
      }

      delete address.extension
      return address
    })

    patients.updateOne(
      { _id: new ObjectId(patient._id as string) },
      { $set: { address: updatedAddresses } }
    )
  })

  await db.collection('Location').updateMany(
    {
      address: { $exists: true }
    },
    { $unset: { partOf: '' } }
  )
}
