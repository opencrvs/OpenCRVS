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
import { ISerializedForm } from '@client/forms'
import { ILanguage } from '@client/i18n/reducer'
import { ILocation } from '@client/offline/reducer'
import { IPDFTemplate } from '@client/pdfRenderer/transformer/types'
import { getToken } from '@client/utils/authUtils'
import { ICertificateCollectorDefinition } from '@client/views/PrintCertificate/VerifyCollector'

export interface ILocationDataResponse {
  [locationId: string]: ILocation
}
export interface IFacilitiesDataResponse {
  [facilityId: string]: ILocation
}
export interface IDefinitionsResponse {
  languages: ILanguage[]
  forms: {
    registerForm: { birth: ISerializedForm; death: ISerializedForm }
    certificateCollectorDefinition: {
      birth: ICertificateCollectorDefinition
      death: ICertificateCollectorDefinition
    }
    userForm: ISerializedForm
  }
  templates: {
    receipt?: IPDFTemplate
    certificates: {
      birth: IPDFTemplate
      death: IPDFTemplate
    }
  }
}
export interface IAssetResponse {
  logo: string
}

async function loadDefinitions(): Promise<IDefinitionsResponse> {
  const url = `${window.config.RESOURCES_URL}/definitions/client`

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${getToken()}`
    }
  })

  if (res && res.status !== 200) {
    throw Error(res.statusText)
  }

  const response = await res.json()
  return response
}

async function loadLocations(): Promise<ILocationDataResponse> {
  const url = `${window.config.RESOURCES_URL}/locations`

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${getToken()}`
    }
  })

  if (res && res.status !== 200) {
    throw Error(res.statusText)
  }

  const response = await res.json()
  return response.data
}

async function loadFacilities(): Promise<IFacilitiesDataResponse> {
  const url = `${window.config.RESOURCES_URL}/facilities`
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${getToken()}`
    }
  })

  if (res && res.status !== 200) {
    throw Error(res.statusText)
  }

  const response = await res.json()
  return response.data
}

async function loadPilotLocations(): Promise<ILocationDataResponse> {
  const url = `${window.config.RESOURCES_URL}/pilotLocations`

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${getToken()}`
    }
  })

  if (res && res.status !== 200) {
    throw Error(res.statusText)
  }

  const response = await res.json()
  return response.data
}

const toDataURL = (url: string) =>
  fetch(url)
    .then(response => response.blob())
    .then(
      blob =>
        new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result)
          reader.onerror = reject
          reader.readAsDataURL(blob)
        })
    )

async function loadAssets(): Promise<IAssetResponse> {
  const url = `${window.config.RESOURCES_URL}/assets/${window.config.COUNTRY_LOGO_FILE}`

  return toDataURL(url).then(dataUrl => {
    return {
      logo: `${dataUrl}`
    }
  })
}

export const referenceApi = {
  loadLocations,
  loadFacilities,
  loadPilotLocations,
  loadDefinitions,
  loadAssets
}
