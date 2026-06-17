import { Category } from "src/domain/entities/category.entity";
import { CategoryData } from "src/infrastructure/grpc/generated/course/types/category";

export class CategoryDto {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon?: string;
  color?: string;
  courseCount: number;
  isActive: boolean;
  parentId: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  subcategories?: CategoryDto[];

  static fromDomain(certificate: Category): CategoryDto {
    const dto = new CategoryDto();
    dto.id = certificate.getId();
    dto.color = certificate.getColor();
    dto.courseCount = certificate.getCourseCount();
    dto.description = certificate.getDescription();
    dto.icon = certificate.getIcon();
    dto.isActive = certificate.getIsActive();
    dto.name = certificate.getName();
    dto.order = certificate.getOrder();
    dto.parentId = certificate.getParentId();
    dto.slug = certificate.getSlug();
    dto.subcategories = certificate
      .getSubcategories()
      ?.map(CategoryDto.fromDomain);
    dto.createdAt = certificate.getCreatedAt().toISOString();
    dto.updatedAt = certificate.getUpdatedAt().toISOString();
    dto.deletedAt = certificate.getDeletedAt()?.toISOString();
    return dto;
  }

  /**
   * Converts this CategoryDto instance into a gRPC CategoryData object.
   */
  toGrpcResponse(): CategoryData {
    return {
      id: this.id,
      courseCount: this.courseCount,
      createdAt: this.createdAt,
      isActive: this.isActive,
      name: this.name,
      order: this.order,
      slug: this.slug,
      subcategories: this.subcategories?.map((cat) => cat.toGrpcResponse()),
      updatedAt: this.updatedAt,
      color: this.color,
      deletedAt: this.deletedAt,
      description: this.description,
      icon: this.icon,
      parentId: this.parentId,
    };
  }
}
