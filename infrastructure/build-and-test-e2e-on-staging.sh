# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at https://mozilla.org/MPL/2.0/.
#
# OpenCRVS is also distributed under the terms of the Civil Registration
# & Healthcare Disclaimer located at http://opencrvs.org/license.
#
# Copyright (C) The OpenCRVS Authors. OpenCRVS and the OpenCRVS
# graphic logo are (registered/a) trademark(s) of Plan International.
set -e

# yarn global add wait-on
npm install wait-on
echo "wait-on https://register.opencrvs-staging.jembi.org/" && ./node_modules/.bin/wait-on -l https://register.opencrvs-staging.jembi.org/
git clone https://github.com/opencrvs/opencrvs-zambia.git
cd opencrvs-zambia
yarn install
yarn e2e --record false
