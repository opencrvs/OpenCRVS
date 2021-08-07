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

interface IHeaderMessages extends Record<string, MessageDescriptor> {
  typeBrnDrn: MessageDescriptor
  typePhone: MessageDescriptor
  placeHolderTrackingId: MessageDescriptor
  placeHolderBrnDrn: MessageDescriptor
  placeHolderPhone: MessageDescriptor
  systemTitle: MessageDescriptor
  settingsTitle: MessageDescriptor
  helpTitle: MessageDescriptor
  teamTitle: MessageDescriptor
  typeName: MessageDescriptor
  placeholderName: MessageDescriptor
}

const messagesToDefine: IHeaderMessages = {
  typeBrnDrn: {
    id: 'home.header.typeBrnDrn',
    defaultMessage: 'BRN/DRN',
    description: 'Search menu brn drn type'
  },
  typePhone: {
    id: 'home.header.typePhone',
    defaultMessage: 'Phone No.',
    description: 'Search menu phone no type'
  },
  placeHolderTrackingId: {
    id: 'home.header.placeHolderTrackingId',
    defaultMessage: 'Enter Tracking ID',
    description: 'Search menu tracking id place holder'
  },
  placeHolderBrnDrn: {
    id: 'home.header.placeHolderBrnDrn',
    defaultMessage: 'Enter BRN/DRN',
    description: 'Search menu brn drn place holder'
  },
  placeHolderPhone: {
    id: 'home.header.placeHolderPhone',
    defaultMessage: 'Enter Phone No.',
    description: 'Search menu phone no place holder'
  },
  systemTitle: {
    id: 'home.header.systemTitle',
    defaultMessage: 'System',
    description: 'System title'
  },
  settingsTitle: {
    id: 'home.header.settingsTitle',
    defaultMessage: 'Settings',
    description: 'settings title'
  },
  helpTitle: {
    id: 'home.header.helpTitle',
    defaultMessage: 'Help',
    description: 'Help title'
  },
  teamTitle: {
    id: 'home.header.teamTitle',
    defaultMessage: 'Team',
    description: 'Team title'
  },
  typeName: {
    id: 'home.header.typeName',
    defaultMessage: 'Name',
    description: 'Search menu name type'
  },
  placeholderName: {
    id: 'home.header.placeholderName',
    defaultMessage: 'Enter name',
    description: 'Search menu name placeholder'
  }
}

export const messages: IHeaderMessages = defineMessages(messagesToDefine)
