import { BaseEvent } from "./base.event";

export const USER_EVENT_TYPES = {
  UPDATED: 'UserUpdatedEvent'
} as const;


export interface UserUpdatedEvent
  extends BaseEvent<{
    userId: string;
    username: string;
    email: string;
    role: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
    status: string;
  }> {}
