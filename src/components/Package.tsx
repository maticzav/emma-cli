import React from 'react'
import { Box, Color, Text, StdinContext } from 'ink'

import { IPackage } from '../algolia'
import { WithStdin } from '../utils'

interface Props {
  pkg: IPackage
  active: boolean
  onClick: (pkg: IPackage) => void
}

class Package extends React.Component<WithStdin<Props>> {
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
    const s = String(data)

    if (active && s == ' ') {
      onClick(pkg)
    }
  }

  render() {
    const { pkg, active } = this.props

    return (
      <Box flexDirection="row">
        <Box marginRight={1}>
          <Color magenta>{active ? `›` : ` `}</Color>
        </Box>
        <Box marginRight={1}>
          <Text>{pkg.humanDownloadsLast30Days}</Text>
        </Box>
        <Box marginRight={1}>
          <Text bold>{pkg.name}</Text>
        </Box>
        <Box marginRight={1}>
          <Text>{pkg.owner.name}</Text>
        </Box>
        {/* <Box>
          <Text>{pkg.description}</Text>
        </Box> */}
      </Box>
    )
  }
}

export default class PackageWithStdin extends React.Component<Props> {
  render() {
    return (
      <StdinContext.Consumer>
        {({ stdin, setRawMode }) => (
          <Package {...this.props} stdin={stdin} setRawMode={setRawMode} />
        )}
      </StdinContext.Consumer>
    )
  }
}
