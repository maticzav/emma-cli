#!/usr/bin/env node

import React from 'react'
import { render } from 'ink'
import meow from 'meow'
import mls from 'multilines'
import updateNotifier from 'update-notifier'

import Emma from '.'

/* Spec */

const cli = meow(
  mls`
  | Usage
  |  $ emma
  `,
)

/**
 * Make sure that user is on the latest version
 * avaiable in case they have connection to NPM.
 */

const notifier = updateNotifier(cli)

notifier.notify()

if (notifier.update) {
  process.exit(0)
}

/* Main */

render(<Emma />, { exitOnCtrlC: true })
