ARG  BRANCH=develop
FROM opencrvs/ocrvs-base:${BRANCH}

USER node

WORKDIR /app/packages/workflow
COPY --chown=node:node . .
RUN ls -lha
RUN ls -lha test

RUN yarn install --frozen-lockfile && yarn build

CMD [ "yarn", "start:prod" ]
