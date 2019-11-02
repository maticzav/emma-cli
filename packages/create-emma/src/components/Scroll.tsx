import React from 'react'
import { Box, Color, Text, StdinContext } from 'ink'

import { WithStdin } from '../utils'

const ARROW_UP = '\u001B[A'
const ARROW_DOWN = '\u001B[B'

interface Props<T> {
  placeholder?: string
  active: boolean
  values: T[]
  children: (props: T & { active: boolean }) => React.ReactNode
  onWillReachEnd?: () => void
}

interface State {
  cursor: number
}

class Scroll<T> extends React.Component<WithStdin<Props<T>>, State> {
  /* Number of items displayed in the list at once. */
  private window: number = 5

  state: State = {
    cursor: 0,
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

  handleInput = (data: any) => {
    const { active, values } = this.props
    const { cursor } = this.state

    /* Prevent any action if element is out of focus. */
    if (!active) return

    /* Decode char */
    const char = String(data)

    switch (char) {
      case ARROW_UP:
        if (cursor - 1 >= 0) this.setState({ cursor: cursor - 1 })
        break
      case ARROW_DOWN:
        if (cursor + 1 < values.length) this.setState({ cursor: cursor + 1 })
        break
    }
  }

  /**
   *
   * This ensures that cursor stays in sync with the most recent props.
   *
   * @param props
   * @param state
   */
  static getDerivedStateFromProps<T>(
    props: Props<T>,
    state: State,
  ): State | null {
    if (props.active === false) return { ...state, cursor: 0 }
    if (props.values.length < state.cursor) {
      return { ...state, cursor: props.values.length }
    }
    return null
  }

  /**
   *
   * Makes sure that the outside world knows where we are.
   *
   * @param props
   * @param state
   */
  componentDidUpdate() {
    const cursor = this.state.cursor

    /**
     * Trigger onWillReachEnd on the second last item in the list.
     */
    if (cursor === this.props.values.length - 2 && this.props.onWillReachEnd)
      this.props.onWillReachEnd()
  }

  render() {
    const mask = this.getMask(),
      cursor = this.state.cursor,
      size = this.window,
      values = this.props.values.slice(mask, mask + size),
      render = this.props.children

    return (
      <Box flexDirection="column">
        {values.length === 0 && this.props.placeholder && (
          <Text>
            <Color grey>{this.props.placeholder}</Color>
          </Text>
        )}

        {values.map((value, i) =>
          render({
            ...value,
            active: this.props.active && i + mask === cursor,
          }),
        )}
      </Box>
    )
  }

  /**
   * Calculates the mask begining position.
   */
  getMask = (): number => {
    const values = this.props.values
    const cursor = this.state.cursor
    const size = this.window

    /** Distance from the cursor to the top of mask. */
    const offset = Math.floor(size / 2)

    /** Items are shorter than mask. */
    if (values.length <= size) return 0

    /** Cursor has moved above the middle point of the mask. */
    if (cursor - offset <= 0) return 0

    /** Cursor has moved past the middle point of the mask. */
    if (cursor + offset >= values.length) return values.length - size

    /** Cursor is in the "middle" of the list. */
    return cursor - offset
  }
}

/**
 * Wraps the component in stdin consumer.
 */
export default class ScrollWithStdin<T> extends React.Component<Props<T>> {
  render() {
    return (
      <StdinContext.Consumer>
        {({ stdin, setRawMode }) => (
          <Scroll {...this.props} stdin={stdin} setRawMode={setRawMode} />
        )}
      </StdinContext.Consumer>
    )
  }
}
