import { EmmaStarter } from '../../src/models'

export const mockStarter: EmmaStarter = {
  /* Meta */
  repo: 'repo',
  owner: 'owner',
  /* Info */
  signature: 'hashhashhash',
  path: '/path/to/starter',
  ref: 'ref',
  /* Search */
  name: 'starter',
  description: 'description',
  dependencies: ['express', 'graphql-shield', 'label-sync'],
}
