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
import { BannerType } from '@client/forms'
import { Icon } from '@opencrvs/components'
import React from 'react'
import styled from 'styled-components'

const IconWrapper = styled.div<{ type: BannerType }>`
  --background-color: ${({ theme, type }) => `
    ${type === 'verified' ? theme.colors.blueLight : ''}
    ${type === 'authenticated' ? theme.colors.greenLight : ''}
    ${type === 'failed' ? theme.colors.redLight : ''}
  `};
  height: 24px;
  width: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--background-color);
`

export const StatusIcon = ({ type }: { type: BannerType }) => {
  if (type === 'authenticated') {
    return (
      <IconWrapper type={type}>
        <Icon name="Check" size="small" weight="bold" color="greenDarker" />
      </IconWrapper>
    )
  } else if (type === 'verified') {
    return (
      <IconWrapper type={type}>
        <Icon name="Check" size="small" weight="bold" color="blueDarker" />
      </IconWrapper>
    )
  } else if (type === 'failed') {
    return (
      <IconWrapper type={type}>
        <Icon name="X" size="small" weight="bold" color="redDarker" />
      </IconWrapper>
    )
  }
  return null
}
