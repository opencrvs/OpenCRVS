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
import {
  ExecutorKey,
  IEventWiseKey,
  Condition,
  ConditionOperation
} from '@client/pdfRenderer/transformer/types'
import {
  Event,
  IFormData,
  IFormSectionData,
  IFormFieldValue
} from '@opencrvs/client/src/forms'
import { IApplication } from '@client/applications'
import { MessageDescriptor } from 'react-intl'

const eventMessageDescriptor = {
  [Event.BIRTH]: {
    defaultMessage: 'Birth',
    description: 'A label from the birth event',
    id: 'constants.birth'
  },
  [Event.DEATH]: {
    defaultMessage: 'Death',
    description: 'A label from the death event',
    id: 'constants.death'
  }
}
export function getValueFromApplicationDataByKey(
  data: IFormData,
  valueKey: string
) {
  const keyTree: string[] = valueKey.split('.')

  let valueObject: IFormSectionData | IFormFieldValue | null = null

  keyTree.forEach(keyNode => {
    valueObject =
      valueObject === null
        ? data[keyNode] || null
        : (valueObject as IFormSectionData)[keyNode]
  })
  if (valueObject === null) {
    // eslint-disable-next-line no-console
    console.error(`Given value key structure is not valid: ${valueKey}`)
  }
  return valueObject
}

export function getEventMessageDescription(event: Event): MessageDescriptor {
  return eventMessageDescriptor[event]
}

export function getExecutorKeyValue(key: ExecutorKey) {
  if (key === 'CURRENT_DATE') {
    return Date.now()
  }
  throw new Error('Invalid executor key found')
}

export function getExecutorFieldValue(
  key: ExecutorKey | IEventWiseKey,
  application: IApplication
) {
  let value = null
  if (typeof key === 'string') {
    value = getExecutorKeyValue(key as ExecutorKey)
  } else {
    value = getValueFromApplicationDataByKey(
      application.data,
      (key as IEventWiseKey)[application.event]
    )
  }
  return value
}

function executeConditionalOperation(
  operation: ConditionOperation,
  conditionInputs: string[],
  value: string
) {
  switch (operation) {
    case ConditionOperation.VALUE_EXISTS:
      return value !== ''
    case ConditionOperation.VALUE_DOES_NOT_EXISTS:
      return value === ''
    case ConditionOperation.DOES_NOT_MATCH:
      return !conditionInputs.includes(value)
    default:
      return conditionInputs.includes(value)
  }
}

function getConditionalOperationEnumByValue(value: string | undefined) {
  if (!value) {
    return ConditionOperation.MATCH
  }
  return ConditionOperation[value as keyof typeof ConditionOperation]
}

export function getMatchedCondition(
  conditions: Condition[],
  applicationData: IFormData
) {
  return conditions.find(conditionObj => {
    try {
      if (!conditionObj.condition) {
        return true
      }
      return executeConditionalOperation(
        getConditionalOperationEnumByValue(conditionObj.condition.operation),
        conditionObj.condition.values,
        // Will return empty string when value is not found for given key
        getValueFromApplicationDataByKey(
          applicationData,
          conditionObj.condition.key || ''
        ) || ''
      )
    } catch (error) {
      /* eslint-disable no-console */
      console.info(`PDF UTILS ERROR: ${error}`)
      /* eslint-enable no-console */
      return false
    }
  })
}
