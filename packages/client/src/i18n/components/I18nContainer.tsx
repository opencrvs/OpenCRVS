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
import { connect } from 'react-redux'
import { IntlProvider } from 'react-intl'

import { getLanguage, getMessages } from '@client/i18n/selectors'
import { IStoreState } from '@client/store'
import { IntlMessages } from '@client/i18n/reducer'

import 'moment/locale/bn'

type StateProps = {
  locale: string
  messages: IntlMessages
}

const mapStateToProps = (state: IStoreState): StateProps => {
  const locale = getLanguage(state)

  return {
    locale,
    messages: getMessages(state)
  }
}

export const I18nContainer = connect(mapStateToProps)(IntlProvider)
