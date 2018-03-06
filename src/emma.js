import path from 'path'
import fs from 'fs'

import { h, render, Component } from 'ink'

// Helpers -------------------------------------------------------------------

const useYarn = fs.existsSync(path.resolve(__dirname, `yarn.lock`))
const shouldUseYarn = () => {
   try {
      execSync(`yarnpkg --version`, { stdio: `ignore` })
      return true
   } catch (e) {
      return false
   }
}

// Emma ----------------------------------------------------------------------

class Emma extends Component {
   constructor() {
      super()
   }
}

export default Emma
