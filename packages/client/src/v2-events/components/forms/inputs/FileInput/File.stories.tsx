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

import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import React from 'react'
import styled from 'styled-components'
import { FormFieldGenerator } from '@client/v2-events/components/forms/FormFieldGenerator'
import { TRPCProvider } from '@client/v2-events/trpc'

const meta: Meta<typeof FormFieldGenerator> = {
  title: 'Inputs/File',
  args: { onChange: fn() },
  decorators: [
    (Story) => (
      <TRPCProvider>
        <Story />
      </TRPCProvider>
    )
  ]
}

export default meta

const StyledFormFieldGenerator = styled(FormFieldGenerator)`
  width: 400px;
`
export const FileInputWithOption: StoryObj<typeof FormFieldGenerator> = {
  name: 'File input with option',
  parameters: {
    layout: 'centered'
  },
  render: function Component(args) {
    const [formData, setFormData] = React.useState({})
    return (
      <StyledFormFieldGenerator
        fields={[
          {
            id: 'storybook.file',
            type: 'FILE_WITH_OPTIONS',
            label: {
              id: 'storybook.file.label',
              defaultMessage: 'Upload your captured photo',
              description: 'The title for the file input'
            },
            options: [
              {
                value: 'forest',
                label: {
                  id: 'storybook.file.option.forest',
                  defaultMessage: 'Forest',
                  description: 'Option for a forest setting'
                }
              },
              {
                value: 'beach',
                label: {
                  id: 'storybook.file.option.beach',
                  defaultMessage: 'Beach',
                  description: 'Option for a beach setting'
                }
              },
              {
                value: 'mountain',
                label: {
                  id: 'storybook.file.option.mountain',
                  defaultMessage: 'Mountain',
                  description: 'Option for a mountain setting'
                }
              },
              {
                value: 'desert',
                label: {
                  id: 'storybook.file.option.desert',
                  defaultMessage: 'Desert',
                  description: 'Option for a desert setting'
                }
              },
              {
                value: 'city',
                label: {
                  id: 'storybook.file.option.city',
                  defaultMessage: 'City',
                  description: 'Option for a city setting'
                }
              }
            ]
          }
        ]}
        formData={formData}
        id="my-form"
        setAllFieldsDirty={false}
        onChange={(data) => {
          args.onChange(data)
          setFormData(data)
        }}
      />
    )
  }
}

export const FileInputWithoutOption: StoryObj<typeof FormFieldGenerator> = {
  name: 'File input without option',
  parameters: {
    layout: 'centered'
  },
  render: function Component(args) {
    const [formData, setFormData] = React.useState({})
    return (
      <StyledFormFieldGenerator
        fields={[
          {
            id: 'storybook.file2',
            type: 'FILE',
            label: {
              id: 'storybook.file2.label',
              defaultMessage: 'Upload your photo',
              description: 'The title for the file input'
            }
          }
        ]}
        formData={formData}
        id="my-form"
        setAllFieldsDirty={false}
        onChange={(data) => {
          args.onChange(data)
          setFormData(data)
        }}
      />
    )
  }
}
