import { execSync } from 'child_process'
import execa from 'execa'
import algoliasearch from 'algoliasearch'
import dot from 'dot-prop'
import { h, Component, Text } from 'ink'
import terminal from 'term-size'
import TextInput from 'ink-text-input'
import SelectInput from 'ink-select-input'
import Spinner from 'ink-spinner'

import { algolia } from './config'

// Helpers -------------------------------------------------------------------

// Terminal

const { columns } = terminal()
const maxCellSize = columns / 4

// Algolia

const client = algoliasearch(algolia.appId, algolia.apiKey).initIndex(algolia.indexName)

const search = query => new Promise((resolve, reject) => {
   client.search(query, (err, res) => {
      if (err) {
         reject(err)
      } else {
         resolve(res)
      }
   })
})

// Yarn

const shouldUseYarn = () => {
   try {
      execSync(`yarnpkg --version`, { stdio: `ignore` })
      return true
   } catch (e) {
      return false
   }
}

// Additional

const notEmpty = x => x.length !== 0
const isEmpty = x => x.length === 0
const getCellPadding = (pkgs, pkg) => attr => {
   const cells = pkgs.map(_pkg => dot.get(_pkg, attr))

   const cellWidth = Math.max(...cells.map(cell => cell ? cell.length : 0))

   const cellValueWidth = dot.get(pkg, attr) === null ? 0 : dot.get(pkg, attr).length
   const width = cellWidth - cellValueWidth

   return ` `.repeat(width)
}

// Progress

const PROGRESS_NOT_LOADED = 0
const PROGRESS_LOADING = 1
const PROGRESS_LOADED = 2
const PROGRESS_ERROR = 3

// Emma ----------------------------------------------------------------------

// Package

const PackageAttribute = ({ pkg, attr, ...props }) => (
   <Text {...props}>
      {`${dot.get(pkg, attr)} ${pkg._cell(attr)}`.slice(0, maxCellSize)}
   </Text>
)

const Package = pkg => (
   <Text>
      <PackageAttribute pkg={pkg} attr="humanDownloadsLast30Days"/>
      <PackageAttribute pkg={pkg} attr="name" blueBright bold/>
      <PackageAttribute pkg={pkg} attr="owner.name" cyan/>
      <PackageAttribute pkg={pkg} attr="description" bold/>
   </Text>
)

// Search

const Search = ({ value, onChange, onSubmit }) => (
   <div>
      <Text bold white>
         {`Search packages 📦  : `}
      </Text>
      <TextInput
         value={value}
         onChange={onChange}
         onSubmit={onSubmit}
         placeholder="..."
      />
   </div>
)

// Overview

const SelectedPackage = ({ pkg }) => (
   <div>
      <Text magenta>
         {` ›`}
      </Text>
      <Text bold white>
         {` ${pkg.name} `}
      </Text>
      <Text grey>
         {` ${pkg.version} `}
      </Text>
   </div>
)

const SelectedPackages = ({ selectedPackages }) => (
   <div>
      <div/>
      <div>
         <Text bold white>Picked: </Text>
      </div>
      {selectedPackages.map(pkg => (
         <SelectedPackage key={pkg.name} pkg={pkg}/>
      ))}
   </div>
)

// Restults

const SearchResults = ({ foundPackages, onToggle, loading }) => {
   return (
      <span>
         <SelectInput
            items={foundPackages}
            itemComponent={Package}
            onSelect={onToggle}
         />
         {loading === PROGRESS_LOADING && (
            <div>
               <Text bold>
                  <Spinner red/> Fetching
               </Text>
            </div>
         )}
      </span>
   )
}

// Info

const SearchInfo = () => (
   <div>
      <Text grey>Try typing in to search the database.</Text>
   </div>
)

const InstallInfo = () => (
   <div>
      <Text grey>Press enter to install all of your packages.</Text>
   </div>
)

const ErrorInfo = () => (
   <div>
      <Text red>Check your internet connection.</Text>
   </div>
)

// Emma

class Emma extends Component {
   constructor(props) {
      super(props)

      this.state = {
         query: '',
         foundPackages: [],
         selectedPackages: [],
         loading: PROGRESS_NOT_LOADED
      }

      this.handleQueryChange = this.handleQueryChange.bind(this)
      this.handleInstall = this.handleInstall.bind(this)
      this.handleTogglePackage = this.handleTogglePackage.bind(this)
   }

   render() {
      const {
         query,
         foundPackages,
         selectedPackages,
         loading
      } = this.state

      return (
         <div>
            <Search
               value={query}
               onChange={this.handleQueryChange}
               onSubmit={this.handleInstall}
               loading={loading}
            />
            {loading === PROGRESS_NOT_LOADED && <SearchInfo/>}
            {isEmpty(query) && <InstallInfo/>}
            {loading === PROGRESS_ERROR && <ErrorInfo/>}
            {notEmpty(query) && (
               <SearchResults
                  foundPackages={foundPackages}
                  onToggle={this.handleTogglePackage}
                  loading={loading}
               />
            )}
            {notEmpty(selectedPackages) && (
               <SelectedPackages
                  selectedPackages={selectedPackages}
               />
            )}
         </div>
      )
   }

   async handleQueryChange(query) {
      this.setState({
         query,
         loading: PROGRESS_LOADING
      })

      try {
         const res = await this.fetchPackages(query)

         if (this.state.query === query) {
            this.setState({
               foundPackages: res,
               loading: PROGRESS_LOADED
            })
         }
      } catch (err) {
         this.setState({
            loading: PROGRESS_ERROR
         })
      }
   }

   async fetchPackages(query) {
      const res = await search({
         query,
         attributesToRetrieve: [
            'name',
            'version',
            'description',
            'owner',
            'humanDownloadsLast30Days'
         ],
         offset: 0,
         length: 5
      })

      const { hits } = res
      const packages = hits.map(hit => ({
         ...hit,
         _cell: getCellPadding(hits, hit)
      }))

      return packages
   }

   handleTogglePackage(pkg) {
      const { selectedPackages, loading } = this.state

      if (loading !== PROGRESS_LOADED) {
         return
      }

      const exists = selectedPackages.some(({ objectID }) => objectID === pkg.objectID)

      if (exists) {
         this.setState({
            query: '',
            selectedPackages: selectedPackages.filter(({ objectID }) => objectID !== pkg.objectID)
         })
      } else {
         this.setState({
            query: '',
            selectedPackages: [...selectedPackages, pkg]
         })
      }
   }

   async handleInstall() {
      const { query, selectedPackages } = this.state

      if (notEmpty(query)) {
         return
      }

      if (isEmpty(selectedPackages)) {
         this.props.onExit()
      }

      // ENV
      const isDev = this.props.dev
      const yarn = shouldUseYarn()
      const env = yarn ? 'yarnpkg' : 'npm'
      const arg = yarn ? 'add' : 'install --save'
      const devArg = yarn ? '-D' : '--save-dev'

      // Packages
      const packages = selectedPackages.map(pkg => pkg.name)
      const args = [
         arg,
         ...packages,
         ...(isDev ? [devArg] : [])
      ]

      // Install the queries

      try {
         await execa.sync(env, args, { stdio: `inherit` })
      } catch (err) {
         throw err
      }

      this.props.onExit()
   }
}

export default Emma
