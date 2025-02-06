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
import type { Meta, StoryObj } from '@storybook/react'
import { IDReader } from '.'
import React from 'react'
import { QRReader } from './readers/QRReader/QRReader'
import { Stack } from '../Stack'
import { Text } from '../Text'
import { ScannableQRReader } from './types'

const meta: Meta<typeof IDReader> = {
  title: 'Controls/IDReader',
  component: IDReader
}

export default meta

type Story = StoryObj<typeof IDReader>

const IDReaderComponent = (qrReaderProps: Partial<ScannableQRReader>) => (
  <IDReader
    dividerLabel="Or"
    manualInputInstructionLabel="Complete fields below"
  >
    <QRReader
      {...qrReaderProps}
      labels={{
        button: 'Scan ID QR code',
        scannerDialogSupportingCopy:
          "Place the Notifier's ID card in front of the camera.",
        tutorial: {
          cameraCleanliness: 'Ensure your camera is clean and functional.',
          distance:
            'Hold the device steadily 6-12 inches away from the QR code.',
          lightBalance:
            'Ensure the QR code is well-lit and not damaged or blurry.'
        }
      }}
      onScan={(data) => alert(JSON.stringify(data))}
      onError={(type, error) =>
        // eslint-disable-next-line no-console
        console.error(`Error: ${type} - ${error.message}`)
      }
    />
  </IDReader>
)

export const IDReaderWithAlertFeedback: Story = {
  render: () => <IDReaderComponent />
}

export const IDReaderWithValidator: Story = {
  render: () => (
    <Stack direction="column" gap={4} alignItems="stretch">
      <IDReaderComponent
        validator={(data: unknown) => {
          if (
            typeof data === 'object' &&
            data !== null &&
            'firstName' in data &&
            'lastName' in data &&
            !!data['firstName'] &&
            !!data['lastName']
          ) {
            return undefined
          } else return 'Invalid QR code'
        }}
      />
      <Text element="h5" variant="h4">
        This reader is provided with a validator function having such rule that
        it will show alert only if the QR code has the below structure:
      </Text>
      <code
        style={{
          whiteSpace: 'pre-wrap',
          padding: '16px',
          background: '#f5f5f5'
        }}
      >
        {JSON.stringify({ firstName: 'John', lastName: 'Doe' }, null, 2)}
      </code>
      <Text element="h5" variant="h4">
        Otherwise it will show an error message in the scanner dialog
      </Text>
      <Text element="h2" variant="h2">
        Example
      </Text>
      <Text element="p" variant="reg16">
        Scan the below QR code with the scanner above and you should see an
        alert as the data of the QR code is valid
      </Text>
      <Stack>
        <img src="./static/valid_qr.png" alt="valid_qr" />
        <code
          style={{
            whiteSpace: 'pre-wrap',
            padding: '16px',
            background: '#f5f5f5'
          }}
        >
          {JSON.stringify({ firstName: 'John', lastName: 'Doe' }, null, 2)}
        </code>
      </Stack>
      <Text element="p" variant="reg16">
        You will see an error message in the scanner dialog if you scan the
        below QR code as the data of the QR code is invalid
      </Text>
      <Stack>
        <img src="./static/invalid_qr.png" alt="invalid_qr" />
        <code
          style={{
            whiteSpace: 'pre-wrap',
            padding: '16px',
            background: '#f5f5f5'
          }}
        >
          {JSON.stringify({ firstName: 'John', lastName: '' }, null, 2)}
        </code>
      </Stack>
    </Stack>
  )
}
