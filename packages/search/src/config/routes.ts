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
import * as Joi from 'joi'
import {
  getAllDocumentsHandler,
  getStatusWiseRegistrationCountHandler,
  advancedRecordSearch,
  searchAssignment,
  searchForBirthDeDuplication,
  searchForDeathDeDuplication
} from '@search/features/search/handler'
import { deduplicateHandler } from '@search/features/registration/deduplicate/handler'
import {
  assignEventHandler,
  unassignEventHandler
} from '@search/features/registration/assignment/handler'
import { getOrCreateClient } from '@search/elasticsearch/client'
import { logger } from '@opencrvs/commons'
import { recordHandler } from '@search/features/registration/record/handler'
import { getRecordByIdHandler } from '@search/features/records/handler'
import {
  reindexHandler,
  reindexStatusHandler
} from '@search/features/reindex/handler'
import { SCOPES } from '@opencrvs/commons/authentication'

export const getRoutes = () => {
  const client = getOrCreateClient()
  const routes = [
    // used for tests to check JWT auth
    {
      method: 'GET',
      path: '/tokenTest',
      handler: (request: any, h: any) => {
        return 'success'
      },
      config: {
        tags: ['api']
      }
    },
    // add ping route by default for health check
    {
      method: 'GET',
      path: '/ping',
      handler: async (request: any, h: any) => {
        try {
          const res = await client.ping(undefined, { meta: true })

          logger.info(res)
          return {
            success: res?.meta?.connection?.status === 'alive'
          }
        } catch (error) {
          logger.error(error)
          if (error?.meta?.connection?.status === 'alive') {
            return {
              success: true
            }
          }
          return {
            success: false
          }
        }
      },
      config: {
        auth: false,
        tags: ['api'],
        description: 'Health check endpoint'
      }
    },
    {
      method: 'POST',
      path: '/search/assignment',
      handler: searchAssignment,
      config: {
        tags: ['api'],
        auth: {
          scope: [
            SCOPES.SEARCH_BIRTH,
            SCOPES.SEARCH_DEATH,
            SCOPES.SEARCH_MARRIAGE,
            SCOPES.SEARCH_BIRTH_MY_JURISDICTION,
            SCOPES.SEARCH_DEATH_MY_JURISDICTION,
            SCOPES.SEARCH_MARRIAGE_MY_JURISDICTION
          ]
        },
        description: 'Handles searching declaration assignment'
      }
    },
    {
      method: 'GET',
      path: '/records/{recordId}',
      handler: getRecordByIdHandler,
      config: {
        tags: ['api'],
        auth: false,
        description: 'Fetch all FHIR entities concerning a record'
      }
    },
    {
      method: 'POST',
      path: '/record',
      handler: recordHandler,
      config: {
        tags: ['api'],
        description: 'Handles indexing a new or existing record'
      }
    },
    {
      method: 'POST',
      path: '/events/birth/{eventType}',
      handler: recordHandler,
      config: {
        tags: ['api'],
        description:
          'Handles indexing a new declaration and searching for duplicates or updating an existing declaration'
      }
    },
    {
      method: 'POST',
      path: '/events/death/{eventType}',
      handler: recordHandler,
      config: {
        tags: ['api'],
        description:
          'Handles indexing a new declaration or updating an existing declaration'
      }
    },
    {
      method: 'POST',
      path: '/events/marriage/{eventType}',
      handler: recordHandler,
      config: {
        tags: ['api'],
        description:
          'Handles indexing a new declaration or updating an existing declaration'
      }
    },
    {
      method: 'POST',
      path: '/events/not-duplicate',
      handler: deduplicateHandler,
      config: {
        tags: ['api'],
        description: 'Marks the declaration as not a duplicate'
      }
    },
    {
      method: 'POST',
      path: '/events/assigned',
      handler: assignEventHandler,
      config: {
        tags: ['api'],
        description:
          'Handles indexing a new declaration or updating an existing declaration'
      }
    },
    {
      method: 'POST',
      path: '/events/unassigned',
      handler: unassignEventHandler,
      config: {
        tags: ['api'],
        description:
          'Handles indexing a new declaration or updating an existing declaration'
      }
    },
    {
      method: 'POST',
      path: '/search/all',
      handler: getAllDocumentsHandler,
      config: {
        tags: ['api'],
        auth: {
          scope: [
            SCOPES.SEARCH_BIRTH,
            SCOPES.SEARCH_DEATH,
            SCOPES.SEARCH_MARRIAGE,
            SCOPES.SEARCH_BIRTH_MY_JURISDICTION,
            SCOPES.SEARCH_DEATH_MY_JURISDICTION,
            SCOPES.SEARCH_MARRIAGE_MY_JURISDICTION
          ]
        },
        description: 'Returns all the documents in the index'
      }
    },
    {
      method: 'POST',
      path: '/statusWiseRegistrationCount',
      handler: getStatusWiseRegistrationCountHandler,
      config: {
        tags: ['api'],
        auth: {
          scope: [
            SCOPES.RECORD_REGISTER,
            SCOPES.RECORD_SUBMIT_FOR_APPROVAL,
            SCOPES.RECORD_DECLARE_BIRTH,
            SCOPES.RECORD_DECLARE_DEATH,
            SCOPES.RECORD_DECLARE_MARRIAGE,
            SCOPES.PERFORMANCE_READ
          ]
        },
        validate: {
          payload: Joi.object({
            declarationJurisdictionId: Joi.string(),
            status: Joi.array().required(),
            event: Joi.string()
          })
        },
        description: 'Returns all the documents in the index'
      }
    },
    {
      method: 'POST',
      path: '/advancedRecordSearch',
      handler: advancedRecordSearch,
      config: {
        tags: ['api'],
        auth: {
          scope: [
            SCOPES.SEARCH_BIRTH,
            SCOPES.SEARCH_DEATH,
            SCOPES.SEARCH_MARRIAGE,
            SCOPES.SEARCH_BIRTH_MY_JURISDICTION,
            SCOPES.SEARCH_DEATH_MY_JURISDICTION,
            SCOPES.SEARCH_MARRIAGE_MY_JURISDICTION
          ]
        },
        description:
          'Populates hierarchical location ids for the legacy indexes'
      }
    },
    {
      method: 'POST',
      path: '/search/duplicates/birth',
      handler: searchForBirthDeDuplication,
      config: {
        tags: ['api'],
        auth: {
          scope: [
            SCOPES.SEARCH_BIRTH,
            SCOPES.SEARCH_DEATH,
            SCOPES.SEARCH_MARRIAGE,
            SCOPES.SEARCH_BIRTH_MY_JURISDICTION,
            SCOPES.SEARCH_DEATH_MY_JURISDICTION,
            SCOPES.SEARCH_MARRIAGE_MY_JURISDICTION,
            SCOPES.SELF_SERVICE_PORTAL
          ]
        },
        description: 'Handles searching from declarations'
      }
    },
    {
      method: 'POST',
      path: '/search/duplicates/death',
      handler: searchForDeathDeDuplication,
      config: {
        tags: ['api'],
        auth: {
          scope: [
            SCOPES.SEARCH_BIRTH,
            SCOPES.SEARCH_DEATH,
            SCOPES.SEARCH_MARRIAGE,
            SCOPES.SEARCH_BIRTH_MY_JURISDICTION,
            SCOPES.SEARCH_DEATH_MY_JURISDICTION,
            SCOPES.SEARCH_MARRIAGE_MY_JURISDICTION,
            SCOPES.SELF_SERVICE_PORTAL
          ]
        },
        description: 'Handle searching from death declarations'
      }
    },
    {
      method: 'POST',
      path: '/reindex',
      handler: reindexHandler,
      config: {
        tags: ['api'],
        auth: false
      }
    },
    {
      method: 'GET',
      path: '/reindex/status/{jobId}',
      handler: reindexStatusHandler,
      config: {
        tags: ['api'],
        auth: false,
        validate: {
          params: Joi.object({
            jobId: Joi.string().uuid()
          })
        }
      }
    }
  ]
  return routes
}
