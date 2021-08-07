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
import fetch from 'node-fetch'
import { METRICS_URL } from '@gateway/constants'
import * as Joi from 'joi'

export default {
  method: 'GET',
  path: '/export/monthlyPerformanceMetrics',
  handler: async (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    const res = await fetch(
      `${METRICS_URL}/monthlyExport?locationId=${request.query['locationId']}` +
        `&timeStart=${request.query['timeStart']}&timeEnd=${request.query['timeEnd']}&event=${request.query['event']}`,
      {
        headers: request.headers
      }
    )
    return res.body
  },
  config: {
    validate: {
      query: Joi.object({
        timeStart: Joi.string().required(),
        timeEnd: Joi.string().required(),
        locationId: Joi.string().required(),
        event: Joi.string().required()
      })
    },
    tags: ['api'],
    description: 'Exports metrics data for each measurement for given filters'
  }
}
