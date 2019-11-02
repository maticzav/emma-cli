import React, { PureComponent } from 'react'
import * as path from 'path'
import * as fs from 'fs'
import { Box, Color, StdinContext } from 'ink'

import { WithStdin } from '../utils'

const ARROW_UP = '\u001B[A'
const ARROW_DOWN = '\u001B[B'
const ARROW_LEFT = '\u001B[D'
const ARROW_RIGHT = '\u001B[C'
const ENTER = '\r'
const CTRL_C = '\x03'
const SPACE = ' '
const BACKSPACE = '\x08'
const DELETE = '\x7F'

interface Props {
  cwd: string
  active: boolean
  onSubmit: (q: string) => void
}

type State = {
  dest: string
  conflicts: string[]
}

class Search extends React.Component<WithStdin<Props>, State> {
  state: State = {
    dest: '',
    conflicts: [],
  }

  constructor(props: WithStdin<Props>) {
    super(props)

    this.handleInput = this.handleInput.bind(this)
  }

  componentDidMount() {
    const { stdin, setRawMode } = this.props

    if (setRawMode) setRawMode(true)
    stdin.on('data', this.handleInput)
  }

  componentWillUnmount() {
    const { stdin } = this.props

    stdin.removeListener('data', this.handleInput)
  }

  handleInput = (data: string) => {
    const { active, onSubmit } = this.props

    /* Only on active. */
    if (!active) return

    const char = String(data)

    switch (char) {
      case ARROW_UP:
      case ARROW_DOWN:
      case ARROW_LEFT:
      case ARROW_RIGHT:
      case CTRL_C:
      case SPACE: {
        return
      }
      case ENTER: {
        /* Submit */
        const fullpath = path.resolve(this.props.cwd, this.state.dest)
        if (this.state.conflicts.length === 0) onSubmit(fullpath)
        return
      }
      default: {
        /* Text input. */
        const value = this.state.dest

        if (char === BACKSPACE || char === DELETE) {
          const dest = value.slice(0, value.length - 1)
          const fullpath = path.resolve(this.props.cwd, dest)

          this.setState({ dest, conflicts: checkFolderForConflicts(fullpath) })
        } else {
          const dest = `${value}${char}`
          const fullpath = path.resolve(this.props.cwd, dest)

          this.setState({ dest, conflicts: checkFolderForConflicts(fullpath) })
        }
      }
    }
  }

  render() {
    const { dest, conflicts } = this.state
    const hasValue = dest.length > 0
    const hasConflicts = conflicts.length > 0

    return (
      <Box flexDirection="row">
        <Box marginRight={1}>
          <Color underline>Type destination:</Color>
        </Box>

        <Box marginRight={1}>
          <Color
            red={hasConflicts && hasValue}
            green={!hasConflicts && hasValue}
            dim={!hasValue}
          >
            {hasValue ? dest : 'Start typing path'}
          </Color>
        </Box>

        {hasConflicts && hasValue && (
          <Color dim>
            {`(Conflicts in path: ${conflicts.slice(0, 4).join(', ')})`}
          </Color>
        )}
      </Box>
    )
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

export default class SearchWithStdin extends PureComponent<Props> {
  render() {
    return (
      <StdinContext.Consumer>
        {({ stdin, setRawMode }) => (
          <Search {...this.props} stdin={stdin} setRawMode={setRawMode} />
        )}
      </StdinContext.Consumer>
    )
  }
}
