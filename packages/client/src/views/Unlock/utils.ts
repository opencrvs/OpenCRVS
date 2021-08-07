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
import { getCurrentUserID, IUserData } from '@client/applications'
import { storage } from '@client/storage'

async function loadUserPin() {
  const currentUserID = await getCurrentUserID()
  const allUserData = JSON.parse(
    (await storage.getItem('USER_DATA')) as string
  ) as IUserData[]
  const currentUserData = allUserData.find(
    user => user.userID === currentUserID
  ) as IUserData
  return currentUserData.userPIN as string
}

export const pinLoader = {
  loadUserPin
}
