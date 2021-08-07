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
import { offlineDataReady } from '@client/offline/actions'
import { createStore } from '@client/store'
import {
  createTestComponent,
  flushPromises,
  getFileFromBase64String,
  mockOfflineData,
  validImageB64String
} from '@client/tests/util'
import { waitForElement } from '@client/tests/wait-for-element'
import { modifyUserFormData } from '@client/user/userReducer'
import { CreateNewUser } from '@client/views/SysAdmin/Team/user/userCreation/CreateNewUser'
import {
  mockDataWithRegistarRoleSelected,
  mockFetchRoleGraphqlOperation,
  mockUserGraphqlOperation
} from '@client/views/SysAdmin/Team/utils'
import { ReactWrapper } from 'enzyme'
import * as React from 'react'

describe('signature upload tests', () => {
  const { store, history } = createStore()
  let testComponent: ReactWrapper

  beforeEach(async () => {
    await store.dispatch(
      offlineDataReady({
        languages: mockOfflineData.languages,
        forms: mockOfflineData.forms,
        templates: mockOfflineData.templates,
        locations: mockOfflineData.locations,
        facilities: mockOfflineData.facilities,
        pilotLocations: mockOfflineData.pilotLocations,
        offices: mockOfflineData.offices,
        assets: mockOfflineData.assets
      })
    )
  })

  describe('when user is in signature upload form page', () => {
    beforeEach(async () => {
      testComponent = (
        await createTestComponent(
          // @ts-ignore
          <CreateNewUser
            match={{
              params: {
                sectionId: mockOfflineData.forms.userForm.sections[0].id,
                groupId: mockOfflineData.forms.userForm.sections[0].groups[2].id
              },
              isExact: true,
              path: '/createUser',
              url: ''
            }}
          />,
          store
        )
      ).component
    })

    it('show the signature form page', async () => {
      await new Promise(resolve => {
        setTimeout(resolve, 100)
      })
      testComponent.update()

      const title = testComponent
        .find('#form-title')
        .hostNodes()
        .text()

      expect(title).toBe('Attach the signature')
    })

    it('No error while uploading if valid file', async () => {
      await new Promise(resolve => {
        setTimeout(resolve, 100)
      })
      testComponent.update()
      testComponent
        .find('#image_file_uploader_field')
        .hostNodes()
        .simulate('change', {
          target: {
            files: [
              getFileFromBase64String(
                validImageB64String,
                'index.png',
                'image/png'
              )
            ]
          }
        })
      await flushPromises()
      testComponent.update()

      expect(testComponent.find('#field-error').hostNodes().length).toBe(0)
    })

    it('return if not file', async () => {
      await new Promise(resolve => {
        setTimeout(resolve, 100)
      })
      testComponent.update()
      testComponent
        .find('#image_file_uploader_field')
        .hostNodes()
        .simulate('change', {
          target: {
            files: []
          }
        })
      await flushPromises()
      testComponent.update()

      expect(testComponent.find('#field-error').hostNodes().length).toBe(0)
    })

    it('clicking on confirm button will go to review page', async () => {
      store.dispatch(modifyUserFormData(mockDataWithRegistarRoleSelected))
      const confirmButton = await waitForElement(testComponent, '#confirm_form')
      confirmButton.hostNodes().simulate('click')
      await flushPromises()
      testComponent.update()

      expect(history.location.pathname).toContain(
        '/createUser/preview/preview-registration-office'
      )
    })
  })

  describe('when user in review page', () => {
    beforeEach(async () => {
      store.dispatch(modifyUserFormData(mockDataWithRegistarRoleSelected))
      testComponent = (
        await createTestComponent(
          // @ts-ignore
          <CreateNewUser
            match={{
              params: {
                sectionId: mockOfflineData.forms.userForm.sections[1].id,
                groupId: mockOfflineData.forms.userForm.sections[1].groups[0].id
              },
              isExact: true,
              path: '/createUser',
              url: ''
            }}
          />,
          store,
          [mockFetchRoleGraphqlOperation, mockUserGraphqlOperation]
        )
      ).component
    })

    it('renders review header', () => {
      expect(
        testComponent
          .find('#preview_title')
          .hostNodes()
          .text()
      ).toBe('Please review the new users details')
    })

    it('clicking submit button submits the form data', async () => {
      testComponent
        .find('#submit_user_form')
        .hostNodes()
        .simulate('click')

      await flushPromises()

      expect(store.getState().userForm.submitting).toBe(false)
    })
  })
})
