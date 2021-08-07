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
import { AppStore } from '@client/store'
import {
  createTestComponent,
  createTestStore,
  flushPromises
} from '@client/tests/util'
import { waitForElement } from '@client/tests/wait-for-element'
import { SEARCH_USERS } from '@client/user/queries'
import { ReactWrapper } from 'enzyme'
import { History } from 'history'
import { stringify } from 'query-string'
import * as React from 'react'
import { UserList } from './UserList'
import { userMutations } from '@client/user/mutations'

describe('User list tests', () => {
  let store: AppStore
  let history: History<any>

  beforeAll(async () => {
    Date.now = jest.fn(() => 1487076708000)
    const { store: testStore, history: testHistory } = await createTestStore()
    store = testStore
    history = testHistory
  })

  describe('Header test', () => {
    it('renders header with user count', async () => {
      const userListMock = [
        {
          request: {
            query: SEARCH_USERS,
            variables: {
              primaryOfficeId: '6e1f3bce-7bcb-4bf6-8e35-0d9facdf158b',
              count: 10
            }
          },
          result: {
            data: {
              searchUsers: {
                totalItems: 0,
                results: []
              }
            }
          }
        }
      ]
      const testComponent = await createTestComponent(
        <UserList
          // @ts-ignore
          location={{
            search: stringify({
              locationId: '6e1f3bce-7bcb-4bf6-8e35-0d9facdf158b'
            })
          }}
        />,
        store,
        userListMock
      )

      // wait for mocked data to load mockedProvider
      await new Promise(resolve => {
        setTimeout(resolve, 200)
      })

      testComponent.component.update()
      const app = testComponent.component
      expect(
        app
          .find('#user_list')
          .hostNodes()
          .html()
      ).toContain('0 users')
    })
    it('load user list in view only mode', async () => {
      const userListMock = [
        {
          request: {
            query: SEARCH_USERS,
            variables: {
              primaryOfficeId: '6e1f3bce-7bcb-4bf6-8e35-0d9facdf158b',
              count: 10
            }
          },
          result: {
            data: {
              searchUsers: {
                totalItems: 0,
                results: []
              }
            }
          }
        }
      ]
      const { component } = await createTestComponent(
        <UserList
          // @ts-ignore
          location={{
            search: stringify({
              locationId: '6e1f3bce-7bcb-4bf6-8e35-0d9facdf158b',
              viewOnly: true
            })
          }}
        />,
        store,
        userListMock
      )
      component.update()
      expect(component.find('#add-user').length).toBe(0)
    })
    it('add user button redirects to user form', async () => {
      const userListMock = [
        {
          request: {
            query: SEARCH_USERS,
            variables: {
              primaryOfficeId: '0d8474da-0361-4d32-979e-af91f012340a',
              count: 10
            }
          },
          result: {
            data: {
              searchUsers: {
                totalItems: 0,
                results: []
              }
            }
          }
        }
      ]
      const { component } = await createTestComponent(
        <UserList
          // @ts-ignore
          location={{
            search: stringify({
              locationId: '0d8474da-0361-4d32-979e-af91f012340a'
            })
          }}
        />,
        store,
        userListMock
      )
      component.update()

      const addUser = await waitForElement(component, '#add-user')
      addUser.hostNodes().simulate('click')

      component.update()

      expect(history.location.pathname).toContain('/createUserInLocation')
    })
    it('add user button redirects to office selection form for invalid location id', async () => {
      const userListMock = [
        {
          request: {
            query: SEARCH_USERS,
            variables: {
              primaryOfficeId: '6e1f3bce-7bcb-4bf6-8e35-0d9facdf158b',
              count: 10
            }
          },
          result: {
            data: {
              searchUsers: {
                totalItems: 0,
                results: []
              }
            }
          }
        }
      ]
      const { component } = await createTestComponent(
        <UserList
          // @ts-ignore
          location={{
            search: stringify({
              locationId: '6e1f3bce-7bcb-4bf6-8e35-0d9facdf158b'
            })
          }}
        />,
        store,
        userListMock
      )
      component.update()

      const addUser = await waitForElement(component, '#add-user')
      addUser.hostNodes().simulate('click')

      component.update()

      expect(history.location.pathname).toContain('/createUser')
    })
  })

  describe('Table test', () => {
    it('renders no result text for empty user list in response', async () => {
      const userListMock = [
        {
          request: {
            query: SEARCH_USERS,
            variables: {
              primaryOfficeId: '6e1f3bce-7bcb-4bf6-8e35-0d9facdf158b',
              count: 10
            }
          },
          result: {
            data: {
              searchUsers: {
                totalItems: 0,
                results: []
              }
            }
          }
        }
      ]
      const testComponent = await createTestComponent(
        // @ts-ignore
        <UserList
          // @ts-ignore
          location={{
            search: stringify({
              locationId: '6e1f3bce-7bcb-4bf6-8e35-0d9facdf158b'
            })
          }}
        />,
        store,
        userListMock
      )

      // wait for mocked data to load mockedProvider
      await new Promise(resolve => {
        setTimeout(resolve, 100)
      })

      testComponent.component.update()
      const app = testComponent.component
      expect(app.find('#no-record').hostNodes()).toHaveLength(1)
    })

    describe('Table responsiveness test', () => {
      let component: ReactWrapper<{}, {}>
      const userListMock = [
        {
          request: {
            query: SEARCH_USERS,
            variables: {
              primaryOfficeId: '6e1f3bce-7bcb-4bf6-8e35-0d9facdf158b',
              count: 10
            }
          },
          result: {
            data: {
              searchUsers: {
                totalItems: 5,
                results: [
                  {
                    id: '5d08e102542c7a19fc55b790',
                    name: [
                      {
                        use: 'en',
                        firstNames: 'Rabindranath',
                        familyName: 'Tagore'
                      }
                    ],
                    username: 'r.tagore',
                    role: 'REGISTRATION_AGENT',
                    type: 'ENTREPENEUR',
                    status: 'active',
                    underInvestigation: false
                  },
                  {
                    id: '5d08e102542c7a19fc55b791',
                    name: [
                      {
                        use: 'en',
                        firstNames: 'Mohammad',
                        familyName: 'Ashraful'
                      }
                    ],
                    username: 'm.ashraful',
                    role: 'LOCAL_REGISTRAR',
                    type: 'CHAIRMAN',
                    status: 'active',
                    underInvestigation: false
                  },
                  {
                    id: '5d08e102542c7a19fc55b792',
                    name: [
                      {
                        use: 'en',
                        firstNames: 'Muhammad Abdul',
                        familyName: 'Muid Khan'
                      }
                    ],
                    username: 'ma.muidkhan',
                    role: 'DISTRICT_REGISTRAR',
                    type: 'MAYOR',
                    status: 'pending',
                    underInvestigation: false
                  },
                  {
                    id: '5d08e102542c7a19fc55b793',
                    name: [
                      {
                        use: 'en',
                        firstNames: 'Nasreen Pervin',
                        familyName: 'Huq'
                      }
                    ],
                    username: 'np.huq',
                    role: 'STATE_REGISTRAR',
                    type: 'MAYOR',
                    status: 'active',
                    underInvestigation: false
                  },
                  {
                    id: '5d08e102542c7a19fc55b795',
                    name: [
                      {
                        use: 'en',
                        firstNames: 'Md. Ariful',
                        familyName: 'Islam'
                      }
                    ],
                    username: 'ma.islam',
                    role: 'FIELD_AGENT',
                    type: 'HOSPITAL',
                    status: 'disabled',
                    underInvestigation: false
                  }
                ]
              }
            }
          }
        }
      ]
      it('redirecting to user profile for smaller devices', async () => {
        Object.defineProperty(window, 'location', {
          value: { href: 'location:3000/team/users' }
        })
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: 400
        })
        const testComponent = await createTestComponent(
          <UserList
            // @ts-ignore
            location={{
              search: stringify({
                locationId: '6e1f3bce-7bcb-4bf6-8e35-0d9facdf158b'
              })
            }}
          />,
          store,
          userListMock
        )

        // wait for mocked data to load mockedProvider
        await new Promise(resolve => {
          setTimeout(resolve, 100)
        })

        testComponent.component.update()
        component = testComponent.component

        component
          .find('#name-role-type-link-5d08e102542c7a19fc55b790')
          .hostNodes()
          .simulate('click')

        // wait for mocked data to load mockedProvider
        await new Promise(resolve => {
          setTimeout(resolve, 100)
        })

        testComponent.component.update()

        expect(history.location.pathname).toContain(
          '/userProfile/5d08e102542c7a19fc55b790'
        )
      })
      it('renders 2 columns for smaller devices', async () => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: 400
        })
        const testComponent = await createTestComponent(
          <UserList
            // @ts-ignore
            location={{
              search: stringify({
                locationId: '6e1f3bce-7bcb-4bf6-8e35-0d9facdf158b'
              })
            }}
          />,
          store,
          userListMock
        )

        // wait for mocked data to load mockedProvider
        await new Promise(resolve => {
          setTimeout(resolve, 100)
        })

        testComponent.component.update()
        component = testComponent.component

        expect(component.find('div#row_4').children()).toHaveLength(2)
      })

      it('renders 3 columns for midium devices', async () => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: 700
        })
        const testComponent = await createTestComponent(
          <UserList
            // @ts-ignore
            location={{
              search: stringify({
                locationId: '6e1f3bce-7bcb-4bf6-8e35-0d9facdf158b'
              })
            }}
          />,
          store,
          userListMock
        )

        // wait for mocked data to load mockedProvider
        await new Promise(resolve => {
          setTimeout(resolve, 100)
        })

        testComponent.component.update()
        component = testComponent.component

        expect(component.find('div#row_4').children()).toHaveLength(3)
      })

      it('renders 4 columns for bigger devices on viewOnly mode', async () => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: 1100
        })
        const testComponent = await createTestComponent(
          <UserList
            // @ts-ignore
            location={{
              search: stringify({
                locationId: '6e1f3bce-7bcb-4bf6-8e35-0d9facdf158b',
                viewOnly: true
              })
            }}
          />,
          store,
          userListMock
        )

        // wait for mocked data to load mockedProvider
        await new Promise(resolve => {
          setTimeout(resolve, 100)
        })

        testComponent.component.update()
        component = testComponent.component

        expect(component.find('div#row_4').children()).toHaveLength(4)
      })

      it('renders 5 columns for bigger devices', async () => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: 1100
        })
        const testComponent = await createTestComponent(
          <UserList
            // @ts-ignore
            location={{
              search: stringify({
                locationId: '6e1f3bce-7bcb-4bf6-8e35-0d9facdf158b'
              })
            }}
          />,
          store,
          userListMock
        )

        // wait for mocked data to load mockedProvider
        await new Promise(resolve => {
          setTimeout(resolve, 100)
        })

        testComponent.component.update()
        component = testComponent.component

        expect(component.find('div#row_4').children()).toHaveLength(5)
      })
    })

    describe('when there is a result from query', () => {
      userMutations.resendSMSInvite = jest.fn()
      let component: ReactWrapper<{}, {}>
      const userListMock = [
        {
          request: {
            query: SEARCH_USERS,
            variables: {
              primaryOfficeId: '6e1f3bce-7bcb-4bf6-8e35-0d9facdf158b',
              count: 10
            }
          },
          result: {
            data: {
              searchUsers: {
                totalItems: 5,
                results: [
                  {
                    id: '5d08e102542c7a19fc55b790',
                    name: [
                      {
                        use: 'en',
                        firstNames: 'Rabindranath',
                        familyName: 'Tagore'
                      }
                    ],
                    username: 'r.tagore',
                    role: 'REGISTRATION_AGENT',
                    type: 'ENTREPENEUR',
                    status: 'active',
                    underInvestigation: false
                  },
                  {
                    id: '5d08e102542c7a19fc55b791',
                    name: [
                      {
                        use: 'en',
                        firstNames: 'Mohammad',
                        familyName: 'Ashraful'
                      }
                    ],
                    username: 'm.ashraful',
                    role: 'LOCAL_REGISTRAR',
                    type: 'CHAIRMAN',
                    status: 'active',
                    underInvestigation: false
                  },
                  {
                    id: '5d08e102542c7a19fc55b792',
                    name: [
                      {
                        use: 'en',
                        firstNames: 'Muhammad Abdul',
                        familyName: 'Muid Khan'
                      }
                    ],
                    username: 'ma.muidkhan',
                    role: 'DISTRICT_REGISTRAR',
                    type: 'MAYOR',
                    status: 'pending',
                    underInvestigation: false
                  },
                  {
                    id: '5d08e102542c7a19fc55b793',
                    name: [
                      {
                        use: 'en',
                        firstNames: 'Nasreen Pervin',
                        familyName: 'Huq'
                      }
                    ],
                    username: 'np.huq',
                    role: 'STATE_REGISTRAR',
                    type: 'MAYOR',
                    status: 'deactivated',
                    underInvestigation: true
                  },
                  {
                    id: '5d08e102542c7a19fc55b795',
                    name: [
                      {
                        use: 'en',
                        firstNames: 'Md. Ariful',
                        familyName: 'Islam'
                      }
                    ],
                    username: 'ma.islam',
                    role: 'FIELD_AGENT',
                    type: 'HOSPITAL',
                    status: 'disabled',
                    underInvestigation: false
                  }
                ]
              }
            }
          }
        }
      ]

      beforeEach(async () => {
        const testComponent = await createTestComponent(
          <UserList
            // @ts-ignore
            location={{
              search: stringify({
                locationId: '6e1f3bce-7bcb-4bf6-8e35-0d9facdf158b'
              })
            }}
          />,
          store,
          userListMock
        )

        // wait for mocked data to load mockedProvider
        await new Promise(resolve => {
          setTimeout(resolve, 100)
        })

        testComponent.component.update()
        component = testComponent.component
      })

      it('renders list of users', () => {
        expect(component.find('#user_list').hostNodes()).toHaveLength(1)
      })

      it('clicking on toggleMenu pops up menu options', async () => {
        const toggleButtonElement = await waitForElement(
          component,
          '#user-item-0-menuToggleButton'
        )

        toggleButtonElement.hostNodes().simulate('click')
        const menuOptionButton = await waitForElement(
          component,
          '#user-item-0-menuItem0'
        )
        expect(menuOptionButton.hostNodes()).toHaveLength(1)
      })

      it('clicking on menu options takes to user review page', async () => {
        const toggleButtonElement = await waitForElement(
          component,
          '#user-item-0-menuToggleButton'
        )

        toggleButtonElement.hostNodes().simulate('click')
        const menuOptionButton = await waitForElement(
          component,
          '#user-item-0-menuItem0'
        )
        menuOptionButton.hostNodes().simulate('click')
        await flushPromises()
        expect(history.location.pathname).toMatch(/.user\/(\w)+\/preview\/*/)
      })

      it('clicking on menu options Resend SMS invite sends invite', async () => {
        ;(userMutations.resendSMSInvite as jest.Mock).mockResolvedValueOnce({
          data: { resendSMSInvite: 'true' }
        })
        const toggleButtonElement = await waitForElement(
          component,
          '#user-item-1-menuToggleButton'
        )

        toggleButtonElement.hostNodes().simulate('click')
        const menuOptionButton = await waitForElement(
          component,
          '#user-item-1-menuItem1'
        )
        expect(menuOptionButton.hostNodes().text()).toBe('Resend SMS invite')
        menuOptionButton.hostNodes().simulate('click')
        await flushPromises()
        component.update()
        await waitForElement(component, '#resend_invite_success')
      })

      it('clicking on menu options Resend SMS invite shows error if any submission error', async () => {
        ;(userMutations.resendSMSInvite as jest.Mock).mockRejectedValueOnce(
          new Error('Something went wrong')
        )
        const toggleButtonElement = await waitForElement(
          component,
          '#user-item-1-menuToggleButton'
        )

        toggleButtonElement.hostNodes().simulate('click')
        const menuOptionButton = await waitForElement(
          component,
          '#user-item-1-menuItem1'
        )
        expect(menuOptionButton.hostNodes().text()).toBe('Resend SMS invite')
        menuOptionButton.hostNodes().simulate('click')
        await flushPromises()
        component.update()
        await waitForElement(component, '#resend_invite_error')
      })

      it('clicking on menu options deactivate to user pops up audit action modal', async () => {
        const toggleButtonElement = await waitForElement(
          component,
          '#user-item-1-menuToggleButton'
        )

        toggleButtonElement.hostNodes().simulate('click')
        const menuOptionButton = await waitForElement(
          component,
          '#user-item-1-menuItem2'
        )
        expect(menuOptionButton.hostNodes().text()).toBe('Deactivate')
        menuOptionButton.hostNodes().simulate('click')
        await waitForElement(component, '#user-audit-modal')
      })

      it('clicking on menu options reactivate to user pops up audit action modal', async () => {
        const toggleButtonElement = await waitForElement(
          component,
          '#user-item-3-menuToggleButton'
        )

        toggleButtonElement.hostNodes().simulate('click')
        const menuOptionButton = await waitForElement(
          component,
          '#user-item-3-menuItem1'
        )
        expect(menuOptionButton.hostNodes().text()).toBe('Reactivate')
        menuOptionButton.hostNodes().simulate('click')
        await waitForElement(component, '#user-audit-modal')
      })

      it('clicking on name link takes to user preview page', async () => {
        const nameLink = await waitForElement(
          component,
          '#name-link-5d08e102542c7a19fc55b790'
        )

        nameLink.hostNodes().simulate('click')
        await flushPromises()
        expect(history.location.pathname).toBe(
          '/userProfile/5d08e102542c7a19fc55b790'
        )
      })
    })
  })

  describe('Pagination test', () => {
    it('renders no pagination block when the total amount of data is not applicable for pagination', async () => {
      const userListMock = [
        {
          request: {
            query: SEARCH_USERS,
            variables: {
              primaryOfficeId: '6e1f3bce-7bcb-4bf6-8e35-0d9facdf158b',
              count: 10
            }
          },
          result: {
            data: {
              searchUsers: {
                totalItems: 5,
                results: [
                  {
                    id: '5d08e102542c7a19fc55b790',
                    name: [
                      {
                        use: 'en',
                        firstNames: 'Rabindranath',
                        familyName: 'Tagore'
                      }
                    ],
                    username: 'r.tagore',
                    role: 'REGISTRATION_AGENT',
                    type: 'ENTREPENEUR',
                    status: 'active',
                    underInvestigation: false
                  },
                  {
                    id: '5d08e102542c7a19fc55b791',
                    name: [
                      {
                        use: 'en',
                        firstNames: 'Mohammad',
                        familyName: 'Ashraful'
                      }
                    ],
                    username: 'm.ashraful',
                    role: 'LOCAL_REGISTRAR',
                    type: 'CHAIRMAN',
                    status: 'active',
                    underInvestigation: false
                  },
                  {
                    id: '5d08e102542c7a19fc55b792',
                    name: [
                      {
                        use: 'en',
                        firstNames: 'Muhammad Abdul',
                        familyName: 'Muid Khan'
                      }
                    ],
                    username: 'ma.muidkhan',
                    role: 'DISTRICT_REGISTRAR',
                    type: 'MAYOR',
                    status: 'pending',
                    underInvestigation: false
                  },
                  {
                    id: '5d08e102542c7a19fc55b793',
                    name: [
                      {
                        use: 'en',
                        firstNames: 'Nasreen Pervin',
                        familyName: 'Huq'
                      }
                    ],
                    username: 'np.huq',
                    role: 'STATE_REGISTRAR',
                    type: 'MAYOR',
                    status: 'active',
                    underInvestigation: false
                  },
                  {
                    id: '5d08e102542c7a19fc55b795',
                    name: [
                      {
                        use: 'en',
                        firstNames: 'Md. Ariful',
                        familyName: 'Islam'
                      }
                    ],
                    username: 'ma.islam',
                    role: 'FIELD_AGENT',
                    type: 'HOSPITAL',
                    status: 'disabled',
                    underInvestigation: false
                  }
                ]
              }
            }
          }
        }
      ]
      const testComponent = await createTestComponent(
        <UserList
          // @ts-ignore
          location={{
            search: stringify({
              locationId: '6e1f3bce-7bcb-4bf6-8e35-0d9facdf158b'
            })
          }}
        />,
        store,
        userListMock
      )

      // wait for mocked data to load mockedProvider
      await new Promise(resolve => {
        setTimeout(resolve, 100)
      })

      testComponent.component.update()
      const app = testComponent.component
      expect(app.find('#pagination').hostNodes()).toHaveLength(0)
    })
    it('renders pagination block with proper page value when the total amount of data is applicable for pagination', async () => {
      const userListMock = [
        {
          request: {
            query: SEARCH_USERS,
            variables: {
              primaryOfficeId: '6e1f3bce-7bcb-4bf6-8e35-0d9facdf158b',
              count: 10
            }
          },
          result: {
            data: {
              searchUsers: {
                totalItems: 15,
                results: [
                  {
                    id: '5d08e102542c7a19fc55b790',
                    name: [
                      {
                        use: 'en',
                        firstNames: 'Rabindranath',
                        familyName: 'Tagore'
                      }
                    ],
                    username: 'r.tagore',
                    role: 'REGISTRATION_AGENT',
                    type: 'ENTREPENEUR',
                    status: 'active',
                    underInvestigation: false
                  },
                  {
                    id: '5d08e102542c7a19fc55b791',
                    name: [
                      {
                        use: 'en',
                        firstNames: 'Mohammad',
                        familyName: 'Ashraful'
                      }
                    ],
                    username: 'm.ashraful',
                    role: 'LOCAL_REGISTRAR',
                    type: 'CHAIRMAN',
                    status: 'active',
                    underInvestigation: false
                  },
                  {
                    id: '5d08e102542c7a19fc55b792',
                    name: [
                      {
                        use: 'en',
                        firstNames: 'Muhammad Abdul',
                        familyName: 'Muid Khan'
                      }
                    ],
                    username: 'ma.muidkhan',
                    role: 'DISTRICT_REGISTRAR',
                    type: 'MAYOR',
                    status: 'active',
                    underInvestigation: false
                  },
                  {
                    id: '5d08e102542c7a19fc55b793',
                    name: [
                      {
                        use: 'en',
                        firstNames: 'Nasreen Pervin',
                        familyName: 'Huq'
                      }
                    ],
                    username: 'np.huq',
                    role: 'STATE_REGISTRAR',
                    type: 'MAYOR',
                    status: 'active',
                    underInvestigation: false
                  },
                  {
                    id: '5d08e102542c7a19fc55b795',
                    name: [
                      {
                        use: 'en',
                        firstNames: 'Md. Ariful',
                        familyName: 'Islam'
                      }
                    ],
                    username: 'ma.islam',
                    role: 'FIELD_AGENT',
                    type: 'HOSPITAL',
                    status: 'active',
                    underInvestigation: false
                  },
                  {
                    id: '5d08e102542c7a19fc55b796',
                    name: [
                      {
                        use: 'en',
                        firstNames: 'Md. Ashraful',
                        familyName: 'Alam'
                      }
                    ],
                    username: 'ma.alam',
                    role: 'FIELD_AGENT',
                    type: 'CHA',
                    status: 'active',
                    underInvestigation: false
                  },
                  {
                    id: '5d08e102542c7a19fc55b797',
                    name: [
                      {
                        use: 'en',
                        firstNames: 'Lovely',
                        familyName: 'Khatun'
                      }
                    ],
                    username: 'l.khatun',
                    role: 'REGISTRATION_AGENT',
                    type: 'DATA_ENTRY_CLERK',
                    status: 'active',
                    underInvestigation: false
                  },
                  {
                    id: '5d08e102542c7a19fc55b794',
                    name: [
                      {
                        use: 'en',
                        firstNames: 'Mohamed Abu',
                        familyName: 'Abdullah'
                      }
                    ],
                    username: 'ma.abdullah',
                    role: 'NATIONAL_REGISTRAR',
                    type: 'SECRETARY',
                    status: 'active',
                    underInvestigation: false
                  },
                  {
                    id: '5d08e102542c7a19fc55b798',
                    name: [
                      {
                        use: 'en',
                        firstNames: 'Md. Seikh',
                        familyName: 'Farid'
                      }
                    ],
                    username: 'ms.farid',
                    role: 'REGISTRATION_AGENT',
                    type: 'DATA_ENTRY_CLERK',
                    status: 'active',
                    underInvestigation: false
                  },
                  {
                    id: '5d08e102542c7a19fc55b799',
                    name: [
                      {
                        use: 'en',
                        firstNames: 'Md. Jahangir',
                        familyName: 'Alam'
                      }
                    ],
                    username: 'mj.alam',
                    role: 'LOCAL_REGISTRAR',
                    type: 'CHAIRMAN',
                    status: 'active',
                    underInvestigation: false
                  }
                ]
              }
            }
          }
        }
      ]
      const testComponent = await createTestComponent(
        <UserList
          // @ts-ignore
          location={{
            search: stringify({
              locationId: '6e1f3bce-7bcb-4bf6-8e35-0d9facdf158b'
            })
          }}
        />,
        store,
        userListMock
      )

      // wait for mocked data to load mockedProvider
      await new Promise(resolve => {
        setTimeout(resolve, 100)
      })

      testComponent.component.update()
      const app = testComponent.component
      expect(
        app
          .find('#load_more_button')
          .hostNodes()
          .text()
      ).toContain('Show next 10')
    })
    it('renders next page of the user list when the next page button is pressed', async () => {
      const userListMock = [
        {
          request: {
            query: SEARCH_USERS,
            variables: {
              primaryOfficeId: '6e1f3bce-7bcb-4bf6-8e35-0d9facdf158b',
              count: 10
            }
          },
          result: {
            data: {
              searchUsers: {
                totalItems: 15,
                results: [
                  {
                    id: '5d08e102542c7a19fc55b790',
                    name: [
                      {
                        use: 'en',
                        firstNames: 'Rabindranath',
                        familyName: 'Tagore'
                      }
                    ],
                    username: 'r.tagore',
                    role: 'REGISTRATION_AGENT',
                    type: 'ENTREPENEUR',
                    status: 'active',
                    underInvestigation: false
                  },
                  {
                    id: '5d08e102542c7a19fc55b791',
                    name: [
                      {
                        use: 'en',
                        firstNames: 'Mohammad',
                        familyName: 'Ashraful'
                      }
                    ],
                    username: 'm.ashraful',
                    role: 'LOCAL_REGISTRAR',
                    type: 'CHAIRMAN',
                    status: 'active',
                    underInvestigation: false
                  },
                  {
                    id: '5d08e102542c7a19fc55b792',
                    name: [
                      {
                        use: 'en',
                        firstNames: 'Muhammad Abdul',
                        familyName: 'Muid Khan'
                      }
                    ],
                    username: 'ma.muidkhan',
                    role: 'DISTRICT_REGISTRAR',
                    type: 'MAYOR',
                    status: 'active',
                    underInvestigation: false
                  },
                  {
                    id: '5d08e102542c7a19fc55b793',
                    name: [
                      {
                        use: 'en',
                        firstNames: 'Nasreen Pervin',
                        familyName: 'Huq'
                      }
                    ],
                    username: 'np.huq',
                    role: 'STATE_REGISTRAR',
                    type: 'MAYOR',
                    status: 'active',
                    underInvestigation: false
                  },
                  {
                    id: '5d08e102542c7a19fc55b795',
                    name: [
                      {
                        use: 'en',
                        firstNames: 'Md. Ariful',
                        familyName: 'Islam'
                      }
                    ],
                    username: 'ma.islam',
                    role: 'FIELD_AGENT',
                    type: 'HOSPITAL',
                    status: 'active',
                    underInvestigation: false
                  },
                  {
                    id: '5d08e102542c7a19fc55b796',
                    name: [
                      {
                        use: 'en',
                        firstNames: 'Md. Ashraful',
                        familyName: 'Alam'
                      }
                    ],
                    username: 'ma.alam',
                    role: 'FIELD_AGENT',
                    type: 'CHA',
                    status: 'active',
                    underInvestigation: false
                  },
                  {
                    id: '5d08e102542c7a19fc55b797',
                    name: [
                      {
                        use: 'en',
                        firstNames: 'Lovely',
                        familyName: 'Khatun'
                      }
                    ],
                    username: 'l.khatun',
                    role: 'REGISTRATION_AGENT',
                    type: 'DATA_ENTRY_CLERK',
                    status: 'active',
                    underInvestigation: false
                  },
                  {
                    id: '5d08e102542c7a19fc55b794',
                    name: [
                      {
                        use: 'en',
                        firstNames: 'Mohamed Abu',
                        familyName: 'Abdullah'
                      }
                    ],
                    username: 'ma.abdullah',
                    role: 'NATIONAL_REGISTRAR',
                    type: 'SECRETARY',
                    status: 'active',
                    underInvestigation: false
                  },
                  {
                    id: '5d08e102542c7a19fc55b798',
                    name: [
                      {
                        use: 'en',
                        firstNames: 'Md. Seikh',
                        familyName: 'Farid'
                      }
                    ],
                    username: 'ms.farid',
                    role: 'REGISTRATION_AGENT',
                    type: 'DATA_ENTRY_CLERK',
                    status: 'active',
                    underInvestigation: false
                  },
                  {
                    id: '5d08e102542c7a19fc55b799',
                    name: [
                      {
                        use: 'en',
                        firstNames: 'Md. Jahangir',
                        familyName: 'Alam'
                      }
                    ],
                    username: 'mj.alam',
                    role: 'LOCAL_REGISTRAR',
                    type: 'CHAIRMAN',
                    status: 'active',
                    underInvestigation: false
                  }
                ]
              }
            }
          }
        },
        {
          request: {
            query: SEARCH_USERS,
            variables: {
              primaryOfficeId: '6e1f3bce-7bcb-4bf6-8e35-0d9facdf158b',
              count: 20
            }
          },
          result: {
            data: {
              searchUsers: {
                totalItems: 15,
                results: [
                  {
                    id: '5d08e102542c7a19fc55b790',
                    name: [
                      {
                        use: 'en',
                        firstNames: 'Rabindranath',
                        familyName: 'Tagore'
                      }
                    ],
                    username: 'r.tagore',
                    role: 'REGISTRATION_AGENT',
                    type: 'ENTREPENEUR',
                    status: 'active'
                  },
                  {
                    id: '5d08e102542c7a19fc55b791',
                    name: [
                      {
                        use: 'en',
                        firstNames: 'Mohammad',
                        familyName: 'Ashraful'
                      }
                    ],
                    username: 'm.ashraful',
                    role: 'LOCAL_REGISTRAR',
                    type: 'CHAIRMAN',
                    status: 'active'
                  },
                  {
                    id: '5d08e102542c7a19fc55b792',
                    name: [
                      {
                        use: 'en',
                        firstNames: 'Muhammad Abdul',
                        familyName: 'Muid Khan'
                      }
                    ],
                    username: 'ma.muidkhan',
                    role: 'DISTRICT_REGISTRAR',
                    type: 'MAYOR',
                    status: 'active'
                  },
                  {
                    id: '5d08e102542c7a19fc55b793',
                    name: [
                      {
                        use: 'en',
                        firstNames: 'Nasreen Pervin',
                        familyName: 'Huq'
                      }
                    ],
                    username: 'np.huq',
                    role: 'STATE_REGISTRAR',
                    type: 'MAYOR',
                    status: 'active'
                  },
                  {
                    id: '5d08e102542c7a19fc55b795',
                    name: [
                      {
                        use: 'en',
                        firstNames: 'Md. Ariful',
                        familyName: 'Islam'
                      }
                    ],
                    username: 'ma.islam',
                    role: 'FIELD_AGENT',
                    type: 'HOSPITAL',
                    status: 'active'
                  },
                  {
                    id: '5d08e102542c7a19fc55b796',
                    name: [
                      {
                        use: 'en',
                        firstNames: 'Md. Ashraful',
                        familyName: 'Alam'
                      }
                    ],
                    username: 'ma.alam',
                    role: 'FIELD_AGENT',
                    type: 'CHA',
                    status: 'active'
                  },
                  {
                    id: '5d08e102542c7a19fc55b797',
                    name: [
                      {
                        use: 'en',
                        firstNames: 'Lovely',
                        familyName: 'Khatun'
                      }
                    ],
                    username: 'l.khatun',
                    role: 'REGISTRATION_AGENT',
                    type: 'DATA_ENTRY_CLERK',
                    status: 'active'
                  },
                  {
                    id: '5d08e102542c7a19fc55b794',
                    name: [
                      {
                        use: 'en',
                        firstNames: 'Mohamed Abu',
                        familyName: 'Abdullah'
                      }
                    ],
                    username: 'ma.abdullah',
                    role: 'NATIONAL_REGISTRAR',
                    type: 'SECRETARY',
                    status: 'active'
                  },
                  {
                    id: '5d08e102542c7a19fc55b798',
                    name: [
                      {
                        use: 'en',
                        firstNames: 'Md. Seikh',
                        familyName: 'Farid'
                      }
                    ],
                    username: 'ms.farid',
                    role: 'REGISTRATION_AGENT',
                    type: 'DATA_ENTRY_CLERK',
                    status: 'active'
                  },
                  {
                    id: '5d08e102542c7a19fc55b799',
                    name: [
                      {
                        use: 'en',
                        firstNames: 'Md. Jahangir',
                        familyName: 'Alam'
                      }
                    ],
                    username: 'mj.alam',
                    role: 'LOCAL_REGISTRAR',
                    type: 'CHAIRMAN',
                    status: 'active'
                  },
                  {
                    id: '5d08e102542c7a19fc55b800',
                    name: [
                      {
                        use: 'en',
                        firstNames: 'Ashraful',
                        familyName: 'Alam'
                      }
                    ],
                    username: 'a.alam',
                    role: 'FIELD_AGENT',
                    type: 'CHA',
                    status: 'active'
                  },
                  {
                    id: '5d08e102542c7a19fc55b801',
                    name: [
                      {
                        use: 'en',
                        firstNames: 'Beauty',
                        familyName: 'Khatun'
                      }
                    ],
                    username: 'b.khatun',
                    role: 'REGISTRATION_AGENT',
                    type: 'DATA_ENTRY_CLERK',
                    status: 'active'
                  },
                  {
                    id: '5d08e102542c7a19fc55b802',
                    name: [
                      {
                        use: 'en',
                        firstNames: 'Abu',
                        familyName: 'Abdullah'
                      }
                    ],
                    username: 'a.abdullah',
                    role: 'NATIONAL_REGISTRAR',
                    type: 'SECRETARY',
                    status: 'active'
                  },
                  {
                    id: '5d08e102542c7a19fc55b803',
                    name: [
                      {
                        use: 'en',
                        firstNames: 'Seikh',
                        familyName: 'Farid'
                      }
                    ],
                    username: 's.farid',
                    role: 'REGISTRATION_AGENT',
                    type: 'DATA_ENTRY_CLERK',
                    status: 'active'
                  },
                  {
                    id: '5d08e102542c7a19fc55b804',
                    name: [
                      {
                        use: 'en',
                        firstNames: 'Jahangir',
                        familyName: 'Alam'
                      }
                    ],
                    username: 'j.alam',
                    role: 'LOCAL_REGISTRAR',
                    type: 'CHAIRMAN',
                    status: 'active'
                  }
                ]
              }
            }
          }
        }
      ]
      const testComponent = await createTestComponent(
        <UserList
          // @ts-ignore
          location={{
            search: stringify({
              locationId: '6e1f3bce-7bcb-4bf6-8e35-0d9facdf158b'
            })
          }}
        />,
        store,
        userListMock
      )

      // wait for mocked data to load mockedProvider
      await new Promise(resolve => {
        setTimeout(resolve, 100)
      })

      testComponent.component.update()
      const app = testComponent.component
      expect(app.find('#load_more_button').hostNodes()).toHaveLength(1)

      app
        .find('#load_more_button')
        .hostNodes()
        .simulate('click')
      await new Promise(resolve => {
        setTimeout(resolve, 100)
      })

      expect(app.find('#load_more_button').hostNodes()).toHaveLength(0)
    })
  })
})
