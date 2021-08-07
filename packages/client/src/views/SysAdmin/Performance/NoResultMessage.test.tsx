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
import { createStore } from '@client/store'
import { createTestComponent, flushPromises } from '@client/tests/util'
import { ReactWrapper } from 'enzyme'
import * as React from 'react'
import { NoResultMessage } from './NoResultMessage'

describe('No report data test', () => {
  describe('No report data without location in props', () => {
    const { store, history } = createStore()
    let app: ReactWrapper

    beforeAll(async () => {
      app = (
        await createTestComponent(
          <NoResultMessage id={'123'} searchedLocation={'Sample location'} />,
          store
        )
      ).component
      app.update()
    })

    it('loads nothing in the search input box', () => {
      expect(
        app
          .find('#noResults-123')
          .hostNodes()
          .text()
      ).toEqual(
        'No data for Sample location. We are currently piloting for following areas:'
      )
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
})
