import React from 'react'
import { Box, Text, StdinContext } from 'ink'

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

    setRawMode!(true)
    stdin.on('data', this.handleInput)
  }

  componentWillUnmount() {
    const { stdin, setRawMode } = this.props

    stdin.removeListener('data', this.handleInput)
    setRawMode!(false)
  }

  handleInput = (data: any) => {
    const { active, onClick, pkg } = this.props
    const s = String(data)

    if (active && s == 's') {
      onClick(pkg)
    }
  }

  render() {
    const { pkg } = this.props

    return (
      <Box>
        <Box>
          <Text bold>{pkg.name}</Text>
        </Box>
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
