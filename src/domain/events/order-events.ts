import { BaseEvent } from "./base.event";


export const ORDER_EVENT_TYPES = {
    SUCCEEDED: 'CourseOrderSucceeded'
  } as const;
  

class OrderCompletedItemPayload {
    courseId: string;

    price: number;
}

export class OrderCompletedEventPayload {

    orderId: string;

    eventId: string;

    userId: string;

    items: OrderCompletedItemPayload[];

    amount: number;

    currency: string
}

export type OrderCompletedEvent = BaseEvent<OrderCompletedEventPayload>;


