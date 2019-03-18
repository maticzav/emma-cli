import React from 'react'
import { Box, Color, StdinContext, Text } from 'ink'

import Heading from './Heading'
import Dependency from './Dependency'

import { IDependency } from '../installer'
import { WithStdin } from '../utils'

interface Props {
  dependencies: IDependency[]
  active: boolean
}

class Overview extends React.Component<WithStdin<Props>> {
  render() {
    const { dependencies, active } = this.props
    const deps = this.sortDependencies(
      dependencies.filter(d => d.type === 'dependency'),
    )
    const devDeps = this.sortDependencies(
      dependencies.filter(d => d.type === 'devDependency'),
    )

    return (
      <Box flexDirection="column">
        <Text underline>Overview</Text>
        {deps.length > 0 && (
          <>
            <Heading>dependencies</Heading>
            {deps.map(dep => (
              <Dependency key={dep.name} data={dep} />
            ))}
          </>
        )}

        {devDeps.length > 0 && (
          <>
            <Heading>devDependencies</Heading>
            {devDeps.map(dep => (
              <Dependency key={dep.name} data={dep} />
            ))}
          </>
        )}

        {deps.length === 0 && devDeps.length === 0 && (
          <Text>
            <Color grey>Select packages using space!</Color>
          </Text>
        )}

        {active && <Color greenBright>{`Press enter to install...`}</Color>}
      </Box>
    )
  }

  sortDependencies(deps: IDependency[]): IDependency[] {
    return deps.sort((depA, depB) => {
      if (depA.type > depB.type) return 1
      if (depA.type < depB.type) return -1
      return 0
    })
  }
}

/**
 * Wraps the component in stdin consumer.
 */
export default class OverviewWithStdin extends React.Component<Props> {
  render() {
    return (
      <StdinContext.Consumer>
        {({ stdin, setRawMode }) => (
          <Overview {...this.props} stdin={stdin} setRawMode={setRawMode} />
        )}
      </StdinContext.Consumer>
    )
  }
}
