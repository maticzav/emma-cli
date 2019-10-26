FROM node:13-alpine

WORKDIR /usr/src/app

# Install Dependencies
COPY . .
RUN yarn install

# Copy Photon
COPY server/node_modules/@generated server/node_modules/@generated

# Build Server
RUN yarn build

CMD ["./node_modules/.bin/probot", "run server/dist/index.js"]