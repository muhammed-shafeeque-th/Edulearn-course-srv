import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ICertificateRepository } from "../../../domain/repositories/certificate.repository";
import { Certificate } from "../../../domain/entities/certificate.entity";
import { CertificateEntityMapper } from "../mappers/certificate.entity.mapper";
import { CertificateOrmEntity } from "../entities/certificate-orm.entity";
import { ILoggerService } from "src/application/adaptors/logger.service";
import { PaginatedResult } from "src/domain/repositories/base.repository";
import { ITraceService } from "src/application/adaptors/trace.service";
import { BaseRepository } from "./base.repository";

@Injectable()
export class CertificateTypeOrmRepository
  extends BaseRepository<Certificate, CertificateOrmEntity>
  implements ICertificateRepository
{
  protected contextName = "CertificateTypeOrmRepository";

  constructor(
    @InjectRepository(CertificateOrmEntity)
    repo: Repository<CertificateOrmEntity>,
    logger: ILoggerService,
    tracer: ITraceService,
  ) {
    super(repo, logger, tracer);
  }

  async save(certificate: Certificate): Promise<void> {
    return this.execute("save", async (span) => {
      const orm = CertificateEntityMapper.toOrmCertificate(certificate);
      await this.repo.save(orm);

      this.logger.debug(`Certificate saved: ${certificate.getId()}`);
    });
  }

  async findById(id: string): Promise<Certificate | null> {
    return this.execute("findById", async (span) => {
      const orm = await this.repo.findOne({ where: { id } });
      if (!orm) return null;

      return CertificateEntityMapper.toDomainCertificate(orm);
    });
  }

  async findByEnrollmentId(enrollmentId: string): Promise<Certificate | null> {
    return this.execute("findByEnrollmentId", async (span) => {
      const orm = await this.repo.findOne({ where: { enrollmentId } });
      if (!orm) return null;

      return CertificateEntityMapper.toDomainCertificate(orm);
    });
  }

  async findByCertificateNumber(
    certificateNumber: string,
  ): Promise<Certificate | null> {
    return this.execute("findByCertificateNumber", async (span) => {
      const orm = await this.repo.findOne({ where: { certificateNumber } });
      if (!orm) return null;

      return CertificateEntityMapper.toDomainCertificate(orm);
    });
  }

  async findByUserId(
    userId: string,
    offset: number = 0,
    limit: number = 10,
  ): Promise<PaginatedResult<Certificate>> {
    return this.execute("findByUserId", async (span) => {
      const [ormEntities, total] = await this.repo.findAndCount({
        where: { userId },
        order: { createdAt: "DESC" },
        skip: offset,
        take: limit,
      });

      return {
        data: ormEntities.map(CertificateEntityMapper.toDomainCertificate),
        total,
        limit,
        page: offset,
      };
    });
  }
}
