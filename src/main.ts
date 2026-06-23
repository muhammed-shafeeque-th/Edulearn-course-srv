import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { LoggingService } from "./infrastructure/observability/logging/logging.service";
import {
  MicroserviceOptions,
  Transport,
  TcpStatus,
} from "@nestjs/microservices";
import { ValidationPipe } from "@nestjs/common";
import { GrpcExceptionFilter } from "./infrastructure/filters/grpc-exeption.filter";
import { GrpcInterceptor } from "./infrastructure/interceptors/grpc-logging.interceptor";
import { GrpcAuthGuard } from "./infrastructure/guards/grpc-auth.guard";
import { AppConfigService } from "./infrastructure/config/config.service";
import { MetricsService } from "./infrastructure/observability/metrics/metrics.service";
import path from "path";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = app.get(LoggingService);
  const config = app.get(AppConfigService);

  // Set Global logger
  app.useLogger(logger);

  // Enable gRPC
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: "course_service",
      protoPath: [path.join(process.cwd(), "proto", "course_service.proto")],
      loader: {
        includeDirs: [path.join(process.cwd(), "proto")],
      },
      url: `0.0.0.0:${config.grpcPort}`,
      channelOptions: {
        'grpc.keepalive_time_ms': 10000,
        'grpc.keepalive_timeout_ms': 5000,
        'grpc.http2.max_pings_without_data': 0,
        'grpc.keepalive_permit_without_calls': 1,
        'grpc.max_receive_message_length': 1024 * 1024 * 50, // 50MB
        'grpc.max_send_message_length': 1024 * 1024 * 50, // 50MB
      },
    },
  });

  // Start Kafka microservice/consumer
  app.connectMicroservice({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: config.kafkaClientId || 'course-service',
        brokers: config.kafkaBrokers,
      },
      consumer: {
        groupId: config.kafkaConsumerGroup || 'course-consumer-group',
        sessionTimeout: 30000,
        heartbeatInterval: 3000,
        maxBytesPerPartition: config.kafkaFetchMaxBytes || 1048576,
        retry: {
          retries: 5,
        },
      },
    },
  });

  // gRPCServer.status.subscribe((status: TcpStatus) => {
  //   console.log("server status: " + status);
  // });

  // Enable global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // Automatically transform payloads to DTO instances
      whitelist: true, // Strip properties not defined in DTOs
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties are present
      errorHttpStatusCode: 400, // Map validation errors to BAD_REQUEST
    })
  );

  app.useGlobalFilters(new GrpcExceptionFilter(logger));
  app.useGlobalInterceptors(
    new GrpcInterceptor(logger, app.get(MetricsService))
  );
  // app.useGlobalGuards(new GrpcAuthGuard(logger));

  // Start both gRPC and HTTP
  await app.startAllMicroservices();
  await app.listen(config.apiPort || 3002);
  logger.info(
    `Course service started on (http port ${config.apiPort}) (grpc port ${config.grpcPort})`,
    { ctx: "Bootstrap" }
  );
}
bootstrap();
