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
import { defineMessages, MessageDescriptor } from 'react-intl'

interface IConfirmationScreenMessages
  extends Record<string, MessageDescriptor> {
  backButton: MessageDescriptor
  boxHeaderDesc: MessageDescriptor
  trackingSectionTitle: MessageDescriptor
  trackingSectionDesc: MessageDescriptor
  backToDuplicatesButton: MessageDescriptor
  newButton: MessageDescriptor
}

const messagesToDefine: IConfirmationScreenMessages = {
  backButton: {
    id: 'register.confirmationScreen.buttons.back',
    defaultMessage: 'Back to homescreen',
    description: 'The button to return to the homescreen'
  },
  boxHeaderDesc: {
    id: 'register.confirmationScreen.boxHeaderDesc',
    defaultMessage: `{event, select, declaration {{eventType, select, birth {birth} death {death}} application has been sent for review.} registration {{eventType, select, birth {birth} death {death}} has been registered.}
        duplication {{eventType, select, birth {birth} death {death}} has been registered.} rejection {{eventType, select, birth {birth} death {death}} application has been rejected.}
        certificate {{eventType, select, birth {birth} death {death}} certificate has been completed.}
        offline {{eventType, select, birth {birth} death {death}} application will be sent when you reconnect.} }`,
    description:
      'The first box header description that appear on the confirmation screen '
  },
  trackingSectionTitle: {
    id: 'register.confirmationScreen.trackingSectionTitle',
    defaultMessage: `{event, select, declaration {Tracking number:} registration {{eventType, select, birth {Birth} death {Death}} Registration Number:}
        duplication {{eventType, select, birth {Birth} death {Death}} Registration Number:} rejection {Tracking number:} certificate {} offline {Tracking number:}} `,
    description:
      'The tracking section title that appear on the confirmation screen'
  },
  trackingSectionDesc: {
    id: 'register.confirmationScreen.trackingSectionDesc',
    defaultMessage: `{event, select, certificate {Certificates have been collected from your jurisdiction.}
        declaration {The informant will receive this number via SMS, but make sure they write it down and keep it safe. They should use the number as a reference if enquiring about their registration.}
        registration {The informant will receive this number via SMS with instructions on how and where to collect the certificate.}
        duplication{The informant will receive this number via SMS with instructions on how and where to collect the certificate.}
        rejection{The application agent will be informed about the reasons for rejection and instructed to follow up.}
        offline {The informant will receive the tracking ID number via SMS when the application has been sent for review.}} `,
    description:
      'The tracking section description that appear on the confirmation screen'
  },
  backToDuplicatesButton: {
    id: 'register.conf.butt.back.dup',
    defaultMessage: 'Back to duplicates',
    description: 'The button to return to the duplicates'
  },
  newButton: {
    id: 'register.conf.butt.newDecl',
    defaultMessage: 'New application',
    description:
      'The button to start a new application now that they are finished with this one'
  }
}

export const messages: IConfirmationScreenMessages = defineMessages(
  messagesToDefine
)
