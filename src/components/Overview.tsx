import React from 'react'
import { StdinContext } from 'ink'

import { IDependency } from '../installer'
import { WithStdin } from '../utils'

interface Props {
  dependencies: IDependency[]
}

class Overview extends React.Component<WithStdin<Props>> {
  render() {
    const { dependencies } = this.props
    const sortedDependencies = this.sortDependencies(dependencies)

    return sortedDependencies.map(d => d.name).join(',')
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
