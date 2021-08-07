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

import { TEAM_SEARCH } from '@client/navigation/routes'
import { AppStore } from '@client/store'
import {
  createTestApp,
  createTestComponent,
  createTestStore,
  flushPromises
} from '@client/tests/util'
import { ReactWrapper } from 'enzyme'
import { History } from 'history'
import { parse } from 'query-string'
import * as React from 'react'
import { TeamSearch } from './TeamSearch'

describe('Team search test', () => {
  let store: AppStore
  let history: History<any>

  beforeAll(async () => {
    const { store: testStore, history: testHistory } = await createTestStore()
    store = testStore
    history = testHistory
  })

  describe('Team search without location in props', () => {
    let app: ReactWrapper

    beforeAll(async () => {
      app = (await createTestComponent(<TeamSearch history={history} />, store))
        .component
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
          target: { id: 'locationSearchInput', value: 'moktarpur' }
        })
      app.update()

      app
        .find('#locationOption0d8474da-0361-4d32-979e-af91f012340a')
        .hostNodes()
        .simulate('click')
      app.update()

      expect(
        app
          .find('#locationSearchInput')
          .hostNodes()
          .props().value
      ).toEqual('Moktarpur Union Parishad')
    })

    it('redirect to user list on search button click', () => {
      Date.now = jest.fn(() => 1455454308000)
      app
        .find('#location-search-btn')
        .hostNodes()
        .simulate('click')
      app.update()
      flushPromises()

      expect(parse(history.location.search)).toEqual({
        locationId: '0d8474da-0361-4d32-979e-af91f012340a'
      })
      expect(history.location.pathname).toContain('/team/users')
    })
  })

  describe('Team search with location in props', () => {
    let app: ReactWrapper
    let history: History

    beforeEach(async () => {
      const testApp = await createTestApp()
      app = testApp.app
      history = testApp.history

      history.replace(TEAM_SEARCH, {
        selectedLocation: {
          id: '',
          searchableText: '',
          displayLabel: 'Alokbali Union Parishad'
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
      ).toEqual('Alokbali Union Parishad')
    })
  })
})
