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
import { createTestComponent } from '@client/tests/util'
import { ReactWrapper } from 'enzyme'
import {
  SysAdminContentWrapper,
  SysAdminPageVariant
} from './SysAdminContentWrapper'

describe('Performance content wrapper', () => {
  const { store } = createStore()

  describe('Tab menu', () => {
    let app: ReactWrapper

    beforeAll(async () => {
      app = (
        await createTestComponent(
          <SysAdminContentWrapper
            type={SysAdminPageVariant.SUBPAGE}
            headerTitle="Subpage"
            backActionHandler={() => {}}
          />,
          store
        )
      ).component
      app.update()
    })

    it('shows sub page variant', () => {
      expect(app.find('#sub-page-header').hostNodes()).toHaveLength(1)
    })
  })
})
