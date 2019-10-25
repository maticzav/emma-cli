import React, { PureComponent } from 'react'
import { Box, Color, Text, StdinContext } from 'ink'
import opn from 'opn'

import { IPackage, SearchContext, WithSearchContext } from '../algolia'
import { IDependency } from '../installer'
import { WithStdin } from '../utils'

const SPACE = ' '
const ARROW_LEFT = '\u001B[D'
const ARROW_RIGHT = '\u001B[C'

interface Props {
  pkg: IPackage
  active: boolean
  onClick: (pkg: IPackage) => void
  type: IDependency['type'] | undefined
}

interface State {
  showDetails: boolean
}

/* Package */

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
        if (this.state.showDetails && pkg.repository) {
          opn(pkg.repository.url)
        }
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
    const { pkg, active, type } = this.props
    const { showDetails } = this.state

    const Cursor = () => (
      <Box marginRight={1}>
        {(() => {
          if (active) {
            if (type === 'dependency') return <Color cyan>{`›`}</Color>
            if (type === 'devDependency') return <Color blue>{`›`}</Color>
            return <Color magenta>{`›`}</Color>
          } else {
            if (type === 'dependency') return <Color cyan>{`◉`}</Color>
            if (type === 'devDependency') return <Color blue>{`◉`}</Color>
            return <Text>{` `}</Text>
          }
        })()}
      </Box>
    )

    const Downloads = () => (
      <Box
        width={this.getColumnWidth('humanDownloadsLast30Days')}
        marginRight={1}
      >
        <Text>{pkg.humanDownloadsLast30Days}</Text>
      </Box>
    )

    const Name = () => (
      <Box width={this.getColumnWidth('name')} marginRight={1}>
        <Text bold>{pkg.name}</Text>
      </Box>
    )

    const Version = () => (
      <Box width={this.getColumnWidth('version')} marginRight={1}>
        <Text italic>{pkg.version}</Text>
      </Box>
    )

    const Owner = () => (
      <Box width={this.getColumnWidth('owner')}>
        <Text>
          <Color grey>{pkg.owner.name}</Color>
        </Text>
      </Box>
    )

    const Description = () => (
      <Box flexDirection="row" marginX={2}>
        <Text>{pkg.description}</Text>
      </Box>
    )

    if (showDetails) {
      return (
        <Box flexDirection="column" marginY={1}>
          <Box flexDirection="row">
            <Cursor />
            <Downloads />
            <Name />
            <Version />
            <Owner />
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
        <Downloads />
        <Name />
        <Version />
        <Owner />
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
          case 'repository': {
            if (hit.repository) {
              return hit.repository.url
            } else {
              return ''
            }
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
