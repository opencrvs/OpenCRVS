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
import TimeoutLink from '@client/utils/timeoutLink'
import gql from 'graphql-tag'
import {
  ApolloLink,
  Observable,
  Operation,
  execute,
  GraphQLRequest,
  FetchResult
} from 'apollo-link'

const testOperation: GraphQLRequest = {
  query: gql`
    query {
      hello
    }
  `,
  operationName: 'testQuery',
  variables: {},
  context: {},
  extensions: {}
}

const fastResponseLink = new ApolloLink((operation: Operation) => {
  return new Observable(observer => {
    new Promise(resolve => {
      setTimeout(() => resolve({ response: true }), 100)
    }).then(res =>
      observer.next(
        res as FetchResult<
          { [key: string]: any },
          Record<string, any>,
          Record<string, any>
        >
      )
    )
  })
})

const slowResponseLink = new ApolloLink((operation: Operation) => {
  return new Observable(observer => {
    new Promise(resolve => {
      setTimeout(() => resolve({ response: true }), 300)
    }).then(res =>
      observer.next(
        res as FetchResult<
          { [key: string]: any },
          Record<string, any>,
          Record<string, any>
        >
      )
    )
  })
})

const timeoutLink = new TimeoutLink(200)
const fakeTimeoutLink = new TimeoutLink(-1)

const composedPassingLink = timeoutLink.concat(fastResponseLink)
const composedFailingLink = timeoutLink.concat(slowResponseLink)
const composedTimelessLink = fakeTimeoutLink.concat(slowResponseLink)

describe('tests for timeout link', () => {
  it.skip('request served within timeout', done => {
    execute(composedPassingLink, testOperation).subscribe({
      next: data => {
        expect(data).toEqual({ response: true })
        done()
      },
      error: e => {
        expect(e).toBe(null)
        done()
      }
    })
  })

  it.skip('resquest aborted with error when exceeds timeout', done => {
    execute(composedFailingLink, testOperation).subscribe({
      next: data => {
        expect(data).toBe(null)
        done()
      },
      error: e => {
        expect(e.message).toBe('Timeout exceeded for query "testQuery"')
        done()
      }
    })
  })

  it.skip('skips timeout link when timeout is explicitly set <0 even if slow response', done => {
    execute(composedTimelessLink, testOperation).subscribe({
      next: data => {
        expect(data).toEqual({ response: true })
        done()
      },
      error: e => {
        expect(e).toBe(null)
        done()
      }
    })
  })
})
