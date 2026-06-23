import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ICertificateRepository } from "../../../domain/repositories/certificate.repository";
import { Certificate } from "../../../domain/entities/certificate.entity";
import { LoggingService } from "../../observability/logging/logging.service";
import { CertificateEntityMapper } from "../mappers/certificate.entity.mapper";
import { CertificateOrmEntity } from "../entities/certificate-orm.entity";
import { ICacheService } from "src/application/services/cache-service";
import { CACHE_KEYS } from "src/infrastructure/redis/cache-keys";


@Injectable()
export class CertificateTypeOrmRepository implements ICertificateRepository {
  constructor(
    @InjectRepository(CertificateOrmEntity)
    private readonly repo: Repository<CertificateOrmEntity>,
    private readonly redisService: ICacheService,
    private readonly logger: LoggingService
  ) {}

  async save(certificate: Certificate): Promise<void> {
    const orm = CertificateEntityMapper.toOrmCertificate(certificate);
    await this.repo.save(orm);

    // Invalidate cache
    await Promise.all([
      this.redisService.del(CACHE_KEYS.certificate.byId(certificate.getId())),
      this.redisService.del(CACHE_KEYS.certificate.byEnrollmentId(certificate.getEnrollmentId())),
      this.redisService.del(CACHE_KEYS.certificate.byCertificateNumber(certificate.getCertificateNumber())),
      this.redisService.del(CACHE_KEYS.certificate.allByUserId(certificate.getUserId())),
    ]);

    this.logger.debug(`Certificate saved: ${certificate.getId()}`);
  }

  async findById(id: string): Promise<Certificate | null> {
    const cacheKey = CACHE_KEYS.certificate.byId(id);
    const cached = await this.redisService.get<CertificateOrmEntity>(cacheKey);

    if (cached) {
      return CertificateEntityMapper.toDomainCertificate(cached);
    }

    const orm = await this.repo.findOne({ where: { id } });
    if (!orm) return null;

    await this.redisService.set(cacheKey, orm, 3600);
    return CertificateEntityMapper.toDomainCertificate(orm);
  }

  async findByEnrollmentId(enrollmentId: string): Promise<Certificate | null> {
    const cacheKey = CACHE_KEYS.certificate.byEnrollmentId(enrollmentId);
    const cached = await this.redisService.get<CertificateOrmEntity>(cacheKey);

    if (cached) {
      return CertificateEntityMapper.toDomainCertificate(cached);
    }

    const orm = await this.repo.findOne({ where: { enrollmentId } });
    if (!orm) return null;

    await this.redisService.set(cacheKey, orm, 3600);
    return CertificateEntityMapper.toDomainCertificate(orm);
  }

  async findByCertificateNumber(
    certificateNumber: string
  ): Promise<Certificate | null> {
    const cacheKey = CACHE_KEYS.certificate.byCertificateNumber(certificateNumber);
    const cached = await this.redisService.get<CertificateOrmEntity>(cacheKey);

    if (cached) {
      return CertificateEntityMapper.toDomainCertificate(cached);
    }

    const orm = await this.repo.findOne({ where: { certificateNumber } });
    if (!orm) return null;

    await this.redisService.set(cacheKey, orm, 3600);
    return CertificateEntityMapper.toDomainCertificate(orm);
  }

  async findByUserId(
    userId: string,
    offset: number = 0,
    limit: number = 10
  ): Promise<{ certificates: Certificate[]; total: number }> {
    const cacheKey = CACHE_KEYS.certificate.byUserId(userId, offset, limit);
    const cached = await this.redisService.get<{
      certificates: CertificateOrmEntity[];
      total: number;
    }>(cacheKey);

    if (cached) {
      return {
        certificates: cached.certificates.map(CertificateEntityMapper.toDomainCertificate),
        total: cached.total,
      };
    }

    const [ormEntities, total] = await this.repo.findAndCount({
      where: { userId },
      order: { createdAt: "DESC" },
      skip: offset,
      take: limit,
    });

    await this.redisService.set(
      cacheKey,
      { certificates: ormEntities, total },
      3600
    );

    return {
      certificates: ormEntities.map(CertificateEntityMapper.toDomainCertificate),
      total,
    };
  }
}
