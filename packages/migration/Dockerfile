ARG  BRANCH=develop
FROM opencrvs/ocrvs-base:${BRANCH}

USER node

## Add the wait script to the image
ADD --chown=node:node https://github.com/ufoscout/docker-compose-wait/releases/download/2.9.0/wait /app/wait
RUN chmod +x /app/wait

# Override the base log level (info).
ENV NPM_CONFIG_LOGLEVEL warn

WORKDIR /app/packages/migration

COPY --chown=node:node . .

RUN yarn install --frozen-lockfile
RUN yarn build

CMD ["/bin/sh", "-c", "/app/wait && yarn start:prod"]
