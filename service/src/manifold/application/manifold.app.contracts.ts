import { AdapterDescriptor, SourceDescriptor } from "../entities/manifold.entities";

export interface AdapterRepository {
  create(attrs: Partial<AdapterDescriptor>): Promise<AdapterDescriptor>
  readAll(): Promise<AdapterDescriptor[]>
  update(attrs: Partial<AdapterDescriptor> & { id: string }): Promise<AdapterDescriptor>
  removeById(adapterId: string): Promise<void>
}

export interface SourceRepository {
  readAll(): Promise<SourceDescriptor[]>
  findById(sourceId: string): Promise<SourceDescriptor | null>
}
