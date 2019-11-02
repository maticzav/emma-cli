import React, { PureComponent } from 'react'
import { Box, Color, Text, StdinContext } from 'ink'

import { SearchContext, WithSearchContext, IStarter } from '../algolia'
import { WithStdin } from '../utils'

const ENTER = '\r'
const ARROW_LEFT = '\u001B[D'
const ARROW_RIGHT = '\u001B[C'

interface Props {
  starter: IStarter
  active: boolean
  onSubmit?: (starter: IStarter) => void
}

interface State {
  showDetails: boolean
}

/* Package */

class Starter extends PureComponent<
  WithSearchContext<WithStdin<Props>>,
  State
> {
  state: State = {
    showDetails: false,
  }

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

  handleInput = (data: any) => {
    const { active, onSubmit, starter } = this.props
    const char = String(data)

    if (!active) return

    switch (char) {
      case ARROW_RIGHT: {
        return this.setState({ showDetails: true })
      }
      case ARROW_LEFT: {
        return this.setState({ showDetails: false })
      }
      case ENTER: {
        if (onSubmit) return onSubmit(starter)
      }
    }
  }

  /**
   *
   * Removes details view when not active anymore.
   *
   * @param props
   * @param state
   */
  static getDerivedStateFromProps(
    props: WithSearchContext<WithStdin<Props>>,
    state: State,
  ): State | null {
    if (props.active === false) return { ...state, showDetails: false }
    return null
  }

  render() {
    const { starter, active } = this.props
    const { showDetails } = this.state

    const Cursor = () => (
      <Box marginRight={1}>
        {(() => {
          if (active) {
            return <Color magenta>{`›`}</Color>
          } else {
            return <Text>{` `}</Text>
          }
        })()}
      </Box>
    )

    const OwnerRepo = () => (
      <Box width={this.getColumnWidth('owner.repo')} marginRight={1}>
        <Text bold>{`${starter.owner}/${starter.repo}`}</Text>
      </Box>
    )

    const Name = () => (
      <Box width={this.getColumnWidth('name')} marginRight={1}>
        <Text italic>{starter.name}</Text>
      </Box>
    )

    const Description = () => (
      <Box flexDirection="row" marginX={2}>
        <Text>{starter.description}</Text>
      </Box>
    )

    if (showDetails) {
      return (
        <Box flexDirection="column" marginY={1}>
          <Box flexDirection="row">
            <Cursor />
            <OwnerRepo></OwnerRepo>
            <Name />
          </Box>
          <Box>
            <Description />
          </Box>
        </Box>
      )
    }

    return (
      <Box flexDirection="row" marginY={0} marginX={0}>
        <Cursor />
        <OwnerRepo></OwnerRepo>
        <Name />
      </Box>
    )
  }

  /**
   *
   * Calculates the width of each column in the list.
   *
   * @param column
   */
  getColumnWidth(column: 'name' | 'owner.repo'): number {
    const hits = this.props.starters
      .map(hit => {
        switch (column) {
          case 'owner.repo': {
            return `${hit.owner}/${hit.repo}`
          }
          case 'name': {
            return hit.name
          }
          default: {
            return hit[column]
          }
        }
      })
      .map(c => c.length)

    return Math.max(...hits)
  }
}

export default class StarterWithStdinAndHits extends React.Component<Props> {
  render() {
    return (
      <SearchContext.Consumer>
        {({ starters, facets }) => (
          <StdinContext.Consumer>
            {({ stdin, setRawMode }) => (
              <Starter
                {...this.props}
                stdin={stdin}
                setRawMode={setRawMode}
                starters={starters}
                facets={facets}
              />
            )}
          </StdinContext.Consumer>
        )}
      </SearchContext.Consumer>
    )
  }
}
