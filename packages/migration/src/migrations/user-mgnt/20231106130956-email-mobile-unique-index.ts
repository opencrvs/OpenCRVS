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

import { Db, MongoClient } from 'mongodb'

export const up = async (db: Db, client: MongoClient) => {
  const session = client.startSession()
  try {
    await session.withTransaction(async () => {
      console.log('Checking if mobile field already have indices')
      const indexes = Object.keys(
        (await db.command({ collStats: 'users' })).indexSizes
      )
      const mobileHasIndex = indexes.some(
        (index) => index.split('_')[0] === ('mobile' as const)
      )

      if (mobileHasIndex) {
        console.log('Removing index of mobile')
        await db.collection('users').dropIndex({ mobile: 1 } as any)
      }

      // Ensure that the "mobile" field in the "users" collection does not contain null or duplicate values
      // Before making the field sparse, which allows it to have null values but ensures uniqueness
      const updateResult = await db.collection('users').updateMany(
        { mobile: { $in: [null, ''] } },
        {
          $unset: {
            mobile: ''
          }
        }
      )
      console.log('Number of documents updated:', updateResult.modifiedCount)

      // eslint-disable-next-line no-console
      console.log('Updating indices for collection: users')
      await db
        .collection('users')
        .createIndex(
          { emailForNotification: 1 },
          { unique: true, sparse: true }
        )
      await db
        .collection('users')
        .createIndex({ mobile: 1 }, { unique: true, sparse: true })
    })
  } finally {
    await session.endSession()
  }
}

export const down = async (db: Db, client: MongoClient) => {
  const session = client.startSession()
  try {
    await session.withTransaction(async () => {
      await db.collection('users').dropIndex({ emailForNotification: 1 } as any)
      await db.collection('users').dropIndex({ mobile: 1 } as any)
    })
  } catch (error) {
    console.error('Error occurred while dropping the index:', error)
  } finally {
    await session.endSession()
  }
}
