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
import { mergeConfig } from 'vite'
import type { StorybookConfig } from '@storybook/react-vite'

const viteFinal = async (config: Record<string, any>) => {
  // return the customized config
  return mergeConfig(config, {
    build: {
      minify: false,
      sourcemap: false
    }
  })
}
const config: StorybookConfig = {
  viteFinal,
  stories: [
    '../@(src|stories)/**/*.stories.mdx',
    '../@(src|stories)/**/*.stories.@(js|jsx|ts|tsx)'
  ],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',
    '@storybook/addon-docs'
  ],
  staticDirs: ['../public', '../static'],
  framework: {
    name: '@storybook/react-vite',
    options: {}
  },
  docs: {
    autodocs: true
  }
}
export default config
