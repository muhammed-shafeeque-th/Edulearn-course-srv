import { Controller } from "@nestjs/common";
import {
  EventPattern,
  Payload,
  Ctx,
  KafkaContext,
} from "@nestjs/microservices";
import { UserHandler } from "../handlers/user.handler";
import { UserUpdatedEvent } from "src/domain/events/user-events";
import { KafkaTopics } from "src/shared/events/event.topics";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { ITraceService } from "src/application/adaptors/trace.service";

@Controller()
export class UserConsumer {
  constructor(
    private readonly userHandler: UserHandler,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}

  @EventPattern(KafkaTopics.UserUpdated)
  async onMessage(
    @Payload() data: UserUpdatedEvent,
    @Ctx() context: KafkaContext,
  ) {
    try {
      await this._tracer.startActiveSpan(
        "UserConsumer.handleUserUpdate",
        async (span) => {
          this._logger.debug(
            "Received data : " + JSON.stringify(data, null, 2),
          );

          this._logger.debug("Handling `handleUserUpdate` event handler ", {
            ctx: UserConsumer.name,
          });

          const meta = {
            topic: context.getTopic(),
            partition: context.getPartition(),
            offset: context.getMessage().offset,
          };
          await this.userHandler.handle(data, meta);

          this._logger.debug(
            "handleUserUpdate event handler has been successfully completed",
          );
        },
      );
    } catch (error) {
      this._logger.error(
        "Error processing kafka event on  `handleUserUpdate`",
        {
          error,
        },
      );
      // return { error: this.createErrorResponse(error) };
    }
  }
}
