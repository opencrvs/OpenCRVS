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
import { Spinner, GridTable } from '@opencrvs/components/lib/interface'
import { checkAuth } from '@opencrvs/client/src/profile/profileActions'
import { merge } from 'lodash'
import * as React from 'react'
import { queries } from '@client/profile/queries'
import { SEARCH_EVENTS } from '@client/search/queries'
import { createStore } from '@client/store'
import { createTestComponent, mockUserResponse } from '@client/tests/util'
import { SearchResult } from '@client/views/SearchResult/SearchResult'
import { goToSearch } from '@client/navigation'
import { waitForElement } from '@client/tests/wait-for-element'
import { Event } from '@client/components/DuplicateDetails'
import { storeApplication } from '@client/applications'

const registerScopeToken =
  'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzY29wZSI6WyJyZWdpc3RlciIsImNlcnRpZnkiLCJkZW1vIl0sImlhdCI6MTU0MjY4ODc3MCwiZXhwIjoxNTQzMjkzNTcwLCJhdWQiOlsib3BlbmNydnM6YXV0aC11c2VyIiwib3BlbmNydnM6dXNlci1tZ250LXVzZXIiLCJvcGVuY3J2czpoZWFydGgtdXNlciIsIm9wZW5jcnZzOmdhdGV3YXktdXNlciIsIm9wZW5jcnZzOm5vdGlmaWNhdGlvbi11c2VyIiwib3BlbmNydnM6d29ya2Zsb3ctdXNlciJdLCJpc3MiOiJvcGVuY3J2czphdXRoLXNlcnZpY2UiLCJzdWIiOiI1YmVhYWY2MDg0ZmRjNDc5MTA3ZjI5OGMifQ.ElQd99Lu7WFX3L_0RecU_Q7-WZClztdNpepo7deNHqzro-Cog4WLN7RW3ZS5PuQtMaiOq1tCb-Fm3h7t4l4KDJgvC11OyT7jD6R2s2OleoRVm3Mcw5LPYuUVHt64lR_moex0x_bCqS72iZmjrjS-fNlnWK5zHfYAjF2PWKceMTGk6wnI9N49f6VwwkinJcwJi6ylsjVkylNbutQZO0qTc7HRP-cBfAzNcKD37FqTRNpVSvHdzQSNcs7oiv3kInDN5aNa2536XSd3H-RiKR9hm9eID9bSIJgFIGzkWRd5jnoYxT70G0t03_mTVnDnqPXDtyI-lmerx24Ost0rQLUNIg'
const getItem = window.localStorage.getItem as jest.Mock
const mockFetchUserDetails = jest.fn()

const nameObj = {
  data: {
    getUser: {
      name: [
        {
          use: 'en',
          firstNames: 'Mohammad',
          familyName: 'Ashraful',
          __typename: 'HumanName'
        },
        { use: 'bn', firstNames: '', familyName: '', __typename: 'HumanName' }
      ],
      role: 'DISTRICT_REGISTRAR'
    }
  }
}

merge(mockUserResponse, nameObj)
mockFetchUserDetails.mockReturnValue(mockUserResponse)
queries.fetchUserDetails = mockFetchUserDetails

describe('SearchResult tests', () => {
  const { store } = createStore()

  beforeAll(async () => {
    getItem.mockReturnValue(registerScopeToken)
    await store.dispatch(checkAuth({ '?token': registerScopeToken }))
  })

  it('sets loading state while waiting for data', async () => {
    const testComponent = await createTestComponent(
      // @ts-ignore
      <SearchResult
        match={{
          params: {
            searchText: 'DW0UTHR',
            searchType: 'tracking-id'
          },
          isExact: true,
          path: '',
          url: ''
        }}
      />,
      store
    )

    // @ts-ignore
    expect(testComponent.component.containsMatchingElement(Spinner)).toBe(true)
  })

  it('renders all items returned from graphql query', async () => {
    const graphqlMock = [
      {
        request: {
          operationName: null,
          query: SEARCH_EVENTS,
          variables: {
            locationIds: ['2a83cf14-b959-47f4-8097-f75a75d1867f'],
            sort: 'DESC',
            trackingId: '',
            registrationNumber: '',
            contactNumber: '+8801622688232',
            name: ''
          }
        },
        result: {
          data: {
            searchEvents: {
              totalItems: 4,
              results: [
                {
                  id: 'bc09200d-0160-43b4-9e2b-5b9e90424e95',
                  type: 'Death',
                  __typename: 'X',
                  registration: {
                    __typename: 'X',
                    status: 'DECLARED',
                    trackingId: 'DW0UTHR',
                    registrationNumber: null,
                    duplicates: ['308c35b4-04f8-4664-83f5-9790e790cd33'],
                    registeredLocationId: '308c35b4-04f8-4664-83f5-9790e790cde1'
                  },
                  dateOfDeath: '2007-01-01',
                  deceasedName: [
                    {
                      __typename: 'X',
                      firstNames: 'Iliyas',
                      familyName: 'Khan'
                    },
                    {
                      __typename: 'X',
                      firstNames: 'ইলিয়াস',
                      familyName: 'খান'
                    }
                  ],

                  // TODO: When fragmentMatching work is completed, remove unnecessary result objects
                  // PR: https://github.com/opencrvs/opencrvs-core/pull/836/commits/6302fa8f015fe313cbce6197980f1300bf4eba32
                  dateOfBirth: '',
                  childName: []
                },
                {
                  id: 'c7e83060-4db9-4057-8b14-71841243b05f',
                  type: 'Death',
                  __typename: 'X',
                  registration: {
                    __typename: 'X',
                    status: 'REJECTED',
                    trackingId: 'DXMJPYA',
                    registrationNumber: null,
                    duplicates: null,
                    registeredLocationId:
                      '308c35b4-04f8-4664-83f5-9790e790cde1',
                    reason:
                      'duplicate,misspelling,missing_supporting_doc,other',
                    comment: 'Rejected'
                  },
                  dateOfDeath: '2010-01-01',
                  deceasedName: [
                    {
                      __typename: 'X',
                      firstNames: 'Zahir',
                      familyName: 'Raihan'
                    },
                    {
                      __typename: 'X',
                      firstNames: 'জহির',
                      familyName: 'রায়হান'
                    }
                  ],

                  // TODO: When fragmentMatching work is completed, remove unnecessary result objects
                  // PR: https://github.com/opencrvs/opencrvs-core/pull/836/commits/6302fa8f015fe313cbce6197980f1300bf4eba32
                  dateOfBirth: '',
                  childName: []
                },
                {
                  id: '150dd4ca-6822-4f94-ad92-b9be037dec2f',
                  type: 'Birth',
                  __typename: 'X',
                  registration: {
                    __typename: 'X',
                    status: 'REGISTERED',
                    trackingId: 'BQRZWDR',
                    registrationNumber: '2019333494BQRZWDR2',
                    duplicates: null,
                    registeredLocationId: '308c35b4-04f8-4664-83f5-9790e790cde1'
                  },
                  dateOfBirth: '2010-01-01',
                  childName: [
                    {
                      __typename: 'X',
                      firstNames: 'Fokrul',
                      familyName: 'Islam'
                    },
                    {
                      __typename: 'X',
                      firstNames: 'ফকরুল',
                      familyName: 'ইসলাম'
                    }
                  ],

                  // TODO: When fragmentMatching work is completed, remove unnecessary result objects
                  // PR: https://github.com/opencrvs/opencrvs-core/pull/836/commits/6302fa8f015fe313cbce6197980f1300bf4eba32
                  dateOfDeath: '',
                  deceasedName: []
                },
                {
                  id: '150dd4ca-6822-4f94-ad92-brbe037dec2f',
                  type: 'Birth',
                  __typename: 'X',
                  registration: {
                    __typename: 'X',
                    status: 'VALIDATED',
                    trackingId: 'BQRZWDR',
                    registrationNumber: '2019333494BQRZWDR2',
                    duplicates: null,
                    registeredLocationId: '308c35b4-04f8-4664-83f5-9790e790cde1'
                  },
                  dateOfBirth: '2010-01-01',
                  childName: [
                    {
                      __typename: 'X',
                      firstNames: 'Fokrul',
                      familyName: 'Islam'
                    },
                    {
                      __typename: 'X',
                      firstNames: 'ফকরুল',
                      familyName: 'ইসলাম'
                    }
                  ],

                  // TODO: When fragmentMatching work is completed, remove unnecessary result objects
                  // PR: https://github.com/opencrvs/opencrvs-core/pull/836/commits/6302fa8f015fe313cbce6197980f1300bf4eba32
                  dateOfDeath: '',
                  deceasedName: []
                },
                {
                  id: '150dd4ca-6822-4f94-ad92-b9beee7dec2f',
                  type: 'Birth',
                  __typename: 'X',
                  registration: {
                    __typename: 'X',
                    status: 'WAITING_VALIDATION',
                    trackingId: 'BQRZWDR',
                    registrationNumber: '2019333494BQRZWDR2',
                    duplicates: null,
                    registeredLocationId: '308c35b4-04f8-4664-83f5-9790e790cde1'
                  },
                  dateOfBirth: '2010-01-01',
                  childName: [
                    {
                      __typename: 'X',
                      firstNames: 'Fokrul',
                      familyName: 'Islam'
                    },
                    {
                      __typename: 'X',
                      firstNames: 'ফকরুল',
                      familyName: 'ইসলাম'
                    }
                  ],

                  // TODO: When fragmentMatching work is completed, remove unnecessary result objects
                  // PR: https://github.com/opencrvs/opencrvs-core/pull/836/commits/6302fa8f015fe313cbce6197980f1300bf4eba32
                  dateOfDeath: '',
                  deceasedName: []
                },
                {
                  id: 'fd60a75e-314e-4231-aab7-e6b71fb1106a',
                  type: 'Birth',
                  __typename: 'X',
                  registration: {
                    __typename: 'X',
                    status: 'CERTIFIED',
                    trackingId: 'B3DBJMP',
                    registrationNumber: '2019333494B3DBJMP5',
                    duplicates: null,
                    registeredLocationId: '308c35b4-04f8-4664-83f5-9790e790cde1'
                  },
                  dateOfBirth: '2008-01-01',
                  childName: [
                    {
                      __typename: 'X',
                      firstNames: 'Rafiq',
                      familyName: 'Islam'
                    },
                    {
                      __typename: 'X',
                      firstNames: 'রফিক',
                      familyName: 'ইসলাম'
                    }
                  ],

                  // TODO: When fragmentMatching work is completed, remove unnecessary result objects
                  // PR: https://github.com/opencrvs/opencrvs-core/pull/836/commits/6302fa8f015fe313cbce6197980f1300bf4eba32
                  dateOfDeath: '',
                  deceasedName: []
                }
              ],
              __typename: 'EventSearchResultSet'
            }
          }
        }
      }
    ]

    const testComponent = await createTestComponent(
      // @ts-ignore
      <SearchResult
        match={{
          params: {
            searchText: '01622688232',
            searchType: 'phone'
          },
          isExact: true,
          path: '',
          url: ''
        }}
      />,
      store,
      graphqlMock
    )

    // wait for mocked data to load mockedProvider
    await new Promise(resolve => {
      setTimeout(resolve, 100)
    })
    testComponent.component.update()
    const data = testComponent.component.find(GridTable).prop('content')
    expect(data.length).toEqual(6)
  })

  it('renders error text when an error occurs', async () => {
    const graphqlMock = [
      {
        request: {
          query: SEARCH_EVENTS,
          variables: {
            locationIds: ['1234567s2323289'],
            sort: 'DESC',
            trackingId: '',
            registrationNumber: '',
            contactNumber: '+8801622688232'
          }
        },
        error: new Error('boom')
      }
    ]

    const testComponent = await createTestComponent(
      // @ts-ignore
      <SearchResult
        match={{
          params: {
            searchText: '+8801622688232',
            searchType: 'phone'
          },
          isExact: true,
          path: '',
          url: ''
        }}
      />,
      store,
      graphqlMock
    )

    // wait for mocked data to load mockedProvider
    await new Promise(resolve => {
      setTimeout(resolve, 100)
    })

    testComponent.component.update()
    expect(
      testComponent.component
        .find('#search-result-error-text')
        .hostNodes()
        .text()
    ).toBe('An error occurred while searching')
  })
  it('renders empty search page with a header in small devices', async () => {
    const testSearchResultComponent = (
      await createTestComponent(
        // @ts-ignore
        <SearchResult match={{ params: {} }} />,
        store
      )
    ).component

    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 200
    })
    store.dispatch(goToSearch())

    const searchTextInput = testSearchResultComponent
      .find('#searchText')
      .hostNodes()

    expect(searchTextInput).toHaveLength(1)

    searchTextInput.simulate('change', { target: { value: 'DW0UTHR' } })

    testSearchResultComponent
      .find('#searchIconButton')
      .hostNodes()
      .simulate('click')

    expect(window.location.pathname).toBe('/search-result/tracking-id/DW0UTHR')
  })

  it('renders download button and loaders in search page', async () => {
    const graphqlMock = [
      {
        request: {
          operationName: null,
          query: SEARCH_EVENTS,
          variables: {
            locationIds: ['2a83cf14-b959-47f4-8097-f75a75d1867f'],
            sort: 'DESC',
            trackingId: 'DW0UTHR',
            registrationNumber: '',
            contactNumber: '',
            name: ''
          }
        },
        result: {
          data: {
            searchEvents: {
              totalItems: 1,
              results: [
                {
                  id: 'bc09200d-0160-43b4-9e2b-5b9e90424e95',
                  type: 'Death',
                  __typename: 'X',
                  registration: {
                    __typename: 'X',
                    status: 'DECLARED',
                    trackingId: 'DW0UTHR',
                    registrationNumber: null,
                    duplicates: [],
                    registeredLocationId: '308c35b4-04f8-4664-83f5-9790e790cde1'
                  },
                  dateOfDeath: '2007-01-01',
                  deceasedName: [
                    {
                      __typename: 'X',
                      firstNames: 'Iliyas',
                      familyName: 'Khan'
                    },
                    {
                      __typename: 'X',
                      firstNames: 'ইলিয়াস',
                      familyName: 'খান'
                    }
                  ],

                  // TODO: When fragmentMatching work is completed, remove unnecessary result objects
                  // PR: https://github.com/opencrvs/opencrvs-core/pull/836/commits/6302fa8f015fe313cbce6197980f1300bf4eba32
                  dateOfBirth: '',
                  childName: []
                }
              ],
              __typename: 'EventSearchResultSet'
            }
          }
        }
      }
    ]

    const testComponent = await createTestComponent(
      // @ts-ignore
      <SearchResult
        match={{
          params: {
            searchText: 'DW0UTHR',
            searchType: 'tracking-id'
          },
          isExact: true,
          path: '',
          url: ''
        }}
      />,
      store,
      graphqlMock
    )

    // wait for mocked data to load mockedProvider
    await new Promise(resolve => {
      setTimeout(resolve, 100)
    })

    testComponent.component.update()
    testComponent.component
      .find('#ListItemAction-0-icon')
      .hostNodes()
      .simulate('click')

    expect(
      testComponent.component
        .find('#action-loading-ListItemAction-0')
        .hostNodes()
    ).toHaveLength(1)
  })

  it('renders review button in search page', async () => {
    const application = {
      id: 'bc09200d-0160-43b4-9e2b-5b9e90424e91',
      data: {},
      event: Event.BIRTH,
      downloadStatus: 'DOWNLOADED',
      submissionStatus: 'DECLARED'
    }

    // @ts-ignore
    store.dispatch(storeApplication(application))
    const graphqlMock = [
      {
        request: {
          operationName: null,
          query: SEARCH_EVENTS,
          variables: {
            locationIds: ['2a83cf14-b959-47f4-8097-f75a75d1867f'],
            sort: 'DESC',
            trackingId: 'DW0UTHR',
            registrationNumber: '',
            contactNumber: '',
            name: ''
          }
        },
        result: {
          data: {
            searchEvents: {
              totalItems: 1,
              results: [
                {
                  id: 'bc09200d-0160-43b4-9e2b-5b9e90424e91',
                  type: 'Death',
                  __typename: 'X',
                  registration: {
                    __typename: 'X',
                    status: 'DECLARED',
                    trackingId: 'DW0UTHR',
                    registrationNumber: null,
                    duplicates: [],
                    registeredLocationId: '308c35b4-04f8-4664-83f5-9790e790cde1'
                  },
                  dateOfDeath: '2007-01-01',
                  deceasedName: [
                    {
                      __typename: 'X',
                      firstNames: 'Iliyas',
                      familyName: 'Khan'
                    },
                    {
                      __typename: 'X',
                      firstNames: 'ইলিয়াস',
                      familyName: 'খান'
                    }
                  ],

                  // TODO: When fragmentMatching work is completed, remove unnecessary result objects
                  // PR: https://github.com/opencrvs/opencrvs-core/pull/836/commits/6302fa8f015fe313cbce6197980f1300bf4eba32
                  dateOfBirth: '',
                  childName: []
                }
              ],
              __typename: 'EventSearchResultSet'
            }
          }
        }
      }
    ]

    const testComponent = await createTestComponent(
      // @ts-ignore
      <SearchResult
        match={{
          params: {
            searchText: 'DW0UTHR',
            searchType: 'tracking-id'
          },
          isExact: true,
          path: '',
          url: ''
        }}
      />,
      store,
      graphqlMock
    )

    // wait for mocked data to load mockedProvider
    await new Promise(resolve => {
      setTimeout(resolve, 100)
    })

    testComponent.component.update()

    const reviewButton = await waitForElement(
      testComponent.component,
      '#ListItemAction-0-Review'
    )

    expect(reviewButton.hostNodes()).toHaveLength(1)
  })

  it('renders update button in search page', async () => {
    const application = {
      id: 'bc09200d-0160-43b4-9e2b-5b9e90424e92',
      data: {},
      event: Event.BIRTH,
      downloadStatus: 'DOWNLOADED',
      submissionStatus: 'REJECTED'
    }

    // @ts-ignore
    store.dispatch(storeApplication(application))
    const graphqlMock = [
      {
        request: {
          operationName: null,
          query: SEARCH_EVENTS,
          variables: {
            locationIds: ['2a83cf14-b959-47f4-8097-f75a75d1867f'],
            sort: 'DESC',
            trackingId: 'DW0UTHR',
            registrationNumber: '',
            contactNumber: '',
            name: ''
          }
        },
        result: {
          data: {
            searchEvents: {
              totalItems: 1,
              results: [
                {
                  id: 'bc09200d-0160-43b4-9e2b-5b9e90424e92',
                  type: 'Death',
                  __typename: 'X',
                  registration: {
                    __typename: 'X',
                    status: 'REJECTED',
                    trackingId: 'DW0UTHR',
                    registrationNumber: null,
                    duplicates: [],
                    registeredLocationId: '308c35b4-04f8-4664-83f5-9790e790cde1'
                  },
                  dateOfDeath: '2007-01-01',
                  deceasedName: [
                    {
                      __typename: 'X',
                      firstNames: 'Iliyas',
                      familyName: 'Khan'
                    },
                    {
                      __typename: 'X',
                      firstNames: 'ইলিয়াস',
                      familyName: 'খান'
                    }
                  ],

                  // TODO: When fragmentMatching work is completed, remove unnecessary result objects
                  // PR: https://github.com/opencrvs/opencrvs-core/pull/836/commits/6302fa8f015fe313cbce6197980f1300bf4eba32
                  dateOfBirth: '',
                  childName: []
                }
              ],
              __typename: 'EventSearchResultSet'
            }
          }
        }
      }
    ]

    const testComponent = await createTestComponent(
      // @ts-ignore
      <SearchResult
        match={{
          params: {
            searchText: 'DW0UTHR',
            searchType: 'tracking-id'
          },
          isExact: true,
          path: '',
          url: ''
        }}
      />,
      store,
      graphqlMock
    )

    // wait for mocked data to load mockedProvider
    await new Promise(resolve => {
      setTimeout(resolve, 100)
    })

    testComponent.component.update()

    const updateButton = await waitForElement(
      testComponent.component,
      '#ListItemAction-0-Update'
    )

    expect(updateButton.hostNodes()).toHaveLength(1)
  })

  it('renders print button in search page', async () => {
    const application = {
      id: 'bc09200d-0160-43b4-9e2b-5b9e90424e92',
      data: {},
      event: Event.BIRTH,
      downloadStatus: 'DOWNLOADED',
      submissionStatus: 'REGISTERED'
    }

    // @ts-ignore
    store.dispatch(storeApplication(application))
    const graphqlMock = [
      {
        request: {
          operationName: null,
          query: SEARCH_EVENTS,
          variables: {
            locationIds: ['2a83cf14-b959-47f4-8097-f75a75d1867f'],
            sort: 'DESC',
            trackingId: 'DW0UTHR',
            registrationNumber: '',
            contactNumber: '',
            name: ''
          }
        },
        result: {
          data: {
            searchEvents: {
              totalItems: 1,
              results: [
                {
                  id: 'bc09200d-0160-43b4-9e2b-5b9e90424e92',
                  type: 'Death',
                  __typename: 'X',
                  registration: {
                    __typename: 'X',
                    status: 'REGISTERED',
                    trackingId: 'DW0UTHR',
                    registrationNumber: null,
                    duplicates: [],
                    registeredLocationId: '308c35b4-04f8-4664-83f5-9790e790cde1'
                  },
                  dateOfDeath: '2007-01-01',
                  deceasedName: [
                    {
                      __typename: 'X',
                      firstNames: 'Iliyas',
                      familyName: 'Khan'
                    },
                    {
                      __typename: 'X',
                      firstNames: 'ইলিয়াস',
                      familyName: 'খান'
                    }
                  ],

                  // TODO: When fragmentMatching work is completed, remove unnecessary result objects
                  // PR: https://github.com/opencrvs/opencrvs-core/pull/836/commits/6302fa8f015fe313cbce6197980f1300bf4eba32
                  dateOfBirth: '',
                  childName: []
                }
              ],
              __typename: 'EventSearchResultSet'
            }
          }
        }
      }
    ]

    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1100
    })
    const testComponent = await createTestComponent(
      // @ts-ignore
      <SearchResult
        match={{
          params: {
            searchText: 'DW0UTHR',
            searchType: 'tracking-id'
          },
          isExact: true,
          path: '',
          url: ''
        }}
      />,
      store,
      graphqlMock
    )

    // wait for mocked data to load mockedProvider
    await new Promise(resolve => {
      setTimeout(resolve, 100)
    })

    testComponent.component.update()

    const printButton = await waitForElement(
      testComponent.component,
      '#ListItemAction-0-Print'
    )

    printButton.hostNodes().simulate('click')

    expect(window.location.pathname).toContain(
      '/cert/collector/bc09200d-0160-43b4-9e2b-5b9e90424e92/death/certCollector'
    )

    expect(printButton.hostNodes()).toHaveLength(1)
  })

  it('goes to duplicate page while click duplicate button in search page', async () => {
    const application = {
      id: 'bc09200d-0160-43b4-9e2b-5b9e90424e93',
      data: {},
      event: Event.BIRTH,
      downloadStatus: 'DOWNLOADED',
      submissionStatus: 'DECLARED'
    }

    // @ts-ignore
    store.dispatch(storeApplication(application))
    const graphqlMock = [
      {
        request: {
          operationName: null,
          query: SEARCH_EVENTS,
          variables: {
            locationIds: ['2a83cf14-b959-47f4-8097-f75a75d1867f'],
            sort: 'DESC',
            trackingId: 'DW0UTHR',
            registrationNumber: '',
            contactNumber: '',
            name: ''
          }
        },
        result: {
          data: {
            searchEvents: {
              totalItems: 1,
              results: [
                {
                  id: 'bc09200d-0160-43b4-9e2b-5b9e90424e93',
                  type: 'Death',
                  __typename: 'X',
                  registration: {
                    __typename: 'X',
                    status: 'DECLARED',
                    trackingId: 'DW0UTHR',
                    registrationNumber: null,
                    duplicates: ['308c35b4-04f8-4664-83f5-9790e790cd33'],
                    registeredLocationId: '308c35b4-04f8-4664-83f5-9790e790cde1'
                  },
                  dateOfDeath: '2007-01-01',
                  deceasedName: [
                    {
                      __typename: 'X',
                      firstNames: 'Iliyas',
                      familyName: 'Khan'
                    },
                    {
                      __typename: 'X',
                      firstNames: 'ইলিয়াস',
                      familyName: 'খান'
                    }
                  ],

                  // TODO: When fragmentMatching work is completed, remove unnecessary result objects
                  // PR: https://github.com/opencrvs/opencrvs-core/pull/836/commits/6302fa8f015fe313cbce6197980f1300bf4eba32
                  dateOfBirth: '',
                  childName: []
                }
              ],
              __typename: 'EventSearchResultSet'
            }
          }
        }
      }
    ]

    const testComponent = await createTestComponent(
      // @ts-ignore
      <SearchResult
        match={{
          params: {
            searchText: 'DW0UTHR',
            searchType: 'tracking-id'
          },
          isExact: true,
          path: '',
          url: ''
        }}
      />,
      store,
      graphqlMock
    )

    // wait for mocked data to load mockedProvider
    await new Promise(resolve => {
      setTimeout(resolve, 100)
    })

    testComponent.component.update()

    const duplicateButton = await waitForElement(
      testComponent.component,
      '#ListItemAction-0-Review'
    )

    expect(duplicateButton.hostNodes()).toHaveLength(1)

    duplicateButton.hostNodes().simulate('click')

    expect(window.location.pathname).toContain(
      'duplicates/bc09200d-0160-43b4-9e2b-5b9e90424e93'
    )
  })

  it('renders review button in search page while application is validated', async () => {
    const application = {
      id: 'bc09200d-0160-43b4-9e2b-5b9e90424e91',
      data: {},
      event: Event.BIRTH,
      downloadStatus: 'DOWNLOADED',
      submissionStatus: 'VALIDATED'
    }

    // @ts-ignore
    store.dispatch(storeApplication(application))
    const graphqlMock = [
      {
        request: {
          operationName: null,
          query: SEARCH_EVENTS,
          variables: {
            locationIds: ['2a83cf14-b959-47f4-8097-f75a75d1867f'],
            sort: 'DESC',
            trackingId: 'DW0UTHR',
            registrationNumber: '',
            contactNumber: '',
            name: ''
          }
        },
        result: {
          data: {
            searchEvents: {
              totalItems: 1,
              results: [
                {
                  id: 'bc09200d-0160-43b4-9e2b-5b9e90424e91',
                  type: 'Death',
                  __typename: 'X',
                  registration: {
                    __typename: 'X',
                    status: 'VALIDATED',
                    trackingId: 'DW0UTHR',
                    registrationNumber: null,
                    duplicates: [],
                    registeredLocationId: '308c35b4-04f8-4664-83f5-9790e790cde1'
                  },
                  dateOfDeath: '2007-01-01',
                  deceasedName: [
                    {
                      __typename: 'X',
                      firstNames: 'Iliyas',
                      familyName: 'Khan'
                    },
                    {
                      __typename: 'X',
                      firstNames: 'ইলিয়াস',
                      familyName: 'খান'
                    }
                  ],

                  // TODO: When fragmentMatching work is completed, remove unnecessary result objects
                  // PR: https://github.com/opencrvs/opencrvs-core/pull/836/commits/6302fa8f015fe313cbce6197980f1300bf4eba32
                  dateOfBirth: '',
                  childName: []
                }
              ],
              __typename: 'EventSearchResultSet'
            }
          }
        }
      }
    ]

    const testComponent = await createTestComponent(
      // @ts-ignore
      <SearchResult
        match={{
          params: {
            searchText: 'DW0UTHR',
            searchType: 'tracking-id'
          },
          isExact: true,
          path: '',
          url: ''
        }}
      />,
      store,
      graphqlMock
    )

    // wait for mocked data to load mockedProvider
    await new Promise(resolve => {
      setTimeout(resolve, 100)
    })

    testComponent.component.update()

    const reviewButton = await waitForElement(
      testComponent.component,
      '#ListItemAction-0-Review'
    )

    expect(reviewButton.hostNodes()).toHaveLength(1)
  })
})
