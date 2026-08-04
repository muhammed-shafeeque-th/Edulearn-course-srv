import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { KafkaTopics } from "src/shared/events/event.topics";
import { IEventProcessRepository } from "src/domain/repositories/event-process-repository.interface";
import {
  USER_EVENT_TYPES,
  UserUpdatedEvent,
} from "src/domain/events/user-events";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { IUpdateUserUseCase } from "src/application/use-cases/user/interfaces/update-user.interface";

@Injectable()
export class UserHandler {
  constructor(
    private readonly eventProcessRepository: IEventProcessRepository,
    private readonly updateUserUseCase: IUpdateUserUseCase,
    private readonly _logger: ILoggerService,
  ) {}

  async handle(raw: UserUpdatedEvent, meta: any) {
    const event = raw as UserUpdatedEvent;
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

    // if (event.eventType === USER_EVENT_TYPES.UPDATED) {
    await this.updateUserUseCase.execute(event);

    await this.eventProcessRepository.markAsProcessed(event.eventId);

    this._logger.debug(
      `Successfully processed user updated for topic ${KafkaTopics.UserUpdated}`,
    );
    // }
  }
}
