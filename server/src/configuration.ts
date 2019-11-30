import * as e from 'fp-ts/lib/Either'
import * as t from 'io-ts'

const StarterConfiguration = t.intersection([
  t.type({
    name: t.string,
    path: t.string,
  }),
  t.partial({
    description: t.string,
  }),
])

export interface StarterConfiguration
  extends t.TypeOf<typeof StarterConfiguration> {}

const Configuration = t.type({
  starters: t.array(StarterConfiguration),
})

export interface EmmaConfiguration extends t.TypeOf<typeof Configuration> {}

/**
 * Decodes configurations. Returns error message as a first parameter,
 * or null meaning that configuration is valid.
 *
 * @param config
 */
export function decodeConfiguration(
  config: any,
): e.Either<t.Errors, EmmaConfiguration> {
  return Configuration.decode(config)
}
