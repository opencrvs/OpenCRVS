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
import React from 'react'
import { QRReader } from '@opencrvs/components/src/IDReader/readers/QRReader/QRReader'
import {
  IFormData,
  IFormField,
  IFormFieldValue,
  IFormSectionData,
  Ii18nIDReaderFormField,
  Ii18nLinkButtonFormField,
  ReaderType
} from '@client/forms'
import { LinkButtonField } from './LinkButton'
import {
  internationaliseFieldObject,
  isReaderQR,
  isReaderLinkButton
} from '@client/forms/utils'
import {
  messages,
  tutorialMessages
} from '@client/i18n/messages/views/qr-reader'
import { useIntl } from 'react-intl'
import { JSONSchema, validate } from '@opencrvs/commons/client'

interface ReaderGeneratorProps {
  readers: ReaderType[]
  fields: IFormField[]
  field: Ii18nIDReaderFormField
  form: IFormSectionData
  draft: IFormData
  setFieldValue: (name: string, value: IFormFieldValue) => void
}
export const ReaderGenerator = ({
  readers,
  field,
  form,
  draft,
  fields,
  setFieldValue
}: ReaderGeneratorProps) => {
  const intl = useIntl()
  return (
    <>
      {readers.map((reader) => {
        const { type } = reader
        if (isReaderQR(reader)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const validator = (data: any) => {
            const result = validate(reader.validation.rule as JSONSchema, data)
            if (!result) {
              return intl.formatMessage(reader.validation.errorMessage)
            }
          }
          return (
            <QRReader
              key={type}
              labels={{
                button: intl.formatMessage(messages.button),
                scannerDialogSupportingCopy: intl.formatMessage(
                  messages.scannerDialogSupportingCopy
                ),
                tutorial: {
                  cameraCleanliness: intl.formatMessage(
                    tutorialMessages.cameraCleanliness
                  ),
                  distance: intl.formatMessage(tutorialMessages.distance),
                  lightBalance: intl.formatMessage(
                    tutorialMessages.lightBalance
                  )
                }
              }}
              validator={validator}
              onScan={(data) => {
                setFieldValue(field.name, data)
              }}
            />
          )
        } else if (isReaderLinkButton(reader)) {
          return (
            <LinkButtonField
              key={type}
              form={form}
              draft={draft}
              fieldDefinition={
                internationaliseFieldObject(
                  intl,
                  reader
                ) as Ii18nLinkButtonFormField
              }
              fields={fields}
              setFieldValue={setFieldValue}
              isDisabled={false}
            />
          )
        } else return null
      })}
    </>
  )
}
