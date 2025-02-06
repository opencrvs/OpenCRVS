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
module.exports = {
  rules: {
    '@typescript-eslint/await-thenable': 2,
    '@typescript-eslint/no-empty-function': 'warn',
    '@typescript-eslint/consistent-type-definitions': 1,
    '@typescript-eslint/default-param-last': 2,
    '@typescript-eslint/no-dynamic-delete': 2,
    '@typescript-eslint/no-explicit-any': 1,
    '@typescript-eslint/no-floating-promises': 2,
    '@typescript-eslint/no-misused-promises': 2,
    '@typescript-eslint/no-unnecessary-boolean-literal-compare': 2,
    '@typescript-eslint/no-non-null-assertion': 2,
    '@typescript-eslint/no-unnecessary-condition': 1,
    '@typescript-eslint/prefer-includes': 1,
    '@typescript-eslint/promise-function-async': 2,
    '@typescript-eslint/require-await': 2,
    '@typescript-eslint/return-await': 2,
    '@typescript-eslint/switch-exhaustiveness-check': 2,
    'func-style': [
      'error',
      'declaration',
      {
        allowArrowFunctions: true
      }
    ],
    'no-restricted-syntax': [
      'error',
      {
        selector:
          ':matches(Program > VariableDeclaration) > VariableDeclarator > ArrowFunctionExpression',
        message: 'Top-level arrow functions are not allowed.'
      }
    ],
    'no-shadow': 1,
    'no-undef-init': 2,
    'no-return-assign': 2,
    'vars-on-top': 1,
    'block-spacing': ['warn', 'always'],
    curly: ['warn', 'all'],
    'no-nested-ternary': 'warn',
    'no-multiple-empty-lines': 1,
    'prefer-const': 1,
    'block-scoped-var': 1,
    'import/no-cycle': 1,
    'max-lines': ['warn', 600]
  },
  parser: '@typescript-eslint/parser'
}
