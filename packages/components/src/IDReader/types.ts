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

/** The validator function is expected to return a string error message if error, otherwise return undefined  */
export type Validator = (
  data: Parameters<Scan['onScan']>[0]
) => string | undefined
interface QRReaderType {
  validator?: Validator
  labels: {
    button: string
    scannerDialogSupportingCopy: string
    tutorial: {
      cameraCleanliness: string
      distance: string
      lightBalance: string
    }
  }
}

export interface IDReaderProps {
  dividerLabel: string
  manualInputInstructionLabel: string
  children: React.ReactNode
}

/**
 * parse: Error when the scanner fails to parse the QR code
 * invalid: Error when the scanner fails to validate the QR code with the validator
 */
type ErrorType = 'parse' | 'invalid'
export type ErrorHandler = (type: ErrorType, error: Error) => void

interface Scan {
  onScan: (code: Record<string, unknown>) => void
  onError?: ErrorHandler
}

export interface ScannableQRReader extends QRReaderType, Scan {}
