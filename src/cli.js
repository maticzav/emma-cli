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

class Counter extends Component {
   constructor() {
      super()

      this.state = {
         i: 0
      }
   }

   render(props, state) {
      return `Iteration #${state.i} ${useYarn}`
   }

   componentDidMount() {
      this.timer = setInterval(() => {
         this.setState({
            i: this.state.i + 1
         })
      }, 100)
   }

   componentWillUnmount() {
      clearInterval(this.timer)
   }
}

const unmount = render(<Counter/>)

setTimeout(() => {
// Enough counting
   unmount()
}, 1000)
