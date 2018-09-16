import execa from 'execa';
import dot from 'dot-prop';

import { h, Component, Text } from 'ink';
import TextInput from 'ink-text-input';
import SelectInput from 'ink-select-input';
import Spinner from 'ink-spinner';

import {
  maxCellSize,
  shouldUseYarn,
  notEmpty,
  isEmpty,
  hitsToCells
} from './utils';
import { getSearch } from './libs/algoliaSearch';
import { getSuggestions } from './libs/npm-suggestions';

// Emma ----------------------------------------------------------------------

// Progress

const PROGRESS_NOT_LOADED = 0;
const PROGRESS_LOADING = 1;
const PROGRESS_LOADED = 2;
const PROGRESS_ERROR = 3;

// Focused

const FOCUSED_SEARCH = 0;
const FOCUSED_SUGGESTIONS = 1;

// Info

const EmptyQuery = () => (
  <div>
    <Text grey>{'Try typing in to search the database.'}</Text>
  </div>
);

const NoSelectedPackages = () => (
  <div>
    <Text grey>{'Select packages to get suggestions.'}</Text>
  </div>
);

const NotFoundSearchInfo = () => (
  <div>
    <Text grey>
      {"We couldn't find any package that would match your input..."}
    </Text>
  </div>
);

const NotFoundSuggestionsInfo = () => (
  <div>
    <Text grey>
      {
        "We couldn't suggest any package that would match your picked packages..."
      }
    </Text>
  </div>
);

const ErrorInfo = ({ err }) => (
  <div>
    <Text red>
      {'Error: '}
      {err}
    </Text>
  </div>
);

const AlgoliaInfo = () => (
  <div>
    <Text>{'Search powered by'}</Text>
    <Text blue>{' Algolia'}</Text>
    <Text>{'.'}</Text>
  </div>
);

// Package

const PackageAttribute = ({ pkg, attr, ...props }) => (
  <Text {...props}>
    {`${dot.get(pkg, attr)} ${pkg._cell(attr)}`.slice(0, maxCellSize())}
  </Text>
);

const Package = pkg => (
  <Text>
    <PackageAttribute pkg={pkg} attr="humanDownloadsLast30Days" />
    <PackageAttribute pkg={pkg} attr="name" blueBright bold />
    <PackageAttribute pkg={pkg} attr="owner.name" cyan />
    <PackageAttribute pkg={pkg} attr="description" bold />
  </Text>
);

// Search

const Search = ({ value, onChange }) => (
  <div>
    <Text bold>{`Search packages 📦  : `}</Text>
    <TextInput value={value} onChange={onChange} placeholder="..." />
  </div>
);

// Overview

const SelectedPackage = ({ pkg }) => (
  <div>
    <Text magenta>{` ›`}</Text>
    <Text bold>{` ${pkg.name} `}</Text>
    <Text grey>{` ${pkg.version} `}</Text>
  </div>
);

const SelectedPackages = ({ selectedPackages }) => (
  <div>
    <div />
    <div>
      <Text bold>{'Picked:'}</Text>
      <Text grey>{' Press Space to install packages...'}</Text>
    </div>
    {selectedPackages.map(pkg => (
      <SelectedPackage key={pkg.name} pkg={pkg} />
    ))}
  </div>
);

// Restults

const SearchResults = ({ foundPackages, onToggle, loading, focused }) => {
  if (loading === PROGRESS_LOADING) {
    return (
      <div>
        <Text bold>
          <Spinner red />
          {' Fetching search'}
        </Text>
      </div>
    );
  }

  if (loading === PROGRESS_ERROR) {
    return <ErrorInfo err="Couldn't reach Algolia search!" />;
  }

  if (isEmpty(foundPackages)) {
    return <NotFoundSearchInfo />;
  }

  return (
    <span>
      <div>
        <Text bold>{'Search results:'}</Text>
        {!focused && <Text grey>{' Press Tab to select search results'}</Text>}
      </div>
      {focused ? (
        <SelectInput
          items={foundPackages}
          itemComponent={Package}
          onSelect={onToggle}
        />
      ) : (
        foundPackages.map(pkg => <div> {Package(pkg)}</div>)
      )}
    </span>
  );
};

const SuggestionsResults = ({ foundPackages, onToggle, loading, focused }) => {
  if (loading === PROGRESS_LOADING) {
    return (
      <div>
        <Text bold>
          <Spinner red />
          {' Fetching suggestions'}
        </Text>
      </div>
    );
  }

  if (loading === PROGRESS_ERROR) {
    return <ErrorInfo err="Couldn't get suggestions!" />;
  }

  if (isEmpty(foundPackages)) {
    return <NotFoundSuggestionsInfo />;
  }

  return (
    <span>
      <div>
        <Text bold>{'Suggestions results:'}</Text>
        {!focused && <Text grey>{' Press Tab to select suggestions'}</Text>}
      </div>
      {focused ? (
        <SelectInput
          items={foundPackages}
          itemComponent={Package}
          onSelect={onToggle}
        />
      ) : (
        foundPackages.map(pkg => <div> {Package(pkg)}</div>)
      )}
    </span>
  );
};

// Emma

class Emma extends Component {
  constructor(props) {
    super(props);

    this.state = {
      query: '',
      foundSearchPackages: [],
      foundSuggestionsPackages: [],
      selectedPackages: [],
      loadingSearch: PROGRESS_NOT_LOADED,
      loadingSuggestions: PROGRESS_NOT_LOADED,
      focused: FOCUSED_SEARCH
    };

    this.handleKeyPress = this.handleKeyPress.bind(this);
    this.handleQueryChange = this.handleQueryChange.bind(this);
    this.handleInstall = this.handleInstall.bind(this);
    this.handleTogglePackage = this.handleTogglePackage.bind(this);
    this.fetchSearch = this.fetchSearch.bind(this);
    this.fetchSuggestions = this.fetchSuggestions.bind(this);
  }

  componentDidMount() {
    process.stdin.on('keypress', this.handleKeyPress);
  }

  componentWillUnmount() {
    process.stdin.removeListener('keypress', this.handleKeyPress);
  }

  render() {
    const {
      query,
      foundSearchPackages,
      foundSuggestionsPackages,
      selectedPackages,
      loadingSearch,
      loadingSuggestions,
      focused
    } = this.state;

    return (
      <div>
        <Search
          value={query}
          onChange={this.handleQueryChange}
          loading={loadingSearch}
        />
        {isEmpty(query) ? (
          <EmptyQuery />
        ) : (
          <SearchResults
            foundPackages={foundSearchPackages}
            onToggle={this.handleTogglePackage}
            loading={loadingSearch}
            focused={focused === FOCUSED_SEARCH}
          />
        )}
        {isEmpty(selectedPackages) ? (
          <NoSelectedPackages />
        ) : (
          <SuggestionsResults
            foundPackages={foundSuggestionsPackages}
            onToggle={this.handleTogglePackage}
            loading={loadingSuggestions}
            focused={focused === FOCUSED_SUGGESTIONS}
          />
        )}
        <AlgoliaInfo />
        {notEmpty(selectedPackages) && (
          <SelectedPackages selectedPackages={selectedPackages} />
        )}
      </div>
    );
  }

  async handleKeyPress(_, key) {
    const {
      query,
      foundSearchPackages,
      foundSuggestionsPackages,
      selectedPackages,
      focused
    } = this.state;

    switch (key.name) {
      case 'tab':
        if (focused === FOCUSED_SEARCH && notEmpty(foundSuggestionsPackages)) {
          this.setState({
            focused: FOCUSED_SUGGESTIONS
          });
        } else if (
          focused === FOCUSED_SUGGESTIONS &&
          notEmpty(foundSearchPackages) &&
          notEmpty(query)
        ) {
          this.setState({
            focused: FOCUSED_SEARCH
          });
        }
        break;

      case 'space':
        this.handleInstall();
        break;

      case 'backspace':
        if (isEmpty(query)) {
          await this.setState({
            selectedPackages: selectedPackages.slice(0, -1)
          });

          this.fetchSuggestions();
        }

      default:
        break;
    }
  }

  async handleQueryChange(query) {
    //check if tab or space have been pressed
    if (/\s/g.test(query)) {
      return;
    }

    if (isEmpty(query)) {
      this.setState({
        query,
        focused: FOCUSED_SUGGESTIONS
      });
      return;
    }

    await this.setState({
      query
    });

    this.fetchSearch();
  }

  async handleTogglePackage(pkg) {
    const { selectedPackages: selectedPackagesOld } = this.state;

    const exists = selectedPackagesOld.some(
      ({ objectID }) => objectID === pkg.objectID
    );

    if (exists) {
      return;
    }

    await this.setState({
      query: '',
      selectedPackages: [...selectedPackagesOld, pkg]
    });

    this.fetchSuggestions();
  }

  async fetchSearch() {
    const { query } = this.state;

    this.setState({
      focused: FOCUSED_SEARCH,
      loadingSearch: PROGRESS_LOADING
    });

    try {
      const hits = await getSearch(query);
      const cells = hitsToCells(hits);

      if (this.state.query === query) {
        this.setState({
          foundSearchPackages: cells,
          loadingSearch: PROGRESS_LOADED
        });
      }
    } catch (err) {
      this.setState({
        loadingSearch: PROGRESS_ERROR
      });
    }
  }

  async fetchSuggestions() {
    const { selectedPackages } = this.state;
    const { dev: isDev } = this.props;

    this.setState({
      focused: FOCUSED_SUGGESTIONS,
      loadingSuggestions: PROGRESS_LOADING
    });

    try {
      const hits = await getSuggestions(
        selectedPackages.map(selectedPackage => selectedPackage.name),
        isDev
      );
      const cells = hitsToCells(hits);

      this.setState({
        foundSuggestionsPackages: cells,
        loadingSuggestions: PROGRESS_LOADED
      });
    } catch (err) {
      this.setState({
        loadingSuggestions: PROGRESS_ERROR
      });
    }
  }

  async handleInstall() {
    const { selectedPackages } = this.state;

    if (isEmpty(selectedPackages)) {
      this.props.onExit();
    }

    // ENV
    const isDev = this.props.dev;
    const yarn = await shouldUseYarn();
    const env = yarn ? 'yarnpkg' : 'npm';
    const arg = yarn ? ['add'] : ['install', '--save'];
    const devArg = yarn ? '-D' : '--save-dev';

    // Packages
    const packages = selectedPackages.map(pkg => pkg.name);
    const args = [...arg, ...packages, ...(isDev ? [devArg] : [])];

    // Install the queries

    try {
      await execa.sync(env, args, { stdio: `inherit` });
    } catch (err) {
      throw err;
    }

    this.props.onExit();
  }
}

export default Emma;
