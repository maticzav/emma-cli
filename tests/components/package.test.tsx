import React from 'react'
import { render } from 'ink-testing-library'

import { IPackage } from '../../src/algolia'
import Package from '../../src/components/Package'

const pkg: IPackage = {
  objectID: 'test-pkg',
  name: 'test-pkg',
  description: 'test-description',
  humanDownloadsLast30Days: '30m',
  version: '2.0.0',
  owner: {
    avatar: 'avatar',
    link: 'link',
    name: 'owner',
    email: 'email',
  },
  repository: {
    url: 'https://github.com/pkg/pkg',
  },
}

describe('package', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  test('renders package', async () => {
    const fn = jest.fn()
    const { frames, unmount } = render(
      <Package pkg={pkg} onClick={fn} type={undefined} active={false} />,
    )

    unmount()
    expect(frames).toMatchSnapshot()
  })

  test('renders dependency', async () => {
    const fn = jest.fn()
    const { frames, unmount } = render(
      <Package pkg={pkg} onClick={fn} type={'dependency'} active={false} />,
    )

    unmount()
    expect(frames).toMatchSnapshot()
  })

  test('renders devDependency', async () => {
    const fn = jest.fn()
    const { frames, unmount } = render(
      <Package pkg={pkg} onClick={fn} type={'devDependency'} active={false} />,
    )

    unmount()
    expect(frames).toMatchSnapshot()
  })

  test('renders active package', async () => {
    const fn = jest.fn()
    const { frames, unmount } = render(
      <Package pkg={pkg} onClick={fn} type={undefined} active={true} />,
    )

    unmount()
    expect(frames).toMatchSnapshot()
  })
  test('renders active depedency', async () => {
    const fn = jest.fn()
    const { frames, unmount } = render(
      <Package pkg={pkg} onClick={fn} type={'dependency'} active={true} />,
    )

    unmount()
    expect(frames).toMatchSnapshot()
  })
  test('renders active devDependency', async () => {
    const fn = jest.fn()
    const { frames, unmount } = render(
      <Package pkg={pkg} onClick={fn} type={'devDependency'} active={true} />,
    )

    unmount()
    expect(frames).toMatchSnapshot()
  })

  test('shows details', async () => {
    const fn = jest.fn()
    const { frames, stdin, unmount } = render(
      <Package pkg={pkg} onClick={fn} type={'devDependency'} active={true} />,
    )

    stdin.write('\u001B[C')

    unmount()
    expect(frames).toMatchSnapshot()
  })

  test('hides details', async () => {
    const fn = jest.fn()
    const { frames, stdin, unmount } = render(
      <Package pkg={pkg} onClick={fn} type={'devDependency'} active={true} />,
    )

    stdin.write('\u001B[C')
    stdin.write('\u001B[D')

    unmount()
    expect(frames).toMatchSnapshot()
  })

  test('hides details', async () => {
    const mockFn = jest.fn()

    jest.mock('opn', () => ({
      __esModule: true,
      default: mockFn,
    }))

    const fn = jest.fn()
    const { frames, stdin, unmount } = render(
      <Package pkg={pkg} onClick={fn} type={'devDependency'} active={true} />,
    )

    stdin.write('\u001B[C')
    stdin.write('\u001B[C')

    unmount()
    expect(frames).toMatchSnapshot()
    expect(mockFn).toBeCalled()
  })
})
