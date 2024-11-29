ARG  BRANCH=develop
FROM opencrvs/ocrvs-base:${BRANCH}

USER node

WORKDIR /app/packages/user-mgnt
COPY --chown=node:node . .
RUN yarn install --frozen-lockfile && yarn build

CMD ["yarn", "start:prod"]
