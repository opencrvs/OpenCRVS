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
import type {
  GQLBirthEventSearchSet,
  GQLDeathEventSearchSet,
  GQLEventSearchSet,
  GQLHumanName,
  GQLMarriageEventSearchSet,
  GQLRegStatus
} from '@client/utils/gateway-deprecated-do-not-use'
import { IntlShape } from 'react-intl'
import { createNamesMap } from '@client/utils/data-formatting'
import { formatLongDate } from '@client/utils/date-formatting'
import { HumanName, SearchEventsQuery } from '@client/utils/gateway'
import { EMPTY_STRING, LANG_EN } from '@client/utils/constants'
import { ITaskHistory } from '@client/declarations'

export const isBirthEvent = (
  req: GQLEventSearchSet
): req is GQLBirthEventSearchSet => {
  return req.type === 'Birth'
}

export const isDeathEvent = (
  req: GQLEventSearchSet
): req is GQLDeathEventSearchSet => {
  return req.type === 'Death'
}

export const isMarriageEvent = (
  reg: GQLEventSearchSet
): reg is GQLMarriageEventSearchSet => {
  return reg.type === 'Marriage'
}

export const transformData = (
  data: SearchEventsQuery['searchEvents'],
  intl: IntlShape
) => {
  const { locale } = intl
  if (!data || !data.results) {
    return []
  }

  return data.results
    .filter((req): req is GQLEventSearchSet => req !== null)
    .map((reg: GQLEventSearchSet) => {
      let birthReg
      let deathReg
      let marriageReg
      let names
      let groomNames
      let brideNames
      let dateOfEvent
      let mergedMarriageName
      const assignedReg = reg

      if (reg.registration) {
        if (isBirthEvent(reg)) {
          birthReg = reg
          names = (birthReg.childName as GQLHumanName[]) || []
          dateOfEvent = birthReg.dateOfBirth
        } else if (isDeathEvent(reg)) {
          deathReg = reg
          names = (deathReg.deceasedName as GQLHumanName[]) || []
          dateOfEvent = deathReg && deathReg.dateOfDeath
        } else if (isMarriageEvent(reg)) {
          marriageReg = reg
          groomNames =
            (marriageReg && (marriageReg.groomName as GQLHumanName[])) || []
          brideNames =
            (marriageReg && (marriageReg.brideName as GQLHumanName[])) || []

          const groomName =
            (createNamesMap(groomNames as HumanName[])[locale] as string) ||
            (createNamesMap(groomNames as HumanName[])[LANG_EN] as string)
          const brideName =
            (createNamesMap(brideNames as HumanName[])[locale] as string) ||
            (createNamesMap(brideNames as HumanName[])[LANG_EN] as string)

          mergedMarriageName =
            brideName && groomName
              ? `${groomName} & ${brideName}`
              : brideName || groomName || EMPTY_STRING

          dateOfEvent = marriageReg && marriageReg.dateOfMarriage
        }
      }
      const status =
        assignedReg.registration &&
        (assignedReg.registration.status as GQLRegStatus)

      return {
        id: assignedReg.id,
        name:
          assignedReg.type === 'Marriage'
            ? mergedMarriageName
            : (createNamesMap(names as HumanName[])[locale] as string) ||
              (createNamesMap(names as HumanName[])[LANG_EN] as string) ||
              '',
        dob:
          (birthReg?.dateOfBirth?.length &&
            formatLongDate(birthReg.dateOfBirth, locale)) ||
          '',
        dod:
          (deathReg?.dateOfDeath?.length &&
            formatLongDate(deathReg.dateOfDeath, locale)) ||
          '',
        dateOfEvent,
        registrationNumber:
          (assignedReg.registration &&
            assignedReg.registration.registrationNumber) ||
          '',
        trackingId:
          (assignedReg.registration && assignedReg.registration.trackingId) ||
          '',
        event: assignedReg.type || '',
        declarationStatus: status || '',
        contactNumber:
          (assignedReg.registration &&
            assignedReg.registration.contactNumber) ||
          '',
        contactEmail:
          (assignedReg.registration && assignedReg.registration.contactEmail) ||
          '',
        duplicates:
          (assignedReg.registration && assignedReg.registration.duplicates) ||
          [],
        rejectionReasons:
          (status === 'REJECTED' &&
            assignedReg.registration &&
            assignedReg.registration.reason) ||
          '',
        rejectionComment:
          (status === 'REJECTED' &&
            assignedReg.registration &&
            assignedReg.registration.comment) ||
          '',
        createdAt: assignedReg?.registration?.createdAt,
        assignment: assignedReg?.registration?.assignment,
        modifiedAt:
          assignedReg.registration &&
          (assignedReg.registration.modifiedAt ||
            assignedReg.registration.createdAt),
        operationHistories: assignedReg.operationHistories as ITaskHistory[],
        registeredLocationId:
          (assignedReg.registration &&
            assignedReg.registration.registeredLocationId) ||
          ''
      }
    })
}
