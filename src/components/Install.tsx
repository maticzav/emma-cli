import React from 'react'
import { Box, Color, Text } from 'ink'
import Spinner from 'ink-spinner'

import Heading from './Heading'

import { IDependency, install } from '../installer'

interface Props {
  dependencies: IDependency[]
  active: boolean
}

interface State {
  dependenciesStatus: InstallationStatus
  devDependenciesStatus: InstallationStatus
}

type InstallationStatus = 'NOT_STARTED' | 'LOADING' | 'INSTALLED' | 'ERROR'

export default class Install extends React.Component<Props, State> {
  state: State = {
    dependenciesStatus: 'NOT_STARTED',
    devDependenciesStatus: 'NOT_STARTED',
  }

  constructor(props: Props) {
    super(props)

    this.installDependencies = this.installDependencies.bind(this)
    this.installDevDependencies = this.installDevDependencies.bind(this)
  }

  // /**
  //  *
  //  * Removes details view when not active anymore.
  //  *
  //  * @param props
  //  * @param state
  //  */
  // static getDerivedStateFromProps(
  //   props: Props,
  //   state: State,
  // ): State | null {
  //   if (props.active === false) return { ...state,}
  //   return null
  // }

  async componentDidMount() {
    try {
      await Promise.all([
        this.installDependencies(),
        this.installDevDependencies(),
      ])

      process.exit(0)
    } catch (err) {
      process.exit(1)
    }
  }

  /**
   * Installation handlers.
   */
  async installDependencies() {
    this.setState({ dependenciesStatus: 'LOADING' })
    try {
      await install(this.props.dependencies, 'dependency')
      this.setState({ dependenciesStatus: 'INSTALLED' })
    } catch (err) {
      this.setState({ dependenciesStatus: 'ERROR' })
    }
  }

  async installDevDependencies() {
    this.setState({ devDependenciesStatus: 'LOADING' })
    try {
      await install(this.props.dependencies, 'dependency')
      this.setState({ devDependenciesStatus: 'INSTALLED' })
    } catch (err) {
      this.setState({ devDependenciesStatus: 'ERROR' })
    }
  }

  render() {
    const { dependencies } = this.props
    const deps = dependencies.filter(d => d.type === 'dependency')
    const devDeps = dependencies.filter(d => d.type === 'devDependency')

    const { dependenciesStatus, devDependenciesStatus } = this.state

    return (
      <Box flexDirection="column">
        <Box>
          <Text>Installation</Text>
        </Box>
        <Box flexDirection="column" marginLeft={1}>
          {deps.length > 0 && (
            <>
              <Heading>dependencies</Heading>
              {(() => {
                switch (dependenciesStatus) {
                  case 'NOT_STARTED': {
                    return (
                      <Box>
                        We haven't started downloading dependencies yet.
                      </Box>
                    )
                  }
                  case 'INSTALLED': {
                    return (
                      <Box>
                        <Color greenBright>
                          Successfully installed dependendencies!
                        </Color>
                      </Box>
                    )
                  }
                  case 'LOADING': {
                    return (
                      <Box>
                        <Color cyan>
                          Loading dependendencies!
                          <Spinner />
                        </Color>
                      </Box>
                    )
                  }
                  case 'ERROR': {
                    return (
                      <Box>
                        <Color red>Couldn't install dependencies.</Color>
                      </Box>
                    )
                  }
                }
              })()}
            </>
          )}
          {devDeps.length > 0 && (
            <>
              <Heading>devDependencies</Heading>
              {(() => {
                switch (devDependenciesStatus) {
                  case 'NOT_STARTED': {
                    return (
                      <Box>
                        We haven't started downloading devDependencies yet.
                      </Box>
                    )
                  }
                  case 'INSTALLED': {
                    return (
                      <Box>
                        <Color greenBright>
                          Successfully installed devDependendencies!
                        </Color>
                      </Box>
                    )
                  }
                  case 'LOADING': {
                    return (
                      <Box>
                        <Color cyan>
                          Loading devDependendencies!
                          <Spinner />
                        </Color>
                      </Box>
                    )
                  }
                  case 'ERROR': {
                    return (
                      <Box>
                        <Color red>Couldn't install devDependencies.</Color>
                      </Box>
                    )
                  }
                }
              })()}
            </>
          )}
          {deps.length === 0 && devDeps.length === 0 && (
            <Box>
              <Color cyan>Nothing to install...</Color>
            </Box>
          )}
        </Box>
      </Box>
    )
  }
}
