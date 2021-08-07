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
import { ReactWrapper } from 'enzyme'
import {
  createTestComponent,
  createTestStore,
  resizeWindow
} from '@client/tests/util'
import { ExternalValidationTab } from './externalValidationTab'
import * as jwt from 'jsonwebtoken'
import { readFileSync } from 'fs'
import { checkAuth } from '@client/profile/profileActions'
import { GQLBirthEventSearchSet } from '@opencrvs/gateway/src/graphql/schema'
import { waitForElement } from '@client/tests/wait-for-element'
import { GridTable } from '@opencrvs/components/lib/interface'
import { RowHistoryView } from '@client/views/RegistrationHome/RowHistoryView'
import { History } from 'history'

const EVENT_CREATION_TIME = 1583322631424
const SEND_FOR_VALIDATION_TIME = 1582912800000

export const registerScopeToken = jwt.sign(
  { scope: ['register'] },
  readFileSync('../auth/test/cert.key'),
  {
    algorithm: 'RS256',
    issuer: 'opencrvs:auth-service',
    audience: 'opencrvs:gateway-user'
  }
)
const getItem = window.localStorage.getItem as jest.Mock

const birthEventSearchSet: GQLBirthEventSearchSet = {
  id: '956281c9-1f47-4c26-948a-970dd23c4094',
  type: 'Birth',
  registration: {
    status: 'WAITING_VALIDATION',
    contactNumber: '01622688231',
    trackingId: 'BW0UTHR',
    registrationNumber: undefined,
    eventLocationId: undefined,
    registeredLocationId: '308c35b4-04f8-4664-83f5-9790e790cde1',
    duplicates: [null],
    createdAt: EVENT_CREATION_TIME.toString(),
    modifiedAt: SEND_FOR_VALIDATION_TIME.toString()
  },
  dateOfBirth: '2010-10-10',
  childName: [
    {
      firstNames: 'Iliyas',
      familyName: 'Khan',
      use: 'en'
    },
    {
      firstNames: 'ইলিয়াস',
      familyName: 'খান',
      use: 'bn'
    }
  ]
}

describe('Registrar home external validation tab tests', () => {
  let component: ReactWrapper<{}, {}>
  let history: History<any>

  beforeEach(async () => {
    const CURRENT_TIME = 1583322631424
    Date.now = jest.fn(() => CURRENT_TIME)
    const { store: testStore, history: testHistory } = await createTestStore()
    getItem.mockReturnValue(registerScopeToken)
    testStore.dispatch(checkAuth({ '?token': registerScopeToken }))

    const testComponent = await createTestComponent(
      // @ts-ignore
      <ExternalValidationTab
        registrarLocationId={'2a83cf14-b959-47f4-8097-f75a75d1867f'}
        queryData={{ data: { totalItems: 1, results: [birthEventSearchSet] } }}
      />,
      testStore
    )
    component = testComponent.component
    history = testHistory
  })

  it('renders data', async () => {
    const tableElement = await waitForElement(component, GridTable)
    const data = tableElement.prop('content')

    expect(data.length).toBe(1)
    expect(data[0].id).toBe('956281c9-1f47-4c26-948a-970dd23c4094')
    expect(data[0].waitingTimeElapsed).toBe('5 days ago')
    expect(data[0].eventTimeElapsed).toBe('9 years ago')
    expect(data[0].event).toBe('Birth')
    expect(data[0].actions).toBeDefined()
  })

  it('clicking on a row makes it expanded', async () => {
    const tableElement = await waitForElement(component, GridTable)
    const dataRow = tableElement.find('#row_0').hostNodes()
    dataRow.simulate('click')
    const rowHistoryView = await waitForElement(component, RowHistoryView)
    const eventDetails = rowHistoryView.prop('eventDetails')
    expect(eventDetails.registration.modifiedAt).toBe(
      SEND_FOR_VALIDATION_TIME.toString()
    )
  })

  describe('On devices with small viewport', () => {
    beforeEach(() => {
      resizeWindow(800, 1280)
      component.update()
    })

    it('clicking on row takes user to details page', async () => {
      const tableElement = await waitForElement(component, GridTable)
      const dataRow = tableElement.find('#row_0').hostNodes()
      dataRow.simulate('click')
      component.update()
      expect(history.location.pathname).toContain('details')
    })
  })
})
