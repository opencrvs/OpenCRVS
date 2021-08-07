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
import { createTestComponent, createTestStore } from '@client/tests/util'
import { waitForElement } from '@client/tests/wait-for-element'
import { ReactWrapper } from 'enzyme'
import * as React from 'react'
import { FETCH_TIME_LOGGED_METRICS_FOR_PRACTITIONER } from '@client/user/queries'
import { UserAuditList } from '@client/views/SysAdmin/Team/user/userProfilie/UserAuditList'

describe('User audit list tests', () => {
  let component: ReactWrapper<{}, {}>
  let store: AppStore

  const graphqlMock = [
    {
      request: {
        query: FETCH_TIME_LOGGED_METRICS_FOR_PRACTITIONER,
        variables: {
          timeEnd: new Date(1487076708000).toISOString(),
          timeStart: new Date(1484398308000).toISOString(),
          practitionerId: '94429795-0a09-4de8-8e1e-27dab01877d2',
          locationId: '6e1f3bce-7bcb-4bf6-8e35-0d9facdf158b',
          count: 10
        }
      },
      result: {
        data: {
          fetchTimeLoggedMetricsByPractitioner: {
            totalItems: 11,
            results: [
              {
                status: 'DECLARED',
                trackingId: 'D23S2D0',
                eventType: 'DEATH',
                timeSpentEditing: 120,
                time: '2019-03-31T18:00:00.000Z'
              },
              {
                status: 'IN_PROGRESS',
                trackingId: 'B23S2D0',
                eventType: 'BIRTH',
                timeSpentEditing: 20,
                time: '2018-03-31T18:00:00.000Z'
              },
              {
                status: 'VALIDATED',
                trackingId: 'B23S2B2',
                eventType: 'BIRTH',
                timeSpentEditing: 110,
                time: '2019-03-31T18:00:00.000Z'
              },
              {
                status: 'WAITING_VALIDATION',
                trackingId: 'B23S232',
                eventType: 'BIRTH',
                timeSpentEditing: 10,
                time: '2019-03-31T18:00:00.000Z'
              },
              {
                status: 'REGISTERED',
                trackingId: 'B23S555',
                eventType: 'BIRTH',
                timeSpentEditing: 50,
                time: '2019-07-30T18:00:00.000Z'
              },
              {
                status: 'REJECTED',
                trackingId: 'B23S786',
                eventType: 'BIRTH',
                timeSpentEditing: 66,
                time: '2019-03-31T18:00:00.000Z'
              },
              {
                status: 'CERTIFIED',
                trackingId: 'B23S245',
                eventType: 'BIRTH',
                timeSpentEditing: 88,
                time: '2019-03-29T18:00:00.000Z'
              },
              {
                status: 'VALIDATED',
                trackingId: 'B23S2B2',
                eventType: 'BIRTH',
                timeSpentEditing: 110,
                time: '2020-03-29T18:00:00.000Z'
              },
              {
                status: 'WAITING_VALIDATION',
                trackingId: 'B23S232',
                eventType: 'BIRTH',
                timeSpentEditing: 10,
                time: '2019-03-31T18:00:00.000Z'
              },
              {
                status: 'REGISTERED',
                trackingId: 'B23S555',
                eventType: 'BIRTH',
                timeSpentEditing: 50,
                time: '2019-03-31T18:00:00.000Z'
              }
            ]
          }
        }
      }
    }
  ]

  beforeAll(async () => {
    Date.now = jest.fn(() => 1487076708000)
    const { store: testStore } = await createTestStore()
    store = testStore
  })

  beforeEach(async () => {
    component = (
      await createTestComponent(
        <UserAuditList
          user={{
            id: '12345',
            name: 'Dummy User',
            role: 'FIELD_AGENT',
            type: 'CHA',
            number: '01622688231',
            status: 'active',
            practitionerId: '94429795-0a09-4de8-8e1e-27dab01877d2',
            locationId: '6e1f3bce-7bcb-4bf6-8e35-0d9facdf158b'
          }}
        />,
        store,
        graphqlMock
      )
    ).component

    // wait for mocked data to load mockedProvider
    await new Promise(resolve => {
      setTimeout(resolve, 100)
    })

    component.update()
  })

  it('renders without crashing', async () => {
    expect(await waitForElement(component, '#user-audit-list')).toBeDefined()
  })

  it('renders in loading mode', async () => {
    const testComponent = (
      await createTestComponent(<UserAuditList isLoading={true} />, store)
    ).component
    expect(
      await waitForElement(testComponent, '#loading-audit-list')
    ).toBeDefined()
  })
  it('renders with a error toast for graphql error', async () => {
    const testComponent = (
      await createTestComponent(
        <UserAuditList
          user={{
            id: '12345',
            name: 'Dummy User',
            role: 'FIELD_AGENT',
            type: 'CHA',
            number: '01622688231',
            status: 'active',
            practitionerId: '94429795-0a09-4de8-8e1e-27dab01877d2',
            locationId: '6e1f3bce-7bcb-4bf6-8e35-0d9facdf158b'
          }}
        />,
        store
      )
    ).component
    expect(await waitForElement(testComponent, '#error-toast')).toBeDefined()
  })
  it('toggles sorting order of the list', async () => {
    const firstRowElement = await waitForElement(component, '#row_0')
    const toggleSortActionElement = await waitForElement(
      component,
      '#auditTime-label'
    )
    const firstTrackingId = firstRowElement
      .hostNodes()
      .childAt(2)
      .text()

    toggleSortActionElement.hostNodes().simulate('click')
    const firstRowElementAfterSort = await waitForElement(component, '#row_0')
    expect(
      firstRowElementAfterSort
        .hostNodes()
        .childAt(2)
        .text()
    ).not.toEqual(firstTrackingId)
  })

  it('renders next page of audits after clicking load more link', async () => {
    const testComponent = (
      await createTestComponent(
        <UserAuditList
          user={{
            id: '12345',
            name: 'Dummy User',
            role: 'FIELD_AGENT',
            type: 'CHA',
            number: '01622688231',
            status: 'active',
            practitionerId: '94429795-0a09-4de8-8e1e-27dab01877d2',
            locationId: '6e1f3bce-7bcb-4bf6-8e35-0d9facdf158b'
          }}
        />,
        store,
        [
          graphqlMock[0],
          {
            request: {
              query: FETCH_TIME_LOGGED_METRICS_FOR_PRACTITIONER,
              variables: {
                timeEnd: new Date(1487076708000).toISOString(),
                timeStart: new Date(1484398308000).toISOString(),
                practitionerId: '94429795-0a09-4de8-8e1e-27dab01877d2',
                locationId: '6e1f3bce-7bcb-4bf6-8e35-0d9facdf158b',
                count: 20
              }
            },
            result: {
              data: {
                fetchTimeLoggedMetricsByPractitioner: {
                  totalItems: 11,
                  results: [
                    {
                      status: 'REGISTERED',
                      trackingId: 'B23S555',
                      eventType: 'BIRTH',
                      timeSpentEditing: 50,
                      time: '2019-03-31T18:00:00.000Z'
                    }
                  ]
                }
              }
            }
          }
        ]
      )
    ).component

    const loadMoreLink = await waitForElement(
      testComponent,
      '#load_more_button'
    )
    expect(loadMoreLink.hostNodes()).toHaveLength(1)
    loadMoreLink.hostNodes().simulate('click')
    await new Promise(resolve => {
      setTimeout(resolve, 100)
    })
    testComponent.update()
    expect(testComponent.find('#load_more_button').hostNodes()).toHaveLength(0)
  })
})
