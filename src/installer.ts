import * as fs from 'fs'
import * as cp from 'child_process'
import execa = require('execa')

/* Spec */

export interface IDependency {
  name: string
  type: DependencyType
}

type DependencyType = keyof DependencyTypes

interface DependencyTypes {
  dependency: InstallationInstruction
  devDependency: InstallationInstruction
}

type Installer = keyof InstallationInstruction

type InstallationInstruction = { yarn: string; npm: string }

export const dependencyTypes: DependencyType[] = ['dependency', 'devDependency']

export const instructions: DependencyTypes = {
  dependency: { yarn: '', npm: '' },
  devDependency: { yarn: '-D', npm: '--save-dev' },
}

/**
 *
 * Returns the next dependency type in the chain.
 *
 * @param dependency
 */
export function getNextDependencyType(
  type: DependencyType,
): DependencyType | undefined {
  return dependencyTypes[dependencyTypes.indexOf(type) + 1]
}

/* Installers */

/**
 *
 * Installation function for Yarn and NPM.
 *
 * @param deps
 * @param type
 */
export async function install(
  deps: IDependency[],
  type: IDependency['type'],
): Promise<execa.ExecaReturns> {
  const installer = getInstaller()
  const dependencies = deps.filter(dep => dep.type === type)

  const command = instructions[type][installer]
  const pkgs = dependencies.join(' ')

  return execa.shell(`${command} ${pkgs}`, { stdio: `ignore` })
}

/* Helpers */

/**
 * Finds installer for the current system.
 */
function getInstaller(): Installer {
  if (!fs.existsSync('package-lock.json') && isYarnInstalled()) {
    return 'yarn'
  } else {
    return 'npm'
  }
}

/**
 * Checks whether Yarn is installed on the computer.
 */
function isYarnInstalled(): boolean {
  try {
    cp.execSync(`yarnpkg --version`, { stdio: `ignore` })
    return true
  } catch (err) {
    return false
  }
}
