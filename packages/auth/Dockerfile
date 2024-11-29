ARG  BRANCH=develop
FROM opencrvs/ocrvs-base:${BRANCH}

USER node

WORKDIR /app/packages/auth
COPY --chown=node:node *.json /app/packages/auth/
RUN yarn install --frozen-lockfile
COPY --chown=node:node . .
RUN yarn build

CMD ["yarn", "start:prod"]
