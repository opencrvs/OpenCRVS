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
import { createTestComponent, createTestStore } from '@client/tests/util'
import { WorkflowStatus } from '@client/views/SysAdmin/Performance/WorkflowStatus'
import { AppStore } from '@client/store'
import { History } from 'history'
import { ReactWrapper } from 'enzyme'
import { stringify, parse } from 'query-string'
import { waitForElement } from '@client/tests/wait-for-element'
import { FETCH_EVENTS_WITH_PROGRESS } from './queries'
import { OPERATIONAL_REPORT_SECTION } from './OperationalReport'
import { GraphQLError } from 'graphql'

describe('Workflow status tests', () => {
  let store: AppStore
  let history: History<any>
  let component: ReactWrapper<{}, {}>
  const timeStart = new Date(2019, 11, 6)
  const timeEnd = new Date(2019, 11, 13)
  const locationId = 'bfe8306c-0910-48fe-8bf5-0db906cf3155'

  beforeAll(async () => {
    const testStore = await createTestStore()
    store = testStore.store
    history = testStore.history
    Date.now = jest.fn(() => 1590220497869)
  })

  describe('events with progress fetched successfully', () => {
    const graphqlMocks = [
      {
        request: {
          query: FETCH_EVENTS_WITH_PROGRESS,
          variables: {
            count: 25,
            skip: 0,
            parentLocationId: locationId,
            status: ['REGISTERED'],
            type: ['birth-application']
          }
        },
        result: {
          data: {
            getEventsWithProgress: {
              totalItems: 3,
              results: [
                {
                  id: '137a4fb2-36ad-4897-8953-dbad0a756d4f',
                  type: null,
                  name: [
                    {
                      use: 'en',
                      firstNames: '',
                      familyName: 'Mother Family Name'
                    },
                    {
                      use: 'bn',
                      firstNames: '',
                      familyName: 'মায়ের পারিবারিক নাম '
                    }
                  ],
                  dateOfEvent: '2020-05-17',
                  registration: {
                    status: null,
                    contactNumber: null,
                    contactRelationship: null,
                    dateOfApplication: null,
                    trackingId: 'B6N6YSF',
                    registrationNumber: '20207210411000121',
                    createdAt: '1590143054612',
                    modifiedAt: '1590143057091'
                  },
                  startedAt: '2020-05-17',
                  startedBy: {
                    name: [
                      {
                        use: 'en',
                        firstNames: 'Mohammad',
                        familyName: 'Ashraful'
                      }
                    ],
                    role: 'LOCAL_REGISTRAR'
                  },
                  startedByFacility: null,
                  progressReport: {
                    timeInProgress: null,
                    timeInReadyForReview: null,
                    timeInRequiresUpdates: null,
                    timeInWaitingForApproval: null,
                    timeInWaitingForBRIS: null,
                    timeInReadyToPrint: null
                  }
                },
                {
                  id: 'd78d29a1-8521-4582-9f4e-902907ca369a',
                  type: 'Birth',
                  name: [
                    {
                      use: 'en',
                      firstNames: '',
                      familyName: 'Mother Family Name'
                    },
                    {
                      use: 'bn',
                      firstNames: 'মায়ের নাম',
                      familyName: 'আমিনা'
                    }
                  ],
                  dateOfEvent: '2020-02-15',
                  registration: {
                    status: 'REGISTERED',
                    contactNumber: '+8801959595999',
                    contactRelationship: 'Uncle',
                    dateOfApplication: '2020-05-20T14:40:03.088Z',
                    trackingId: 'BXOQWTT',
                    registrationNumber: '20207210411000119',
                    createdAt: '1589985603133',
                    modifiedAt: '1589985605583'
                  },
                  startedAt: '2020-05-17',
                  startedBy: {
                    name: [
                      {
                        use: 'en',
                        firstNames: 'Mohammad',
                        familyName: 'Ashraful'
                      }
                    ],
                    role: 'LOCAL_REGISTRAR'
                  },
                  progressReport: {
                    timeInProgress: 123,
                    timeInReadyForReview: 25,
                    timeInRequiresUpdates: 23,
                    timeInWaitingForApproval: 56,
                    timeInWaitingForBRIS: 1200,
                    timeInReadyToPrint: 78
                  }
                },
                {
                  id: '8a1d92b8-18a6-4074-83fb-cc57134e6dbf',
                  type: 'Birth',
                  name: [
                    {
                      use: 'en',
                      firstNames: '',
                      familyName: 'Mother Family Name'
                    },
                    {
                      use: 'bn',
                      firstNames: '',
                      familyName: 'আমিনা'
                    }
                  ],
                  dateOfEvent: '2020-03-15',
                  registration: {
                    status: 'CERTIFIED',
                    contactNumber: '+8801656568682',
                    contactRelationship: 'MOTHER',
                    dateOfApplication: '2020-05-22T06:18:04.895Z',
                    trackingId: 'BGEPVNQ',
                    registrationNumber: '20207210411000118',
                    createdAt: '1590128285130',
                    modifiedAt: null
                  },
                  startedAt: '2020-05-17',
                  startedBy: {
                    name: [
                      {
                        use: 'en',
                        firstNames: 'Mohammad',
                        familyName: 'Ashraful'
                      }
                    ],
                    role: 'LOCAL_REGISTRAR'
                  },
                  progressReport: {
                    timeInProgress: null,
                    timeInReadyForReview: null,
                    timeInRequiresUpdates: null,
                    timeInWaitingForApproval: null,
                    timeInWaitingForBRIS: null,
                    timeInReadyToPrint: 72
                  }
                }
              ]
            }
          }
        }
      }
    ]

    beforeEach(async () => {
      const testComponent = await createTestComponent(
        <WorkflowStatus
          // @ts-ignore
          location={{
            search: stringify({
              locationId,
              event: 'BIRTH',
              status: 'REGISTERED'
            }),
            state: {
              sectionId: OPERATIONAL_REPORT_SECTION,
              timeStart,
              timeEnd
            }
          }}
        />,
        store,
        graphqlMocks
      )

      component = testComponent.component

      // wait for mocked data to load mockedProvider
      await new Promise(resolve => {
        setTimeout(resolve, 100)
      })

      component.update()
    })

    it('renders without crashing', async () => {
      await waitForElement(component, '#workflow-status-header')
    })

    it('clicking on back takes back to operational dashboard', async () => {
      const backButton = await waitForElement(
        component,
        '#workflow-status-action-back'
      )
      backButton.hostNodes().simulate('click')

      expect(history.location.pathname).toContain('/performance/operations')
      expect(history.location.pathname).not.toContain('workflowStatus')
    })

    it('renders data', async () => {
      const listTable = await waitForElement(
        component,
        '#application-status-list'
      )
      expect(listTable.find('div#row_1').hostNodes()).toHaveLength(1)
    })

    it('toggles sort order', async () => {
      const listTable = await waitForElement(
        component,
        '#application-status-list'
      )

      const toggleSortButton = await waitForElement(
        component,
        'span#applicationStartedOn-label'
      )
      expect(
        listTable
          .find('div#row_0')
          .hostNodes()
          .childAt(7)
          .text()
      ).toMatch(/May 17, 2020/)

      toggleSortButton.hostNodes().simulate('click')

      expect(
        listTable
          .find('div#row_2')
          .hostNodes()
          .childAt(7)
          .text()
      ).toMatch(/May 17, 2020/)

      toggleSortButton.hostNodes().simulate('click')

      expect(
        listTable
          .find('div#row_0')
          .hostNodes()
          .childAt(7)
          .text()
      ).toMatch(/May 17, 2020/)
    })

    it('update event from select updates query params', async () => {
      const eventSelect = await waitForElement(component, '#event-select')
      eventSelect.at(0).prop('onChange')({ label: 'Deaths', value: 'DEATH' })
      component.update()
      expect(parse(history.location.search).event).toBe('DEATH')
    })

    it('update status from select updates query params', async () => {
      const statusSelect = await waitForElement(component, '#status-select')
      statusSelect.at(0).prop('onChange')({
        label: 'Ready to print',
        value: 'REGISTERED'
      })
      component.update()
      expect(parse(history.location.search).status).toBe('REGISTERED')
    })

    it('changing location id from location picker updates the query params', async () => {
      const locationIdBeforeChange = parse(history.location.search).locationId
      const locationPickerElement = await waitForElement(
        component,
        '#location-range-picker-action'
      )

      locationPickerElement.hostNodes().simulate('click')

      const locationSearchInput = await waitForElement(
        component,
        '#locationSearchInput'
      )
      locationSearchInput.hostNodes().simulate('change', {
        target: { value: 'Duaz', id: 'locationSearchInput' }
      })

      const searchResultOption = await waitForElement(
        component,
        '#locationOptiond3cef1d4-6187-4f0e-a024-61abd3fce9d4'
      )
      searchResultOption.hostNodes().simulate('click')
      const newLocationId = parse(history.location.search).locationId
      expect(newLocationId).not.toBe(locationIdBeforeChange)
      expect(newLocationId).toBe('d3cef1d4-6187-4f0e-a024-61abd3fce9d4')
    })
  })

  describe('events with progress fetched with failure', () => {
    const graphqlMocksWithError = [
      {
        request: {
          query: FETCH_EVENTS_WITH_PROGRESS,
          variables: {
            count: 25,
            skip: 0,
            parentLocationId: locationId,
            status: ['REGISTERED'],
            type: ['birth-application']
          }
        },
        result: {
          errors: [new GraphQLError('Error!')]
        }
      }
    ]

    beforeEach(async () => {
      const testComponent = await createTestComponent(
        <WorkflowStatus
          // @ts-ignore
          location={{
            search: stringify({
              locationId
            }),
            state: {
              sectionId: OPERATIONAL_REPORT_SECTION,
              timeStart,
              timeEnd
            }
          }}
        />,
        store,
        graphqlMocksWithError
      )

      component = testComponent.component

      // wait for mocked data to load mockedProvider
      await new Promise(resolve => {
        setTimeout(resolve, 100)
      })

      component.update()
    })

    it('renders error notification toast', async () => {
      const notificationToast = await waitForElement(component, '#error-toast')
      expect(notificationToast.hostNodes().text()).toBe(
        "Sorry, we couldn't laod the content for this pageRetry"
      )
    })
  })
})
