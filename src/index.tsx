import React from 'react'
import { Box, StdinContext } from 'ink'

import { IPackage, search } from './algolia'

import { Footer } from './components/Footer'
import Overview from './components/Overview'
import Package from './components/Package'
import Scroll from './components/Scroll'
import Search from './components/Search'

import { IDependency, getNextDependencyType } from './installer'
import { WithStdin } from './utils'

const ARROW_DOWN = '\u001B[B'
const ENTER = '\r'

interface State {
  view: 'SEARCH' | 'SCROLL' | 'OVERVIEW'
  query: string
  hits: IPackage[]
  page: number
  loading: boolean
  dependencies: IDependency[]
}

class Emma extends React.Component<WithStdin<{}>, State> {
  state: State = {
    view: 'SEARCH',
    query: '',
    page: 0,
    hits: [],
    loading: false,
    dependencies: [],
  }

  constructor(props: WithStdin<{}>) {
    super(props)

    this.handleQueryChange = this.handleQueryChange.bind(this)
    this.handleWillReachEnd = this.handleWillReachEnd.bind(this)
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

  handleInput = (data: any) => {
    const s = String(data)

    switch (this.state.view) {
      case 'SEARCH': {
        if (s === ARROW_DOWN || s === ENTER) {
          this.setState({ view: 'SCROLL' })
        }
      }

      case 'SCROLL': {
        if (s === ENTER) {
          this.setState({ view: 'OVERVIEW' })
        }
      }

      case 'OVERVIEW': {
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
    const dependency = dependencies.find(dep => dep.name === pkg.name)

    if (dependency === undefined) {
      this.setState({
        dependencies: dependencies.concat({
          name: pkg.name,
          type: 'dependency',
        }),
      })
    } else {
      const nextType = getNextDependencyType(dependency)

      if (nextType) {
        this.setState({
          dependencies: dependencies.map(d => {
            if (d.name === pkg.name) return { ...d, type: nextType }
            else return d
          }),
        })
      } else {
        this.setState({
          dependencies: dependencies.filter(d => d.name !== pkg.name),
        })
      }
    }
  }

  render() {
    const { view, query, loading } = this.state

    return (
      <Box flexDirection="column">
        <Search
          value={query}
          onChange={this.handleQueryChange}
          loading={loading}
          active
        />
        <Scroll
          placeholder="Start typing or change query so we can find something!"
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
            />
          )}
        </Scroll>
        <Overview />
        <Footer />
      </Box>
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
