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
import { Button } from '@opencrvs/components/lib/buttons'
import { ListTable } from '@opencrvs/components/lib/interface'
import { createStore } from '@client/store'
import { createTestComponent } from '@client/tests/util'
import { ReactWrapper } from 'enzyme'
import * as React from 'react'
import { MonthlyReports } from './MonthlyReports'
import { waitForElement } from '@client/tests/wait-for-element'

describe('Monthly report', () => {
  const { store, history } = createStore()
  let app: ReactWrapper

  beforeAll(async () => {
    app = (
      await createTestComponent(<MonthlyReports history={history} />, store)
    ).component
    app.update()
  })

  it('loads monthly report list table', () => {
    expect(app.find(ListTable)).toHaveLength(2)
  })

  it('redirection to report page is disabled', async () => {
    const button = app
      .find(ListTable)
      .first()
      .find('#row_0')
      .hostNodes()
      .find(Button)
      .first()

    expect(button.props().disabled).toEqual(true)
  })

  it('redirects to report page', async () => {
    const locationSearchInput = await waitForElement(
      app,
      '#locationSearchInput'
    )

    locationSearchInput.hostNodes().simulate('change', {
      target: { id: 'locationSearchInput', value: 'Chittagong' }
    })

    locationSearchInput.update()

    app
      .find('#locationOption8cbc862a-b817-4c29-a490-4a8767ff023c')
      .hostNodes()
      .simulate('click')

    app.update()

    app
      .find(ListTable)
      .first()
      .find('#row_0')
      .hostNodes()
      .find(Button)
      .first()
      .simulate('click')
    app.update()

    expect(history.location.pathname).toBe('/performance/report')
  })
})
