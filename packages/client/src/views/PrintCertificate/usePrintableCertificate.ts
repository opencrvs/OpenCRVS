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
import { WORKQUEUE_TABS } from '@client/components/interface/Navigation'
import {
  IPrintableDeclaration,
  SUBMISSION_STATUS,
  modifyDeclaration,
  writeDeclaration
} from '@client/declarations'
import { useDeclaration } from '@client/declarations/selectors'
import {
  CorrectionSection,
  IFormSectionData,
  SubmissionAction
} from '@client/forms'
import { goToCertificateCorrection, goToHomeTab } from '@client/navigation'
import { getOfflineData } from '@client/offline/selectors'
import { getScope, getUserDetails } from '@client/profile/profileSelectors'
import { IStoreState } from '@client/store'
import {
  hasRegisterScope,
  hasRegistrationClerkScope
} from '@client/utils/authUtils'
import { cloneDeep } from 'lodash'
import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { addFontsToSvg, compileSvg, svgToPdfTemplate } from './PDFUtils'
import {
  isCertificateForPrintInAdvance,
  getRegisteredDate,
  getEventDate,
  calculatePrice
} from './utils'
import { Event } from '@client/utils/gateway'
import { getUserName, UserDetails } from '@client/utils/userUtils'
import { formatLongDate } from '@client/utils/date-formatting'
import { AdminStructure, IOfflineData } from '@client/offline/reducer'
import { getLocationHierarchy } from '@client/utils/locationUtils'
import { printPDF } from '@client/pdfRenderer'

const withEnhancedTemplateVariables = (
  declaration: IPrintableDeclaration | undefined,
  userDetails: UserDetails | null,
  offlineData: IOfflineData
) => {
  if (!declaration) {
    return
  }

  const registeredDate = getRegisteredDate(declaration.data)
  const eventDate = getEventDate(declaration.data, declaration.event)
  const registrationFees = calculatePrice(
    declaration.event,
    eventDate,
    registeredDate,
    offlineData
  )

  const locationKey = userDetails?.primaryOffice?.id
    ? offlineData.offices[userDetails.primaryOffice.id].partOf.split('/')[1]
    : ''
  const { country, ...locationHierarchyIds } = getLocationHierarchy(
    locationKey,
    offlineData.locations
  )

  const locationHierarchy: Record<string, string | AdminStructure | undefined> =
    { country }

  for (const [key, value] of Object.entries(locationHierarchyIds)) {
    locationHierarchy[`${key}Id`] = value
  }

  return {
    ...declaration,
    data: {
      ...declaration.data,
      template: {
        ...declaration.data.template,
        printInAdvance: isCertificateForPrintInAdvance(declaration),
        certificateDate: formatLongDate(new Date().toISOString()),
        registrationFees,
        ...(userDetails && {
          loggedInUser: {
            name: getUserName(userDetails),
            officeId: userDetails.primaryOffice?.id,
            signature: userDetails.localRegistrar?.signature,
            ...locationHierarchy
          }
        })
      } as IFormSectionData
    }
  }
}

export const usePrintableCertificate = (declarationId: string) => {
  const declarationWithoutAllTemplateVariables = useDeclaration<
    IPrintableDeclaration | undefined
  >(declarationId)
  const userDetails = useSelector(getUserDetails)
  const offlineData = useSelector(getOfflineData)
  const declaration = withEnhancedTemplateVariables(
    declarationWithoutAllTemplateVariables,
    userDetails,
    offlineData
  )

  const state = useSelector((store: IStoreState) => store)
  const [svg, setSvg] = useState<string>()
  const isPrintInAdvance = isCertificateForPrintInAdvance(declaration)
  const dispatch = useDispatch()
  const scope = useSelector(getScope)
  const canUserEditRecord =
    declaration?.event !== Event.Marriage &&
    (hasRegisterScope(scope) || hasRegistrationClerkScope(scope))

  useEffect(() => {
    const certificateTemplate =
      declaration &&
      offlineData.templates.certificates?.[declaration.event].definition
    if (certificateTemplate) {
      declaration.data.template = {
        ...declaration.data.template,
        fatherFirstName: !declaration?.data?.father?.detailsExist
          ? ''
          : declaration.data.template?.fatherFirstName,
        fatherFamilyName: !declaration?.data?.father?.detailsExist
          ? ''
          : declaration.data.template?.fatherFamilyName,

        motherFirstName: !declaration?.data?.mother?.detailsExist
          ? ''
          : declaration.data.template?.motherFirstName,
        motherFamilyName: !declaration?.data?.mother?.detailsExist
          ? ''
          : declaration.data.template?.motherFamilyName
      }
      compileSvg(
        certificateTemplate,
        { ...declaration.data.template, preview: true },
        state
      ).then((svg) => {
        const svgWithFonts = addFontsToSvg(
          svg,
          offlineData.templates.fonts ?? {}
        )

        setSvg(svgWithFonts)
      })
    }
  }, [offlineData, declaration, state])

  const handleCertify = async () => {
    if (
      !declaration ||
      !offlineData.templates.certificates?.[declaration.event].definition
    ) {
      return
    }
    const draft = cloneDeep(declaration)

    draft.submissionStatus = SUBMISSION_STATUS.READY_TO_CERTIFY
    draft.action = isPrintInAdvance
      ? SubmissionAction.CERTIFY_DECLARATION
      : SubmissionAction.CERTIFY_AND_ISSUE_DECLARATION

    const registeredDate = getRegisteredDate(draft.data)
    const certificate = draft.data.registration.certificates[0]
    const eventDate = getEventDate(draft.data, draft.event)
    if (!isPrintInAdvance) {
      const paymentAmount = calculatePrice(
        draft.event,
        eventDate,
        registeredDate,
        offlineData
      )
      certificate.payments = {
        type: 'MANUAL' as const,
        amount: Number(paymentAmount),
        outcome: 'COMPLETED' as const,
        date: new Date().toISOString()
      }
    }

    const svg = await compileSvg(
      offlineData.templates.certificates[draft.event].definition,
      { ...draft.data.template, preview: false },
      state
    )

    draft.data.registration = {
      ...draft.data.registration,
      certificates: [
        {
          ...certificate,
          data: svg || ''
        }
      ]
    }

    const pdfTemplate = svgToPdfTemplate(svg, offlineData)

    printPDF(pdfTemplate, draft.id)

    dispatch(modifyDeclaration(draft))
    dispatch(writeDeclaration(draft))
    dispatch(goToHomeTab(WORKQUEUE_TABS.readyToPrint))
  }

  const handleEdit = () => {
    // Delete certificate properties during print record corrections
    // since correction flow doesn't handle certificates
    if (declaration?.data?.registration.certificates) {
      const { certificates, ...rest } = declaration.data.registration
      const updatedDeclaration = {
        ...declaration,
        data: {
          ...declaration.data,
          registration: {
            ...rest
          }
        }
      }

      dispatch(modifyDeclaration(updatedDeclaration))
      dispatch(writeDeclaration(updatedDeclaration))
    }

    dispatch(
      goToCertificateCorrection(declarationId, CorrectionSection.Corrector)
    )
  }

  return {
    svg,
    handleCertify,
    isPrintInAdvance,
    canUserEditRecord,
    handleEdit
  }
}
