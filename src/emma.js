import path from 'path'
import fs from 'fs'
import { execSync } from 'child_process'
import exec from 'execa'
import algoliasearch from 'algoliasearch'
import { h, Component, Text } from 'ink'
import TextInput from 'ink-text-input'
import SelectInput from 'ink-select-input'

import { algolia } from './config'

// Helpers -------------------------------------------------------------------

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

const shouldUseYarn = fs.existsSync(path.resolve(__dirname, `yarn.lock`))
const canUseYarn = () => {
   try {
      execSync(`yarnpkg --version`, { stdio: `ignore` })
      return true
   } catch (e) {
      return false
   }
}

const STATE_NOT_REQUESTED = 0
const STATE_LOADING = 0
const STATE_LOADED = 1
const STATE_ERROR = 2

// Emma ----------------------------------------------------------------------

const Indicator = () => (
   <Text bold red>
     ›
   </Text>
)

const Package = ({ item }) => (
   <div>
      <Text>
         { item.humanDownloadsLast30Days }
      </Text>
      <Text>
         { item.name }
      </Text>
      <Text>
         { item.description }
      </Text>
   </div>
)

const Search = ({ value, onChange, onSubmit }) => (
   <div>
      { `Search packages: ` }
      <TextInput
         value={value}
         onChange={onChange}
         onSubmit={onSubmit}
         placeholder="yarn/npm"
      />
   </div>
)

const SelectedPackages = ({ selectedPackages }) => {
   const list = selectedPackages.map(pkg => (
      <Text key={pkg.name}>
         { pkg.name }
      </Text>
   ))

   return (
      <div>
         {list}
      </div>
   )
}

const SearchResults = ({ foundPackages, onToggle }) => (
   <div>
      <SelectInput
         items={foundPackages}
         indicatorComponent={Indicator}
         itemComponent={Package}
         onSelect={onToggle}
      />
   </div>
)

class Emma extends Component {
   constructor() {
      super()

      this.state = {
         query: '',
         foundPackages: [],
         selectedPackages: [],
         loading: false,
         error: null
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
         loading,
         error
      } = this.state

      return (
         <div>
            <SelectedPackages
               selectedPackages={selectedPackages}
            />
            <Search
               value={query}
               onChange={this.handleQueryChange}
               onSubmit={this.handleInstall}
            />
            <SearchResults
               foundPackages={foundPackages}
               onToggle={this.handleTogglePackage}
            />
         </div>
      )
   }

   async handleQueryChange(query) {
      this.setState({
         query,
         loading: true
      })

      try {
         const res = await this.fetchPackages(query)

         this.setState({
            foundPackages: res,
            loading: false
         })
      } catch (err) {
         this.setState({
            loading: false,
            error: err
         })
      }
   }

   async fetchPackages(query) {
      const res = await search(query)
      return res.hits
   }

   handleTogglePackage() {

   }

   handleInstall() {
      this.props.onExit()
   }
}

export default Emma