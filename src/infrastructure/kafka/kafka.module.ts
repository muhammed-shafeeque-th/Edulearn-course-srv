import { Module } from "@nestjs/common";
import { KafkaProducerImpl } from "./kafka-producer.service";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { AppConfigService } from "src/infrastructure/config/config.service";
import { KAFKA_CLIENT } from "./constants";
import { IEventProducer } from "@/application/adaptors/event-producer.interface";
import { KafkaHealthService } from "./kafka-heath.service";

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: KAFKA_CLIENT,
        useFactory: (config: AppConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: config.kafkaClientId || "course-service",
              brokers: config.kafkaBrokers,
            },
            producer: {
              maxInFlightRequests: 1,
              idempotent: true,
              retry: {
                retries: 5,
              },
            },
          },
        }),
        inject: [AppConfigService],
      },
    ]),
  ],
  providers: [
    { provide: IEventProducer, useClass: KafkaProducerImpl },
    KafkaHealthService,
  ],
  exports: [KafkaHealthService, IEventProducer, ClientsModule],
})
export class KafkaModule {}
