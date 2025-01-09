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
import { Db } from 'mongodb'

export interface Channel {
  name?: string
  urlPattern?: string
  description?: string
  routes?: Route[]
  methods: string[]
  type: string
  allow: string[]
  whitelist: string[]
  authType: string
  matchContentTypes: string[]
  properties: any[]
  txViewAcl: any[]
  txViewFullAcl: any[]
  txRerunAcl: any[]
  status: string
  rewriteUrls: boolean
  addAutoRewriteRules: boolean
  autoRetryEnabled: boolean
  autoRetryPeriodMinutes: number
  requestBody: boolean
  responseBody: boolean
  rewriteUrlsConfig: any[]
  matchContentRegex: null | string
  matchContentXpath: null | string
  matchContentValue: null | string
  matchContentJson: null | string
  pollingSchedule: null | any
  tcpHost: null | string
  tcpPort: null | string
  alerts: any[]
  priority: number
  maxBodyAgeDays?: number
}

export interface Route {
  type: string
  status: string
  forwardAuthHeader: boolean
  secured: boolean
  path: string
  pathTransform: string
  username: string
  password: string
  name?: string
  host?: string
  port?: number
  primary?: boolean
}

export async function upsertChannel(db: Db, channel: Channel) {
  await db.collection('channels').updateOne(
    { name: channel.name },
    { $set: channel },
    {
      upsert: true
    }
  )
}

export async function removeChannel(db: Db, channel: { name?: string }) {
  await db.collection('channels').deleteOne({ name: channel.name })
}

export async function addRouteToChannel(
  db: Db,
  channelName: string,
  route: Route
) {
  await db
    .collection<Channel>('channels')
    .updateOne({ name: channelName }, { $push: { routes: route } })
}

export async function removeRouteFromChannel(
  db: Db,
  channelName: string,
  routeName: string
) {
  await db
    .collection<Channel>('channels')
    .updateOne(
      { name: channelName },
      { $pull: { routes: { name: routeName } } }
    )
}

export const newChannelTemplate: Channel = {
  methods: [
    'GET',
    'POST',
    'DELETE',
    'PUT',
    'OPTIONS',
    'HEAD',
    'TRACE',
    'CONNECT',
    'PATCH'
  ],
  type: 'http',
  allow: [],
  whitelist: [],
  authType: 'public',
  matchContentTypes: [],
  properties: [],
  txViewAcl: [],
  txViewFullAcl: [],
  txRerunAcl: [],
  status: 'enabled',
  rewriteUrls: false,
  addAutoRewriteRules: true,
  autoRetryEnabled: false,
  autoRetryPeriodMinutes: 60,
  requestBody: true,
  responseBody: true,
  rewriteUrlsConfig: [],
  matchContentRegex: null,
  matchContentXpath: null,
  matchContentValue: null,
  matchContentJson: null,
  pollingSchedule: null,
  tcpHost: null,
  tcpPort: null,
  alerts: [],
  priority: 1,
  maxBodyAgeDays: 30
}

export const routeTemplate: Route = {
  type: 'http',
  status: 'enabled',
  forwardAuthHeader: true,
  secured: false,
  path: '',
  pathTransform: '',
  username: '',
  password: ''
}
