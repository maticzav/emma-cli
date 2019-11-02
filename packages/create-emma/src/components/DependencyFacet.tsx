import React, { PureComponent } from 'react'
import { Box, Color, Text, StdinContext } from 'ink'

import {
  SearchContext,
  WithSearchContext,
  IStarterDependencyFacet,
} from '../algolia'
import { WithStdin } from '../utils'

const SPACE = ' '

interface Props {
  dependency: IStarterDependencyFacet
  active: boolean
  selected: boolean
  onClick: (dependency: IStarterDependencyFacet) => void
}

/* Package */

class DependencyFacet extends PureComponent<
  WithSearchContext<WithStdin<Props>>,
  {}
> {
  componentDidMount() {
    const { stdin, setRawMode } = this.props

    if (setRawMode) setRawMode(true)
    stdin.on('data', this.handleInput)
  }

  componentWillUnmount() {
    const { stdin } = this.props

    stdin.removeListener('data', this.handleInput)
    // if (setRawMode) setRawMode(false)
  }

  handleInput = (data: any) => {
    const { active, onClick, dependency } = this.props
    const char = String(data)

    if (!active) return

    switch (char) {
      case SPACE: {
        return onClick(dependency)
      }
    }
  }

  render() {
    const { dependency, active, selected } = this.props

    const Cursor = () => (
      <Box marginRight={1}>
        {(() => {
          if (selected) {
            if (active) return <Color magenta>{`›`}</Color>
            else return <Text>{`-`}</Text>
          } else {
            if (active) return <Color cyan>{`›`}</Color>
            else return <Text>{` `}</Text>
          }
        })()}
      </Box>
    )

    const Count = () => (
      <Box width={this.getColumnWidth('count')} marginRight={1}>
        <Text>{dependency.count}</Text>
      </Box>
    )

    const Name = () => (
      <Box width={this.getColumnWidth('value')}>
        <Text bold italic>
          {dependency.value}
        </Text>
      </Box>
    )

    return (
      <Box flexDirection="row" marginY={0} marginX={0}>
        <Cursor />
        <Count></Count>
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
  getColumnWidth(column: 'count' | 'value'): number {
    const hits = this.props.facets
      .map(hit => {
        switch (column) {
          case 'count': {
            return `${hit.count}`
          }
          case 'value': {
            return hit.value
          }
        }
      })
      .map(c => c.length)

    return Math.max(...hits)
  }
}

export default class DependencyFacetWithStdinAndStartersAndFacets extends React.Component<
  Props
> {
  render() {
    return (
      <SearchContext.Consumer>
        {({ starters, facets }) => (
          <StdinContext.Consumer>
            {({ stdin, setRawMode }) => (
              <DependencyFacet
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
