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
import { getDirective, MapperKind, mapSchema } from '@graphql-tools/utils'
import {
  defaultFieldResolver,
  GraphQLError,
  GraphQLScalarType,
  GraphQLSchema,
  Kind
} from 'graphql'

import { ApolloServerOptions } from '@apollo/server'
import { resolvers as bookmarkAdvancedSearchResolvers } from '@gateway/features/bookmarkAdvancedSearch/root-resolvers'
import { resolvers as correctionRootResolvers } from '@gateway/features/correction/root-resolvers'
import { resolvers as locationRootResolvers } from '@gateway/features/location/root-resolvers'
import { resolvers as metricsRootResolvers } from '@gateway/features/metrics/root-resolvers'
import { typeResolvers as metricsTypeResolvers } from '@gateway/features/metrics/type-resolvers'
import { resolvers as notificationRootResolvers } from '@gateway/features/notification/root-resolvers'
import { resolvers as registrationRootResolvers } from '@gateway/features/registration/root-resolvers'
import { typeResolvers } from '@gateway/features/registration/type-resolvers'
import { resolvers as roleRootResolvers } from '@gateway/features/role/root-resolvers'
import { roleTypeResolvers } from '@gateway/features/role/type-resolvers'
import { resolvers as searchRootResolvers } from '@gateway/features/search/root-resolvers'
import { searchTypeResolvers } from '@gateway/features/search/type-resolvers'
import { resolvers as integrationResolver } from '@gateway/features/systems/root-resolvers'
import { resolvers as userRootResolvers } from '@gateway/features/user/root-resolvers'
import {
  ISystemModelData,
  IUserModelData,
  userTypeResolvers
} from '@gateway/features/user/type-resolvers'
import { getSystem, getUser } from '@gateway/features/user/utils'
import { Context } from '@gateway/graphql/context'
import { AuthenticationError } from '@gateway/utils/graphql-errors'
import { GraphQLFileLoader } from '@graphql-tools/graphql-file-loader'
import { loadSchemaSync } from '@graphql-tools/load'
import {
  addResolversToSchema,
  makeExecutableSchema
} from '@graphql-tools/schema'
import { readFileSync } from 'fs'
import { IResolvers } from 'graphql-tools'
import { merge } from 'lodash'

const graphQLSchemaPath = `${__dirname}/schema.graphql`

interface IStringIndexSignatureInterface {
  [index: string]: any
}

type StringIndexed<T> = T & IStringIndexSignatureInterface

export const resolvers: StringIndexed<IResolvers> = merge(
  notificationRootResolvers as IResolvers,
  registrationRootResolvers as IResolvers,
  locationRootResolvers as IResolvers,
  userRootResolvers as IResolvers,
  userTypeResolvers as IResolvers,
  metricsRootResolvers as IResolvers,
  integrationResolver as IResolvers,
  metricsTypeResolvers as IResolvers,
  typeResolvers as IResolvers,
  searchRootResolvers as IResolvers,
  searchTypeResolvers as IResolvers,
  roleRootResolvers as IResolvers,
  roleTypeResolvers as IResolvers,
  correctionRootResolvers as IResolvers,
  integrationResolver as IResolvers,
  bookmarkAdvancedSearchResolvers as IResolvers,
  {
    FieldValue: new GraphQLScalarType({
      name: 'FieldValue',
      description: 'String, Number or Boolean',
      serialize(value) {
        if (!['string', 'number', 'boolean'].includes(typeof value)) {
          throw new Error('Value must be either a String, Boolean or an number')
        }

        return value
      },
      parseValue(value) {
        if (!['string', 'number', 'boolean'].includes(typeof value)) {
          throw new Error('Value must be either a String, Boolean or an number')
        }

        return value
      },
      parseLiteral(ast) {
        switch (ast.kind) {
          case Kind.INT:
            return parseInt(ast.value, 10)
          case Kind.FLOAT:
            return parseFloat(ast.value)
          case Kind.BOOLEAN:
            return ast.value
          case Kind.STRING:
            return ast.value
          default:
            throw new Error(
              'Value must be either a String, Boolean or an number'
            )
        }
      }
    }),
    PlainDate: new GraphQLScalarType({
      name: 'PlainDate',
      description: 'A date string such as 2024-04-15',
      serialize(value: unknown) {
        if (typeof value !== 'string') {
          throw new GraphQLError(
            `PlainDate must be of type string, found: ${typeof value}`
          )
        }

        return value
      },
      parseValue(value: unknown) {
        if (typeof value !== 'string') {
          throw new GraphQLError(
            `PlainDate must be of type string, found: ${typeof value}`
          )
        }

        if (!validateDate(value)) {
          throw new GraphQLError(
            `PlainDate cannot be represented by an invalid date-string: ${value}`
          )
        }

        return value
      },
      parseLiteral(ast) {
        if (ast.kind !== Kind.STRING) {
          throw new GraphQLError(
            `PlainDate must be of type string, found: ${ast.kind}`,
            ast
          )
        }
        const { value } = ast

        if (!validateDate(value)) {
          throw new GraphQLError(
            `PlainDate cannot be represented by an invalid date-string: ${value}`
          )
        }

        return value
      }
    })
  }
)

export const schema = loadSchemaSync(graphQLSchemaPath, {
  loaders: [new GraphQLFileLoader()]
})

export const getExecutableSchema = (): GraphQLSchema => {
  return addResolversToSchema({
    schema,
    resolvers
  })
}

export function authSchemaTransformer(schema: GraphQLSchema) {
  const directiveName = 'auth'

  return mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: (fieldConfig, _fieldName, fieldType) => {
      if (!['Mutation', 'Query'].includes(fieldType)) {
        return undefined
      }

      const authDirective = getDirective(
        schema,
        fieldConfig,
        directiveName
      )?.[0]

      const { resolve = defaultFieldResolver } = fieldConfig
      fieldConfig.resolve = async function (source, args, context, info) {
        if (authDirective && authDirective.requires === 'ANONYMOUS') {
          return resolve(source, args, context, info)
        }

        if (!context.request.auth.isAuthenticated) {
          throw new AuthenticationError('Unauthorized')
        }

        const credentials = context.request.auth.credentials

        try {
          const userId = credentials.sub
          let user: IUserModelData | ISystemModelData
          const isSystemUser =
            credentials.scope.indexOf('recordsearch') > -1 ||
            credentials.scope.indexOf('self-service-portal') > -1
          if (isSystemUser) {
            user = await getSystem(
              { systemId: userId },
              { Authorization: context.request.headers.authorization }
            )
          } else {
            user = await getUser(
              { userId },
              { Authorization: context.request.headers.authorization }
            )
          }

          if (!user || !['active', 'pending'].includes(user.status)) {
            throw new AuthenticationError('Authentication failed')
          }

          // @TODO: When scope work is done, this check should stay.
          // For now, the registrar might not have 'record.confirm-registration' token, but the per-record issued token will have it

          // if (credentials && !isEqual(credentials.scope, user.scope)) {
          //   throw new AuthenticationError('Authentication failed')
          // }
        } catch (err) {
          throw new AuthenticationError(err)
        }

        return resolve(source, args, context, info)
      }
      return fieldConfig
    }
  })
}

export const getApolloConfig = (): ApolloServerOptions<Context> => {
  const typeDefs = readFileSync(graphQLSchemaPath, 'utf8')
  const schema = authSchemaTransformer(
    makeExecutableSchema({
      typeDefs,
      resolvers
    })
  )

  return {
    schema,
    introspection: true
  }
}

/* credit: https://github.com/Urigo/graphql-scalars */

// Check whether a certain year is a leap year.
//
// Every year that is exactly divisible by four
// is a leap year, except for years that are exactly
// divisible by 100, but these centurial years are
// leap years if they are exactly divisible by 400.
// For example, the years 1700, 1800, and 1900 are not leap years,
// but the years 1600 and 2000 are.
//
const leapYear = (year: number): boolean => {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

// Function that checks whether a date-string is RFC 3339 compliant.
//
// It checks whether the date-string is a valid date in the YYYY-MM-DD.
//
// Note, the number of days in each date are determined according to the
// following lookup table:
//
// Month Number  Month/Year           Maximum value of date-mday
// ------------  ----------           --------------------------
// 01            January              31
// 02            February, normal     28
// 02            February, leap year  29
// 03            March                31
// 04            April                30
// 05            May                  31
// 06            June                 30
// 07            July                 31
// 08            August               31
// 09            September            30
// 10            October              31
// 11            November             30
// 12            December             31
//
export const validateDate = (datestring: string): boolean => {
  const RFC_3339_REGEX = /^(\d{4}-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01]))$/

  if (!RFC_3339_REGEX.test(datestring)) {
    return false
  }

  // Verify the correct number of days for
  // the month contained in the date-string.
  const year = Number(datestring.substring(0, 4))
  const month = Number(datestring.substring(5, 2))
  const day = Number(datestring.substring(8, 2))

  switch (month) {
    case 2: // February
      if (leapYear(year) && day > 29) {
        return false
      } else if (!leapYear(year) && day > 28) {
        return false
      }
      return true
    case 4: // April
    case 6: // June
    case 9: // September
    case 11: // November
      if (day > 30) {
        return false
      }
      break
  }

  return true
}
