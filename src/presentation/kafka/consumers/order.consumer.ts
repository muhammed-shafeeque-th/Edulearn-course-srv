import { Controller } from "@nestjs/common";

import OrderCompletedEventDTO from "../dtos/order-complete.event-dto";
import { KafkaTopics } from "src/shared/events/event.topics";
import {
  Ctx,
  EventPattern,
  KafkaContext,
  Payload,
} from "@nestjs/microservices";
import { KafkaMessage } from "src/infrastructure/__kafka/custom/kafka.types";
import { OrderHandler } from "../handlers/order.handler";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { ITraceService } from "src/application/adaptors/trace.service";

@Controller()
export class OrderConsumer {
  constructor(
    private readonly orderHandler: OrderHandler,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}

  @EventPattern(KafkaTopics.OrderCourseSucceeded)
  async handleOrderComplete(
    @Payload() data: OrderCompletedEventDTO,
    @Ctx() context: KafkaContext,
  ): Promise<void> {
    try {
      await this._tracer.startActiveSpan(
        "OrderConsumer.handleOrderComplete",
        async () => {
          this._logger.debug("Handling `handleOrderComplete` event handler ", {
            ctx: OrderConsumer.name,
          });

          const meta = {
            topic: context.getTopic(),
            partition: context.getPartition(),
            offset: context.getMessage().offset,
          };

          await this.orderHandler.handle(data, meta);

          this._logger.debug(
            "handleOrderComplete event handle has been successfully completed",
          );
        },
      );
    } catch (error) {
      this._logger.error(
        "Error processing kafka even handler  `handleOrderComplete`",
        {
          error,
        },
      );
    }
  }
}
