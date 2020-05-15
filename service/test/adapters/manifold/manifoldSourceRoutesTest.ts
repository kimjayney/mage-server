import { expect, assert } from 'chai'
import { mock, reset, instance, when } from 'ts-mockito'
import request from 'supertest'
import express, { Request, Response, NextFunction } from 'express'
import { SourceRepository, RegisteredFeedTypeRepository, ManifoldAdapterRegistry } from '../../../lib/application/manifold/app.manifold.use_cases'
import { SourceDescriptorModel, ManifoldModels, SourceDescriptorSchema, SourceDescriptorDocument } from '../../../lib/adapters/manifold/adapters.manifold.db.mongoose'
import mongoose from 'mongoose'
import { createRouter, Injection as ManifoldInjection } from '../../../lib/adapters/manifold/adapters.manifold.controllers.web'
import { ManifoldAdapter, SourceConnection } from '../../../lib/entities/manifold/entities.manifold'
import * as OgcApiFeatures from '../../../lib/entities/ogcapi-features/entities.ogcapi-features'
import log = require('../../../lib/logger')

describe('manifold source routes', function() {

  const SourceDescriptorModel: SourceDescriptorModel = mongoose.model(ManifoldModels.SourceDescriptor, SourceDescriptorSchema)
  const adapterRepoMock = mock<RegisteredFeedTypeRepository>()
  const adapterRepo = instance(adapterRepoMock)
  const sourceRepoMock = mock<SourceRepository>()
  const sourceRepo = instance(sourceRepoMock)
  const manifoldServiceMock = mock<ManifoldAdapterRegistry>()
  const manifoldService = instance(manifoldServiceMock)
  const manifoldAdapterMock = mock<ManifoldAdapter>()
  const manifoldAdapter = instance(manifoldAdapterMock)
  const connectionMock = mock<SourceConnection>()
  const connection = instance(connectionMock)
  // TODO: workaround for https://github.com/NagRock/ts-mockito/issues/163
  ;(manifoldAdapterMock as any).__tsmockitoMocker.excludedPropertyNames.push('then')
  ;(connectionMock as any).__tsmockitoMocker.excludedPropertyNames.push('then')
  const app = express()
  app.use(express.json())
  const injection: ManifoldInjection = {
    adapterRepo,
    sourceRepo,
  }
  const manifold = createRouter(injection)
  app.use('/manifold', manifold)
  app.use((err: any, req: Request, res: Response, next: NextFunction): any => {
    if (err) {
      log.error(err)
    }
    next(err)
  })

  beforeEach(function() {
    reset(adapterRepoMock)
    reset(sourceRepoMock)
    reset(manifoldServiceMock)
    reset(manifoldAdapterMock)
    reset(connectionMock)
  })

  describe('path /{sourceId}/collections', function() {

    it('is tested', function() {
      assert.fail('TODO')
    })
  })

  describe('path /{sourceId}/collections/{collectionId}', function() {

    describe('GET', function() {

      it('returns the collection descriptor', async function() {

        const colId = 'col1'
        const colDesc: OgcApiFeatures.CollectionDescriptorJson = {
          id: colId,
          title: 'Collection 1',
          description: 'A test collection',
          links: [],
          crs: [ OgcApiFeatures.CrsWgs84 ],
          extent: {
            spatial: {
              crs: OgcApiFeatures.CrsWgs84,
              bbox: [[ 1, 1, 2, 2 ]]
            }
          }
        }

        const source: SourceDescriptorDocument = new SourceDescriptorModel({
          title: 'Source 1',
          adapter: mongoose.Types.ObjectId().toHexString(),
          isReadable: true,
          isWritable: false,
          url: 'https://source1.test.net'
        })
        const collectionDescriptors = new Map([
          [ colId, colDesc ]
        ])
        when(sourceRepoMock.findById(source.id as string)).thenResolve(source)
        when(manifoldServiceMock.getAdapterForId(source.adapter as string)).thenResolve(manifoldAdapter)
        when(manifoldAdapterMock.connectTo(source)).thenResolve(connection)
        when(connectionMock.getCollections()).thenResolve(collectionDescriptors)

        const res = await request(app).get(`/manifold/sources/${source.id}/collections/${colId}`)

        expect(res.status).to.equal(200)
        expect(res.type).to.match(/^application\/json/)
        expect(res.body).to.deep.equal(colDesc)
      })
    })
  })

  describe('path /{sourceId}/collections/{collectionId}/items', function() {

    describe('GET', function() {

      it('returns all the features', async function() {

        const sourceEntity = new SourceDescriptorModel({
          adapter: new mongoose.Types.ObjectId().toHexString(),
          title: 'Source A',
          summary: 'All the As',
          url: 'https://a.test/data'
        })
        const page: OgcApiFeatures.CollectionPage = {
          collectionId: 'a1',
          items: {
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                geometry: {
                  type: 'Point',
                  coordinates: [ 100, 30 ]
                },
                properties: {
                  lerp: 'ner'
                }
              },
              {
                type: 'Feature',
                geometry: {
                  type: 'Point',
                  coordinates: [ 101, 29 ]
                },
                properties: {
                  squee: 'bouf'
                }
              },
              {
                type: 'Feature',
                geometry: {
                  type: 'Point',
                  coordinates: [ 102, 27 ]
                },
                properties: {
                  noich: 'sna'
                }
              }
            ]
          }
        }
        when(sourceRepoMock.findById(sourceEntity.id)).thenResolve(sourceEntity)
        when(manifoldServiceMock.getAdapterForId(sourceEntity.adapter as string)).thenResolve(manifoldAdapter)
        when(manifoldAdapterMock.connectTo(sourceEntity)).thenResolve(connection)
        when(connectionMock.getItemsInCollection(page.collectionId)).thenResolve(page)

        const res = await request(app).get(`/manifold/sources/${sourceEntity.id}/collections/${page.collectionId}/items`)

        expect(res.status).to.equal(200)
        expect(res.type).to.match(/^application\/geo\+json/)
        expect(res.body).to.deep.equal(page.items)
      })
    })
  })

  describe('path /{sourceId}/collections/{collectoinId}/items/{featureId}', function() {

  })
})
