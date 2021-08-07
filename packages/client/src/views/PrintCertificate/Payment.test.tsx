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
import { createStore } from '@client/store'
import {
  createTestComponent,
  mockApplicationData,
  mockDeathApplicationData,
  validToken,
  mockUserResponse
} from '@client/tests/util'
import { storeApplication } from '@client/applications'
import { Event } from '@client/forms'
import { Payment } from './Payment'
import * as PDFUtils from '@client/views/PrintCertificate/PDFUtils'
import { queries } from '@client/profile/queries'
import { checkAuth } from '@client/profile/profileActions'

const getItem = window.localStorage.getItem as jest.Mock
;(queries.fetchUserDetails as jest.Mock).mockReturnValue(mockUserResponse)

describe('verify collector tests', () => {
  const { store, history } = createStore()
  const mockLocation: any = jest.fn()

  const birthApplication = {
    id: 'mockBirth1234',
    data: mockApplicationData,
    event: Event.BIRTH
  }

  const deathApplication = {
    id: 'mockDeath1234',
    data: mockDeathApplicationData,
    event: Event.DEATH
  }

  describe('in case of birth application', () => {
    beforeAll(async () => {
      getItem.mockReturnValue(validToken)
      await store.dispatch(checkAuth({ '?token': validToken }))

      store.dispatch(storeApplication(birthApplication))
    })

    it('when mother is collector renders Payment component', async () => {
      const testComponent = (
        await createTestComponent(
          <Payment
            history={history}
            location={mockLocation}
            match={{
              params: {
                registrationId: 'mockBirth1234',
                eventType: Event.BIRTH
              },
              isExact: true,
              path: '',
              url: ''
            }}
          />,
          store
        )
      ).component

      expect(
        testComponent
          .find('#service')
          .hostNodes()
          .text()
      ).toContain('Birth')

      expect(
        testComponent
          .find('#amountDue')
          .hostNodes()
          .text()
      ).toContain('50')

      testComponent
        .find('#Continue')
        .hostNodes()
        .simulate('click')
    })

    it('print payment receipt', async () => {
      const printMoneyReceiptSpy = jest.spyOn(PDFUtils, 'printMoneyReceipt')
      const testComponent = (
        await createTestComponent(
          <Payment
            location={mockLocation}
            history={history}
            match={{
              params: {
                registrationId: 'mockBirth1234',
                eventType: Event.BIRTH
              },
              isExact: true,
              path: '',
              url: ''
            }}
          />,
          store
        )
      ).component

      testComponent
        .find('#print-receipt')
        .hostNodes()
        .simulate('click')

      expect(printMoneyReceiptSpy).toBeCalled()
    })

    it('invalid application id', () => {
      expect(
        createTestComponent(
          <Payment
            location={mockLocation}
            history={history}
            match={{
              params: {
                registrationId: 'mockBirth',
                eventType: Event.BIRTH
              },
              isExact: true,
              path: '',
              url: ''
            }}
          />,
          store
        )
      ).rejects.toEqual(new Error('Application "mockBirth" missing!'))
    })
  })

  describe('in case of death application renders payment component', () => {
    beforeAll(() => {
      store.dispatch(storeApplication(deathApplication))
    })

    it('when informant is collector', async () => {
      const testComponent = (
        await createTestComponent(
          <Payment
            location={mockLocation}
            history={history}
            match={{
              params: {
                registrationId: 'mockDeath1234',
                eventType: Event.DEATH
              },
              isExact: true,
              path: '',
              url: ''
            }}
          />,
          store
        )
      ).component

      expect(
        testComponent
          .find('#service')
          .hostNodes()
          .text()
      ).toContain('Death')
    })
  })
})
