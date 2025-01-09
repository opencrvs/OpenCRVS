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

const USER_MGNT_MONGO_URL =
  process.env.USER_MGNT_MONGO_URL || 'mongodb://localhost/user-mgnt'

export const up = async (db: Db, client: MongoClient) => {
  const session = client.startSession()
  const userManagementClient = new MongoClient(USER_MGNT_MONGO_URL)
  const connectedUserManagementClient = await userManagementClient.connect()
  const systemsCollection = connectedUserManagementClient
    .db()
    .collection('systems')
  const systemIdentifier = 'http://opencrvs.org/specs/id/system_identifier'
  let processTask = 0
  let processTaskHistory = 0

  try {
    await session.withTransaction(async () => {
      const tasksWithSystem = await db.collection('Task').find({
        'identifier.system': systemIdentifier
      })

      const tasksHistoryWithSystem = await db.collection('Task_history').find({
        'identifier.system': systemIdentifier
      })

      const tasksWithSystemCount = await getTotalTaskCountByCollectionName(
        db,
        'Task'
      )

      const tasksHistoryWithSystemCount =
        await getTotalTaskCountByCollectionName(db, 'Task_history')

      // eslint-disable-next-line no-console
      console.log(
        `Migration - Task integration update with system object, total ${tasksWithSystemCount} tasks need to be processed`
      )

      for await (const task of tasksWithSystem) {
        // eslint-disable-next-line no-console
        console.log(
          `Processed ${
            processTask + 1
          }/${tasksWithSystemCount} tasks, progress ${(
            ((processTask + 1) / tasksWithSystemCount) *
            100
          ).toFixed(2)}% ...`
        )
        for (const identifier of task.identifier) {
          if (identifier.system === systemIdentifier) {
            const system = await systemsCollection.findOne({
              _id: new ObjectId(identifier.value)
            })
            if (system) {
              await db.collection('Task').updateOne(
                { _id: task._id, 'identifier.value': identifier.value },
                {
                  $set: {
                    'identifier.$.value': JSON.stringify({
                      name: system.name,
                      username: system.username,
                      type: system.type
                    })
                  }
                }
              )
              processTask++
            }
          }
        }
      }

      // eslint-disable-next-line no-console
      console.log(
        `Migration - Task history integration update with system object, total ${tasksHistoryWithSystemCount} task history need to be processed`
      )
      for await (const task of tasksHistoryWithSystem) {
        // eslint-disable-next-line no-console
        console.log(
          `Processed ${
            processTaskHistory + 1
          }/${tasksHistoryWithSystemCount} tasks history, progress ${(
            ((processTaskHistory + 1) / tasksHistoryWithSystemCount) *
            100
          ).toFixed(2)}% ...`
        )
        for (const identifier of task.identifier) {
          if (identifier.system === systemIdentifier) {
            const system = await systemsCollection.findOne({
              _id: new ObjectId(identifier.value)
            })
            if (system) {
              await db.collection('Task_history').updateOne(
                { _id: task._id, 'identifier.value': identifier.value },
                {
                  $set: {
                    'identifier.$.value': JSON.stringify({
                      name: system.name,
                      username: system.username,
                      type: system.type
                    })
                  }
                }
              )
              processTaskHistory++
            }
          }
        }
      }
    })
  } finally {
    await session.endSession()
  }
}

export const down = async (db: Db, client: MongoClient) => {}

async function getTotalTaskCountByCollectionName(
  db: Db,
  collectionName: string
) {
  return await db.collection(collectionName).count()
}
