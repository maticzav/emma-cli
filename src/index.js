#!/usr/bin/env node

import meow from 'meow'
import { h, render } from 'ink'
import updateNotifier from 'update-notifier'

import emma from './emma'

// Notify updater
const pkg = require(`../package.json`)

updateNotifier({ pkg }).notify()

// CLI

const cli = meow(`
   Usage
     $ emma [add|remove] [package-name]

   Example
     $ emma add graphql-shield

   Options
     --verbose -v  Include version select.
     --dev -D      Add to dev dependencies.

   Run without package-name to enter live search.
   Use keyboard to search through package library.
   Use up/down to select packages.
   Click enter to trigger the install.   
`, {
   boolean: [
      'dev'
   ],
   alias: {
      v: 'verbose',
      D: 'dev'
   }
})

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

   // Uses `h` instead of JSX to avoid transpiling this file
   unmount = render(h(emma, { onError, onExit }))
}

console.log(cli)

main()
