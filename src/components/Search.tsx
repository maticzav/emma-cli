import React from 'react'
import { Box, Text } from 'ink'
import TextInput from 'ink-text-input'

interface Props {
  active: boolean
  value: string
  onChange: (q: string) => void
}

export default class Search extends React.Component<Props> {
  handleChange = (val: string) => {
    const { onChange } = this.props
    /* Ignore space char because it's used for toggling the dependency */
    if (val[val.length] === ' ') return
    onChange(val)
  }

  render() {
    const { active, value } = this.props

    return (
      <Box>
        <Box marginRight={1}>
          <Text>Search packages:</Text>
        </Box>
        <Box>
          <TextInput
            placeholder="graphql-shield"
            focus={active}
            value={value}
            onChange={this.handleChange}
          />
        </Box>
      </Box>
    )
  }
}
