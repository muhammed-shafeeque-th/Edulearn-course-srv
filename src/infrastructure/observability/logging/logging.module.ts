import { ILoggerService } from "@/application/adaptors/logger.service";
import { AppConfigService } from "@/infrastructure/config/config.service";
import { LoggerModule, LoggerService } from "@edulearn/nest";
import { Module, Global } from "@nestjs/common";
@Global()
@Module({
  imports: [
    LoggerModule.forRootAsync({
      // imports: [ConfigModule],

      inject: [AppConfigService],

      useFactory: (config: AppConfigService) => ({
        environment: config.nodeEnv,
        level: config.logLevel,
        serviceName: config.serviceName,
        version: config.serviceVersion,
      }),
    }),
  ],
  providers: [{ provide: ILoggerService, useClass: LoggerService }],
  exports: [ILoggerService],
})
export class AppLoggerModule {}
