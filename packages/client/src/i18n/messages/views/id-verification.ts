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

const authenticated = {
  title: {
    id: 'views.idVerification.banner.authenticated.title',
    defaultMessage: 'ID Authenticated'
  },
  description: {
    id: 'views.idVerification.banner.authenticated.description',
    defaultMessage:
      'This identity has been successfully authenticated with the Farajaland’s National ID System. To make edits, please remove the authentication first.'
  },
  resetConfirmation: {
    title: {
      id: 'views.idVerification.banner.authenticated.resetConfirmation.title',
      defaultMessage: 'Revoke authenticated ID?'
    },
    description: {
      id: 'views.idVerification.banner.authenticated.resetConfirmation.description',
      defaultMessage:
        'By clicking ‘Continue,’ you’ll remove ID Authenticated status and unlock the fields for editing.'
    }
  }
}

const verified = {
  title: {
    id: 'views.idVerification.banner.verified.title',
    defaultMessage: 'ID Verified'
  },
  description: {
    id: 'views.idVerification.banner.verified.description',
    defaultMessage:
      'This identity data has been successfully verified with the Farajaland’s National ID System. Please note that their identity has not been authenticated using the individuals biometrics. To make edits, please remove the verification first.'
  },
  resetConfirmation: {
    title: {
      id: 'views.idVerification.banner.verified.resetConfirmation.title',
      defaultMessage: 'Revoke valid ID?'
    },
    description: {
      id: 'views.idVerification.banner.verified.resetConfirmation.description',
      defaultMessage:
        'By clicking ‘Continue,’ you’ll remove ID Verified status and unlock the fields for editing.'
    }
  }
}

const failed = {
  title: {
    id: 'views.idVerification.banner.failed.title',
    defaultMessage: 'ID Verification Failed'
  },
  description: {
    id: 'views.idVerification.banner.failed.description',
    defaultMessage:
      'The identity card scanned has not be successfully authenticated'
  },
  resetConfirmation: {
    title: {
      id: 'views.idVerification.banner.failed.resetConfirmation.title',
      defaultMessage: 'Reset information?'
    },
    description: {
      id: 'views.idVerification.banner.failed.resetConfirmation.description',
      defaultMessage:
        'By clicking ‘Continue,’ you’ll clear all information to it’s default state.'
    }
  }
}

const actions = {
  revoke: {
    id: 'views.idVerification.banner.actions.revoke',
    defaultMessage: 'Revoke'
  },
  reset: {
    id: 'views.idVerification.banner.actions.reset',
    defaultMessage: 'Reset'
  }
}

export const messages = {
  authenticated,
  verified,
  failed,
  actions
}
