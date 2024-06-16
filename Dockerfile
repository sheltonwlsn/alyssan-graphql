FROM node:20 as builder

WORKDIR /usr/src/app

SHELL ["/bin/bash", "-c"]
COPY  ./install-rover.sh .
RUN bash ./install-rover.sh

COPY package*.json ./

RUN npm install

ENV PORT=8080

ENV ENVIRONMENT=${ENVIRONMENT}

COPY . ./

RUN npm run build

FROM node:20 as release

WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/prisma ./prisma
COPY --from=builder /usr/src/app/package*.json ./
# COPY --from=builder /usr/src/app/.env* ./
# COPY --from=builder /usr/src/app/*.env ./
# COPY --from=builder /usr/src/app/service-account.json ./
COPY --from=builder /usr/src/app/build ./build
COPY --from=builder /usr/src/app/src/shared ./build/shared
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/robots.txt ./robots.txt

RUN npm install -g dotenv-cli

ENV PORT=8080

ENV ENVIRONMENT=${ENVIRONMENT}

EXPOSE 8080

CMD ["sh", "-c", "npm run start"]
