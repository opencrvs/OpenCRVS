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
import { IAction } from '../ListItem'
import { ColumnContentAlignment } from './GridTable'
import * as React from 'react'
export { IAction, IActionObject } from '../ListItem'

enum GQLRegStatus {
  DECLARED = 'DECLARED',
  REGISTERED = 'REGISTERED',
  CERTIFIED = 'CERTIFIED',
  REJECTED = 'REJECTED'
}

export interface IStatus {
  type: GQLRegStatus | null
  practitionerName: string
  timestamp: string | null
  practitionerRole: string
  officeName: string | Array<string | null> | null
}

type ReactText = string | number
type ReactChild = React.ReactNodeArray | ReactText

export interface IColumn {
  label?: string | React.ReactNode
  width: number
  key: string
  errorValue?: string
  alignment?: ColumnContentAlignment
  isActionColumn?: boolean
  isIconColumn?: boolean
  color?: string
  isSortable?: boolean
  icon?: JSX.Element | React.ReactNode
  sortFunction?: (key: string) => void
}

export interface IFooterFColumn {
  label?: string
  width: number
}

export interface IDynamicValues {
  [key: string]:
    | string
    | boolean
    | IAction[]
    | Array<string | null>
    | IStatus[]
    | React.ReactNode[]
    | JSX.Element
    | null
    | undefined
}
