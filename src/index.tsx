import React from 'react'
import { Box, StdinContext } from 'ink'

import { IPackage, search } from './algolia'

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
  dependencies: IDependency[]
  page: number
}

class Emma extends React.Component<WithStdin<{}>, State> {
  state: State = {
    query: '',
    page: 0,
    hits: [],
    dependencies: [],
    view: 'SEARCH',
  }

  constructor(props: WithStdin<{}>) {
    super(props)

    this.handleQueryChange = this.handleQueryChange.bind(this)
    this.handleWillReachEnd = this.handleWillReachEnd.bind(this)
  }

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
    })

    const hits = await search(value)

    this.setState({ hits })
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
    const { query } = this.state

    return (
      <Box flexDirection="column">
        <Search value={query} onChange={this.handleQueryChange} active />
        <Scroll
          placeholder="Start typing or change query so we can find something!"
          values={this.state.hits}
          onWillReachEnd={this.handleWillReachEnd}
          active
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
