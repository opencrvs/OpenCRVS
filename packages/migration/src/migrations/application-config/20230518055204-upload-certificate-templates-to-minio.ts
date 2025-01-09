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
import isSvg from 'is-svg'
import { uploadSvgToMinio } from '../../utils/minio-helper.js'
import { ICertificateTemplateData } from '../../utils/migration-interfaces.js'
import { Db, MongoClient, ObjectId } from 'mongodb'

export const up = async (db: Db, client: MongoClient) => {
  const session = client.startSession()
  try {
    await session.withTransaction(async () => {
      const certificates = (await db.collection('certificates').find().project({
        svgCode: 1,
        event: 1
      })) as unknown as ICertificateTemplateData[]

      for await (const { _id, svgCode, event } of certificates) {
        if (!isSvg(svgCode)) {
          console.log(`Invalid certificate svg found for ${event}`)
          continue
        }

        try {
          const uri = await uploadSvgToMinio(svgCode)
          await db
            .collection('certificates')
            .updateOne({ _id: new ObjectId(_id) }, { $set: { svgCode: uri } })
        } catch (err) {
          console.log(`Saving certificate template failed with error: ${err}`)
        }
      }
    })
  } finally {
    await session.endSession()
  }
}

export const down = async (db: Db, client: MongoClient) => {}
