import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UserOrmEntity } from "../entities/user.entity";
import { User } from "src/domain/entities/user.entity";
import { UserEntityMapper } from "../mappers/user.entity.mapper";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { ITraceService } from "src/application/adaptors/trace.service";
import { IMetricService } from "src/application/adaptors/metric.service";
import { BaseRepository } from "./base.repository";

@Injectable()
export class UserTypeOrmRepository extends BaseRepository<User, UserOrmEntity> {
  protected contextName: string = UserTypeOrmRepository.name;
  constructor(
    @InjectRepository(UserOrmEntity)
    repo: Repository<UserOrmEntity>,
    logger: ILoggerService,
    tracer: ITraceService,
    metrics: IMetricService,
  ) {
    super(repo, logger, tracer, metrics);
  }

  async save(user: User): Promise<void> {
    return await this.execute("save", async (span) => {
      span.setAttributes({
        "db.user.operation": "INSERT",
        "user.user.id": user.getId(),
      });
      const ormEntity = UserEntityMapper.toOrmUser(user);

      const end = this.metrics.measureDBOperationDuration(
        "user.save",
        "INSERT",
      );
      const result = await this.repo.save(ormEntity);
      end();

      if (!result) {
        this.logger.warn(
          `Save operation returned null or undefined for user ${user.getId()}`,
          { ctx: UserTypeOrmRepository.name },
        );
      } else {
        this.logger.debug("user has been successfully saved to DB", {
          ctx: UserTypeOrmRepository.name,
        });
      }
      span.setAttribute("user.saved", !!result);
    });
  }

  async findById(id: string): Promise<User | null> {
    return await this.execute("findById", async (span) => {
      span.setAttributes({
        "db.user.operation": "SELECT",
        "user.id": id,
      });

      const end = this.metrics.measureDBOperationDuration(
        "user.findOne",
        "SELECT",
      );
      const ormEntity = await this.repo.findOne({ where: { id } });
      end();
      this.metrics.incrementDBRequestCounter("SELECT");

      if (!ormEntity) {
        span.setAttribute("db.user.status", "Not found");
        return null;
      }
      span.setAttribute("db.user.status", "found");

      const user = UserEntityMapper.toDomainUser(ormEntity);

      return user;
    });
  }
}
