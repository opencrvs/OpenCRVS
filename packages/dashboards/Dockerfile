FROM metabase/metabase:v0.50.30.1

# Install envsubst, uuidgen
RUN apk update && apk upgrade && apk add --no-cache gettext && apk add --no-cache util-linux

ADD run.sh /
ADD run-dev.sh /
ADD initialize-database.sh /
ADD update-database.sh /
ADD environment-configuration.sql /
ADD metabase.init.db.sql /

ENV METABASE_JAR=/app/metabase.jar
ENV MB_DB_INIT_SQL_FILE=/metabase.init.db.sql
ENV MB_DB_FILE=/data/metabase/metabase.mv.db
ENV OPENCRVS_ENVIRONMENT_CONFIGURATION_SQL_FILE=/environment-configuration.sql

ENTRYPOINT ["/bin/sh", "/run.sh"]
