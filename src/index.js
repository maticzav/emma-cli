#!/usr/bin/env node

import cli from './cli'

// Notify updater
const pkg = require(`../package.json`)
const updateNotifier = require(`update-notifier`)

updateNotifier({ pkg }).notify()

Promise.onPossiblyUnhandledRejection(error => {
   report.error(error)
   throw error
})

process.on(`unhandledRejection`, error => {
   // This will exit the process in newer Node anyway so lets be consistent
   // across versions and crash
   report.panic(`UNHANDLED REJECTION`, error)
})

process.on(`uncaughtException`, error => {
   report.panic(`UNHANDLED EXCEPTION`, error)
})

createCli(process.argv)
