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
import { referenceApi } from '@client/utils/referenceApi'
import traverse from 'traverse'
import { IForm } from '@client/forms'
import { deserializeForm } from './deserializer'

function isGraphQLTag(item: any) {
  return typeof item === 'object' && item.kind && item.directives
}

function hasOperatorDescriptors(form: IForm) {
  return traverse(form).reduce(
    function([paths, found], item) {
      if (typeof item === 'object' && item.operation && !isGraphQLTag(item)) {
        return [[...paths, this.path.join('.')], true]
      }
      return [paths, found]
    },
    [[], false]
  )
}

describe('Form desearializer', () => {
  it('replaces all operator descriptors from the serialized form', async () => {
    const definitions = await referenceApi.loadDefinitions()
    const { birth, death } = definitions.forms.registerForm

    expect(hasOperatorDescriptors(deserializeForm(birth))).toEqual([[], false])
    expect(hasOperatorDescriptors(deserializeForm(death))).toEqual([[], false])
  })

  it('throws errors when developer passes in invalid operations', async () => {
    const definitions = await referenceApi.loadDefinitions()
    const { birth } = definitions.forms.registerForm

    birth.sections[0].groups[0].fields[0].mapping!.mutation!.operation = 'non_existing_123' as any

    expect(() => deserializeForm(birth)).toThrow()
    /* eslint-disable no-console */
    expect((console.error as jest.Mock).mock.calls).toHaveLength(1)
    expect((console.error as jest.Mock).mock.calls[0][0]).toMatch(
      'non_existing_123'
    )
    /* eslint-enable no-console */
  })
})
