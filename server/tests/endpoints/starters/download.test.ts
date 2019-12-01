import { Starter } from '@prisma/photon'
import supertest from 'supertest'

import { mockStarter } from '../../__mock__/data'
import { getMockSources } from '../../__mock__/sources'

import { downloadStarter } from '../../../src/endpoints/starters/download'

describe('starters download endpoint:', () => {
  const sources = getMockSources()
  const request = supertest(downloadStarter(sources))

  let mockTemplate: Starter

  beforeAll(async () => {
    mockTemplate = await sources.prisma.photon.starters.create({
      data: { ...mockStarter, dependencies: { set: mockStarter.dependencies } },
    })
  })

  test('returns 404 on unknown', done => {
    request.get('/foo').then(res => {
      expect(res.status).toBe(404)
      done()
    })
  })

  test('returns template information', done => {
    request.get(`/${mockTemplate.signature}`).then(res => {
      expect(res.status).toBe(200)
      done()
    })
  })
})
