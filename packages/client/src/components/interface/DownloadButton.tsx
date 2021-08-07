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
import * as React from 'react'
import { injectIntl, WrappedComponentProps as IntlShapeProps } from 'react-intl'
import styled from '@client/styledComponents'
import { constantsMessages } from '@client/i18n/messages'
import { Spinner } from '@opencrvs/components/lib/interface'
import { Warning, Download } from '@opencrvs/components/lib/icons'
import { TertiaryButton } from '@opencrvs/components/lib/buttons'
import { connect } from 'react-redux'
import {
  downloadApplication,
  makeApplicationReadyToDownload,
  DOWNLOAD_STATUS
} from '@client/applications'
import { Event, Action } from '@client/forms'
import { withApollo, WithApolloClient } from 'react-apollo'

interface IDownloadConfig {
  event: string
  compositionId: string
  action: Action
}

interface DownloadButtonProps extends IntlShapeProps {
  id?: string
  className?: string
  downloadConfigs: IDownloadConfig
  status: DOWNLOAD_STATUS
}

interface IDispatchProps {
  downloadApplication: typeof downloadApplication
}

type HOCProps = IDispatchProps & WithApolloClient<{}>

const StatusIndicator = styled.div<{
  isLoading?: boolean
}>`
  display: flex;
  flex-grow: 1;
  align-items: center;
  max-width: 152px;
  justify-content: ${({ isLoading }) =>
    isLoading ? `space-between` : `flex-end`};
`
const DownloadAction = styled(TertiaryButton)<{
  isFullHeight?: boolean
}>`
  ${({ isFullHeight }) => isFullHeight && `height: 100%;`}
`

function DownloadButtonComponent(props: DownloadButtonProps & HOCProps) {
  const { id, status, intl, className } = props

  function initiateDownload() {
    const { event, compositionId, action } = props.downloadConfigs
    const downloadableApplication = makeApplicationReadyToDownload(
      (event.toLowerCase() as unknown) as Event,
      compositionId,
      action
    )

    props.downloadApplication(downloadableApplication, props.client)
  }

  if (
    status === DOWNLOAD_STATUS.READY_TO_DOWNLOAD ||
    status === DOWNLOAD_STATUS.DOWNLOADING
  ) {
    return (
      <StatusIndicator isLoading={true} className={className}>
        {intl.formatMessage(constantsMessages.downloading)}
        <Spinner id={`action-loading-${id}`} size={24} />
      </StatusIndicator>
    )
  }

  if (
    status === DOWNLOAD_STATUS.FAILED ||
    status === DOWNLOAD_STATUS.FAILED_NETWORK
  ) {
    return (
      <StatusIndicator className={className}>
        <Warning id={`action-error-${id}`} />
        <DownloadAction
          isFullHeight={false}
          id={`${id}-icon`}
          onClick={e => {
            initiateDownload()
            e.stopPropagation()
          }}
          icon={() => <Download />}
        />
      </StatusIndicator>
    )
  }

  return (
    <DownloadAction
      isFullHeight={false}
      id={`${id}-icon`}
      onClick={e => {
        initiateDownload()
        e.stopPropagation()
      }}
      icon={() => <Download />}
      className={className}
    />
  )
}

export const DownloadButton = connect(null, { downloadApplication })(
  injectIntl(withApollo(DownloadButtonComponent))
)
