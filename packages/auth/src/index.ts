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
// tslint:disable no-var-requires
require('app-module-path').addPath(require('path').join(__dirname, '../'))
require('dotenv').config({
  path: `${process.cwd()}/.env`
})
// tslint:enable no-var-requires
import * as Hapi from '@hapi/hapi'
import { AUTH_HOST, AUTH_PORT } from '@auth/constants'
import authenticateHandler, {
  requestSchema as reqAuthSchema,
  responseSchema as resAuthSchema
} from '@auth/features/authenticate/handler'
import verifyCodeHandler, {
  requestSchema as reqVerifySchema,
  responseSchma as resVerifySchema
} from '@auth/features/verifyCode/handler'
import refreshTokenHandler, {
  requestSchema as reqRefreshSchema,
  responseSchma as resRefreshSchema
} from '@auth/features/refresh/handler'
import resendSmsHandler, {
  requestSchema as reqResendSmsSchema,
  responseSchma as resResendSmsSchema
} from '@auth/features/resend/handler'
import getPlugins from '@auth/config/plugins'
import * as database from '@auth/database'
import verifyTokenHandler, {
  reqVerifyTokenSchema,
  resVerifyTokenSchema
} from '@auth/features/verifyToken/handler'
import invalidateTokenHandler, {
  reqInvalidateTokenSchema
} from '@auth/features/invalidateToken/handler'
import verifyUserHandler, {
  requestSchema as reqVerifyUserSchema,
  responseSchema as resVerifyUserSchema
} from '@auth/features/retrievalSteps/verifyUser/handler'
import verifyNumberHandler, {
  requestSchema as reqVerifyNumberSchema,
  responseSchema as resVerifyNumberSchema
} from '@auth/features/retrievalSteps/verifyNumber/handler'
import verifySecurityQuestionHandler, {
  verifySecurityQuestionSchema,
  verifySecurityQuestionResSchema
} from '@auth/features/retrievalSteps/verifySecurityAnswer/handler'
import changePasswordHandler, {
  reqChangePasswordSchema
} from '@auth/features/retrievalSteps/changePassword/handler'
import sendUserNameHandler, {
  requestSchema as reqSendUserNameSchema
} from '@auth/features/retrievalSteps/sendUserName/handler'
import {
  authenticateSystemClientHandler,
  requestSchema as reqSystemSchema,
  responseSchema as resSystemSchema,
  registerSystemClient,
  registerRquestSchema
} from '@auth/features/system/handler'

export async function createServer() {
  const server = new Hapi.Server({
    host: AUTH_HOST,
    port: AUTH_PORT,
    routes: {
      cors: { origin: ['*'] },
      payload: { maxBytes: 52428800 }
    }
  })

  /* add ping route by default for health check */
  server.route({
    method: 'GET',
    path: '/ping',
    handler: (request: any, h: any) => {
      // Perform any health checks and return true or false for success prop
      return {
        success: true
      }
    },
    options: {
      auth: false,
      tags: ['api'],
      description: 'Health check endpoint'
    }
  })

  // curl -H 'Content-Type: application/json' -d '{"username": "test.user", "password": "test"}' http://localhost:4040/authenticate
  server.route({
    method: 'POST',
    path: '/authenticate',
    handler: authenticateHandler,
    options: {
      tags: ['api'],
      description: 'Authenticate with username and password',
      notes:
        'Authenticates user and returns nonce to use for collating the login for 2 factor authentication.' +
        'Sends an SMS to the user mobile with verification code',
      validate: {
        payload: reqAuthSchema
      },
      response: {
        schema: resAuthSchema
      }
    }
  })

  // curl -H 'Content-Type: application/json' -d '{"nonce": ""}' http://localhost:4040/resendSms
  server.route({
    method: 'POST',
    path: '/resendSms',
    handler: resendSmsHandler,
    options: {
      tags: ['api'],
      description: 'Resend another SMS code',
      notes:
        'Sends a new SMS code to the user based on the phone number associated with the nonce',
      validate: {
        payload: reqResendSmsSchema
      },
      response: {
        schema: resResendSmsSchema
      }
    }
  })

  // curl -H 'Content-Type: application/json' -d '{"code": "123456"}' http://localhost:4040/verifyCode
  server.route({
    method: 'POST',
    path: '/verifyCode',
    handler: verifyCodeHandler,
    options: {
      tags: ['api'],
      description: 'Verify the 2 factor auth code',
      notes:
        'Verifies the 2 factor auth code and returns the JWT API token for future requests',
      validate: {
        payload: reqVerifySchema
      },
      response: {
        schema: resVerifySchema
      }
    }
  })

  // curl -H 'Content-Type: application/json' -d '{"nonce": "", "token": ""}' http://localhost:4040/refreshToken
  server.route({
    method: 'POST',
    path: '/refreshToken',
    handler: refreshTokenHandler,
    options: {
      tags: ['api'],
      description: 'Refresh an expiring token',
      notes:
        'Verifies the expired client token as true and returns a refreshed JWT API token for future requests',
      validate: {
        payload: reqRefreshSchema
      },
      response: {
        schema: resRefreshSchema
      }
    }
  })

  // curl -H 'Content-Type: application/json' -d '{ "token": "" }' http://localhost:4040/verifyToken
  server.route({
    method: 'POST',
    path: '/verifyToken',
    handler: verifyTokenHandler,
    options: {
      tags: ['api'],
      description: 'Check if a token is marked as invalid or not',
      notes:
        'Check if this token is part of the invalid token list that is stored in redis',
      validate: {
        payload: reqVerifyTokenSchema
      },
      response: {
        schema: resVerifyTokenSchema
      }
    }
  })

  // curl -H 'Content-Type: application/json' -d '{ "token": "" }' http://localhost:4040/invalidateToken
  server.route({
    method: 'POST',
    path: '/invalidateToken',
    handler: invalidateTokenHandler,
    options: {
      tags: ['api'],
      description: 'Marks token as invalid until it expires',
      notes:
        'Adds a token to the invalid tokens stored in Redis, ' +
        'these are stored as individual key value pairs to that we can set their expiry TTL individually',
      validate: {
        payload: reqInvalidateTokenSchema
      },
      response: {
        schema: false
      }
    }
  })

  // curl -H 'Content-Type: application/json' -d '{ "mobile": "" }' http://localhost:4040/verifyUser
  server.route({
    method: 'POST',
    path: '/verifyUser',
    handler: verifyUserHandler,
    options: {
      tags: ['api'],
      description:
        'First step of password or username retrieval steps.' +
        'Check if user exists for given mobile number or not.',
      notes:
        'Verifies user and returns nonce to use for next step of password reset flow.' +
        'Sends an SMS to the user mobile with verification code',
      validate: {
        payload: reqVerifyUserSchema
      },
      response: {
        schema: resVerifyUserSchema
      }
    }
  })

  // curl -H 'Content-Type: application/json' -d '{ "mobile": "" }' http://localhost:4040/verifyUser
  server.route({
    method: 'POST',
    path: '/verifyNumber',
    handler: verifyNumberHandler,
    options: {
      tags: ['api'],
      description:
        'Second step of password or username retrieval steps.' +
        'Check if provided verification code is valid or not.',
      notes:
        'Verifies code for given nonce and returns a random security question for that user.',
      validate: {
        payload: reqVerifyNumberSchema
      },
      response: {
        schema: resVerifyNumberSchema
      }
    }
  })

  // curl -H 'Content-Type: application/json' -d '{ "questionKey": "", "answer": "", "nonce": "" }' http://localhost:4040/verifyUser
  server.route({
    method: 'POST',
    path: '/verifySecurityAnswer',
    handler: verifySecurityQuestionHandler,
    options: {
      tags: ['api'],
      description:
        'Third step of password or username retrieval steps.' +
        'Checks if the submitted security question answer is right',
      notes:
        'Verifies security answer and updates the nonce information so that it can be used for changing the password' +
        'In-case of a wrong answer, it will return an another question key.',
      validate: {
        payload: verifySecurityQuestionSchema
      },
      response: {
        schema: verifySecurityQuestionResSchema
      }
    }
  })

  // curl -H 'Content-Type: application/json' -d '{ "newPassword": "", "nonce": "" }' http://localhost:4040/changePassword
  server.route({
    method: 'POST',
    path: '/changePassword',
    handler: changePasswordHandler,
    options: {
      tags: ['api'],
      description:
        'Final step of password retrieval flow.' + 'Changes the user password',
      notes:
        'Expects the nonce parameter to be coming from the reset password journey',
      validate: {
        payload: reqChangePasswordSchema
      },
      response: {
        schema: false
      }
    }
  })

  // curl -H 'Content-Type: application/json' -d '{ "nonce": "" }' http://localhost:4040/sendUserName
  server.route({
    method: 'POST',
    path: '/sendUserName',
    handler: sendUserNameHandler,
    options: {
      tags: ['api'],
      description:
        'Final step of username retrieval flow.' +
        'Sends the username to user mobile number',
      notes:
        'Expects the nonce parameter to be coming from the retrieve username journey',
      validate: {
        payload: reqSendUserNameSchema
      },
      response: {
        schema: false
      }
    }
  })

  server.route({
    method: 'POST',
    path: '/authenticateSystemClient',
    handler: authenticateSystemClientHandler,
    options: {
      tags: ['api'],
      description: 'Authenticate system with client_id and client_secret',
      validate: {
        payload: reqSystemSchema
      },
      response: {
        schema: resSystemSchema
      }
    }
  })

  server.route({
    method: 'POST',
    path: '/registerSystemClient',
    handler: registerSystemClient,
    options: {
      tags: ['api'],
      validate: {
        payload: registerRquestSchema
      }
    }
  })

  await server.register(getPlugins())
  server.ext({
    type: 'onRequest',
    method(request: Hapi.Request & { sentryScope: any }, h) {
      request.sentryScope.setExtra('payload', request.payload)
      return h.continue
    }
  })

  async function stop() {
    await server.stop()
    await database.stop()
    server.log('info', 'server stopped')
  }

  async function start() {
    await server.start()
    await database.start()
    server.log('info', `server started on ${AUTH_HOST}:${AUTH_PORT}`)
  }

  return { server, start, stop }
}

if (require.main === module) {
  createServer().then(server => server.start())
}
