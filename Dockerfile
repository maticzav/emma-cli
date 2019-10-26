FROM heroku/heroku:18

# NodeJS
RUN curl -sL https://deb.nodesource.com/setup_13.x | bash - &&\
    curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add - &&\
    echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list &&\
    apt-get update -y && apt-get install -y nodejs 

# Yarn
RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add - &&\
    echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list &&\
    apt-get update -y && apt-get install -y gcc g++ make yarn

WORKDIR /usr/src/app

# Install Dependencies
COPY . .
RUN yarn install

# Build Photon
RUN ./scripts/generate.sh

# Build Server
RUN yarn build

CMD ["./node_modules/.bin/probot", "run server/dist/index.js"]