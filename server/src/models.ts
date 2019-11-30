export interface EmmaStarter {
  /* Meta */
  repo: string
  owner: string
  /* Info */
  signature: string
  path: string
  ref: string
  /* Search */
  name: string
  description?: string
  dependencies: string[]
}
