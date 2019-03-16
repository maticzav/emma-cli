import React, { PureComponent } from 'react'
import { Box, Color, Text, StdinContext } from 'ink'
// import Spinner from 'ink-spinner'

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
  active: boolean
  value: string
  onChange: (q: string) => void
  loading: boolean
}

class Search extends React.Component<WithStdin<Props>> {
  componentDidMount() {
    const { stdin, setRawMode } = this.props

    if (setRawMode) setRawMode(true)
    stdin.on('data', this.handleInput)
  }

  componentWillUnmount() {
    const { stdin, setRawMode } = this.props

    stdin.removeListener('data', this.handleInput)
    if (setRawMode) setRawMode(false)
  }

  handleInput = (data: string) => {
    const { active, value, onChange } = this.props

    const char = String(data)

    if (
      [
        ARROW_UP,
        ARROW_DOWN,
        ARROW_LEFT,
        ARROW_RIGHT,
        ENTER,
        CTRL_C,
        SPACE,
      ].includes(char) ||
      !active
    ) {
      return
    }

    if (char === BACKSPACE || char === DELETE) {
      onChange(value.slice(0, value.length - 1))
    } else {
      onChange(`${value}${char}`)
    }
  }

  render() {
    const { value } = this.props
    const hasValue = value.length > 0

    return (
      <Box flexDirection="row">
        <Box marginRight={1}>
          <Text>
            Search packages on <Color cyan>Yarn</Color>:
          </Text>
        </Box>
        <Box>
          <Color dim={!hasValue}>{hasValue ? value : 'graphql-shield'}</Color>
        </Box>
        {/* TODO: Think about how to display that loading indicator */}
      </Box>
    )
  }
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
