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
     $ emma

   Example
     $ emma -D

   Options
     --dev -D      Add to dev dependencies.

   Run without package-name to enter live search.
   Use keyboard to search through package library.
   Use up/down to select packages.
   Click enter to trigger the install.   
`, {
   flags: {
      dev: {
         type: 'boolean',
         alias: 'D'
      }
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

   const { dev } = cli.flags

   // Uses `h` instead of JSX to avoid transpiling this file
   unmount = render(h(emma, { dev, onError, onExit }))
}

main()
