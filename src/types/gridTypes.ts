// Selenium Grid Types

export interface Stereotype {
  browserName?: string;
  browserVersion?: string;
  platformName?: string;
  [key: string]: any;
}

export interface Session {
  sessionId: string;
  capabilities: Stereotype;
  startTime: string;
  uri: string;
}

export interface Slot {
  id: string;
  stereotype: Stereotype;
  session: Session | null;
}

export interface GridNode {
  id: string;
  uri: string;
  availability: string;
  slots: Slot[];
}

export interface ActiveSession {
  sessionId: string;
  nodeId: string;
  nodeUri: string;
  capabilities: Stereotype;
  startTime: string;
  stereotype: Stereotype;
}

export interface GridStatistics {
  totalNodes: number;
  totalSlots: number;
  availableSlots: number;
  activeSessions: number;
}

export interface GridData {
  nodes: GridNode[];
  sessions: ActiveSession[];
  statistics: GridStatistics;
  gridUrl: string;
  vncPassword: string;
}

export interface GridStatusResponse {
  success: boolean;
  data?: GridData;
  error?: string;
}

export interface QueueRequest {
  requestId: string;
  capabilities: Stereotype;
}

export interface QueueData {
  value: {
    requests: QueueRequest[];
  };
}
