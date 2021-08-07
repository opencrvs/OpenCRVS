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
import { createTestComponent } from '@client/tests/util'
import { ReactWrapper } from 'enzyme'
import { createStore } from '@client/store'
import { Report } from './Report'
import { PERFORMANCE_METRICS } from '@client/views/SysAdmin/Performance/metricsQuery'
import { Event } from '@client/forms'

describe('Report page', () => {
  let testComponent: ReactWrapper
  const { store, history } = createStore()
  const timeStart = new Date(2019, 11, 6)
  const timeEnd = new Date(2019, 11, 13)

  const graphqlMock = [
    {
      request: {
        query: PERFORMANCE_METRICS,
        variables: {
          timeStart: timeStart.toISOString(),
          timeEnd: timeEnd.toISOString(),
          locationId: '8cbc862a-b817-4c29-a490-4a8767ff023c',
          event: 'birth'
        }
      },
      result: {
        data: {
          fetchRegistrationMetrics: {
            timeFrames: {
              details: [
                {
                  locationId: 'Location/db5faba3-8143-4924-a44a-8562ed5e0437',
                  regWithin45d: 0,
                  regWithin45dTo1yr: 0,
                  regWithin1yrTo5yr: 0,
                  regOver5yr: 2,
                  total: 2
                }
              ],
              total: {
                regWithin45d: 0,
                regWithin45dTo1yr: 0,
                regWithin1yrTo5yr: 0,
                regOver5yr: 2,
                total: 2
              }
            },
            genderBasisMetrics: {
              details: [
                {
                  location: 'Location/db5faba3-8143-4924-a44a-8562ed5e0437',
                  maleUnder18: 2,
                  femaleUnder18: 0,
                  maleOver18: 0,
                  femaleOver18: 0,
                  total: 2
                }
              ],
              total: {
                maleUnder18: 2,
                femaleUnder18: 0,
                maleOver18: 0,
                femaleOver18: 0,
                total: 2
              }
            },
            estimated45DayMetrics: {
              details: [
                {
                  locationId: 'Location/db5faba3-8143-4924-a44a-8562ed5e0437',
                  estimatedRegistration: 99,
                  registrationIn45Day: 2,
                  estimationYear: 2019,
                  estimationLocationLevel: 'UNION',
                  estimationPercentage: 2
                }
              ],
              total: {
                estimatedRegistration: 99,
                registrationIn45Day: 2,
                estimationPercentage: 2
              }
            },
            payments: {
              details: [
                {
                  locationId: 'Location/db5faba3-8143-4924-a44a-8562ed5e0437',
                  total: 200
                }
              ],
              total: {
                total: 200
              }
            }
          }
        }
      }
    },
    {
      request: {
        query: PERFORMANCE_METRICS,
        variables: {
          timeStart: timeStart.toISOString(),
          timeEnd: timeEnd.toISOString(),
          locationId: 'dabffdf7-c174-4450-b306-5a3c2c0e2c0e',
          event: 'birth'
        }
      },
      result: {
        data: {
          fetchRegistrationMetrics: {
            timeFrames: {
              details: [],
              total: {
                regWithin45d: 0,
                regWithin45dTo1yr: 0,
                regWithin1yrTo5yr: 0,
                regOver5yr: 0,
                total: 0
              }
            },
            genderBasisMetrics: {
              details: [],
              total: {
                maleUnder18: 0,
                femaleUnder18: 0,
                maleOver18: 0,
                femaleOver18: 0,
                total: 0
              }
            },
            estimated45DayMetrics: {
              details: [],
              total: {
                estimatedRegistration: 0,
                registrationIn45Day: 0,
                estimationPercentage: 0
              }
            },
            payments: {
              details: [],
              total: {
                total: 0
              }
            }
          }
        }
      }
    }
  ]

  beforeEach(async () => {
    const mock: any = jest.fn()

    testComponent = (
      await createTestComponent(
        // @ts-ignore
        <Report
          history={history}
          staticContext={mock}
          match={{
            params: {},
            isExact: true,
            path: '',
            url: ''
          }}
          location={{
            pathname: '',
            search: '',
            hash: '',
            state: {
              selectedLocation: {
                id: '8cbc862a-b817-4c29-a490-4a8767ff023c',
                displayLabel: 'Chittagong Divison',
                searchableText: 'Chittagong'
              },
              eventType: Event.BIRTH,
              timeRange: {
                start: timeStart,
                end: timeEnd
              }
            }
          }}
        />,
        store,
        graphqlMock
      )
    ).component
  })

  it('loads with page title from given time range from props', () => {
    expect(
      testComponent
        .find('#reports-header')
        .first()
        .text()
    ).toBe('December 2019')
  })
})
