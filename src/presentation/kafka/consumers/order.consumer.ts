import { Controller } from "@nestjs/common";

import { LoggingService } from "src/infrastructure/observability/logging/logging.service";
import { TracingService } from "src/infrastructure/observability/tracing/trace.service";
import UserUpdateDto from "../dtos/update-user.event-dto";
import OrderCompletedEventDTO from "../dtos/order-complete.event-dto";
import { KafkaTopics } from "src/shared/events/event.topics";
import { Ctx, EventPattern, KafkaContext, Payload } from "@nestjs/microservices";
import { KafkaMessage } from "src/infrastructure/__kafka/custom/kafka.types";
import { OrderHandler } from "../handlers/order.handler";

@Controller()
export class OrderConsumer {
  constructor(
    private readonly orderHandler: OrderHandler,
    private readonly tracer: TracingService,
    private readonly logger: LoggingService
  ) { }

   
  @EventPattern(KafkaTopics.OrderCourseSucceeded)
  async handleOrderComplete(
    @Payload() data: OrderCompletedEventDTO,
    @Ctx() context: KafkaContext
  ): Promise<void> {
    try {
      await this.tracer.startActiveSpan(
        "OrderConsumer.handleOrderComplete",
        async () => {
          this.logger.debug("Received data : " + JSON.stringify(data, null, 2));
          this.logger.info("Handling `handleOrderComplete` event handler ", {
            ctx: OrderConsumer.name,
          });

          const meta = {
            topic: context.getTopic(),
            partition: context.getPartition(),
            offset: context.getMessage().offset,
          };

          await this.orderHandler.handle(data, meta);

          this.logger.info(
            "handleOrderComplete event handle has been successfully completed"
          );

        }
      );
    } catch (error) {
      this.logger.error(
        "Error processing kafka even handler  `handleOrderComplete`",
        {
          error,
        }
      );
    }
  }
}
