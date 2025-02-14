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
import {
  IntlShape,
  MessageDescriptor,
  createIntl,
  createIntlCache
} from 'react-intl'
import * as Handlebars from 'handlebars'
import htmlToPdfmake from 'html-to-pdfmake'
import {
  Content,
  TDocumentDefinitions,
  TFontFamilyTypes
} from 'pdfmake/interfaces'
import { Location } from '@events/service/locations/locations'
import pdfMake from 'pdfmake/build/pdfmake'
import { LanguageConfig } from '@opencrvs/commons'
import {
  ActionFormData,
  EventDocument,
  EventIndex,
  User
} from '@opencrvs/commons/client'

import { getHandlebarHelpers } from '@client/forms/handlebarHelpers'
import { isMobileDevice } from '@client/utils/commonUtils'

export interface FontFamilyTypes {
  normal: string
  bold: string
  italics: string
  bolditalics: string
}

export type CertificateConfiguration = Partial<{
  fonts: Record<string, FontFamilyTypes>
}>

export const certificateBaseTemplate = {
  definition: {
    pageMargins: [0, 0, 0, 0] as [number, number, number, number],
    defaultStyle: {
      font: 'notosans'
    },
    content: []
  },
  fonts: {}
}

function isMessageDescriptor(obj: unknown): obj is MessageDescriptor {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'defaultMessage' in obj &&
    typeof (obj as MessageDescriptor).id === 'string' &&
    typeof (obj as MessageDescriptor).defaultMessage === 'string'
  )
}

function formatAllNonStringValues(
  templateData: ActionFormData,
  intl: IntlShape
): Record<string, string> {
  const formattedData: Record<string, string> = {}

  for (const key of Object.keys(templateData)) {
    const value = templateData[key]

    if (isMessageDescriptor(value)) {
      formattedData[key] = intl.formatMessage(value)
    } else if (Array.isArray(value)) {
      // Address field: country label is a MessageDescriptor but others are strings
      formattedData[key] = value
        .filter(Boolean)
        .map((item) =>
          isMessageDescriptor(item) ? intl.formatMessage(item) : item
        )
        .join(', ')
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    } else if (typeof value === 'object' && value !== null) {
      formattedData[key] = JSON.stringify(
        formatAllNonStringValues(value as ActionFormData, intl)
      )
    } else {
      formattedData[key] = String(value)
    }
  }

  return formattedData
}

const cache = createIntlCache()

export function compileSvg(
  templateString: string,
  $actions: EventDocument['actions'],
  $data: EventIndex['data'],
  locations: Location[],
  users: User[],
  language: LanguageConfig
): string {
  const intl: IntlShape = createIntl(
    {
      locale: language.lang,
      messages: language.messages
    },
    cache
  )

  const customHelpers = getHandlebarHelpers()

  for (const helperName of Object.keys(customHelpers)) {
    /*
     * Note for anyone adding new context variables to handlebar helpers:
     * Everything you expose to country config's here will become API surface area,
     * This means that countries will become dependant on it and it will be hard to remove or rename later on.
     * If you need to expose the full record, please consider only exposing the specific values you know are needed.
     * Otherwise what happens is that we lose the ability to refactor and remove things later on.
     */
    const helper = customHelpers[helperName]({ intl })
    Handlebars.registerHelper(helperName, helper)
  }

  const template = Handlebars.compile(templateString)
  $data = formatAllNonStringValues($data, intl)
  const output = template({
    $data,
    $actions,
    $references: {
      locations,
      users
    }
  })
  return output
}

export function addFontsToSvg(
  svgString: string,
  fonts: Record<string, FontFamilyTypes>
) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(svgString, 'image/svg+xml')
  const svg = doc.documentElement
  const style = document.createElement('style')
  style.innerHTML = Object.entries(fonts)
    .flatMap(([font, families]) =>
      Object.entries(families).map(
        ([family, url]) => `
@font-face {
font-family: "${font}";
font-weight: ${family};
src: url("${url}") format("truetype");
}`
      )
    )
    .join('')
  svg.prepend(style)
  const serializer = new XMLSerializer()
  return serializer.serializeToString(svg)
}
export function svgToPdfTemplate(
  svg: string,
  certificateFonts: CertificateConfiguration
) {
  const pdfTemplate: PdfTemplate = {
    ...certificateBaseTemplate,
    definition: {
      ...certificateBaseTemplate.definition,
      defaultStyle: {
        font:
          Object.keys(certificateFonts)[0] ||
          certificateBaseTemplate.definition.defaultStyle.font
      }
    },
    fonts: {
      ...certificateBaseTemplate.fonts,
      ...certificateFonts
    }
  }

  const parser = new DOMParser()
  const svgElement = parser.parseFromString(
    svg,
    'image/svg+xml'
  ).documentElement

  const widthValue = svgElement.getAttribute('width')
  const heightValue = svgElement.getAttribute('height')

  if (widthValue && heightValue) {
    const width = Number.parseInt(widthValue)
    const height = Number.parseInt(heightValue)
    pdfTemplate.definition.pageSize = {
      width,
      height
    }
    if (width > height) {
      pdfTemplate.definition.pageOrientation = 'landscape'
    }
  }

  const foreignObjects = svgElement.getElementsByTagName('foreignObject')
  const absolutelyPositionedHTMLs: Content[] = []
  for (const foreignObject of foreignObjects) {
    const width = Number.parseInt(foreignObject.getAttribute('width') ?? '0')
    const x = Number.parseInt(foreignObject.getAttribute('x') ?? '0')
    const y = Number.parseInt(foreignObject.getAttribute('y') ?? '0')
    const htmlContent = foreignObject.innerHTML
    const pdfmakeContent = htmlToPdfmake(htmlContent, {
      ignoreStyles: ['font-family']
    })
    absolutelyPositionedHTMLs.push({
      columns: [
        {
          width,
          stack: pdfmakeContent
        }
      ],
      absolutePosition: { x, y }
    } as Content)
  }

  pdfTemplate.definition.content = [
    {
      svg
    },
    ...absolutelyPositionedHTMLs
  ]

  return pdfTemplate
}

export function downloadFile(
  contentType: string,
  data: string,
  fileName: string
) {
  const linkSource = `data:${contentType};base64,${window.btoa(data)}`
  const downloadLink = document.createElement('a')
  downloadLink.setAttribute('href', linkSource)
  downloadLink.setAttribute('download', fileName)
  downloadLink.click()
}

export interface PdfTemplate {
  definition: TDocumentDefinitions
  fonts: Record<string, TFontFamilyTypes>
}

export interface SvgTemplate {
  definition: string
}

export function printAndDownloadPdf(
  template: PdfTemplate,
  declarationId: string
) {
  const pdf = pdfMake.createPdf(template.definition, undefined, template.fonts)
  if (isMobileDevice()) {
    pdf.download(`${declarationId}`)
  } else {
    pdf.print()
  }
}
