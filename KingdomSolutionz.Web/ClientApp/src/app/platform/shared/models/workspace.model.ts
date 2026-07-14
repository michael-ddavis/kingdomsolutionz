export type WorkspaceId =
  | 'all'
  | 'apostle-cynthia'
  | 'jpp';

export type WorkspaceKind =
  | 'network'
  | 'itinerant-ministry'
  | 'church';

export interface Workspace {
  id: WorkspaceId;
  name: string;
  shortName: string;
  kind: WorkspaceKind;
  description: string;
}