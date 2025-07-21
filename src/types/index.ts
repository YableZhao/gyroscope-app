// Core data types
export interface GyroscopeData {
  alpha: number;
  beta: number;
  gamma: number;
}

export interface FilteredGyroscopeData extends GyroscopeData {
  timestamp: number;
}

// User management types  
export interface UserData extends GyroscopeData {
  username: string;
  update: (data: Partial<UserData>) => void;
}

export interface Position {
  x: number;
  y: number;
  alpha: number;
}

// WebSocket message types
export interface WebSocketMessage {
  type: 'USER_UPDATE' | 'USER_JOIN' | 'USER_LEAVE' | 'ROOM_STATE';
  data: any;
  timestamp: number;
}

export interface UserUpdateMessage extends WebSocketMessage {
  type: 'USER_UPDATE';
  data: {
    username: string;
    gyroscope: GyroscopeData;
  };
}

// Context types
export interface UserContextState {
  users: Map<string, UserData>;
  timestamp: number;
}

export interface OverseerContextState extends UserContextState {
  update: (data: Partial<UserData>, username?: string) => void;
  addUser: (user: UserData) => void;
  removeUser: (username: string) => void;
}

// Permission types
export type PermissionState = 'default' | 'granted' | 'denied';

// Component props
export interface BoardProps {
  className?: string;
}

export interface DotProps {
  className?: string;
  username: string;
  position: Position;
}