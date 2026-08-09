import { Category } from "src/domain/entities/category.entity";
import { CategoryData } from "src/infrastructure/grpc/generated/course/types/category";

export class CategoryMapper {
  static toGrpcResponse(certificate: Category): CategoryData {
    return {
      id: certificate.getId(),
      courseCount: certificate.getCourseCount(),
      createdAt: certificate.getCreatedAt().toISOString(),
      isActive: certificate.getIsActive(),
      name: certificate.getName(),
      order: certificate.getOrder(),
      slug: certificate.getSlug(),
      subcategories: certificate
        .getSubcategories()
        ?.map((cat) => CategoryMapper.toGrpcResponse(cat)),
      updatedAt: certificate.getUpdatedAt().toISOString(),
      color: certificate.getColor(),
      deletedAt: certificate.getDeletedAt().toISOString(),
      description: certificate.getDescription(),
      icon: certificate.getIcon(),
      parentId: certificate.getParentId(),
    };
  }
}
