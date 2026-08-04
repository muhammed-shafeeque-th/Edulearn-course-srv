import { Injectable } from "@nestjs/common";
import { ConfigService as NestConfigService } from "@nestjs/config";

@Injectable()
export class AppConfigService {
  constructor(private readonly configService: NestConfigService) {}

  // Service config
  get nodeEnv(): string {
    return this.configService.get<string>("NODE_ENV", "development");
  }

  get serviceName(): string {
    return this.configService.get<string>("SERVICE_NAME", "PaymentService");
  }
  get serviceVersion(): string {
    return this.configService.get<string>("SERVICE_VERSION", "1.0.0");
  }

  get httpPort(): number {
    return this.configService.get<number>("HTTP_PORT", 3000);
  }

  get grpcPort(): number {
    return this.configService.get<number>("GRPC_PORT", 50051);
  }

  // DB config

  get databaseUrl(): string {
    return this.configService.get<string>(
      "DATABASE_URL",
      "postgresql://postgres:password@localhost:5432/edulearn",
    );
  }
  get databaseHost(): string {
    return this.configService.get<string>("DATABASE_HOST", "localhost");
  }
  get databasePort(): string {
    return this.configService.get<string>("DATABASE_PORT", "5432");
  }
  get databaseUsername(): string {
    return this.configService.get<string>("DATABASE_USERNAME", "postgres");
  }
  get databasePassword(): string {
    return this.configService.get<string>("DATABASE_PASSWORD", "password");
  }
  get databaseName(): string {
    return this.configService.get<string>("DATABASE_NAME", "course_service");
  }

  get databaseMaxConnections(): number {
    return this.configService.get<number>("DATABASE_MAX_CONNECTIONS", 50);
  }

  get databaseMinConnections(): number {
    return this.configService.get<number>("DATABASE_MIN_CONNECTIONS", 10);
  }

  // Redis config

  get redisUrl(): string {
    return this.configService.get<string>(
      "REDIS_URL",
      "redis://localhost:6379/0",
    );
  }
  get redisDb(): number {
    return this.configService.get<number>("REDIS_DB", 2);
  }
  get redisHost(): string {
    return this.configService.get<string>("REDIS_HOST", "localhost");
  }
  get redisPort(): number {
    return this.configService.get<number>("REDIS_PORT", 6379);
  }

  get redisMaxConnections(): number {
    return this.configService.get<number>("REDIS_MAX_CONNECTIONS", 100);
  }
  get redisKeyPrefix(): string {
    return this.configService.get<string>(
      "REDIS_KEY_PREFIX",
      "edulearn:course:",
    );
  }

  get redisMinConnections(): number {
    return this.configService.get<number>("REDIS_MIN_CONNECTIONS", 10);
  }

  get redisTtlDefault(): number {
    return this.configService.get<number>("REDIS_TTL_DEFAULT", 86400);
  }

  // Kafka config

  get kafkaBrokers(): string[] {
    return this.configService
      .get<string>("KAFKA_BROKER", "localhost:9092")
      .split(",");
  }

  get kafkaClientId(): string {
    return this.configService.get<string>("KAFKA_CLIENT_ID", "course-service");
  }

  get kafkaConsumerGroup(): string {
    return this.configService.get<string>(
      "KAFKA_CONSUMER_GROUP",
      "course-service-group",
    );
  }

  get kafkaMaxPollRecords(): number {
    return this.configService.get<number>("KAFKA_MAX_POLL_RECORDS", 100);
  }

  get kafkaFetchMaxBytes(): number {
    return this.configService.get<number>("KAFKA_FETCH_MAX_BYTES", 5242880);
  }


  // Observability config


  get tracingSamplingRatio(): number {
    return this.configService.get<number>("TRACING_SAMPLING_RATIO", 0.1);
  }

  get logLevel(): string {
    return this.configService.get<string>("LOG_LEVEL", "info");
  }

  get collectorUrl(): string {
    return this.configService.get<string>('OTLP_ENDPOINT', 'info');
  }

}
