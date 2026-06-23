export interface BaseEvent<T> {
    eventId: string;
    eventType: string;
    timestamp: number;
    eventVersion?: "0.0.1";
    source?: "course-service";
    correlationId?: string;
    payload?: T;
  }