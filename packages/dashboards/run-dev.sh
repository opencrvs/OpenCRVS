# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at https://mozilla.org/MPL/2.0/.
#
# OpenCRVS is also distributed under the terms of the Civil Registration
# & Healthcare Disclaimer located at http://opencrvs.org/license.
#
# Copyright (C) The OpenCRVS Authors located at https://github.com/opencrvs/opencrvs-core/blob/master/AUTHORS.

#!/bin/bash

##########
#
# This script is mean for development of Dashboards and Questions
# Start Metabase with this script and make the changes you want.
#
# After you are done, press ctrl + c and this script automatically
# saves the database state to MB_DB_SAVE_TO_SQL_FILE
#
#########

echo 'OpenCRVS Metabase development environment'

METABASE_VERSION="v0.46.6.4"
METABASE_JAR="./$METABASE_VERSION-metabase.jar"

# enable job control
set -m

if [ ! -f "$METABASE_JAR" ]; then
  echo "You don't seem to have Metabase installed. Downloading Metabase..."
  curl https://downloads.metabase.com/$METABASE_VERSION/metabase.jar --output $METABASE_JAR
fi

if [ -f .env ]
then
  source .env
fi

# Variables exported so they can be used in initialize-database.sh
export OPENCRVS_METABASE_SITE_NAME=${OPENCRVS_METABASE_SITE_NAME:-"OpenCRVS Local"}
export OPENCRVS_ENVIRONMENT_CONFIGURATION_SQL_FILE=${OPENCRVS_ENVIRONMENT_CONFIGURATION_SQL_FILE:-"$(pwd)/environment-configuration.sql"}
export MB_DB_FILE=${MB_DB_FILE:-"$(pwd)/data/metabase/metabase.mv.db"}
export MB_DB_INIT_SQL_FILE=${MB_DB_INIT_SQL_FILE:-"$(pwd)/metabase.init.db.sql"}
export MB_DB_SAVE_TO_SQL_FILE=${MB_DB_SAVE_TO_SQL_FILE:-"$(pwd)/metabase.init.db.sql"}
export MB_JETTY_PORT=${MB_JETTY_PORT:-4444}
export OPENCRVS_METABASE_SITE_URL=${OPENCRVS_METABASE_SITE_URL:-"http://localhost:4444"}
export OPENCRVS_METABASE_DB_HOST=${OPENCRVS_METABASE_DB_HOST:-"localhost"}
export OPENCRVS_METABASE_DB_USER=${OPENCRVS_METABASE_DB_USER:-""}
export OPENCRVS_METABASE_DB_PASS=${OPENCRVS_METABASE_DB_PASS:-""}
export OPENCRVS_METABASE_DB_AUTH_DB=${OPENCRVS_METABASE_DB_AUTH_DB:-""}

export OPENCRVS_METABASE_MAP_NAME=${OPENCRVS_METABASE_MAP_NAME:-"Full country"}
export OPENCRVS_METABASE_MAP_URL=${OPENCRVS_METABASE_MAP_URL:-"http://localhost:3040/content/map.geojson"}
export OPENCRVS_METABASE_MAP_REGION_KEY=${OPENCRVS_METABASE_MAP_REGION_KEY:-"State"}
export OPENCRVS_METABASE_MAP_REGION_NAME=${OPENCRVS_METABASE_MAP_REGION_NAME:-"State"}
export OPENCRVS_METABASE_ADMIN_EMAIL=${OPENCRVS_METABASE_ADMIN_EMAIL:-"user@opencrvs.org"}
export OPENCRVS_METABASE_ADMIN_PASSWORD_SALT=$(uuidgen)
export OPENCRVS_METABASE_ADMIN_PASSWORD=${OPENCRVS_METABASE_ADMIN_PASSWORD:-"m3tabase"}
SALT_AND_PASSWORD=$OPENCRVS_METABASE_ADMIN_PASSWORD_SALT$OPENCRVS_METABASE_ADMIN_PASSWORD
export OPENCRVS_METABASE_ADMIN_PASSWORD_HASH=$(java -cp $METABASE_JAR clojure.main -e "(require 'metabase.util.password) (println (metabase.util.password/hash-bcrypt \"$SALT_AND_PASSWORD\"))" 2>/dev/null | tail -n 1)
metabase_db_path=${MB_DB_FILE:-'/data/metabase/metabase.mv.db'}
metabase_db_path="${metabase_db_path}"
metabase_db_path_for_metabase=${metabase_db_path%.mv.db}

##########
#
# Create database from supplied SQL file
#
#########
. ./initialize-database.sh
. ./update-database.sh

##########
#
# Start Metabase
#
#########

MB_DB_FILE=${metabase_db_path_for_metabase} \
MB_DB_TYPE=h2 \
java -jar $METABASE_JAR
##########
#
# Store database back to SQL File to be stored in version control
#
#########

save_sql_file=${MB_DB_SAVE_TO_SQL_FILE}

if [ -n "$save_sql_file" ]; then
  echo "Saving database $metabase_db_path to $save_sql_file"
  java -cp "$METABASE_JAR" org.h2.tools.Script -url jdbc:h2:"$metabase_db_path_for_metabase" -script "$save_sql_file"
  echo "Done"
  exit 0
fi
