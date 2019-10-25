import React from 'react'
import { Box, Text } from 'ink'
import { IDependency } from '../installer'

export default ({ data }: { data: IDependency }) => (
  <Box flexDirection="row">
    <Box marginX={1}>
      <Text>{`-`}</Text>
    </Box>
    <Box>
      <Text>{data.name}</Text>
    </Box>
  </Box>
)
