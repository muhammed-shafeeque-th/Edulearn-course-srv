import { Module } from '@nestjs/common';
import { KafkaProducerImpl } from './kafka-producer.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AppConfigService } from 'src/infrastructure/config/config.service';
import { KAFKA_CLIENT } from './constants';
import { IKafkaProducer } from 'src/application/services/kafka-producer.interface';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: KAFKA_CLIENT,
        useFactory: (config: AppConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: config.kafkaClientId || 'course-service',
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
  providers: [{ provide: IKafkaProducer, useClass: KafkaProducerImpl }],
  exports: [IKafkaProducer, ClientsModule],
})
export class KafkaModule {}
