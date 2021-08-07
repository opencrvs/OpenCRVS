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
import { PERFORMANCE_HOME } from '@client/navigation/routes'
import { createStore } from '@client/store'
import {
  createTestApp,
  createTestComponent,
  flushPromises
} from '@client/tests/util'
import { ReactWrapper } from 'enzyme'
import { History } from 'history'
import * as React from 'react'
import { PerformanceHome } from './PerformanceHome'
import { parse } from 'query-string'

describe('Performance home test', () => {
  describe('Performance home without location in props', () => {
    const { store, history } = createStore()
    let app: ReactWrapper

    beforeAll(async () => {
      app = (
        await createTestComponent(<PerformanceHome history={history} />, store)
      ).component
      app.update()
    })

    it('loads nothing in the search input box', () => {
      expect(
        app
          .find('#locationSearchInput')
          .hostNodes()
          .props().value
      ).toEqual('')
    })

    it('loads the selected location in search input box', () => {
      app
        .find('#locationSearchInput')
        .hostNodes()
        .simulate('change', {
          target: { id: 'locationSearchInput', value: 'Dhaka' }
        })
      app.update()

      app
        .find('#locationOption6e1f3bce-7bcb-4bf6-8e35-0d9facdf158b')
        .hostNodes()
        .simulate('click')
      app.update()

      expect(
        app
          .find('#locationSearchInput')
          .hostNodes()
          .props().value
      ).toEqual('Dhaka Division')
    })

    it('redirect to operatoins on search button click', () => {
      Date.now = jest.fn(() => 1455454308000)
      app
        .find('#location-search-btn')
        .hostNodes()
        .simulate('click')
      app.update()
      flushPromises()

      expect(parse(history.location.search)).toEqual({
        sectionId: 'OPERATIONAL',
        locationId: '6e1f3bce-7bcb-4bf6-8e35-0d9facdf158b',
        timeEnd: '2016-02-14T12:51:48.000Z',
        timeStart: '2015-02-14T12:51:48.000Z'
      })
      expect(history.location.pathname).toContain('operations')
    })
    it('redirect to operatoins on pilot location link click', () => {
      Date.now = jest.fn(() => 1455454308000)
      app
        .find('#pilot-location-link-0')
        .hostNodes()
        .simulate('click')
      app.update()
      flushPromises()

      expect(history.location.pathname).toContain('operations')
    })
  })

  describe('Performance home with location in props', () => {
    let app: ReactWrapper
    let history: History

    beforeEach(async () => {
      const testApp = await createTestApp()
      app = testApp.app
      history = testApp.history

      history.replace(PERFORMANCE_HOME, {
        selectedLocation: {
          id: '',
          searchableText: '',
          displayLabel: 'Khulna'
        }
      })
      app.update()
    })

    it('loads the location in the search input box', () => {
      expect(
        app
          .find('#locationSearchInput')
          .hostNodes()
          .props().value
      ).toEqual('Khulna')
    })
  })
})
