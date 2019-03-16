import React from 'react'
import { StdinContext } from 'ink'

import { WithStdin } from '../utils'

interface Props {}

class Overview extends React.Component<WithStdin<Props>> {
  render() {
    return 'hey'
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
