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
import pdfMake, { TCreatedPdf } from 'pdfmake/build/pdfmake'
import { commonVFS } from '@client/pdfRenderer/common_vfs'
import { transformers } from '@client/pdfRenderer/transformer'
import {
  IPDFTemplate,
  OptionalData
} from '@client/pdfRenderer/transformer/types'
import { IntlShape } from 'react-intl'
import { IApplication } from '@client/applications'
import { IUserDetails } from '@client/utils/userUtils'
import { IOfflineData } from '@client/offline/reducer'

/*
  Converts template definition into actual PDF using defined transformers, applicationData and userDetails
*/
export function createPDF(
  template: IPDFTemplate,
  application: IApplication,
  userDetails: IUserDetails,
  offlineResource: IOfflineData,
  intl: IntlShape,
  optionalData?: OptionalData
): TCreatedPdf {
  pdfMake.vfs = { ...commonVFS, ...template.vfs }
  let definitionString = JSON.stringify(template.definition)
  if (template.transformers && template.transformers.length > 0) {
    template.transformers.forEach(transformerDef => {
      const transformFunction = transformers[transformerDef.operation]
      if (!transformFunction) {
        throw new Error(
          `No transform function found for given name: ${transformerDef.operation}`
        )
      }
      let result = transformFunction(
        { application, userDetails, resource: offlineResource },
        intl,
        transformerDef.parameters,
        optionalData
      )
      if (
        typeof transformerDef.valueIndex !== 'undefined' && // Checking type of the object as it can contain 0
        typeof result === 'string'
      ) {
        result = (result as string).charAt(transformerDef.valueIndex) || ''
      }
      definitionString = definitionString.replace(
        new RegExp(`{${transformerDef.field}}`, 'gi'),
        result || ''
      )
    })
  }
  return pdfMake.createPdf(
    JSON.parse(definitionString),
    undefined,
    template.fonts[intl.locale]
  )
}

export function printPDF(
  template: IPDFTemplate,
  application: IApplication,
  userDetails: IUserDetails,
  offlineResource: IOfflineData,
  intl: IntlShape,
  optionalData?: OptionalData
) {
  createPDF(
    template,
    application,
    userDetails,
    offlineResource,
    intl,
    optionalData
  ).print()
}
