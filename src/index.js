#!/usr/bin/env node

import meow from 'meow'
import { h, render } from 'ink'
import updateNotifier from 'update-notifier'

import emma from './emma'

// Notify updater
const pkg = require(`../package.json`)

updateNotifier({ pkg }).notify()

// CLI

const cli = meow(
  `
  Usage
    $ emma

  Options
    --dev -D      Add to dev dependencies.
    --limit -L      Number of packages shown, defaults to 5.

  Example
    $ emma -D

  Run without package-name to enter live search.
  Use keyboard to search through package library.
  Use up/down to select packages.
  Use enter to select a package.
  Use tab to move between search/suggestions.
  When query is empty use backspace to remove packages.
  Click space to trigger the install.   
`,
  {
    flags: {
      dev: {
        type: 'boolean',
        alias: 'D',
      },
      limit: {
        type: 'string',
        alias: 'L',
        default: '5',
      },
    },
  },
)

const main = () => {
  let unmount // eslint-disable-line prefer-const

  const onError = () => {
    unmount()
    process.exit(1)
  }

  const onExit = () => {
    unmount()
    process.exit()
  }

  const { dev, limit } = cli.flags

  // Uses `h` instead of JSX to avoid transpiling this file
  unmount = render(h(emma, { dev, limit, onError, onExit }))
}

main()
