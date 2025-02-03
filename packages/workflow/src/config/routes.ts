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
import { markEventAsRegisteredCallbackHandler } from '@workflow/features/registration/handler'
import { certifyRoute } from '@workflow/records/handler/certify'
import { archiveRoute } from '@workflow/records/handler/archive'
import createRecordHandler from '@workflow/records/handler/create'
import { unassignRecordHandler } from '@workflow/records/handler/unassign'
import { downloadRecordHandler } from '@workflow/records/handler/download'
import { issueRoute } from '@workflow/records/handler/issue'
import { duplicateRecordHandler } from '@workflow/records/handler/duplicate'
import { registerRoute } from '@workflow/records/handler/register'
import { rejectRoute } from '@workflow/records/handler/reject'
import { reinstateRoute } from '@workflow/records/handler/reinstate'
import { updateRoute } from '@workflow/records/handler/update'
import { validateRoute } from '@workflow/records/handler/validate'
import { viewRecordHandler } from '@workflow/records/handler/view'
import { verifyRecordHandler } from '@workflow/records/handler/verify'
import { markAsNotDuplicateHandler } from '@workflow/records/handler/not-duplicate'
import { rejectCorrectionRoute } from '@workflow/records/handler/correction/reject'
import { approveCorrectionRoute } from '@workflow/records/handler/correction/approve'
import { requestCorrectionRoute } from '@workflow/records/handler/correction/request'
import { makeCorrectionRoute } from '@workflow/records/handler/correction/make-correction'
import { eventNotificationHandler } from '@workflow/records/handler/eventNotificationHandler'
import * as Hapi from '@hapi/hapi'
import { SCOPES } from '@opencrvs/commons/authentication'
import { upsertRegistrationHandler } from '@workflow/records/handler/upsert-identifiers'
import { updateField } from '@workflow/records/handler/update-field'

export const getRoutes = () => {
  const routes: Hapi.ServerRoute[] = [
    // used for tests to check JWT auth
    {
      method: 'GET',
      path: '/tokenTest',
      handler: (request: any, h: any) => {
        return 'success'
      },
      options: {
        tags: ['api']
      }
    },
    // add ping route by default for health check
    {
      method: 'GET',
      path: '/ping',
      handler: (request: any, h: any) => {
        // Perform any health checks and return true or false for success prop
        return {
          success: true
        }
      },
      options: {
        auth: false,
        tags: ['api'],
        description: 'Health check endpoint'
      }
    },
    {
      method: 'POST',
      path: '/records/{id}/confirm',
      handler: markEventAsRegisteredCallbackHandler,
      options: {
        auth: {
          scope: [SCOPES.RECORD_CONFIRM_REGISTRATION]
        },
        tags: ['api'],
        description:
          'Register event based on tracking id and registration number.'
      }
    },
    {
      method: 'POST',
      path: '/records/{id}/upsert-identifiers',
      handler: upsertRegistrationHandler,
      options: {
        tags: ['api'],
        description:
          'Upsert Register event based on tracking id and registration number.'
      }
    },
    {
      method: 'POST',
      path: '/create-record',
      handler: createRecordHandler,
      options: {
        auth: {
          scope: [
            SCOPES.RECORD_DECLARE_BIRTH,
            SCOPES.RECORD_DECLARE_DEATH,
            SCOPES.RECORD_DECLARE_MARRIAGE,
            SCOPES.SELF_SERVICE_PORTAL
          ]
        },
        tags: ['api'],
        description: 'Create record endpoint'
      }
    },
    {
      method: 'POST',
      path: '/download-record',
      handler: downloadRecordHandler,
      options: {
        tags: ['api'],
        description: 'Download record endpoint'
      }
    },
    {
      method: 'POST',
      path: '/unassign-record',
      handler: unassignRecordHandler,
      options: {
        tags: ['api'],
        description: 'Unassign record endpoint'
      }
    },
    {
      method: 'POST',
      path: '/records/{id}/view',
      handler: viewRecordHandler,
      options: {
        tags: ['api'],
        description: 'View record endpoint'
      }
    },
    {
      method: 'POST',
      path: '/records/{id}/duplicate',
      handler: duplicateRecordHandler,
      options: {
        tags: ['api'],
        description: 'Unassign record endpoint'
      }
    },
    {
      method: 'POST',
      path: '/records/{id}/verify',
      handler: verifyRecordHandler,
      options: {
        tags: ['api'],
        description: 'Verify record endpoint'
      }
    },
    {
      method: 'POST',
      path: '/records/{id}/not-duplicate',
      handler: markAsNotDuplicateHandler,
      options: {
        tags: ['api'],
        description: 'Mark as not-duplicate record endpoint'
      }
    },
    {
      method: 'POST',
      path: '/records/event-notification',
      handler: eventNotificationHandler,
      options: {
        tags: ['api'],
        description: 'Saves full fhir bundle to search and hearth'
      }
    },
    validateRoute,
    updateRoute,
    registerRoute,
    certifyRoute,
    issueRoute,
    archiveRoute,
    rejectRoute,
    reinstateRoute,
    approveCorrectionRoute,
    rejectCorrectionRoute,
    requestCorrectionRoute,
    makeCorrectionRoute,
    {
      method: 'POST',
      path: '/records/{id}/update-field',
      handler: updateField,
      options: {
        tags: ['api'],
        description: 'Update a single field in a registration'
      }
    }
  ]

  return routes
}
