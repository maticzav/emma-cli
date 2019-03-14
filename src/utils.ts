import * as fs from 'fs'
import * as cp from 'child_process'

const isYarnInstalled = async () => {
  try {
    await cp.execSync(`yarnpkg --version`, { stdio: `ignore` })
    return true
  } catch (err) {
    return false
  }
}

export const shouldUseYarn = async () => {
  try {
    await fs.existsSync('package-lock.json')
    return false
  } catch (err) {
    return isYarnInstalled()
  }
}
