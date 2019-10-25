import React from 'react'
import { Color, Text } from 'ink'

export const Heading = ({ children }: { children: string }) => (
  <Text underline>
    <Color green>{children}</Color>
  </Text>
)

export default Heading
