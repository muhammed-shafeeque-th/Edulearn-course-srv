import { OrderCompletedEvent } from "src/domain/events/order-events";

export abstract class ICreateEnrollmentFromOrderUseCase {
  abstract execute(event: OrderCompletedEvent): Promise<void>;
}
