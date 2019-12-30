export const advanced = {
  path: 'examples/advanced/package.json',
  name: 'advanced',
  scripts: {
    start: 'dotenv -- nodemon -e ts,graphql -x ts-node src/index.ts',
    dev: 'npm-run-all --parallel start playground',
    debug: 'dotenv -- nodemon -e ts,graphql -x ts-node --inspect src/index.ts',
    playground: 'graphql playground',
    build: 'rimraf dist && tsc',
  },
  dependencies: {
    bcryptjs: '2.4.3',
    'graphql-shield': '^6.1.0',
    'graphql-yoga': '1.18.3',
    jsonwebtoken: '8.5.1',
    'prisma-binding': '2.3.16',
  },
  devDependencies: {
    '@types/bcryptjs': '2.4.2',
    'dotenv-cli': '3.0.0',
    'graphql-cli': '3.0.14',
    nodemon: '1.19.4',
    'npm-run-all': '4.1.5',
    prettier: '^1.18.2',
    prisma: '1.34.10',
    rimraf: '3.0.0',
    'ts-node': '8.4.1',
    typescript: '3.6.4',
  },
}

export const basic = {
  path: 'examples/basic/package.json',
  name: 'basic',
  version: '1.0.0',
  main: 'index.js',
  license: 'MIT',
  scripts: {
    start: 'babel-node index.js',
  },
  dependencies: {
    'graphql-shield': '6.1.0',
    'graphql-yoga': '1.18.3',
  },
  devDependencies: {
    '@babel/core': '^7.6.4',
    '@babel/node': '^7.6.3',
    '@babel/preset-env': '^7.6.3',
  },
}

export const withApolloServerLambda = {
  path: 'examples/with-apollo-server-lambda/package.json',
  name: 'example-shield-apollo-server-lambda',
  version: '1.0.0',
  description: '',
  main: 'index.js',
  repository: {
    type: 'git',
    url:
      'git+https://github.com/doitadrian/example-shield-apollo-server-lambda.git',
  },
  keywords: [],
  author: '',
  license: 'ISC',
  bugs: {
    url:
      'https://github.com/doitadrian/example-shield-apollo-server-lambda/issues',
  },
  homepage:
    'https://github.com/doitadrian/example-shield-apollo-server-lambda#readme',
  dependencies: {
    'apollo-server-lambda': '^2.3.1',
    graphql: '^14.0.2',
    'graphql-middleware': '^4.0.1',
    'graphql-shield': '^6.1.0',
    'graphql-tools': '^4.0.3',
  },
  devDependencies: {
    prettier: '^1.15.3',
    serverless: '^1.35.1',
    'serverless-offline': '^5.12.0',
  },
  scripts: {
    start: 'sls offline start',
  },
}

export const withGraphqlMiddlewareForwardBinding = {
  path: 'examples/with-graphql-middleware-forward-binding/package.json',
  name: 'with-graphql-middleware-forward-binding',
  scripts: {
    start: 'dotenv -- ts-node src/index.ts',
    dev: 'npm-run-all --parallel start playground',
    playground: 'graphql playground',
  },
  dependencies: {
    'graphql-import': '0.7.1',
    'graphql-middleware-forward-binding': '^1.3.2',
    'graphql-shield': '^6.1.0',
    'graphql-yoga': '^1.18.3',
    'prisma-binding': '2.3.16',
  },
  devDependencies: {
    'dotenv-cli': '^3.0.0',
    'graphql-cli': '3.0.14',
    'npm-run-all': '4.1.5',
    prisma: '1.34.10',
    'ts-node': '8.4.1',
    typescript: '3.6.4',
  },
}

export const withGraphqlNexus = {
  path: 'examples/with-graphql-nexus/package.json',
  name: 'graphql_nexus_test',
  version: '1.0.0',
  main: 'src/index.js',
  license: 'MIT',
  scripts: {
    start: 'node src/index.js',
    'start:dev': 'nodemon --exec node src/index.js',
  },
  xo: {
    prettier: true,
  },
  dependencies: {
    'apollo-server-express': '^2.9.7',
    bcrypt: '^3.0.6',
    'cookie-parser': '^1.4.4',
    dotenv: '^8.2.0',
    express: '^4.17.1',
    graphql: '^14.5.8',
    'graphql-middleware': '^4.0.1',
    'graphql-shield': '^6.1.0',
    jsonwebtoken: '^8.5.1',
    nexus: '^0.11.7',
    'nexus-prisma': '^0.5.0',
    'prisma-client-lib': '^1.34.10',
  },
  devDependencies: {
    nodemon: '^1.19.4',
    prettier: '^1.18.2',
    xo: '^0.25.3',
  },
}
