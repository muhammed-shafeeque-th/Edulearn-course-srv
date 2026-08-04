import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { ClientKafka } from "@nestjs/microservices";
import { lastValueFrom } from "rxjs";
import { KAFKA_CLIENT } from "./constants";
import {
  IEventProducer,
  KafkaMessageObject,
} from "@/application/adaptors/event-producer.interface";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { ITraceService } from "src/application/adaptors/trace.service";

@Injectable()
export class KafkaProducerImpl
  implements IEventProducer, OnModuleInit, OnModuleDestroy
{
  constructor(
    @Inject(KAFKA_CLIENT) private readonly kafkaClient: ClientKafka,
    private readonly logger: ILoggerService,
    private readonly tracer: ITraceService,
  ) {}

  async onModuleInit() {
    await this.kafkaClient.connect();
    this.logger.info(`Kafka client connected ${KafkaProducerImpl.name}`);
  }

  async onModuleDestroy() {
    await this.kafkaClient.close();
    this.logger.info(`Kafka client disconnected ${KafkaProducerImpl.name}`);
  }

  async produce<T = any>(topic: string, message: KafkaMessageObject<T>) {
    return await this.tracer.startActiveSpan(
      "KafkaProducerImpl.produce",
      async (span) => {
        try {
          span.setAttribute("kafka.topic", topic);
          span.setAttribute("kafka.message", JSON.stringify(message));

          // emit() returns an Observable, so we convert to Promise
          await lastValueFrom(this.kafkaClient.emit(topic, message));
          this.logger.debug(
            `Message send to topic ${topic}: ${JSON.stringify(message)}`,
            { ctx: KafkaProducerImpl.name },
          );
        } catch (error: any) {
          this.logger.error(
            `Failed to send message to topic ${topic}: ${error.message}`,
            { ctx: KafkaProducerImpl.name, error },
          );
          throw error;
        }
      },
    );
  }
}
