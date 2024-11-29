ARG  BRANCH=develop
FROM opencrvs/ocrvs-base:${BRANCH}

USER node

COPY --chown=node:node events /app/packages/events

WORKDIR /app/packages/gateway
COPY --chown=node:node gateway/*.json /app/packages/gateway/
RUN yarn install --frozen-lockfile
COPY --chown=node:node gateway /app/packages/gateway
RUN yarn build

CMD [ "yarn", "start:prod" ]
