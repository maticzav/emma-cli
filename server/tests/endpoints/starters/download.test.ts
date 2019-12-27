import supertest from 'supertest'
import express from 'express'

import { mockStarter } from '../../__mock__/data'
import { getMockSources } from '../../__mock__/sources'

import { downloadStarter } from '../../../src/endpoints/starters/download'

describe('starters download endpoint:', () => {
  let app : express.Application
  let request : supertest.SuperTest<supertest.Test>
  let findOne : jest.Mock

  beforeEach(() => {
    const sources = getMockSources()
    findOne = jest.fn()

    Object.defineProperty(sources.prisma.photon, 'starters', {
      get: () => ({
        findOne
      })
    });

    app = express()
    app.get('/starters/:signature', downloadStarter(sources))

    request = supertest(app)
  })

  test('returns 404 on unknown', done => {
    findOne.mockResolvedValueOnce(null)

    request.get('/starters/unknown').then(res => {
      expect(findOne).toBeCalledTimes(1)
      expect(findOne).toBeCalledWith({
        where: { signature: 'unknown' }
      })
      expect(res.status).toBe(404)
      done()
    })
  })

  test('returns template information', done => {
    findOne.mockResolvedValueOnce(mockStarter)

    request.get(`/starters/${mockStarter.signature}`).then(res => {
      expect(findOne).toBeCalledTimes(1)
      expect(findOne).toBeCalledWith({
        where: { signature: mockStarter.signature }
      })
      expect(res.status).toBe(200)
      done()
    })
  })
})
