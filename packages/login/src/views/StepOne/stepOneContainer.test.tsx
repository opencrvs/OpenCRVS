/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * OpenCRVS is also distributed under the terms of the Civil Registration
 * & Healthcare Disclaimer located at http://opencrvs.org/license.
 *
 * Copyright (C) The OpenCRVS Authors located at https://github.com/opencrvs/opencrvs-core/blob/master/AUTHORS.
 */
import * as React from 'react'
import { ReactWrapper } from 'enzyme'
import { StepOneContainer } from '@login/views/StepOne/StepOneContainer'
import { createTestComponent, createTestApp } from '@login/tests/util'
import { client } from '@login/utils/authApi'
import { applicationConfigLoadedAction } from '@login/login/actions'

describe('Login app step one', () => {
  describe('Step One Container', () => {
    let component: ReactWrapper

    beforeEach(() => {
      component = createTestComponent(<StepOneContainer />)
    })
    it('renders successfully', () => {
      expect(component.find('form#STEP_ONE')).toHaveLength(1)
    })
  })

  describe('Step One Form', () => {
    let component: ReactWrapper

    beforeEach(async () => {
      const testApp = await createTestApp()
      component = testApp.app
      testApp.store.dispatch(
        applicationConfigLoadedAction({
          config: {
            APPLICATION_NAME: 'Dummy App',
            COUNTRY: 'dum',
            COUNTRY_LOGO: {
              fileName: 'dummy-file-name',
              file: 'dummy-logo'
            },

            LOGIN_BACKGROUND: {
              backgroundColor: 'FFF',
              backgroundImage: '',
              imageFit: 'FILL'
            },
            SENTRY: '',
            USER_NOTIFICATION_DELIVERY_METHOD: 'sms',
            LIMIT_RECORD_PER_LOCATION: false,
            INFORMANT_NOTIFICATION_DELIVERY_METHOD: 'sms'
          }
        })
      )
      component.update()
    })
    it('loads country logo properly', () => {
      expect(component.find('img').prop('src')).toBe('dummy-logo')
    })
  })
})
