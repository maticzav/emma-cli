import fs from 'fs'
import path from 'path'

/**
 * Determines whether a project is a TypeScript project.
 *
 * @param cwd
 */
export function isTypeScriptProject(cwd: string): boolean {
  return fs.existsSync(path.resolve(cwd, 'tsconfig.json'))
}
