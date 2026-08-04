import { User } from "src/domain/entities/user.entity";
import { UserOrmEntity } from "../entities/user.entity";

/**
 * UserEntityMapper handles mapping between domain entities and ORM/database entities.
 * Add new methods as new mappings are needed.
 * Follows best practices: single-responsibility, reusability, null/undef checking, date normalization, and minimal knowledge of property structure.
 */
export class UserEntityMapper {
  // --- User/User Mapping ---

  static toOrmUser(user: User): UserOrmEntity {
    const orm = new UserOrmEntity();
    orm.id = user.getId();
    orm.avatar = user.getAvatar();
    orm.email = user.getEmail();
    orm.name = user.getName();
    orm.updatedAt = user.getUpdatedAt();
    return orm;
  }

  static toDomainUser(orm: UserOrmEntity): User {
    return new User(
      orm.id,
      orm.name,
      orm.avatar,
      orm.email,
      new Date(orm.updatedAt),
    );
  }
}
