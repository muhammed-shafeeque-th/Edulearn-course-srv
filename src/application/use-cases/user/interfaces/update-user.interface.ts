import { UserUpdatedEvent } from "src/domain/events/user-events";

export abstract class IUpdateUserUseCase {
  abstract execute(dto: UserUpdatedEvent): Promise<void>;
}
