import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { KafkaTopics } from 'src/shared/events/event.topics';
import { IEventProcessRepository } from 'src/domain/repositories/event-process-repository.interface';
import { LoggingService } from 'src/infrastructure/observability/logging/logging.service';
import { UpdateUserUseCase } from 'src/application/use-cases/user/update-user.use-case';
import { USER_EVENT_TYPES, UserUpdatedEvent } from 'src/domain/events/user-events';

@Injectable()
export class UserHandler {
  constructor(
    private readonly eventProcessRepository: IEventProcessRepository,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly logger: LoggingService,
  ) {}

  async handle(raw: UserUpdatedEvent, meta: any) {
    const event = raw as UserUpdatedEvent;
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

    // if (event.eventType === USER_EVENT_TYPES.UPDATED) {
      await this.updateUserUseCase.execute(event);

      await this.eventProcessRepository.markAsProcessed(event.eventId);

        this.logger.info(
          `Successfully processed user updated for topic ${KafkaTopics.UserUpdated}`
        );
    // }
  }
}
