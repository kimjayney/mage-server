
import { FeedServiceType, FeedServiceConnection, FeedServiceTypeId, FeedTopic, FeedServiceInfo, InvalidServiceConfigError, FeedTopicId, FeedsError, ErrInvalidServiceConfig, FeedServiceTypeUnregistered, FeedTopicContent } from "@ngageoint/mage.service/lib/entities/feeds/entities.feeds"
import { Json, JSONSchema4, JsonObject } from '@ngageoint/mage.service/lib/entities/entities.json_types'
import * as Asam from './topics/asam'
import { URL } from 'url'
import querystring from 'querystring'

/**
 * MSI is NGA's Maritime Safety Information API.
 */
export class MsiServiceType implements FeedServiceType {

  readonly id: FeedServiceTypeId = FeedServiceTypeUnregistered
  readonly pluginServiceTypeId: string = 'nga-msi'
  readonly title: string = 'NGA MSI'
  readonly summary: string = 'NGA Maritime Safety Information service'
  readonly configSchema: JSONSchema4 = {
    type: 'string',
    title: 'URL',
    description: "The base URL of a service that implements NGA's MSI OpenAPI definition",
    default: 'https://msi.gs.mil/'
  }

  async validateServiceConfig(config: Json): Promise<null | InvalidServiceConfigError> {
    if (typeof config !== 'string') {
      return new FeedsError(ErrInvalidServiceConfig, { invalidKeys: [], config }, 'config must be a url string')
    }
    try {
      const url = new URL(config)
    }
    catch (err) {
      return new FeedsError(ErrInvalidServiceConfig, { invalidKeys: [], config }, 'invalid service url')
    }
    return null
  }

  createConnection(config: Json): FeedServiceConnection {
    return new MsiConnection(config as string, topics, transport)
  }
}

const transport: MsiTransport = {
  async send() {
    throw new Error('todo')
  }
}

const topics: Map<string, MsiTopicModule> = new Map<FeedTopicId, MsiTopicModule>([
  [ Asam.topicDescriptor.id, Asam ],
])

export class MsiConnection implements FeedServiceConnection {

  constructor(readonly url: string, readonly topics: Map<FeedTopicId, MsiTopicModule>, readonly transport: MsiTransport) {}

  async fetchServiceInfo(): Promise<FeedServiceInfo> {
    return {
      title: 'NGA Maritime Safety Information Service',
      summary: 'Provide global maritime geospatial intelligence in support of national security objectives, including safety of navigation, international obligations, and joint military operations.'
    }
  }

  async fetchAvailableTopics(): Promise<FeedTopic[]> {
    return Array.from(this.topics.values()).map(x => x.topicDescriptor)
  }

  async fetchTopicContent(topic: string, params?: JsonObject | undefined): Promise<FeedTopicContent> {
    const topicModule = this.topics.get(topic)
    if (!topicModule) {
      throw new Error(`unknown topic: ${topic}`)
    }
    const req = topicModule.createContentRequest(params)
    const res = await this.transport.send(req)
    return topicModule.transformResponse(res, req)
  }
}

export interface MsiRequest {
  method: 'get' | 'post'
  path: string
  queryParams?: querystring.ParsedUrlQuery
  body?: Json
}

export interface MsiResponse {
  status: number
  body: Json
}

export interface MsiTransport {
  send(req: MsiRequest): Promise<MsiResponse>
}

export interface MsiTopicModule {
  topicDescriptor: FeedTopic
  createContentRequest(params?: JsonObject): MsiRequest
  transformResponse(res: MsiResponse, req: MsiRequest): FeedTopicContent
}
