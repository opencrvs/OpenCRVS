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
import * as Hapi from '@hapi/hapi'
import { logger } from '@search/logger'
import { internal } from '@hapi/boom'
import { removeDuplicate } from '@search/features/registration/deduplicate/service'

export async function deduplicateHandler(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  try {
    await removeDuplicate(request.payload as fhir.Bundle)
  } catch (error) {
    logger.error(`Search/searchDeclarationHandler: error: ${error}`)
    return internal(error)
  }
  return h.response().code(200)
}
