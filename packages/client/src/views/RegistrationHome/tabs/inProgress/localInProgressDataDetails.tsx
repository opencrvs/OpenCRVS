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
import { StatusProgress } from '@opencrvs/components/lib/icons'
import { IApplication, SUBMISSION_STATUS } from '@client/applications'
import { messages } from '@client/i18n/messages/views/search'
import { IStoreState } from '@client/store'
import { CERTIFICATE_DATE_FORMAT } from '@client/utils/constants'
import moment from 'moment'
import * as React from 'react'
import { WrappedComponentProps as IntlShapeProps, injectIntl } from 'react-intl'
import { connect } from 'react-redux'
import styled from 'styled-components'
import { constantsMessages } from '@client/i18n/messages'

const ExpansionContent = styled.div`
  background: ${({ theme }) => theme.colors.white};
  margin-bottom: 1px;
  border-top: ${({ theme }) => `2px solid ${theme.colors.background}`};
`
const ExpansionContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: row;
  color: ${({ theme }) => theme.colors.copy};
  ${({ theme }) => theme.fonts.bodyStyle};
  margin-bottom: 8px;
  &:last-child {
    margin-bottom: 0;
  }
`
const ExpansionContentContainer = styled.div`
  flex: 1;
  margin-left: 10px;
`
const StatusIcon = styled.div`
  margin-top: 3px;
`
const StyledLabel = styled.label`
  ${({ theme }) => theme.fonts.bodyBoldStyle};
  margin-right: 3px;
`
const StyledValue = styled.span`
  ${({ theme }) => theme.fonts.bodyStyle};
  text-transform: capitalize !important;
`

const HistoryWrapper = styled.div`
  padding: 10px 25px;
  margin: 20px 0px;
`
const BoldSpan = styled.span`
  ${({ theme }) => theme.fonts.bodyBoldStyle};
  padding: 0 10px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

function LabelValue({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <StyledLabel>{label}:</StyledLabel>
      <StyledValue>{value}</StyledValue>
    </div>
  )
}

type IProps = {
  draft?: IApplicationWithContactPoint
}

type NestedFields = {
  contactRelationshipOther: string
  registrationPhone: string
}

type IApplicationWithContactPoint = IApplication & {
  data: {
    registration: {
      contactPoint: {
        value: string
        nestedFields?: NestedFields
      }
      registrationPhone: string
    }
  }
}

function getInformant(draft: IApplicationWithContactPoint): string {
  const contactPoint = draft.data.registration.contactPoint
  const informantType = contactPoint && contactPoint.value

  if (informantType === 'OTHER') {
    return contactPoint.nestedFields!.contactRelationshipOther
  }
  return informantType
}

class LocalInProgressDataDetailsComponent extends React.Component<
  IProps & IntlShapeProps
> {
  transformer = (draft?: IApplicationWithContactPoint) => {
    if (!draft) {
      return {}
    }

    const contactPoint = draft.data.registration.contactPoint
    const relation = getInformant(draft)

    const registrationPhone = contactPoint
      ? contactPoint &&
        contactPoint.nestedFields &&
        contactPoint.nestedFields.registrationPhone
      : draft.data.registration.registrationPhone

    return {
      draftStartedOn: draft && draft.savedOn,
      informantRelation: relation,
      informantContactNumber: registrationPhone
    }
  }

  render() {
    const { intl, draft } = this.props
    const transformedData = this.transformer(draft)
    const timestamp = moment(transformedData.draftStartedOn).format(
      CERTIFICATE_DATE_FORMAT
    )

    return (
      <ExpansionContent>
        <HistoryWrapper>
          <ExpansionContainer>
            <StatusIcon>
              <StatusProgress />
            </StatusIcon>
            <ExpansionContentContainer>
              <LabelValue
                label={intl.formatMessage(
                  constantsMessages.applicationStartedOn
                )}
                value={timestamp}
              />
              <ExpansionContainer>
                <label>{intl.formatMessage(messages.informantContact)}:</label>
                <BoldSpan>
                  {[transformedData.informantContactNumber || '']}
                </BoldSpan>
              </ExpansionContainer>
            </ExpansionContentContainer>
          </ExpansionContainer>
        </HistoryWrapper>
      </ExpansionContent>
    )
  }
}

function mapStateToProps(state: IStoreState, props: { eventId: string }) {
  const { eventId } = props
  return {
    draft:
      (state.applicationsState.applications &&
        eventId &&
        (state.applicationsState.applications.find(
          application =>
            application.id === eventId &&
            application.submissionStatus ===
              SUBMISSION_STATUS[SUBMISSION_STATUS.DRAFT]
        ) as IApplicationWithContactPoint)) ||
      undefined
  }
}

export const LocalInProgressDataDetails = connect<
  IProps,
  {},
  { eventId: string },
  IStoreState
>(mapStateToProps)(injectIntl(LocalInProgressDataDetailsComponent))
