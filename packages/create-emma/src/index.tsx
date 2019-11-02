import React from 'react'
import { Text, Box, StdinContext, Color } from 'ink'

import {
  IStarter,
  SearchContext,
  IStarterDependency,
  searchStarters,
  searchDependencies,
  IStarterDependencyFacet,
} from './algolia'

import DependencyFacet from './components/DependencyFacet'
import Footer from './components/Footer'
import FSPathInput from './components/FSPathInput'
import Overview from './components/Overview'
import Starter from './components/Starter'
import Scroll from './components/Scroll'
import Search from './components/Search'

import { WithStdin } from './utils'

const ENTER = '\r'
const CTRL_C = '\x03'

type State =
  | {
      view: 'DEPENDENCIES_SEARCH'
      /* Facets search */
      query: string
      facets: IStarterDependencyFacet[]
      loading: boolean
      /* User selection */
      dependencies: IStarterDependency[]
      /* Preview */
      starters: IStarter[]
    }
  | {
      view: 'STARTERS_SEARCH'
      /* Prior selection */
      dependencies: IStarterDependency[]
      /* Starters search */
      query: string
      page: number
      loading: boolean
      starters: IStarter[]
    }
  | {
      view: 'INSTALLATION'
      /* Installation status. */
      starter: IStarter
      destination: string | null
      // status: InstallationStatus
    }

class Emma extends React.Component<WithStdin<{}>, State> {
  state: State = {
    view: 'DEPENDENCIES_SEARCH',
    query: '',
    facets: [],
    loading: false,
    dependencies: [],
    starters: [],
  }

  constructor(props: WithStdin<{}>) {
    super(props)

    this.handleQueryChange = this.handleQueryChange.bind(this)
    this.handleInput = this.handleInput.bind(this)
    this.handleWillReachEnd = this.handleWillReachEnd.bind(this)
    this.handleDependencyToggle = this.handleDependencyToggle.bind(this)
    this.handleInstallStarter = this.handleInstallStarter.bind(this)
    this.handleStarterDestChange = this.handleStarterDestChange.bind(this)
  }

  componentDidMount() {
    const { stdin, setRawMode } = this.props

    if (setRawMode) setRawMode(true)
    stdin.setMaxListeners(100)
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
      case 'DEPENDENCIES_SEARCH': {
        if (s === ENTER) {
          const { starters, dependencies } = this.state
          this.setState({
            view: 'STARTERS_SEARCH',
            query: '',
            page: 0,
            loading: false,
            starters: starters,
            dependencies: dependencies,
          })
        }
        return
      }
    }
  }

  /**
   * Whenever input changes, switch to the initial screen, change the value
   * of the query accordingly, reset pagination and perform search.
   */
  async handleQueryChange(query: string) {
    switch (this.state.view) {
      case 'DEPENDENCIES_SEARCH': {
        this.setState({
          view: 'DEPENDENCIES_SEARCH',
          query: query,
          loading: true,
        })

        const [starters, facets] = await Promise.all([
          searchStarters('', this.state.dependencies),
          searchDependencies(query, this.state.dependencies),
        ])

        if (this.state.view === 'DEPENDENCIES_SEARCH') {
          this.setState({
            view: 'DEPENDENCIES_SEARCH',
            query: query,
            facets: facets,
            loading: false,
            dependencies: this.state.dependencies,
            starters: starters.hits,
          })
        }

        return
      }
      case 'STARTERS_SEARCH': {
        this.setState({
          view: 'STARTERS_SEARCH',
          query: query,
          page: 0,
          dependencies: this.state.dependencies,
          starters: this.state.starters,
          loading: true,
        })

        const starters = await searchStarters(query, this.state.dependencies)

        if (
          starters.query === this.state.query &&
          this.state.view === 'STARTERS_SEARCH'
        ) {
          this.setState({
            view: 'STARTERS_SEARCH',
            loading: false,
            starters: starters.hits,
            dependencies: this.state.dependencies,
          })
        }
      }
    }
  }

  /**
   * Start querying new hits and update pagination. But limit pagniation to
   * ten pages.
   */
  async handleWillReachEnd() {
    switch (this.state.view) {
      case 'STARTERS_SEARCH': {
        const { query, starters, dependencies, page } = this.state

        /* Memory leak. */
        if (page > 10) return

        /* Perform search of the next page. */
        const res = await searchStarters(query, dependencies, page + 1)

        if (
          res.query === this.state.query &&
          this.state.view === 'STARTERS_SEARCH' &&
          res.page - 1 === this.state.page
        ) {
          this.setState({
            view: 'STARTERS_SEARCH',
            page: res.page,
            starters: [...starters, ...res.hits],
            dependencies: [],
            query: query,
            loading: false,
          })
        }
      }
    }
  }

  /**
   * Creates a new dependency if newly selected or toggles the existing one.
   */
  async handleDependencyToggle({ value }: IStarterDependencyFacet) {
    switch (this.state.view) {
      case 'DEPENDENCIES_SEARCH': {
        const { dependencies } = this.state
        /* Search to see whether the dependency is already selected. */
        const foundDependency = dependencies.find(({ name }) => name === value)

        /* Add/Remove dependency from the list. */
        if (foundDependency === undefined) {
          this.setState({
            view: 'DEPENDENCIES_SEARCH',
            dependencies: [...dependencies, { name: value }],
          })
        } else {
          this.setState({
            view: 'DEPENDENCIES_SEARCH',
            dependencies: dependencies.filter(({ name }) => name !== value),
          })
        }

        /* Perform search. */

        const [starters, facets] = await Promise.all([
          searchStarters('', this.state.dependencies),
          searchDependencies('', this.state.dependencies),
        ])

        if (this.state.view === 'DEPENDENCIES_SEARCH') {
          this.setState({
            view: 'DEPENDENCIES_SEARCH',
            query: this.state.query,
            facets: facets,
            loading: false,
            dependencies: this.state.dependencies,
            starters: starters.hits,
          })
        }
      }
    }
  }

  /**
   * Performs a starter installation.
   */
  async handleInstallStarter(starter: IStarter) {
    this.setState({ view: 'INSTALLATION', starter, destination: null })
  }

  /**
   * Modifies the target destination of a starter.
   * @param dest
   */
  handleStarterDestChange(dest: string) {
    switch (this.state.view) {
      case 'INSTALLATION': {
        this.setState({
          view: 'INSTALLATION',
          destination: dest,
        })
      }
    }
  }

  render() {
    switch (this.state.view) {
      case 'DEPENDENCIES_SEARCH': {
        const { query, loading, starters, facets, dependencies } = this.state

        return (
          <SearchContext.Provider value={{ starters, facets }}>
            <Box flexDirection="column">
              <Search
                heading={<Text underline>Search tools:</Text>}
                value={query}
                onChange={this.handleQueryChange}
                loading={loading}
                active
              />
              <Overview dependencies={this.state.dependencies}></Overview>
              <Box flexDirection="column">
                <Color cyan underline>
                  Search:
                </Color>

                <Scroll
                  placeholder="Packages will appear as you start searching!"
                  values={this.state.facets}
                  active
                >
                  {dependency => (
                    <DependencyFacet
                      key={`${query}-dependency-${dependency.value}`}
                      dependency={dependency}
                      onClick={this.handleDependencyToggle}
                      selected={dependencies.some(
                        d => d.name === dependency.value,
                      )}
                      active={dependency.active}
                    />
                  )}
                </Scroll>
              </Box>
              <Box flexDirection="column">
                <Text>Starters:</Text>
                <Scroll
                  placeholder=""
                  values={this.state.starters}
                  active={false}
                >
                  {starter => (
                    <Starter
                      key={starter.objectID}
                      starter={starter}
                      active={false}
                    />
                  )}
                </Scroll>
              </Box>
              <Footer />
            </Box>
          </SearchContext.Provider>
        )
      }

      case 'STARTERS_SEARCH': {
        const { query, loading, starters } = this.state

        return (
          <SearchContext.Provider value={{ starters, facets: [] }}>
            <Box flexDirection="column">
              <Overview dependencies={this.state.dependencies}></Overview>

              <Search
                heading={
                  <Color yellow underline>
                    Search starters:
                  </Color>
                }
                value={query}
                onChange={this.handleQueryChange}
                loading={loading}
                active
              />

              <Scroll
                placeholder="We couldn't find anything. Try changing the search!"
                values={this.state.starters}
                onWillReachEnd={this.handleWillReachEnd}
                active
              >
                {starter => (
                  <Starter
                    key={starter.objectID}
                    starter={starter}
                    onSubmit={this.handleInstallStarter}
                    active={starter.active}
                  />
                )}
              </Scroll>

              <Footer />
            </Box>
          </SearchContext.Provider>
        )
      }
      case 'INSTALLATION': {
        const { starter, destination } = this.state

        return (
          <Box flexDirection="column">
            <Color underline bold>
              {starter.name}
            </Color>

            <FSPathInput
              cwd={process.cwd()}
              onSubmit={this.handleStarterDestChange}
              active={destination === null}
            />
          </Box>
        )
      }
    }
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
