export type ExtensionMessageType =
  | 'START_SESSION'
  | 'PAUSE_SESSION'
  | 'RESUME_SESSION'
  | 'STOP_SESSION'
  | 'GET_SESSION_STATE'
  | 'SESSION_STATE_CHANGED'
  | 'FOCUS_UPDATE'
  | 'AUTH_SYNC'
  | 'CAMERA_PERMISSION_REQUEST';

export interface BaseExtensionMessage {
  type: ExtensionMessageType;
  payload?: any;
}

export interface StartSessionMessage extends BaseExtensionMessage {
  type: 'START_SESSION';
  payload: {
    title?: string;
    sourceUrl?: string;
    sourceType?: string;
  };
}

export interface FocusUpdateMessage extends BaseExtensionMessage {
  type: 'FOCUS_UPDATE';
  payload: {
    focusScore: number;
    headDirection: 'front' | 'left' | 'right' | 'down' | 'up';
    faceDetected: boolean;
    isDistracted: boolean;
    timestamp: string;
  };
}

export interface SessionStateMessage extends BaseExtensionMessage {
  type: 'SESSION_STATE_CHANGED';
  payload: {
    status: 'idle' | 'active' | 'paused' | 'completed';
    sessionId?: string | null;
    title?: string;
    elapsedSeconds: number;
    avgFocusScore?: number;
  };
}
