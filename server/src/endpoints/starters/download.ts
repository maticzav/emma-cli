import { RequestHandler } from 'express'

import { Sources } from '../../sources'

/**
 * Handles starter loading from the server.
 *
 * @param photon
 */
export const downloadStarter = ({ prisma }: Sources): RequestHandler => async (
  req,
  res,
) => {
  const starter = await prisma.photon.starters.findOne({
    where: { signature: req.params.signature },
  })

  /* Process response */
  if (!starter) {
    res.sendStatus(404)
  } else {
    res.setHeader('Content-Type', 'application/json')
    res.send(
      JSON.stringify({
        ref: starter.ref,
        path: starter.path,
        owner: starter.owner,
        repo: starter.repo,
      }),
    )
  }
}
