import React from 'react'
import { Box, StdinContext } from 'ink'

import { IPackage, SearchContext, search } from './algolia'

import { Footer } from './components/Footer'
import Install, { InstallationStatus } from './components/Install'
import Overview from './components/Overview'
import Package from './components/Package'
import Scroll from './components/Scroll'
import Search from './components/Search'

import { IDependency, getNextDependencyType, install } from './installer'
import { WithStdin, removeKey } from './utils'

const SPACE = ' '
const ARROW_UP = '\u001B[A'
const ARROW_DOWN = '\u001B[B'
const ENTER = '\r'

interface State {
  view: 'SEARCH' | 'SCROLL' | 'OVERVIEW' | 'INSTALL'
  query: string
  hits: IPackage[]
  page: number
  loading: boolean
  dependencies: {
    [name: string]: IDependency
  }
  dependenciesInstallationStatus: InstallationStatus
  devDependenciesInstallationStatus: InstallationStatus
}

class Emma extends React.Component<WithStdin<{}>, State> {
  state: State = {
    view: 'SEARCH',
    query: '',
    page: 0,
    hits: [],
    loading: false,
    dependencies: {},
    dependenciesInstallationStatus: 'NOT_STARTED',
    devDependenciesInstallationStatus: 'NOT_STARTED',
  }

  constructor(props: WithStdin<{}>) {
    super(props)

    this.handleQueryChange = this.handleQueryChange.bind(this)
    this.handleInput = this.handleInput.bind(this)
    this.handleWillReachEnd = this.handleWillReachEnd.bind(this)
    this.installDependencies = this.installDependencies.bind(this)
    this.installDevDependencies = this.installDevDependencies.bind(this)
  }

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

  async handleInput(data: any) {
    const s = String(data)

    switch (this.state.view) {
      case 'SEARCH': {
        if (s === ARROW_DOWN || s === ENTER || SPACE) {
          this.setState({ view: 'SCROLL' })
        }
        return
      }

      case 'SCROLL': {
        if (s === ENTER) {
          this.setState({ view: 'OVERVIEW' })
        }
        return
      }

      case 'OVERVIEW': {
        if (s === ARROW_UP || ARROW_DOWN) {
          this.setState({ view: 'SCROLL' })
        }

        if (s === ENTER) {
          if (Object.values(this.state.dependencies).length > 0) {
            this.setState({ view: 'INSTALL' })
            try {
              await Promise.all([
                this.installDependencies(),
                this.installDevDependencies(),
              ])

              process.exit(0)
            } catch (err) {
              process.exit(1)
            }
          } else {
            process.exit(0)
          }
        }

        return
      }

      case 'INSTALL': {
        return
      }
    }
  }

  /**
   * Whenever input changes, switch to the initial screen, change the value
   * of the query accordingly, reset pagination and perform search.
   */
  async handleQueryChange(value: string) {
    this.setState({
      query: value,
      page: 0,
      view: 'SEARCH',
      loading: true,
    })

    const hits = await search(value)

    this.setState({ hits, loading: false })
  }

  /**
   * Start querying new hits and update pagination.
   */
  async handleWillReachEnd() {
    const { query, hits } = this.state
    const page = this.state.page + 1

    const newHits = await search(query, page)

    this.setState({
      page,
      hits: [...hits, ...newHits],
    })
  }

  /**
   * Creates a new dependency if newly selected or toggles the existing one.
   */
  toggleDependency = (pkg: IPackage) => {
    const { dependencies } = this.state
    const dependency = dependencies[pkg.name]

    if (dependency === undefined) {
      this.setState({
        dependencies: {
          ...dependencies,
          [pkg.name]: { name: pkg.name, type: 'dependency' },
        },
      })
    } else {
      const nextType = getNextDependencyType(dependency.type)

      if (nextType) {
        this.setState({
          dependencies: {
            ...dependencies,
            [pkg.name]: { name: pkg.name, type: nextType },
          },
        })
      } else {
        this.setState({
          dependencies: removeKey(pkg.name, dependencies),
        })
      }
    }
  }

  /**
   * Installation handlers.
   */
  async installDependencies() {
    this.setState({ dependenciesInstallationStatus: 'LOADING' })
    try {
      await install(Object.values(this.state.dependencies), 'dependency')
      this.setState({ dependenciesInstallationStatus: 'INSTALLED' })
    } catch (err) {
      this.setState({ dependenciesInstallationStatus: 'ERROR' })
      throw err
    }
  }

  async installDevDependencies() {
    this.setState({ devDependenciesInstallationStatus: 'LOADING' })
    try {
      await install(Object.values(this.state.dependencies), 'devDependency')
      this.setState({ devDependenciesInstallationStatus: 'INSTALLED' })
    } catch (err) {
      this.setState({ devDependenciesInstallationStatus: 'ERROR' })
      throw err
    }
  }

  render() {
    const {
      view,
      query,
      loading,
      hits,
      dependencies,
      dependenciesInstallationStatus,
      devDependenciesInstallationStatus,
    } = this.state

    return (
      <SearchContext.Provider value={hits}>
        <Box flexDirection="column">
          <Search
            value={query}
            onChange={this.handleQueryChange}
            loading={loading}
            active
          />
          <Scroll
            values={this.state.hits}
            onWillReachEnd={this.handleWillReachEnd}
            active={view === 'SCROLL'}
          >
            {pkg => (
              <Package
                key={pkg.objectID}
                pkg={pkg}
                onClick={this.toggleDependency}
                active={pkg.active}
                type={(dependencies[pkg.name] || {}).type}
              />
            )}
          </Scroll>
          <Overview
            dependencies={Object.values(dependencies)}
            active={view === 'OVERVIEW'}
          />
          <Install
            dependencies={Object.values(dependencies)}
            dependenciesInstallationStatus={dependenciesInstallationStatus}
            devDependenciesInstallationStatus={
              devDependenciesInstallationStatus
            }
            active={view === 'INSTALL'}
          />
          <Footer />
        </Box>
      </SearchContext.Provider>
    )
  }
}

export default class EmmaWithStdin extends React.Component {
  render() {
    return (
      <StdinContext.Consumer>
        {({ stdin, setRawMode }) => (
          <Emma {...this.props} stdin={stdin} setRawMode={setRawMode} />
        )}
      </StdinContext.Consumer>
    )
  }
}
