import { Controller } from '@nestjs/common';
import { EventPattern, Payload, Ctx, KafkaContext } from '@nestjs/microservices';
import { UserHandler } from '../handlers/user.handler';
import { TracingService } from 'src/infrastructure/observability/tracing/trace.service';
import { LoggingService } from 'src/infrastructure/observability/logging/logging.service';
import { UserUpdatedEvent } from 'src/domain/events/user-events';
import { KafkaTopics } from 'src/shared/events/event.topics';

@Controller()
export class UserConsumer {
    constructor(
        private readonly userHandler: UserHandler,
        private readonly tracer: TracingService,
        private readonly logger: LoggingService
    ) { }

    @EventPattern(KafkaTopics.UserUpdated)
    async onMessage(@Payload() data: UserUpdatedEvent, @Ctx() context: KafkaContext) {
        try {
            await this.tracer.startActiveSpan(
                "UserConsumer.handleUserUpdate",
                async (span) => {

                    this.logger.debug("Received data : " + JSON.stringify(data, null, 2));

                    this.logger.info("Handling `handleUserUpdate` event handler ", {
                        ctx: UserConsumer.name,
                    });

                    const meta = {
                        topic: context.getTopic(),
                        partition: context.getPartition(),
                        offset: context.getMessage().offset,
                    };
                    await this.userHandler.handle(data, meta);


                    this.logger.info(
                        "handleUserUpdate event handler has been successfully completed"
                    );

                }
            );
        } catch (error) {
            this.logger.error("Error processing kafka event on  `handleUserUpdate`", {
                error,
            });
            // return { error: this.createErrorResponse(error) };
        }


    }
}
