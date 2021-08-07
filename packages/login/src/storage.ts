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
import * as localForage from 'localforage'

function configStorage(dbName: string) {
  localForage.config({
    driver: localForage.INDEXEDDB,
    name: dbName
  })
}

async function getItem(key: string): Promise<string> {
  return (await localForage.getItem<string>(key)) as string
}

async function setItem(key: string, value: string) {
  return await localForage.setItem(key, value)
}

async function removeItem(key: string) {
  return await localForage.removeItem(key)
}

export const storage = {
  configStorage,
  getItem,
  setItem,
  removeItem
}
