ARG  BRANCH=develop
FROM opencrvs/ocrvs-base:${BRANCH}

USER node

WORKDIR /app/packages/notification
COPY --chown=node:node . .
RUN yarn install --frozen-lockfile && yarn build

CMD [ "yarn", "start:prod" ]
