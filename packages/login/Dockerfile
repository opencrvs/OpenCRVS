ARG  BRANCH=develop
FROM opencrvs/ocrvs-base:${BRANCH}

USER node

ENV CONTENT_SECURITY_POLICY_WILDCARD "{{CONTENT_SECURITY_POLICY_WILDCARD}}"
ENV COUNTRY_CONFIG_URL_INTERNAL "{{COUNTRY_CONFIG_URL_INTERNAL}}"

WORKDIR /app/packages/components
COPY --chown=node:node components /app/packages/components
RUN yarn install --frozen-lockfile && yarn build

WORKDIR /app/packages/login
COPY --chown=node:node login /app/packages/login
RUN yarn install --frozen-lockfile && yarn build

# Step 2. Build the actual image

FROM nginx:1.27

RUN apt-get update && apt-get upgrade -y

COPY login/nginx/nginx-deploy-config.sh /
COPY login/nginx/nginx-default.conf /etc/nginx/conf.d/default.conf
RUN chmod +x /nginx-deploy-config.sh

COPY --from=0 /app/packages/login/build/ /usr/share/nginx/html/

CMD ["bash", "-c", "'./nginx-deploy-config.sh'"]
