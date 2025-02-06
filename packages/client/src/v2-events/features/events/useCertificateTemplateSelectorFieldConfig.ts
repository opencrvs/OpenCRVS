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

import { EventDocument } from '@opencrvs/commons/client'
import { useAppConfig } from '@client/v2-events/hooks/useAppConfig'

export const useCertificateTemplateSelectorFieldConfig = (
  event: EventDocument
) => {
  const { certificateTemplates } = useAppConfig()
  return {
    id: 'templateId',
    type: 'SELECT',
    required: true,
    label: {
      defaultMessage: 'Select Certificate Template',
      description: 'This is the label for the field',
      id: 'v2.event.default.action.certificate.form.section.who.field.surname.label'
    },
    options: certificateTemplates
      .filter((x) => x.event === event.type)
      .map((x) => ({ label: x.label, value: x.id }))
  }
}
