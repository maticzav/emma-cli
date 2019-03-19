import React from 'react'
import { Box, Color, Text } from 'ink'
import Spinner from 'ink-spinner'

import Heading from './Heading'

import { IDependency } from '../installer'

interface Props {
  active: boolean
  dependencies: IDependency[]
  status: InstallationStatus
}

export type InstallationStatus =
  | 'NOT_STARTED'
  | 'LOADING'
  | 'INSTALLED'
  | 'ERROR'

export default class Install extends React.Component<Props> {
  render() {
    const { active, dependencies, status } = this.props

    return (
      <Box flexDirection="column">
        <Box>
          <Text underline>Installation</Text>
        </Box>
        {!active && (
          <Box>
            <Text>
              <Color grey>Select packages to install.</Color>
            </Text>
          </Box>
        )}
        {active && (
          <Box flexDirection="column">
            {dependencies.length > 0 && (
              <>
                <Heading>dependencies</Heading>
                {(() => {
                  switch (status) {
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

            {dependencies.length === 0 && (
              <Box>
                <Color cyan>Nothing to install...</Color>
              </Box>
            )}
          </Box>
        )}
      </Box>
    )
  }
}
