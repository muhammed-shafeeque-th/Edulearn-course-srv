import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { KafkaTopics } from "src/shared/events/event.topics";
import { IEventProcessRepository } from "src/domain/repositories/event-process-repository.interface";
import {
  ORDER_EVENT_TYPES,
  OrderCompletedEvent,
} from "src/domain/events/order-events";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { ICreateEnrollmentFromOrderUseCase } from "src/application/use-cases/enrollment/interfaces/create-enrollment-from-order.interface";

@Injectable()
export class OrderHandler {
  constructor(
    private readonly eventProcessRepository: IEventProcessRepository,
    private readonly createEnrollmentUseCase: ICreateEnrollmentFromOrderUseCase,
    private readonly _logger: ILoggerService,
  ) {}

  async handle(raw: OrderCompletedEvent, meta: any) {
    const event = raw as OrderCompletedEvent;
    let alreadyProcessed: boolean;
    try {
      alreadyProcessed = await this.eventProcessRepository.isProcessed(
        event.eventId,
      );
    } catch (err: any) {
      this._logger.error(
        `Error checking event process repository for eventId ${event.eventId}: ${err?.message}`,
        err?.stack,
      );
      throw new InternalServerErrorException(
        "Could not verify event processing state",
      );
    }
    if (alreadyProcessed) {
      this._logger.debug(
        `[Event Already Processed] Skipping: ${event.eventId}`,
        { ctx: "CreateEnrollmentFromOrderUseCase" },
      );
      return;
    }

    // if (event.eventType === ORDER_EVENT_TYPES.SUCCEEDED) {

    await this.createEnrollmentUseCase.execute(event);

    await this.eventProcessRepository.markAsProcessed(event.eventId);

    this._logger.debug(
      `Successfully processed order enrollment for topic ${KafkaTopics.CourseEnrollmentCreated}`,
    );
    // }
  }
}
