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
// tslint:disable-next-line no-var-requires
require('app-module-path').addPath(require('path').join(__dirname, '../'))

import * as Hapi from '@hapi/hapi'
import * as DotEnv from 'dotenv'
import { getPlugins } from '@gateway/config/plugins'
import { getRoutes } from '@gateway/config/routes'
import {
  CERT_PUBLIC_KEY_PATH,
  CHECK_INVALID_TOKEN,
  AUTH_URL,
  PORT,
  HOST
} from '@gateway/constants'
import { readFileSync } from 'fs'
import { validateFunc } from '@opencrvs/commons'
import { ApolloServer } from 'apollo-server-hapi'
import { getApolloConfig } from '@gateway/graphql/config'

DotEnv.config({
  path: `${process.cwd()}/.env`
})

const publicCert = readFileSync(CERT_PUBLIC_KEY_PATH)

export async function createServer() {
  const apolloServer = new ApolloServer(getApolloConfig())
  const app = new Hapi.Server({
    host: HOST,
    port: PORT,
    routes: {
      cors: { origin: ['*'] },
      payload: { maxBytes: 52428800 }
    }
  })
  const plugins = getPlugins()

  await app.register(plugins)
  app.auth.strategy('jwt', 'jwt', {
    key: publicCert,
    verifyOptions: {
      algorithms: ['RS256'],
      issuer: 'opencrvs:auth-service',
      audience: 'opencrvs:gateway-user'
    },
    validate: (payload: any, request: Hapi.Request) =>
      validateFunc(payload, request, CHECK_INVALID_TOKEN, AUTH_URL)
  })

  app.auth.default('jwt')

  await apolloServer.applyMiddleware({
    app
  })

  const routes = getRoutes()
  app.route(routes)

  /*
   * For debugging sent applications on pre-prod environments.
   * Custom implementation a sGood doesn't support logging request payloads
   * https://github.com/hapijs/good/search?q=request&type=Issues
   */
  if (process.env.NODE_ENV !== 'production') {
    app.events.on('response', request => {
      app.log('info', JSON.stringify(request.payload))
    })
  }

  async function start() {
    await app.start()
    app.log('info', `server started on port ${PORT}`)
  }

  async function stop() {
    await app.stop()
    app.log('info', 'server stopped')
  }

  return { app, start, stop }
}

if (require.main === module) {
  createServer().then(app => app.start())
}
