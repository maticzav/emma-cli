import { TemplateRepository } from 'creato'
import fetch from 'node-fetch'
import fs from 'fs'
import path from 'path'
import prompts from 'prompts'

import { IStarter } from './algolia'

const EMMA_CLI_URL = 'https://emma-cli.herokuapp.com/api/'

/**
 * Loads the starter template from EmmaCLI DB.
 * @param starter
 */
export async function getStarterTemplateRepo(
  starter: IStarter,
): Promise<[string] | [null, TemplateRepository]> {
  try {
    const res = await fetch(
      `${EMMA_CLI_URL}/starters/${starter.objectID}`,
    ).then(res => res.json())

    return [
      null,
      {
        uri: `https://github.com/${res.owner}/${res.repo}`,
        branch: res.ref,
        path: res.path,
      },
    ]
  } catch (err) {
    return [err.message]
  }
}

/**
 * Prompts for the destination directory.
 *
 * @param provided
 */
export async function getDistDirectory(
  cwd: string,
  provided?: string,
): Promise<[string] | [null, string]> {
  if (provided) {
    const conflicts = checkFolderForConflicts(provided)

    if (conflicts.length > 0) {
      return [`Selected directory is not empty.`]
    }

    return [null, provided]
  } else {
    const destination = await prompts({
      type: 'text',
      name: 'path',
      message: 'Where should I load the starter?',
      initial: 'my-app',
      validate: dist => {
        const conflicts = checkFolderForConflicts(path.resolve(cwd, dist))

        if (conflicts.length > 0) {
          return `Selected directory is not empty.`
        }

        return true
      },
    })

    return [null, destination.path]
  }
}

/**
 * Determines whether a folder includes any conflicts.
 * @param cwd
 */
function checkFolderForConflicts(cwd: string): string[] {
  const exists = fs.existsSync(cwd)

  if (!exists) return []

  /* taken from zeit/next.js/create-next-app */
  const validFiles = [
    '.DS_Store',
    '.git',
    '.gitattributes',
    '.gitignore',
    '.gitlab-ci.yml',
    '.hg',
    '.hgcheck',
    '.hgignore',
    '.idea',
    '.npmignore',
    '.travis.yml',
    'LICENSE',
    'Thumbs.db',
    'docs',
    'mkdocs.yml',
    'npm-debug.log',
    'yarn-debug.log',
    'yarn-error.log',
  ]

  const conflicts = fs
    .readdirSync(cwd)
    .filter(file => !validFiles.includes(file))
    // Support IntelliJ IDEA-based editors
    .filter(file => !/\.iml$/.test(file))

  return conflicts
}
