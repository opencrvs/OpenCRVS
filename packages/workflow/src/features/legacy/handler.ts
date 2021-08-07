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
import {
  REG_STATUS_REGISTERED,
  CHILD_SECTION_CODE,
  DECEASED_SECTION_CODE,
  EVENT_TYPE,
  BIRTH_REG_NUMBER_SYSTEM,
  DEATH_REG_NUMBER_SYSTEM
} from '@workflow/features/registration/fhir/constants'
import { getTaskEventType } from '@workflow/features/registration/utils'
import { updatePatientIdentifierWithRN } from '@workflow/features/registration/fhir/fhir-bundle-modifier'
import {
  getFromFhir,
  updateResourceInHearth,
  getBirthRegistrationNumber,
  getDeathRegistrationNumber
} from '@workflow/features/registration/fhir/fhir-utils'
import { logger } from '@workflow/logger'
import { unauthorized } from '@hapi/boom'

/**
 *  This handler is responsible for updating
 *  child's or deceased's identifer with registration number from task identifier
 */
export async function updatePatientRegistrationNumberHandler(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  if (!request.auth.credentials.scope?.includes('sysadmin')) {
    throw unauthorized()
  }
  const taskBundle: fhir.Bundle = await getFromFhir(
    `/Task?business-status=${REG_STATUS_REGISTERED}&_count=0`
  )
  if (!taskBundle || !taskBundle.entry) {
    throw new Error('No task found on search')
  }

  for (const bundleEntry of taskBundle.entry) {
    const task = bundleEntry.resource as fhir.Task
    try {
      const composition: fhir.Composition = await getFromFhir(
        `/${task.focus?.reference}`
      )
      if (!composition) {
        throw new Error(
          `No composition found with ref: ${task.focus?.reference}`
        )
      }

      let sectionCode
      let identifierType
      let registrationNumber
      if (getTaskEventType(task) === EVENT_TYPE.BIRTH) {
        sectionCode = CHILD_SECTION_CODE
        identifierType = BIRTH_REG_NUMBER_SYSTEM
        registrationNumber = getBirthRegistrationNumber(task)
      } else {
        sectionCode = DECEASED_SECTION_CODE
        identifierType = DEATH_REG_NUMBER_SYSTEM
        registrationNumber = getDeathRegistrationNumber(task)
      }
      const patient = await updatePatientIdentifierWithRN(
        composition,
        sectionCode,
        identifierType,
        registrationNumber
      )
      await updateResourceInHearth(patient)
    } catch (error) {
      logger.error(`Error for processing ${task.focus?.reference}`)
      logger.error(error)
    }
  }

  return h.response('Migration successful').code(200)
}
