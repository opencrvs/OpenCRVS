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
import {
  createTestApp,
  createTestComponent,
  getItem,
  flushPromises
} from '@client/tests/util'

import { createClient } from '@client/utils/apolloClient'
import * as actions from '@client/notification/actions'
import { referenceApi } from '@client/utils/referenceApi'
import { StyledErrorBoundary } from '@client/components/StyledErrorBoundary'
import { createStore, AppStore } from '@client/store'
import { waitFor } from './tests/wait-for-element'
import { ReactWrapper } from 'enzyme'

const validToken =
  'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYWRtaW4iLCJpYXQiOjE1MzMxOTUyMjgsImV4cCI6MTU0MzE5NTIyNywiYXVkIjpbImdhdGV3YXkiXSwic3ViIjoiMSJ9.G4KzkaIsW8fTkkF-O8DI0qESKeBI332UFlTXRis3vJ6daisu06W5cZsgYhmxhx_n0Q27cBYt2OSOnjgR72KGA5IAAfMbAJifCul8ib57R4VJN8I90RWqtvA0qGjV-sPndnQdmXzCJx-RTumzvr_vKPgNDmHzLFNYpQxcmQHA-N8li-QHMTzBHU4s9y8_5JOCkudeoTMOd_1021EDAQbrhonji5V1EOSY2woV5nMHhmq166I1L0K_29ngmCqQZYi1t6QBonsIowlXJvKmjOH5vXHdCCJIFnmwHmII4BK-ivcXeiVOEM_ibfxMWkAeTRHDshOiErBFeEvqd6VWzKvbKAH0UY-Rvnbh4FbprmO4u4_6Yd2y2HnbweSo-v76dVNcvUS0GFLFdVBt0xTay-mIeDy8CKyzNDOWhmNUvtVi9mhbXYfzzEkwvi9cWwT1M8ZrsWsvsqqQbkRCyBmey_ysvVb5akuabenpPsTAjiR8-XU2mdceTKqJTwbMU5gz-8fgulbTB_9TNJXqQlH7tyYXMWHUY3uiVHWg2xgjRiGaXGTiDgZd01smYsxhVnPAddQOhqZYCrAgVcT1GBFVvhO7CC-rhtNlLl21YThNNZNpJHsCgg31WA9gMQ_2qAJmw2135fAyylO8q7ozRUvx46EezZiPzhCkPMeELzLhQMEIqjo'
const expiredToken =
  'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiY2h3IiwiaWF0IjoxNTMwNzc2OTYxLCJleHAiOjE1MzA3Nzc1NjEsInN1YiI6IjViMzI1YTYyMGVmNDgxM2UzMDhhNDMxMyJ9.leJuSng-PmQvFCS-FrIl9-Z2iYitwuX274QHkDoVQGmHtfi9SsKIRmZ1OlNRS6g7eT4LvvUDjwBZvCO7Rvhf_vnrHmHE4JR_e9MWVoK_0vjxCkDmo-cZ6iM7aBzrB4-F1eaaZJwxrwPFY5o_rsxCAeHj-draVYQTEr388y-rffdaC7IHoHhTrGoj8n40d8RyvX7UVVG5w1zsxFhYlN44zvMDNy56zGpbJ7mNn3M6hJWGUjDaOhtsEpfyDeoeiuEkU4Rn_WxtbognqLt12P6TQWsQOy_eHqR2UfBdmPw_uSW28FFQh9ebOEjMSI0JnIFXagrWkkFVO2DcBh8YlGE5M_fZWrrkz9pTiVb1KQWTz_TPUf8VVlTRNBKCnumiQJRIkWNxIecYwKap_HpKd5SaD8sLgB3htmomfJE4h4nu-7Tjy_QYw_2Sm4upDCEcB-mjx_EeIVTQXk5Re3QMhY1hEh9tD0kDhJudPQWBG7g8GQy2ZBmy6CtP7FQ-tRdyOE_0TNazZSB4Ogz8im5c2ZSVRWalPZWp0TupiSWI5sY-k_Qab6hpbxAFxqsH-8eRelos4y9Ohh60mpNNIqZkizSLfoWKgR5tMBkyDbMPbfbDUEKYKSa5b29uCeAHeJXvW-A0Nk5YwiPNZIe2ycuVaWUaDnL3vvbb5yrTG1eDuhFm_xw'

const assign = window.location.assign as jest.Mock

beforeEach(() => {
  getItem.mockReset()
})

it('renders without crashing', () =>
  createTestApp({ waitUntilResourcesLoaded: false }))

it("redirects user to SSO if user doesn't have a token", async () => {
  await createTestApp({ waitUntilResourcesLoaded: false })
  await waitFor(() => assign.mock.calls[0][0] === window.config.LOGIN_URL)
})

describe('when user has a valid token in url but an expired one in localStorage', () => {
  beforeEach(async () => {
    getItem.mockReturnValue(expiredToken)
    window.history.replaceState('', '', '?token=' + validToken)
    await createTestApp()
  })

  it("doesn't redirect user to SSO", async () => {
    expect(assign.mock.calls).toHaveLength(0)
  })

  it("doesn't redirect user to SSO if user has a token in their URL", async () => {
    const token =
      'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYWRtaW4iLCJpYXQiOjE1MzMxOTUyMjgsImV4cCI6MTU0MzE5NTIyNywiYXVkIjpbImdhdGV3YXkiXSwic3ViIjoiMSJ9.G4KzkaIsW8fTkkF-O8DI0qESKeBI332UFlTXRis3vJ6daisu06W5cZsgYhmxhx_n0Q27cBYt2OSOnjgR72KGA5IAAfMbAJifCul8ib57R4VJN8I90RWqtvA0qGjV-sPndnQdmXzCJx-RTumzvr_vKPgNDmHzLFNYpQxcmQHA-N8li-QHMTzBHU4s9y8_5JOCkudeoTMOd_1021EDAQbrhonji5V1EOSY2woV5nMHhmq166I1L0K_29ngmCqQZYi1t6QBonsIowlXJvKmjOH5vXHdCCJIFnmwHmII4BK-ivcXeiVOEM_ibfxMWkAeTRHDshOiErBFeEvqd6VWzKvbKAH0UY-Rvnbh4FbprmO4u4_6Yd2y2HnbweSo-v76dVNcvUS0GFLFdVBt0xTay-mIeDy8CKyzNDOWhmNUvtVi9mhbXYfzzEkwvi9cWwT1M8ZrsWsvsqqQbkRCyBmey_ysvVb5akuabenpPsTAjiR8-XU2mdceTKqJTwbMU5gz-8fgulbTB_9TNJXqQlH7tyYXMWHUY3uiVHWg2xgjRiGaXGTiDgZd01smYsxhVnPAddQOhqZYCrAgVcT1GBFVvhO7CC-rhtNlLl21YThNNZNpJHsCgg31WA9gMQ_2qAJmw2135fAyylO8q7ozRUvx46EezZiPzhCkPMeELzLhQMEIqjo'

    window.history.replaceState({}, '', '?token=' + token)

    await createTestApp()
    expect(assign.mock.calls).toHaveLength(0)
  })
})

describe('when session expired', () => {
  let app: ReactWrapper
  let store: AppStore

  beforeEach(async () => {
    const testApp = await createTestApp({ waitUntilResourcesLoaded: false })
    app = testApp.app
    store = testApp.store
  })

  it('when apolloClient is created', () => {
    const client = createClient(store)
    expect(client.link).toBeDefined()
  })

  it('displays session expired confirmation dialog', async () => {
    const action = actions.showSessionExpireConfirmation()
    await store.dispatch(action)
    app.update()

    expect(app.find('#login').hostNodes()).toHaveLength(1)
  })
})

describe('when user has a valid token in local storage', () => {
  beforeEach(() => {
    getItem.mockReturnValue(validToken)
  })

  it("doesn't redirect user to SSO", async () => {
    createTestApp()
    await flushPromises()
    expect(assign.mock.calls).toHaveLength(0)
  })

  it('loads languages, facilities and locations on startup', async () => {
    const loadFacilities = jest.spyOn(referenceApi, 'loadFacilities')
    const loadDefinitions = jest.spyOn(referenceApi, 'loadDefinitions')
    const loadLocations = jest.spyOn(referenceApi, 'loadLocations')

    createTestApp()
    await flushPromises()
    expect(loadFacilities).toHaveBeenCalled()
    expect(loadDefinitions).toHaveBeenCalled()
    expect(loadLocations).toHaveBeenCalled()
  })
})

describe('it handles react errors', () => {
  const { store } = createStore()
  it('displays react error page', async () => {
    function Problem(): JSX.Element {
      throw new Error('Error thrown.')
    }
    const testComponent = await createTestComponent(
      <StyledErrorBoundary>
        <Problem />
      </StyledErrorBoundary>,
      store
    )
    // @ts-ignore
    expect(
      testComponent.component.find('#GoToHomepage').hostNodes()
    ).toHaveLength(1)
  })
})

describe('it handles react unauthorized errors', () => {
  const { store } = createStore()
  it('displays react error page', async () => {
    function Problem(): JSX.Element {
      throw new Error('401')
    }
    const testComponent = await createTestComponent(
      <StyledErrorBoundary>
        <Problem />
      </StyledErrorBoundary>,
      store
    )

    expect(
      testComponent.component.find('#GoToHomepage').hostNodes()
    ).toHaveLength(1)

    testComponent.component
      .find('#GoToHomepage')
      .hostNodes()
      .simulate('click')
  })

  xit('Should create a failed test', () => {
    expect(true).toBe(false)
  })
})
