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

import { Location } from '@events/service/locations/locations'
import {
  EventDocument,
  EventIndex,
  isMinioUrl,
  User
} from '@opencrvs/commons/client'
import {
  CertificateTemplateConfig,
  LanguageConfig
} from '@opencrvs/commons/events'

import {
  addFontsToSvg,
  compileSvg,
  printAndDownloadPdf,
  svgToPdfTemplate
} from '@client/v2-events/features/events/actions/print-certificate/pdfUtils'
import { fetchImageAsBase64 } from '@client/utils/imageUtils'

async function replaceMinioUrlWithBase64(template: Record<string, any>) {
  async function recursiveTransform(obj: any) {
    if (typeof obj !== 'object' || obj === null) {
      return obj
    }

    const transformedObject = Array.isArray(obj) ? [...obj] : { ...obj }

    for (const key in obj) {
      const value = obj[key]
      if (typeof value === 'string' && isMinioUrl(value)) {
        transformedObject[key] = await fetchImageAsBase64(value)
      } else if (typeof value === 'object') {
        transformedObject[key] = await recursiveTransform(value)
      } else {
        transformedObject[key] = value
      }
    }

    return transformedObject
  }
  return recursiveTransform(template)
}

export const usePrintableCertificate = (
  event: EventDocument,
  form: EventIndex['data'],
  locations: Location[],
  users: User[],
  certificateConfig?: CertificateTemplateConfig,
  language?: LanguageConfig
) => {
  if (!language || !certificateConfig) {
    return { svgCode: null }
  }

  const certificateFonts = certificateConfig.fonts ?? {}
  const svgWithoutFonts = compileSvg(
    certificateConfig.svg,
    event.actions,
    form,
    locations,
    users,
    language
  )
  const svgCode = addFontsToSvg(svgWithoutFonts, certificateFonts)

  const handleCertify = async () => {
    const base64ReplacedTemplate = await replaceMinioUrlWithBase64(form)
    const compiledSvg = compileSvg(
      certificateConfig.svg,
      event.actions,
      {
        ...base64ReplacedTemplate,
        preview: false
      },
      locations,
      users,
      language
    )
    const compiledSvgWithFonts = addFontsToSvg(compiledSvg, certificateFonts)
    const pdfTemplate = svgToPdfTemplate(compiledSvgWithFonts, certificateFonts)
    printAndDownloadPdf(pdfTemplate, event.id)
  }
  return {
    svgCode,
    handleCertify
  }
}
