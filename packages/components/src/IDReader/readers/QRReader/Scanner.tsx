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
import React, { useCallback, useEffect, useRef, useState } from 'react'
import QRScanner from 'qr-scanner'
import styled from 'styled-components'
import { ErrorHandler, Validator } from '../../../IDReader/types'
import { throttle } from 'lodash'

interface ScannerProps {
  onError: ErrorHandler
  onScan: (data: Record<string, unknown>) => void
  validator?: Validator
}

const QRReader = styled.div`
  width: 100%;
  height: 100%;
  margin: 0 auto;
  position: relative;

  @media (max-width: 426px) {
    width: 100%;
  }
`
const Video = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
`

const Scanner = (props: ScannerProps) => {
  const scanner = useRef<QRScanner>()
  const videoElement = useRef<HTMLVideoElement>(null)
  const [qrOn, setQrOn] = useState(true)
  const { onError, onScan, validator } = props
  const onScanSuccess = useCallback(
    (result: QRScanner.ScanResult) => {
      if (result.data) {
        try {
          const data = JSON.parse(result.data)
          const validationError = validator && validator(data)
          if (validationError) {
            onError('invalid', new Error(validationError))
            return
          }
          onScan(data)
        } catch (error) {
          // log detailed error message to console for debugging
          // eslint-disable-next-line no-console
          console.error(error)
          onError('parse', new Error('Invalid JSON format'))
        }
      }
    },
    [onScan, onError, validator]
  )
  const onScanError = useCallback(
    (error: Error) => {
      onError('parse', error)
    },
    [onError]
  )

  useEffect(() => {
    const currentVideoElement = videoElement?.current
    if (currentVideoElement && !scanner.current) {
      // implementation does not support the deprecated constructor overloads
      // but supports the current signature. TS is throwing error. Need to have a closer
      // look why TS is not able to detect the correct signature
      // @ts-ignore
      scanner.current = new QRScanner(currentVideoElement, onScanSuccess, {
        onDecodeError: throttle(onScanError, 5000),
        preferredCamera: 'environment',
        highlightCodeOutline: true,
        highlightScanRegion: false
      })

      scanner?.current
        ?.start()
        .then(() => setQrOn(true))
        .catch((error) => {
          if (error) {
            setQrOn(false)
          }
        })
    }

    return () => {
      if (currentVideoElement && currentVideoElement.srcObject) {
        const stream = currentVideoElement.srcObject as MediaStream
        stream.getTracks().forEach((track) => track.stop())
      } else {
        scanner?.current?.stop()
      }
      scanner.current?.destroy()
    }
  }, [onScan, onError, validator, onScanSuccess, onScanError])

  useEffect(() => {
    if (!qrOn) alert('Please allow camera access to scan QR code')
  }, [qrOn])

  return (
    <QRReader>
      <Video ref={videoElement} />
    </QRReader>
  )
}

export default Scanner
