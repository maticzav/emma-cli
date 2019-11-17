#!/usr/bin/env node

import React from 'react'
import chalk from 'chalk'
import { loadTemplate } from 'creato'
import { render, Instance } from 'ink'
import meow from 'meow'
import mls from 'multilines'
import updateNotifier from 'update-notifier'
import prompts from 'prompts'

import { IStarter } from './algolia'
import Emma from './Emma'
import { getDistDirectory, getStarterTemplateRepo } from './installer'
import { drawBox } from './structure'

/* Spec */

const cli = meow(
  mls`
  | Usage
  |  $ create-emma <dir>
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

// function breakStep() {
//   console.log(`-------------------------------------------------------`)
// }

export async function main(cwd: string) {
  console.log(
    drawBox({
      title: `Welcome to ${chalk.bold.blue(`emma-cli starters`)}!`,
      width: 60,
      height: 4,
      str: mls`
      | I'll help you find the starter for your project! 
      |
      | We'll start by finding the appropriate folder for your
      | project, and then explore the starters you can use.
      `,
    }),
  )

  /* Destination picker */
  const [err, dist] = await getDistDirectory(cwd, cli.input[0])

  if (err || !dist) return console.error(err)

  await prompts({
    type: 'confirm',
    name: 'openBrowser',
    message: mls`
      | I'll now open a browser of starters so you can find the one you need.

      `,
  })

  console.log(
    drawBox({
      title: `Browsing Instructions`,
      width: 60,
      height: 6,
      str: mls`
      | You can start typing to search the tools used in strarters.
      |
      | Press ${chalk.yellow('space')} to select the tools,
      | and ${chalk.yellow('enter')} to move forward in the process.
      |
      | You can search both, the dependencies and the starters.
      `,
    }),
  )

  /* Starter browser. */
  let app: Instance

  const handleStarterSelect = async (starter: IStarter): Promise<void> => {
    /* Unmount browser. */
    app.unmount()

    /* Find and load the tempalte. */
    const [templateError, repo] = await getStarterTemplateRepo(starter)

    if (templateError || !repo) return console.error(templateError)

    /* Use creato to load the template. */
    const loadStatus = await loadTemplate(
      {
        name: starter.name,
        description: starter.description || '',
        repo: repo,
      },
      dist,
    )

    if (loadStatus.status === 'err') return console.error(loadStatus.message)
    else console.log(loadStatus.message)
  }

  app = render(<Emma onSelect={handleStarterSelect} />, {
    exitOnCtrlC: true,
  })
}

try {
  main(process.cwd())
} catch (err) {
  console.error(err)
  process.exit(1)
}
