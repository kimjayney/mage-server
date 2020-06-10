import { AuthenticatedRequest, AppResponse, Descriptor } from '../app.api.global'
import { FeedService, FeedTopic, FeedParams, FeedContent, FeedId, FeedServiceTypeId, FeedServiceId, Feed, FeedTopicId, FeedServiceType } from '../../entities/feeds/entities.feeds'
import { Json, JsonObject } from '../../entities/entities.global.json'
import { PermissionDeniedError, EntityNotFoundError, InvalidInputError } from '../app.api.global.errors'


export interface ListFeedServiceTypes {
  (req: AuthenticatedRequest): Promise<AppResponse<FeedServiceTypeDescriptor[], PermissionDeniedError>>
}

export interface PreviewTopicsRequest extends AuthenticatedRequest {
  serviceType: FeedServiceTypeId
  serviceConfig: Json
}

export interface PreviewTopics {
  (req: PreviewTopicsRequest): Promise<AppResponse<FeedTopic[], PermissionDeniedError | EntityNotFoundError | InvalidInputError>>
}

export interface CreateFeedServiceRequest extends AuthenticatedRequest {
  serviceType: FeedServiceTypeId
  title: string
  summary?: string | null
  config: Json
}

export interface CreateFeedService {
  (req: CreateFeedServiceRequest): Promise<AppResponse<FeedService, PermissionDeniedError | EntityNotFoundError | InvalidInputError>>
}

export interface ListServiceTopicsRequest extends AuthenticatedRequest {
  service: FeedServiceId
}

export interface ListServiceTopics {
  (req: ListServiceTopicsRequest): Promise<AppResponse<FeedTopic[], PermissionDeniedError | EntityNotFoundError>>
}

export interface PreviewFeedContentRequest extends AuthenticatedRequest {
  params: FeedParams
}

export interface PreviewFeedContent {
  (req: PreviewFeedContentRequest): Promise<FeedContent>
}

export interface CreateFeedRequest extends AuthenticatedRequest {
  service: FeedServiceId,
  topic: FeedTopicId
  title: string,
  summary: string,
  constantParams: Json
  variableParams: Json
}

export interface CreateFeed {
  (req: CreateFeedRequest): Promise<FeedService>
}

export interface FetchEventFeedsRequest extends AuthenticatedRequest {
  eventId: string
}

export interface FetchEventFeeds {
  (req: FetchEventFeedsRequest): Promise<Feed[]>
}

export interface FetchFeedContentRequest extends AuthenticatedRequest {
  feedId: FeedId,
  variableParams: Json
}

export interface FetchFeedContent {
  (req: FetchFeedContentRequest): Promise<FeedContent>
}

export interface FeedServiceTypeDescriptor extends Descriptor<'FeedServiceType'>, Pick<FeedServiceType, 'id' | 'title' | 'summary'> {
  id: string
  configSchema: JsonObject | null
}

export function FeedServiceTypeDescriptor(from: FeedServiceType): FeedServiceTypeDescriptor {
  return {
    descriptorOf: 'FeedServiceType',
    id: from.id as string,
    title: from.title,
    summary: from.summary,
    configSchema: from.configSchema as JsonObject | null
  }
}

export interface FeedServiceDescriptor extends Descriptor<'FeedService'>, Pick<FeedService, 'id' | 'serviceType' | 'title' | 'summary' | 'config'> {
  serviceType: string
}

export function FeedServiceDescriptor(from: FeedService): FeedServiceDescriptor {
  return {
    descriptorOf: 'FeedService',
    id: from.id,
    serviceType: from.serviceType as string,
    title: from.title,
    summary: from.summary,
    config: from.config
  }
}
