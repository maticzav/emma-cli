import React from 'react'
import { Box, Text, Color } from 'ink'

import { IStarterDependency } from '../algolia'

interface Props {
  dependencies: IStarterDependency[]
}

export default class Overview extends React.Component<Props, {}> {
  render() {
    const { dependencies } = this.props
    return (
      <Box flexDirection="column">
        <Color green underline>
          Selected dependencies:
        </Color>

        <Box flexDirection="row">
          {dependencies.length === 0 && (
            <Color grey>You haven't selected any dependency yet.</Color>
          )}

          {dependencies.map(d => (
            <Box marginX={1}>
              <Text italic bold>
                {d.name}
              </Text>
            </Box>
          ))}
        </Box>
      </Box>
    )
  }
}
