<p align="center"><img src="media/emma.png" width="800" /></p>

# Emma 📦

[![CircleCI](https://circleci.com/gh/maticzav/emma-cli.svg?style=shield)](https://circleci.com/gh/maticzav/emma-cli)
[![npm version](https://badge.fury.io/js/emma-cli.svg)](https://badge.fury.io/js/emma-cli)
![npm](https://img.shields.io/npm/dt/emma-cli.svg)
[![Backers on Open Collective](https://opencollective.com/emma-cli/backers/badge.svg)](#backers) [![Sponsors on Open Collective](https://opencollective.com/emma-cli/sponsors/badge.svg)](#sponsors)

> Install the package you are looking for.

Powered by [Algolia search API](https://www.algolia.com/), [npm-suggestions](https://github.com/JureSotosek/npm-suggestions) and the [Yarn](http://yarnpkg.com/) package manager.

<p align="center"><img src="media/newExample.gif" width="655" /></p>

## Overview

Emma is a command line assistant which helps you search and install packages more efficiently. Algolia's responsive and interactive features gives you the information you need to find the right package, while npm-suggestions make it quicker then ever to find the packages you need.

## Features

- **Extremely fast:** Search all the packages from NPM and Yarn using your terminal.
- **Suggestions:** Get packages selected based on the ones you have already selected.
- **Build the stack:** Search for multiple packages and install them with one keystroke.
- **Automatic tool detection:** Detects whether it should use Yarn or NPM, out of the box.

## Install

```bash
npm install -g emma-cli
```

Use Yarn or NPM to install.

## Example

```
❯ emma-cli ~ emma
Search packages 📦  : grap
Search results:
  11   grap           loopingrage     Utility that GReps for gAPs and out of sequence line in log
  8.4m sass-graph     xzyfer          Parse sass files and extract a graph of imports
  3.7m @types/graphql DefinitelyTyped TypeScript definitions for graphql
❯ 2.9m graphql        graphql         A Query Language and Runtime which can target any service.
  1.8m graphlib       dagrejs         A directed and undirected multi-graph library
Suggestions results: Press Tab to select suggestions
  10.2m react-dom  facebook  React package for working with the DOM.
  14.6m prop-types facebook  Runtime type checking for React props and similar objects.
  7m    classnames JedWatson A simple utility for conditionally joining classNames toget
  65.3m lodash     lodash    Lodash modular utilities.
  7.2m  redux      reactjs   Predictable state container for JavaScript apps
Search powered by Algolia.

Picked: Press Space to install packages...
› react  16.5.1
```

## API

```
Usage
$ emma

Options
--dev -D Add to dev dependencies.
--limit -L Number of packages shown, defaults to 5.

Example
$ emma -D

Run without package-name to enter live search.
Use keyboard to search through package library.
Use up/down to select packages.
Use enter to select a package.
Use tab to move between search/suggestions.
When query is empty use backspace to remove packages.
Click space to trigger the install.
```

## Contributors

This project exists thanks to all the people who contribute.
<a href="graphs/contributors"><img src="https://opencollective.com/emma-cli/contributors.svg?width=890&button=false" /></a>

## Backers

Thank you to all our backers! 🙏 [[Become a backer](https://opencollective.com/emma-cli#backer)]

<a href="https://opencollective.com/emma-cli#backers" target="_blank"><img src="https://opencollective.com/emma-cli/backers.svg?width=890"></a>

## Sponsors

Support this project by becoming a sponsor. Your logo will show up here with a link to your website. [[Become a sponsor](https://opencollective.com/emma-cli#sponsor)]

<a href="https://opencollective.com/emma-cli/sponsor/0/website" target="_blank"><img src="https://opencollective.com/emma-cli/sponsor/0/avatar.svg"></a>
<a href="https://opencollective.com/emma-cli/sponsor/1/website" target="_blank"><img src="https://opencollective.com/emma-cli/sponsor/1/avatar.svg"></a>
<a href="https://opencollective.com/emma-cli/sponsor/2/website" target="_blank"><img src="https://opencollective.com/emma-cli/sponsor/2/avatar.svg"></a>
<a href="https://opencollective.com/emma-cli/sponsor/3/website" target="_blank"><img src="https://opencollective.com/emma-cli/sponsor/3/avatar.svg"></a>
<a href="https://opencollective.com/emma-cli/sponsor/4/website" target="_blank"><img src="https://opencollective.com/emma-cli/sponsor/4/avatar.svg"></a>
<a href="https://opencollective.com/emma-cli/sponsor/5/website" target="_blank"><img src="https://opencollective.com/emma-cli/sponsor/5/avatar.svg"></a>
<a href="https://opencollective.com/emma-cli/sponsor/6/website" target="_blank"><img src="https://opencollective.com/emma-cli/sponsor/6/avatar.svg"></a>
<a href="https://opencollective.com/emma-cli/sponsor/7/website" target="_blank"><img src="https://opencollective.com/emma-cli/sponsor/7/avatar.svg"></a>
<a href="https://opencollective.com/emma-cli/sponsor/8/website" target="_blank"><img src="https://opencollective.com/emma-cli/sponsor/8/avatar.svg"></a>
<a href="https://opencollective.com/emma-cli/sponsor/9/website" target="_blank"><img src="https://opencollective.com/emma-cli/sponsor/9/avatar.svg"></a>

## Related

- [ibrew](https://github.com/mischah/ibrew) - Interactive CLI to find and install homebrew packages.

## License

MIT © [Matic Zavadlal](https://github.com/maticzav)

<p align="center"><a href="https://www.algolia.com"><img src="media/algolia.svg" width="400" /></a></p>
