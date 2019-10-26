const fs = require('fs')
const path = require('path')

const chalk = require('chalk')
const execa = require('execa')
const ml = require('multilines').default

/* Constants */

const PACKAGES_DIR = path.resolve(__dirname, '../packages')

/* Find all packages */

const packages = fs
  .readdirSync(PACKAGES_DIR)
  .map(file => path.resolve(PACKAGES_DIR, file))
  .filter(f => fs.lstatSync(path.resolve(f)).isDirectory())

const packagesWithTs = packages.filter(p =>
  fs.existsSync(path.resolve(p, 'tsconfig.json')),
)

/* Server module */

const server = path.resolve(__dirname, '../server')

/* Build */

const builds = [server, ...packagesWithTs]

console.log(ml`
  | ${chalk.reset.inverse.bold.cyan(' BUILDING ')}
  | ${builds.map(build => `- ${build}`).join('\n')}
`)

const args = ['-b', server, ...packagesWithTs, ...process.argv.slice(2)]

console.log(chalk.inverse('Building TypeScript definition files\n'))

try {
  execa.sync('tsc', args, { stdio: 'inherit' })
  process.stdout.write(`${chalk.reset.inverse.bold.green(' DONE ')}\n`)
} catch (e) {
  process.stdout.write('\n')
  console.error(
    chalk.inverse.red('Unable to build TypeScript definition files'),
  )
  console.error(e.stack)
  process.exitCode = 1
}

/**
MIT License

For Jest software

Copyright (c) 2014-present, Facebook, Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
 */
