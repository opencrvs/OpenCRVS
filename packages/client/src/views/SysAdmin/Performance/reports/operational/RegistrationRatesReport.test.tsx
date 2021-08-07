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
import { createTestComponent } from '@client/tests/util'
import { RegistrationRatesReport } from './RegistrationRatesReport'
import { createStore } from '@client/store'
import * as React from 'react'
import { GQLEventEstimationMetrics } from '@opencrvs/gateway/src/graphql/schema'
import { waitForElement } from '@client/tests/wait-for-element'
import { ReactWrapper } from 'enzyme'

describe('Registration rates report', () => {
  const { store } = createStore()
  const onDetailsClickMock: jest.Mock = jest.fn()

  it('renders loading indicator', async () => {
    const { component } = await createTestComponent(
      <RegistrationRatesReport
        loading={true}
        onClickEventDetails={onDetailsClickMock}
      />,
      store
    )

    expect(
      component.find('#registration-rates-reports-loader').hostNodes()
    ).toHaveLength(1)
    expect(
      component.find('#registration-rates-reports').hostNodes()
    ).toHaveLength(0)
  })

  describe('when it has data in props', () => {
    let component: ReactWrapper<{}, {}>
    beforeEach(async () => {
      const data: GQLEventEstimationMetrics = {
        birth45DayMetrics: {
          actualRegistration: 0,
          estimatedPercentage: 0,
          estimatedRegistration: 0,
          malePercentage: 0,
          femalePercentage: 0
        },
        death45DayMetrics: {
          actualRegistration: 0,
          estimatedPercentage: 0,
          estimatedRegistration: 0,
          malePercentage: 0,
          femalePercentage: 0
        }
      }
      component = (
        await createTestComponent(
          <RegistrationRatesReport
            data={data}
            onClickEventDetails={onDetailsClickMock}
          />,
          store
        )
      ).component
    })
    it('renders reports', async () => {
      expect(
        component.find('#registration-rates-reports-loader').hostNodes()
      ).toHaveLength(0)
      expect(
        component.find('#registration-rates-reports').hostNodes()
      ).toHaveLength(1)
    })

    it('clicking on the link buttons triggers onDetailsClick', async () => {
      const birthEventLink = await waitForElement(
        component,
        '#birth-registration-detalis-link'
      )

      birthEventLink.hostNodes().simulate('click')
      expect(onDetailsClickMock).toBeCalledWith(
        'birth',
        'Birth registration rate within 45 days of event'
      )
      const deathEventLink = await waitForElement(
        component,
        '#death-registration-detalis-link'
      )
      deathEventLink.hostNodes().simulate('click')
      expect(onDetailsClickMock).toBeCalledWith(
        'death',
        'Death registration rate within 45 days of event'
      )
    })
  })
})
