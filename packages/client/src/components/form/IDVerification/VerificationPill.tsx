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
import { messages } from '@client/i18n/messages/views/id-verification'
import { Pill, Icon } from '@opencrvs/components'
import React from 'react'
import { useIntl } from 'react-intl'
import styled from 'styled-components'

const StyledIcon = styled(Icon)`
  margin-right: 4px;
`
function Authenticated() {
  const intl = useIntl()
  return (
    <Pill
      type="active"
      size="small"
      pillTheme="dark"
      label={
        <>
          <StyledIcon name="Fingerprint" size="small" />
          {intl.formatMessage(messages.authenticated.title)}
        </>
      }
    />
  )
}

function Verified() {
  const intl = useIntl()
  return (
    <Pill
      type="default"
      size="small"
      pillTheme="dark"
      label={
        <>
          <StyledIcon name="CircleWavyCheck" size="small" />
          {intl.formatMessage(messages.verified.title)}
        </>
      }
    />
  )
}

function Failed() {
  const intl = useIntl()
  return (
    <Pill
      type="inactive"
      size="small"
      pillTheme="dark"
      label={
        <>
          <StyledIcon name="X" size="small" />
          {intl.formatMessage(messages.failed.title)}
        </>
      }
    />
  )
}

export function VerificationPill({ type }: { type: string }) {
  if (type === 'authenticated') {
    return <Authenticated />
  } else if (type === 'verified') {
    return <Verified />
  } else if (type === 'failed') {
    return <Failed />
  }
  return null
}
