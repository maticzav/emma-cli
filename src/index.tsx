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
const CTRL_C = '\x03'

interface State {
  view: 'SEARCH' | 'SCROLL' | 'OVERVIEW' | 'INSTALL'
  query: string
  hits: IPackage[]
  page: number
  loading: boolean
  dependencies: {
    [name: string]: IDependency
  }
  status: InstallationStatus
}

class Emma extends React.Component<WithStdin<{}>, State> {
  state: State = {
    view: 'SEARCH',
    query: '',
    page: 0,
    hits: [],
    loading: false,
    dependencies: {},
    status: 'NOT_STARTED',
  }

  constructor(props: WithStdin<{}>) {
    super(props)

    this.handleQueryChange = this.handleQueryChange.bind(this)
    this.handleInput = this.handleInput.bind(this)
    this.handleWillReachEnd = this.handleWillReachEnd.bind(this)
    this.installDependencies = this.installDependencies.bind(this)
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

  /**
   * Keyboard events manager split based on the active view.
   */
  async handleInput(data: any) {
    const s = String(data)

    /**
     * Create an exit listener.
     */

    if (s === CTRL_C) {
      process.exit(0)
    }

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
              await this.installDependencies()
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

    const res = await search(value)

    if (res.query === this.state.query) {
      this.setState({ hits: res.hits, loading: false })
    }
  }

  /**
   * Start querying new hits and update pagination. But limit pagniation to
   * ten pages.
   */
  async handleWillReachEnd() {
    const { query, hits, page } = this.state

    if (page > 10) return

    const res = await search(query, page + 1)

    if (res.query === this.state.query && res.page - 1 === this.state.page) {
      this.setState({
        page: res.page,
        hits: [...hits, ...res.hits],
      })
    }
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

  async installDependencies() {
    this.setState({ status: 'LOADING' })
    try {
      await Promise.all([
        install(Object.values(this.state.dependencies), 'dependency'),
        install(Object.values(this.state.dependencies), 'devDependency'),
      ])
      this.setState({ status: 'INSTALLED' })
    } catch (err) {
      this.setState({ status: 'ERROR' })
      throw err
    }
  }

  render() {
    const { view, query, loading, hits, dependencies, status } = this.state

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
            status={status}
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
