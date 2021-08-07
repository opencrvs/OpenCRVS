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

interface IPerformanceReportsMessages
  extends Record<string, MessageDescriptor> {
  monthlyTabTitle: MessageDescriptor
  monthlyReportsBodyHeader: MessageDescriptor
  sysAdminPerformanceHomeHeader: MessageDescriptor
  sysAdminTeamHomeHeader: MessageDescriptor
  noResultForLocation: MessageDescriptor
  noResultForLocationWithoutPilotAreas: MessageDescriptor
  exportAll: MessageDescriptor
  operational: MessageDescriptor
  reports: MessageDescriptor
  applicationsStartedTitle: MessageDescriptor
  applicationsStartedDescription: MessageDescriptor
  applicationsStartedTotal: MessageDescriptor
  applicationsStartedFieldAgents: MessageDescriptor
  applicationsStartedHospitals: MessageDescriptor
  applicationsStartedOffices: MessageDescriptor
  registrationRatesReportHeader: MessageDescriptor
  registrationRatesReportSubHeader: MessageDescriptor
  registrationRatesReportDescription: MessageDescriptor
  birthRegistrationRatesReportHeader: MessageDescriptor
  deathRegistrationRatesReportHeader: MessageDescriptor
  overTime: MessageDescriptor
  byLocation: MessageDescriptor
  locationTitle: MessageDescriptor
  applicationCountByStatusDescription: MessageDescriptor
  workflowStatusHeader: MessageDescriptor
  fieldAgentsTitle: MessageDescriptor
  fieldAgentsNoResult: MessageDescriptor
  fieldAgentColumnHeader: MessageDescriptor
  typeColumnHeader: MessageDescriptor
  officeColumnHeader: MessageDescriptor
  startMonthColumnHeader: MessageDescriptor
  totalSentColumnHeader: MessageDescriptor
  totalInProgressColumnHeader: MessageDescriptor
  avgCompletionTimeColumnHeader: MessageDescriptor
  totalRejectedColumnHeader: MessageDescriptor
  fieldAgentStatusOptionActive: MessageDescriptor
  fieldAgentStatusOptionPending: MessageDescriptor
  fieldAgentStatusOptionDeactive: MessageDescriptor
  eventOptionForBoth: MessageDescriptor
  eventOptionForBirths: MessageDescriptor
  eventOptionForDeaths: MessageDescriptor
  showMoreUsersLinkLabel: MessageDescriptor
  pilotAreaListHeader: MessageDescriptor
}

const messagesToDefine: IPerformanceReportsMessages = {
  monthlyTabTitle: {
    id: 'performance.topbar.tab.title.monthly',
    defaultMessage: 'Monthly',
    description: 'Title used for monthly tab in performance page header'
  },
  monthlyReportsBodyHeader: {
    id: 'performance.body.header.monthly.reports',
    defaultMessage: 'Monthly reports',
    description: 'Header used for the body of monthly reports page'
  },
  sysAdminPerformanceHomeHeader: {
    id: 'performance.header.sysadmin.home',
    defaultMessage: 'Search for an administrative area or office',
    description: 'Header for system admin performance home page'
  },
  sysAdminTeamHomeHeader: {
    id: 'team.header.sysadmin.home',
    defaultMessage: 'Search for an office',
    description: 'Header for system admin team home page'
  },
  noResultForLocation: {
    id: 'performance.reports.noResultForLocation',
    defaultMessage:
      'No data for {searchedLocation}. We are currently piloting for following areas:',
    description: 'Message to show if no data is found for a location'
  },
  noResultForLocationWithoutPilotAreas: {
    id: 'performance.reports.noResultInPilot',
    defaultMessage: 'No data for {searchedLocation}.',
    description: 'Message to show if no data is found for a location'
  },
  exportAll: {
    id: 'performance.reports.exportAll',
    defaultMessage: 'Export all performance data',
    description: 'Link text where all performance data is downloaded from'
  },
  operational: {
    id: 'performance.reports.select.item.operational',
    defaultMessage: 'Operational',
    description: 'Label for select option Operational'
  },
  reports: {
    id: 'performance.reports.select.item.reports',
    defaultMessage: 'Reports',
    description: 'Label for select option Reports'
  },
  applicationsStartedTitle: {
    id: 'performance.reports.applicationsStarted.title',
    defaultMessage: 'Applications started',
    description: 'Title for applications started in performance reports'
  },
  applicationsStartedDescription: {
    id: 'performance.reports.appStart.desc',
    defaultMessage:
      'Total and percentage breakdown of the applications started by source from ',
    description: 'Description for applications started in performance reports'
  },
  applicationsStartedTotal: {
    id: 'performance.reports.applicationsStarted.total',
    defaultMessage: 'Total started',
    description: 'Total applications started title'
  },
  applicationsStartedFieldAgents: {
    id: 'performance.reports.appStart.fieldAgents',
    defaultMessage: 'Field agents',
    description: 'Field agent applications started title'
  },
  applicationsStartedOffices: {
    id: 'performance.reports.applicationsStarted.offices',
    defaultMessage: 'Registration offices',
    description: 'Offices applications started title'
  },
  applicationsStartedHospitals: {
    id: 'performance.reports.applicationsStarted.hospitals',
    defaultMessage: 'Hospitals (DHIS2)',
    description: 'Hospitals applications started title'
  },
  registrationRatesReportHeader: {
    id: 'performance.report.registration.rates.header',
    defaultMessage: 'Registration rates',
    description: 'Header for registration rates report'
  },
  registrationRatesReportSubHeader: {
    id: 'performance.report.registration.rates.subheader',
    defaultMessage:
      'Rates are based on estimated totals calculated using the crude birth and death rate for {startTime} - {endTime}',
    description: 'Sub header for registration rates report'
  },
  registrationRatesReportDescription: {
    id: 'performance.report.registration.rates.description',
    defaultMessage:
      '{totalRegistrationNumber} registered within 45 days out of estimated {estimatedRegistrationNumber}',
    description: 'Event registration rate report description'
  },
  birthRegistrationRatesReportHeader: {
    id: 'performance.report.regrates.birth.head',
    defaultMessage: 'Birth registration rate within 45 days of event',
    description: 'Header for birth registration rates report'
  },
  deathRegistrationRatesReportHeader: {
    id: 'performance.report.regrates.death.head',
    defaultMessage: 'Death registration rate within 45 days of event',
    description: 'Header for death registration rates report'
  },
  overTime: {
    id: 'performance.regRates.select.item.overTime',
    defaultMessage: 'Over time',
    description: 'Label for select option Over time'
  },
  byLocation: {
    id: 'performance.regRates.select.item.byLocation',
    defaultMessage: 'By location',
    description: 'Label for select option By location'
  },
  locationTitle: {
    id: 'performance.regRates.column.location',
    defaultMessage: 'Locations',
    description: 'Title for location column on estimation table'
  },
  applicationCountByStatusDescription: {
    id: 'performance.ops.statCount.desc',
    defaultMessage:
      'Current status of all applications being processed for your selected administrative area.',
    description: 'Description of the status wise application count view'
  },
  workflowStatusHeader: {
    id: 'performance.operational.workflowStatus.header',
    defaultMessage: 'Current applications in workflow',
    description: 'Header title for work flow status page'
  },
  fieldAgentsTitle: {
    id: 'performance.fieldAgents.title',
    defaultMessage: 'Field agnets',
    description: 'Header title for field agent list page'
  },
  fieldAgentsNoResult: {
    id: 'performance.fieldAgents.noResult',
    defaultMessage: 'No users found',
    description: 'Text for no field agent found'
  },
  fieldAgentColumnHeader: {
    id: 'performance.fieldAgents.columnHeader.name',
    defaultMessage: 'Field agents ({totalAgents})',
    description: 'Column header for field agent'
  },
  typeColumnHeader: {
    id: 'performance.fieldAgents.columnHeader.type',
    defaultMessage: 'Type',
    description: 'Column header for type in field agent list'
  },
  officeColumnHeader: {
    id: 'performance.fieldAgents.columnHeader.office',
    defaultMessage: 'Office',
    description: 'Column header for office in field agent list'
  },
  startMonthColumnHeader: {
    id: 'performance.fieldAgents.columnHeader.startMonth',
    defaultMessage: 'Start month',
    description: 'Column header for start of month in field agent list'
  },
  totalSentColumnHeader: {
    id: 'performance.fieldAgents.columnHeader.totalSent',
    defaultMessage: 'Applications{linebreak}sent',
    description: 'Column header for total application sent in field agent list'
  },
  totalInProgressColumnHeader: {
    id: 'performance.fieldAgents.col.totInProg',
    defaultMessage: 'Sent{linebreak}incomplete',
    description:
      'Column header for total inprogress application sent in field agent list'
  },
  avgCompletionTimeColumnHeader: {
    id: 'performance.fieldAgents.col.avgCompTime',
    defaultMessage: 'Avg. time to send{linebreak}complete application',
    description:
      'Column header for avg application completion time in field agent list'
  },
  totalRejectedColumnHeader: {
    id: 'performance.fieldAgents.col.totRej',
    defaultMessage: 'Rejected',
    description:
      'Column header for total rejected applications in field agent list'
  },
  fieldAgentStatusOptionActive: {
    id: 'performance.fieldAgents.options.status.active',
    defaultMessage: 'Active',
    description: 'Label for active status option'
  },
  fieldAgentStatusOptionPending: {
    id: 'performance.fieldAgents.options.status.pending',
    defaultMessage: 'Pending',
    description: 'Label for pending status option'
  },
  fieldAgentStatusOptionDeactive: {
    id: 'performance.fieldAgents.options.status.deactive',
    defaultMessage: 'Deactive',
    description: 'Label for deactive status option'
  },
  eventOptionForBoth: {
    id: 'performance.fieldAgents.options.event.both',
    defaultMessage: 'Births and deaths',
    description: 'Label for both event option'
  },
  eventOptionForBirths: {
    id: 'performance.fieldAgents.options.event.births',
    defaultMessage: 'Births',
    description: 'Label for birth event option'
  },
  eventOptionForDeaths: {
    id: 'performance.fieldAgents.options.event.deaths',
    defaultMessage: 'Deaths',
    description: 'Label for death event option'
  },
  showMoreUsersLinkLabel: {
    id: 'performance.fieldAgents.showMore',
    defaultMessage: 'Show next {pageSize}',
    description: 'Label for show more link'
  },
  pilotAreaListHeader: {
    id: 'performance.pilotArea.header',
    defaultMessage: 'Pilot Areas',
    description: 'Label for pilot area list header'
  }
}

export const messages: IPerformanceReportsMessages = defineMessages(
  messagesToDefine
)
