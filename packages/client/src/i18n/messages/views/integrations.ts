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
import { defineMessages } from 'react-intl'

const messagesToDefine = {
  createClient: {
    id: 'integrations.createClient',
    defaultMessage: 'Create client',
    description: 'Label for the button creating client'
  },

  pageTitle: {
    id: 'integrations.pageTitle',
    defaultMessage: 'Integrations',
    description: 'Title for integrations page'
  },

  pageIntroduction: {
    id: 'integrations.pageIntroduction',
    defaultMessage:
      'For each new client that needs to integrate with OpenCRVS you can create unique client IDs. A number of integration use cases are currently supported, based on both API and webhook technologies.',
    description: 'Label for the text integration page intorduction'
  },
  copy: {
    id: 'integrations.copy',
    defaultMessage: 'Copy',
    description: 'Label for the text Copy'
  },

  newIntegrationDescription: {
    id: 'integrations.newIntegrationDescription',
    defaultMessage:
      'Add a unique name and select the type of client you would like to create',
    description:
      'Description to help user fill name and type of a new integration client'
  },

  uniqueKeysDescription: {
    id: 'integrations.uniqueKeyDescription',
    defaultMessage:
      'These unique keys will be required by the client integrating',
    description: 'Label for the unique key description'
  },

  revealKeys: {
    id: 'integrations.revealKeys',
    defaultMessage: 'Reveal Keys',
    description: 'Label for reveal keys option'
  },
  disable: {
    id: 'integrations.disable',
    defaultMessage: 'Disable',
    description: 'Label for disable option'
  },
  enable: {
    id: 'integrations.enable',
    defaultMessage: 'Enable',
    description: 'Label for enable option'
  },
  delete: {
    id: 'integrations.delete',
    defaultMessage: 'Delete',
    description: 'Label for delete option'
  },
  name: {
    id: 'integrations.name',
    defaultMessage: 'Name',
    description: 'Label for name input'
  },
  nationalIDName: {
    id: 'integrations.nationalIDName',
    defaultMessage: 'Name',
    description: 'Label for name input for National ID'
  },
  type: {
    id: 'integrations.client.type',
    defaultMessage: 'Type',
    description: 'Label for type of client'
  },
  label: {
    id: 'integrations.label',
    defaultMessage: 'Label',
    description: 'Label'
  },
  webhookPermissionsDescription: {
    id: 'integrations.webhookPermissionsDescription',
    defaultMessage:
      'Select the data you wish to be contained within the webhook payload',
    description: 'Webhook description above permissions'
  },
  webhookDescription: {
    id: 'integrations.webhookDescription',
    defaultMessage:
      'Select the data you wish to be contained within the webhook payload',
    description: 'label for webhook client'
  },

  PIIDataLabel: {
    id: 'integrations.webhook.PII',
    defaultMessage: 'Include PII data',
    description: 'Label for PII'
  },

  birth: {
    id: 'integrations.birth',
    defaultMessage: 'Birth',
    description: 'Label for birth'
  },

  death: {
    id: 'integrations.death',
    defaultMessage: 'Death',
    description: 'Label for death'
  },

  eventNotification: {
    id: 'integrations.type.eventNotification',
    defaultMessage: 'Event notification',
    description: 'Label for event notification'
  },

  selfServicePortal: {
    id: 'integrations.type.selfServicePortal',
    defaultMessage: 'Self Service Portal',
    description: 'Label for Self Service Portal'
  },

  childDetails: {
    id: 'integrations.childDetails',
    defaultMessage: `Child's details`,
    description: 'Label for child details'
  },

  motherDetails: {
    id: 'integrations.motherDetails',
    defaultMessage: `Mother's details`,
    description: 'Label for mothers details'
  },

  fatherDetails: {
    id: 'integrations.fatherDetails',
    defaultMessage: `Father's details`,
    description: 'Label for fathers details'
  },

  informantDetails: {
    id: 'integrations.informantDetails',
    defaultMessage: `Informant's details`,
    description: 'Label for informant details'
  },

  documentDetails: {
    id: 'integrations.documentDetails',
    defaultMessage: `Document details`,
    description: 'Label for document details'
  },

  deathEventDetails: {
    id: 'integrations.deathEventDetails',
    defaultMessage: `Event details`,
    description: 'Label for death event details'
  },

  deceasedDetails: {
    id: 'integrations.deceasedDetails',
    defaultMessage: `Deceased's details`,
    description: 'Label for Deceased details'
  },

  registrationDetailsNoPII: {
    id: 'integrations.registrationDetailsnNoPII',
    defaultMessage: 'Registration Details (No PII)',
    description: 'Label for registration details no PII'
  },

  childDetailsNoPII: {
    id: 'integrations.childDetailsNoPII',
    defaultMessage: 'Childs Details (No PII)',
    description: 'Label for child details no PII'
  },

  motherDetailsNoPII: {
    id: 'integrations.motherDetailsNoPII',
    defaultMessage: 'Mothers Details (No PII)',
    description: 'Label for mothers details no PII'
  },

  fatherDetailsNoPII: {
    id: 'integrations.fatherDetailsNoPII',
    defaultMessage: 'Fathers Details (No PII)',
    description: 'Label for fathers details no PII'
  },

  informantDetailsNoPII: {
    id: 'integrations.informantDetailsNoPII',
    defaultMessage: 'Informant Details (No PII)',
    description: 'Label for informant details no PII'
  },

  recordSearch: {
    id: 'integrations.type.recordSearch',
    defaultMessage: 'Record search',
    description: 'Label for record search'
  },

  nationalId: {
    id: 'integrations.type.nationalId',
    defaultMessage: 'National id',
    description: 'Label for national id'
  },

  webhook: {
    id: 'integrations.type.webhook',
    defaultMessage: 'Webhook',
    description: 'Label for web hook'
  },
  healthSystem: {
    id: 'integrations.type.healthSystem',
    defaultMessage: 'Health integration',
    description: 'Label for health system type'
  },
  healthnotificationAlertDescription: {
    id: 'integrations.eventNotificationDescription',
    defaultMessage:
      'A notification client (eg. hospital) can send a partial notification or a full declaration of a birth or death to OpenCRVS for processing. For more information, visit:',
    description: 'Label for  health notification description'
  },
  recordSearchDescription: {
    id: 'integrations.recordSearchDescription',
    defaultMessage:
      'A Record search client can perform an advanced search on OpenCRVS data. For more information, visit:',
    description: 'Label for  record search description'
  },

  clientId: {
    id: 'integrations.clientId',
    defaultMessage: 'Client ID',
    description: 'Label for client Id'
  },

  clientSecret: {
    id: 'integrations.clientSecret',
    defaultMessage: 'Client secret',
    description: 'Label for client secret'
  },
  shaSecret: {
    id: 'integrations.shaSecret',
    defaultMessage: 'SHA secret',
    description: 'Label for SHA secret'
  },
  active: {
    id: 'integrations.active',
    defaultMessage: 'Active',
    description: 'Label for active integration'
  },
  inactive: {
    id: 'integrations.inactive',
    defaultMessage: 'Inactive',
    description: 'Label for inactive integration'
  },
  activate: {
    id: 'integrations.activate',
    defaultMessage: 'Activate',
    description: 'Label for activate option'
  },
  deactivate: {
    id: 'integrations.deactivate',
    defaultMessage: 'Deactivate',
    description: 'Label for deactivate option'
  },
  loading: {
    id: 'integrations.loading',
    defaultMessage: 'Loading',
    description: 'Label for loading option'
  },
  error: {
    id: 'integrations.error',
    defaultMessage: 'Something went wrong',
    description: 'Label for error option'
  },
  activateClient: {
    id: 'integrations.activate.client',
    defaultMessage: 'Activate Client?',
    description: 'Label for activate client option'
  },
  activateClientStatus: {
    id: 'integrations.activate.status',
    defaultMessage: 'Client activated',
    description: 'Label for activate client'
  },
  deactivateClientStatus: {
    id: 'integrations.deactivate.status',
    defaultMessage: 'Client deactivated',
    description: 'Label for deactivate client'
  },
  deactivateClient: {
    id: 'integrations.deactivate.client',
    defaultMessage: 'Deactivate Client?',
    description: 'Label for deactivate client option'
  },
  activateClientText: {
    id: 'integrations.activatetext',
    defaultMessage: 'This will activate the client',
    description: 'This will activate the client'
  },
  deactivateClientText: {
    id: 'integrations.deactivatetext',
    defaultMessage: 'This will deactivate the client',
    description: 'This will deactivate the client'
  },
  updatePermissionsMsg: {
    id: 'integrations.updatePermissionsMsg',
    defaultMessage: 'Permissions updated successfully',
    description: 'Label for update permissions message'
  },
  deleteSystemText: {
    id: 'integrations.deleteSystemText',
    defaultMessage:
      'Are you sure you want to <b>permanently</b> delete the integration?',
    description: 'Label for system delete description'
  },
  deleteSystemMsg: {
    id: 'integrations.deleteSystemMsg',
    defaultMessage: 'System has been deleted successfully',
    description: 'Label for system deletion success message'
  },
  integratingSystemTypeMosip: {
    id: 'integrations.integratingSystemTypeMosip',
    defaultMessage: 'MOSIP',
    description: 'Integrating system type option "MOSIP"'
  },
  integratingSystemTypeOther: {
    id: 'integrations.integratingSystemTypeOther',
    defaultMessage: 'Other',
    description: 'Integrating system type option "Other"'
  },
  integratingSystemType: {
    id: 'integrations.integratingSystemType',
    defaultMessage: 'System',
    description: 'Label for integrating system type'
  },
  integratingSystemTypeAlertMosip: {
    id: 'integrations.integratingSystemTypeAlertMosip',
    defaultMessage: 'Mosip copy tbd. TODO: Euan',
    description: 'Label for alert when selecting MOSIP type'
  },
  integratingSystemTypeAlertOther: {
    id: 'integrations.integratingSystemTypeAlertOther',
    defaultMessage: 'Other copy tbd. TODO: Euan',
    description: 'Label for alert when selecting other type'
  }
}

export const integrationMessages = defineMessages(messagesToDefine)
