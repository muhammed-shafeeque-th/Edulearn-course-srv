import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { KafkaTopics } from 'src/shared/events/event.topics';
import { IEventProcessRepository } from 'src/domain/repositories/event-process-repository.interface';
import { LoggingService } from 'src/infrastructure/observability/logging/logging.service';
import { ORDER_EVENT_TYPES, OrderCompletedEvent } from 'src/domain/events/order-events';
import { CreateEnrollmentFromOrderUseCase } from 'src/application/use-cases/enrollment/create-enrollment-from-order.use-case';

@Injectable()
export class OrderHandler {
  constructor(
    private readonly eventProcessRepository: IEventProcessRepository,
    private readonly createEnrollmentUseCase: CreateEnrollmentFromOrderUseCase,
    private readonly logger: LoggingService,
  ) {}

  async handle(raw: OrderCompletedEvent, meta: any) {
    const event = raw as OrderCompletedEvent;
    let alreadyProcessed: boolean;
    try {
      alreadyProcessed = await this.eventProcessRepository.isProcessed(
        event.eventId
      );
    } catch (err) {
      this.logger.error(
        `Error checking event process repository for eventId ${event.eventId}: ${err?.message}`,
        err?.stack
      );
      throw new InternalServerErrorException(
        "Could not verify event processing state"
      );
    }
    if (alreadyProcessed) {
      this.logger.debug(
        `[Event Already Processed] Skipping: ${event.eventId}`,
        { ctx: "CreateEnrollmentFromOrderUseCase" }
      );
      return;
    }

    // if (event.eventType === ORDER_EVENT_TYPES.SUCCEEDED) {

      await this.createEnrollmentUseCase.execute(event);

      await this.eventProcessRepository.markAsProcessed(event.eventId);

        this.logger.info(
          `Successfully processed order enrollment for topic ${KafkaTopics.CourseEnrollmentCreated}`
        );
    // }
  }
}
