import { Module, Global } from "@nestjs/common";
import { WinstonModule } from "nest-winston";
import winston, { format, transports } from "winston";
import LokiTransport from "winston-loki";
import DailyRotateFile from "winston-daily-rotate-file";
import { LoggingService } from "./logging.service";
import { AppConfigService } from "src/infrastructure/config/config.service";

/**
 * LoggingModule
 *
 * - Uses Winston for log management.
 * - Logs are output to console (with color in dev), daily-rotating files, and optionally Loki (Grafana).
 * - Splits logs by severity: all logs to combined file, errors separately as well.
 * - Best practices: async config, robust format, clear separation of concerns, extensibility.
 */
@Global()
@Module({
  imports: [
    WinstonModule.forRootAsync({
      inject: [AppConfigService],
      useFactory: async (configService: AppConfigService) => {
        const { lokiUrl, serviceName, nodeEnv, logLevel } = configService;

        // Define transports
        const logTransports: winston.transport[] = [];

        // Console: always present, color in non-production, human-friendly format
        logTransports.push(
          new transports.Console({
            handleExceptions: true,
            format:
              nodeEnv === "production"
                ? format.combine(
                    format.timestamp({ format: "YYYY-MM-DDTHH:mm:ss:SSSZ" }),
                    format.errors({ stack: true }),
                    format.printf(
                      ({ timestamp, level, message, stack, ...meta }) => {
                        let metaString =
                          meta && Object.keys(meta).length
                            ? ` ${JSON.stringify(meta)}`
                            : "";
                        let msg = stack ? `${message}\n${stack}` : message;
                        return `[${timestamp}] [${level.toUpperCase()}]: ${msg}${metaString}`;
                      },
                    ),
                  )
                : format.combine(
                    format.colorize(),
                    format.timestamp({ format: "YYYY-MM-DDTHH:mm:ss:SSSZ" }),
                    format.printf(
                      ({ timestamp, level, message, stack, ...meta }) => {
                        let metaString =
                          meta && Object.keys(meta).length
                            ? ` ${JSON.stringify(meta)}`
                            : "";
                        let msg = stack ? `${message}\n${stack}` : message;
                        return `[${timestamp}] [${level}]: ${msg}${metaString}`;
                      },
                    ),
                  ),
          }),
        );

        // Daily rotating combined file (all levels)
        logTransports.push(
          new DailyRotateFile({
            filename: `logs/${serviceName}-%DATE%-combined.log`,
            datePattern: "YYYY-MM-DD",
            zippedArchive: true,
            maxSize: "20m",
            maxFiles: "14d",
            level: logLevel,
            format: format.combine(
              format.timestamp({ format: "YYYY-MM-DDTHH:mm:ss:SSSZ" }),
              format.errors({ stack: true }),
              format.json(),
            ),
          }),
        );

        // Daily rotating error file (errors only)
        logTransports.push(
          new DailyRotateFile({
            filename: `logs/${serviceName}-%DATE%-error.log`,
            datePattern: "YYYY-MM-DD",
            zippedArchive: true,
            maxSize: "20m",
            maxFiles: "14d",
            level: "error",
            format: format.combine(
              format.timestamp({ format: "YYYY-MM-DDTHH:mm:ss:SSSZ" }),
              format.errors({ stack: true }),
              format.json(),
            ),
          }),
        );

        // Loki transport (if enabled)
        if (lokiUrl) {
          logTransports.push(
            new LokiTransport({
              host: lokiUrl,
              labels: { app: serviceName, env: nodeEnv },
              json: true,
              batching: true,
              interval: 5000,
              format: format.combine(format.timestamp(), format.json()),
            }) as any,
          );
        }

        return {
          level: logLevel,
          transports: logTransports,
          silent: nodeEnv === "test", // Suppress logs in test, a best practice
          // Default logger format (used by winston's logger.log, not always each transport; but can provide structured fallback)
          format: format.combine(
            format.timestamp({ format: "YYYY-MM-DDTHH:mm:ss:SSSZ" }),
            format.errors({ stack: true }),
            format.json(),
          ),
          exitOnError: false, // Prevent Winston from exiting on handled exceptions
        };
      },
    }),
  ],
  providers: [LoggingService],
  exports: [LoggingService],
})
export class LoggingModule {}
