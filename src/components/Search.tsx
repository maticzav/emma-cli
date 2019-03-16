import React from 'react'
import { Box, Text, Color } from 'ink'
import TextInput from 'ink-text-input'
// import Spinner from 'ink-spinner'

interface Props {
  active: boolean
  value: string
  onChange: (q: string) => void
  loading: boolean
}

export default class Search extends React.Component<Props> {
  handleChange = (val: string) => {
    /* Ignore space char because it's used for toggling the dependency */
    if (val[val.length - 1] !== ' ') this.props.onChange(val)
  }

  render() {
    const { active, value } = this.props

    return (
      <Box flexDirection="row">
        <Box marginRight={1}>
          <Text>
            Search packages on <Color cyan>Yarn</Color>:
          </Text>
        </Box>
        <Box>
          <TextInput
            placeholder="graphql-shield"
            focus={active}
            value={value}
            onChange={this.handleChange}
          />
        </Box>
        {/* TODO: Think about how to display that loading indicator */}
      </Box>
    )
  }
}
