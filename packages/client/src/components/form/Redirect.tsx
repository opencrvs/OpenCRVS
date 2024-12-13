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
  IFormData,
  IFormField,
  IFormFieldValue,
  IFormSectionData,
  IHttpFormField,
  Ii18nRedirectFormField
} from '@client/forms'
import { evalExpressionInFieldDefinition } from '@client/forms/utils'
import { getOfflineData } from '@client/offline/selectors'
import { getUserDetails } from '@client/profile/profileSelectors'
import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Link } from '@opencrvs/components'
import { useHttp } from '@client/components/form/http'

export const RedirectField = ({
  fields,
  form,
  draft,
  fieldDefinition,
  setFieldValue,
  isDisabled
}: {
  fields: IFormField[]
  form: IFormSectionData
  draft: IFormData
  fieldDefinition: Ii18nRedirectFormField
  setFieldValue: (name: string, value: IFormFieldValue) => void
  isDisabled?: boolean
}) => {
  const config = useSelector(getOfflineData)
  const user = useSelector(getUserDetails)
  const {
    options: {
      url: to,
      callback: { params }
    }
  } = fieldDefinition
  const evalPath = evalExpressionInFieldDefinition(
    '`' + to + '`',
    form,
    config,
    draft,
    user
  )
  const trigger = fields.find(
    (f) => f.name === fieldDefinition.options.callback.trigger
  )!
  const onChange: Parameters<typeof useHttp>[1] = ({ data, error, loading }) =>
    setFieldValue(trigger.name, { loading, data, error } as IFormFieldValue)

  const { call } = useHttp<string>(
    trigger as IHttpFormField,
    onChange,
    form,
    config,
    draft,
    user
  )

  useEffect(() => {
    const hasRequestBeenMade = Boolean(form[trigger.name])
    function checkParamsPresentInURL() {
      const urlParams = new URLSearchParams(window.location.search)
      for (const [key, value] of Object.entries(params)) {
        if (urlParams.get(key) !== value) {
          return false
        }
      }
      return true
    }
    if (checkParamsPresentInURL() && !hasRequestBeenMade) {
      call()
    }
  }, [call, params, form, trigger])

  return (
    <Link disabled={isDisabled}>
      <a href={evalPath}>{fieldDefinition.label}</a>
    </Link>
  )
}
