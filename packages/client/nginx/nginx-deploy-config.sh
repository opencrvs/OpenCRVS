# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at https://mozilla.org/MPL/2.0/.
#
# OpenCRVS is also distributed under the terms of the Civil Registration
# & Healthcare Disclaimer located at http://opencrvs.org/license.
#
# Copyright (C) The OpenCRVS Authors located at https://github.com/opencrvs/opencrvs-core/blob/master/AUTHORS.
set -e

sed -i s~{{COUNTRY_CONFIG_URL_INTERNAL}}~$COUNTRY_CONFIG_URL_INTERNAL~g /etc/nginx/conf.d/default.conf
sed -i s~{{COUNTRY_CONFIG_URL_INTERNAL}}~$COUNTRY_CONFIG_URL_INTERNAL~g /usr/share/nginx/html/index.html
sed -i s~{{CONTENT_SECURITY_POLICY_WILDCARD}}~$CONTENT_SECURITY_POLICY_WILDCARD~g /etc/nginx/conf.d/default.conf
nginx -g 'daemon off;'