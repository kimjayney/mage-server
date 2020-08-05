
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    // interface Request {
    // }
  }
}

import express from 'express'
import { ListFeedServiceTypes, ListServiceTopics, CreateFeedService, ListFeedServices, PreviewTopics, PreviewTopicsRequest, CreateFeed, CreateFeedRequest, ListServiceTopicsRequest, ListAllFeeds, FetchFeedContent, PreviewFeedRequest, PreviewFeed } from '../../app.api/feeds/app.api.feeds'
import { ErrPermissionDenied, MageError, PermissionDeniedError, ErrInvalidInput, invalidInput, ErrEntityNotFound } from '../../app.api/app.api.errors'
import { WebAppRequestFactory } from '../adapters.controllers.web'

export interface FeedsAppLayer {
  listServiceTypes: ListFeedServiceTypes
  createService: CreateFeedService
  listServices: ListFeedServices
  previewTopics: PreviewTopics
  listTopics: ListServiceTopics
  previewFeed: PreviewFeed
  createFeed: CreateFeed
  listAllFeeds: ListAllFeeds
}

export function FeedsRoutes(appLayer: FeedsAppLayer, createAppRequest: WebAppRequestFactory): express.Router {
  const routes = express.Router()
  routes.use(express.json())

  function errorHandler(err: PermissionDeniedError | any, req: express.Request, res: express.Response, next: express.NextFunction): any {
    if (!(err instanceof MageError)) {
      return next(err)
    }
    switch (err.code) {
      case ErrPermissionDenied:
        return res.status(403).json(`permission denied: ${(err as PermissionDeniedError).data.permission}`)
      case ErrEntityNotFound:
        return res.status(404).json(err.message)
      case ErrInvalidInput:
        return res.status(400).json(err.message)
    }
    next(err)
  }

  routes.route('/service_types')
    .get(async (req, res, next): Promise<any> => {
      const appReq = createAppRequest(req)
      const appRes = await appLayer.listServiceTypes(appReq)
      if (appRes.success) {
        return res.json(appRes.success)
      }
      next(appRes.error)
    })

  routes.route('/service_types/:serviceTypeId/topic_preview')
    .post(async (req, res, next): Promise<any> => {
      const body = req.body
      const appReq: PreviewTopicsRequest = createAppRequest(req, {
        serviceType: req.params.serviceTypeId,
        serviceConfig: body.serviceConfig
      })
      const appRes = await appLayer.previewTopics(appReq)
      if (appRes.success) {
        return res.json(appRes.success)
      }
      return next(appRes.error)
    })

  routes.route('/services')
    .post(async (req, res, next): Promise<any> => {
      const body = req.body
      const params = {
        serviceType: body.serviceType,
        config: body.config || null,
        title: body.title,
        summary: body.summary
      }
      if (!params.serviceType) {
        return next(invalidInput('invalid request', [ 'missing', 'serviceType' ]))
      }
      if (!params.title) {
        return next(invalidInput('invalid request', [ 'missing', 'title' ]))
      }
      const appReq = createAppRequest(req, params)
      const appRes = await appLayer.createService(appReq)
      if (appRes.success) {
        return res.status(201).json(appRes.success)
      }
      if (appRes.error?.code === ErrEntityNotFound) {
        return res.status(400).json('service type not found')
      }
      next(appRes.error)
    })
    .get(async (req, res, next): Promise<any> => {
      const appReq = createAppRequest(req)
      const appRes = await appLayer.listServices(appReq)
      if (appRes.success) {
        return res.json(appRes.success)
      }
      next(appRes.error)
    })

  routes.route('/services/:serviceId/topics')
    .get(async (req, res, next) => {
      const appReq: ListServiceTopicsRequest = createAppRequest(req, {
        service: req.params.serviceId
      })
      const appRes = await appLayer.listTopics(appReq)
      if (appRes.success) {
        return res.json(appRes.success)
      }
      next(appRes.error)
    })


  const feedCreateParamsFromRequest = (req: express.Request): Pick<CreateFeedRequest, 'feed'> => {
    const body = req.body
    return {
      feed: {
        service: req.params.serviceId,
        topic: req.params.topicId,
        title: body.title,
        summary: body.summary,
        constantParams: body.constantParams,
        variableParamsSchema: body.variableParamsSchema,
        itemsHaveIdentity: body.itemsHaveIdentity,
        itemsHaveSpatialDimension: body.itemsHaveSpatialDimension,
        itemTemporalProperty: body.itemTemporalProperty,
        itemPrimaryProperty: body.itemPrimaryProperty,
        itemSecondaryProperty: body.itemSecondaryProperty,
        updateFrequencySeconds: body.updateFrequencySeconds
      }
    }
  }

  routes.route('/services/:serviceId/topics/:topicId/feed_preview')
    .post(async (req, res, next) => {
      const params = feedCreateParamsFromRequest(req) as Omit<PreviewFeedRequest, 'context'>
      params.variableParams = req.body.variableParams
      const appReq = createAppRequest(req, params)
      const appRes = await appLayer.previewFeed(appReq)
      if (appRes.success) {
        return res.status(200).json(appRes.success)
      }
      return next(appRes.error)
    })

  routes.route('/services/:serviceId/topics/:topicId/feeds')
    .post(async (req, res, next) => {
      const params: Omit<CreateFeedRequest, 'context'> = feedCreateParamsFromRequest(req)
      const appReq = createAppRequest(req, params)
      const appRes = await appLayer.createFeed(appReq)
      if (appRes.success) {
        return res
          .status(201)
          .header('location', `${req.baseUrl}/${appRes.success.id}`)
          .json(appRes.success)
      }
      return next(appRes.error)
    })

  routes.route('/')
    .get(async (req, res, next) => {
      const appReq = createAppRequest(req)
      const appRes = await appLayer.listAllFeeds(appReq)
      if (appRes.success) {
        return res.json(appRes.success)
      }
      return next(appRes.error)
    })

  routes.use(errorHandler)

  return routes
}
