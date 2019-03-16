import React, { PureComponent } from 'react'
import { Box, Color, Text, StdinContext } from 'ink'

import { IPackage, SearchContext, WithSearchContext } from '../algolia'
import { WithStdin } from '../utils'

const SPACE = ' '
const ARROW_LEFT = '\u001B[D'
const ARROW_RIGHT = '\u001B[C'

interface Props {
  pkg: IPackage
  active: boolean
  onClick: (pkg: IPackage) => void
}

interface State {
  showDetails: boolean
}

class Package extends PureComponent<
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
    const { active, onClick, pkg } = this.props
    const char = String(data)

    if (!active) return

    switch (char) {
      case SPACE: {
        return onClick(pkg)
      }
      case ARROW_RIGHT: {
        return this.setState({ showDetails: true })
      }
      case ARROW_LEFT: {
        return this.setState({ showDetails: false })
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
    const { pkg, active } = this.props
    const { showDetails } = this.state

    if (showDetails) {
      return (
        <Box flexDirection="column" marginY={1}>
          <Box flexDirection="row">
            <Box marginRight={1}>
              <Color magenta>{active ? `›` : ` `}</Color>
            </Box>
            <Box
              width={this.getColumnWidth('humanDownloadsLast30Days')}
              marginRight={1}
            >
              <Text>{pkg.humanDownloadsLast30Days}</Text>
            </Box>
            <Box width={this.getColumnWidth('name')} marginRight={1}>
              <Text bold>{pkg.name}</Text>
            </Box>
            <Box width={this.getColumnWidth('owner')}>
              <Text>
                <Color grey>{pkg.owner.name}</Color>
              </Text>
            </Box>
          </Box>
          <Box flexDirection="row" marginX={2}>
            <Text>{pkg.description}</Text>
          </Box>
        </Box>
      )
    }

    return (
      <Box flexDirection="row" marginY={0}>
        <Box marginRight={1}>
          <Color magenta>{active ? `›` : ` `}</Color>
        </Box>
        <Box width={this.getColumnWidth('humanDownloadsLast30Days')}>
          <Text>{pkg.humanDownloadsLast30Days}</Text>
        </Box>
        <Box width={this.getColumnWidth('name')} marginX={1}>
          <Text bold>{pkg.name}</Text>
        </Box>
        <Box width={this.getColumnWidth('owner')}>
          <Text>{pkg.owner.name}</Text>
        </Box>
      </Box>
    )
  }

  /**
   *
   * Calculates the width of each column in the list.
   *
   * @param column
   */
  getColumnWidth(column: keyof IPackage): number {
    const hits = this.props.hits
      .map(hit => {
        switch (column) {
          case 'owner': {
            return hit.owner.name
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

export default class PackageWithStdinAndHits extends React.Component<Props> {
  render() {
    return (
      <SearchContext.Consumer>
        {values => (
          <StdinContext.Consumer>
            {({ stdin, setRawMode }) => (
              <Package
                {...this.props}
                stdin={stdin}
                setRawMode={setRawMode}
                hits={values}
              />
            )}
          </StdinContext.Consumer>
        )}
      </SearchContext.Consumer>
    )
  }
}
