import { Injectable } from "@nestjs/common";
import { UserUpdatedEvent } from "src/domain/events/user-events";
import { UserTypeOrmRepository } from "src/infrastructure/database/repositories/user-typeorm.repository";
import { ITraceService } from "src/application/adaptors/trace.service";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { UserNotFoundException } from "src/shared/exceptions/infra.exceptions";
import { IUpdateUserUseCase } from "../interfaces/update-user.interface";

@Injectable()
export class UpdateUserUseCase implements IUpdateUserUseCase {
  constructor(
    private readonly _userRepository: UserTypeOrmRepository,
    private readonly _logger: ILoggerService,
    private readonly _tracer: ITraceService,
  ) {}

  async execute(dto: UserUpdatedEvent): Promise<void> {
    return await this._tracer.startActiveSpan(
      "UpdateUserUseCase.execute",
      async (span) => {
        const { payload } = dto;

        span.setAttributes({
          "user.id": payload.userId,
        });
        this._logger.debug(`Updating user ${payload.userId}`, {
          ctx: UpdateUserUseCase.name,
        });

        const user = await this._userRepository.findById(payload.userId);
        if (!user) {
          span.setAttribute("user.found", false);
          throw new UserNotFoundException(payload.userId);
        }

        user.update(payload.avatar, payload.firstName + " " + payload.lastName);

        await this._userRepository.save(user);
        span.setAttribute("user.updated", true);

        this._logger.debug(`Review ${payload.userId} updated`, {
          ctx: UpdateUserUseCase.name,
        });
      },
    );
  }
}
