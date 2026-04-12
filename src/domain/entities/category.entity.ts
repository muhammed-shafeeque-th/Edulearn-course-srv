export interface CategoryPrimitive {
  id: string;
  name: string;
  slug: string;
  idempotencyKey?: string;
  description?: string;
  icon?: string;
  color?: string;
  isActive?: boolean;
  order?: number;
  parentId?: string;
  courseCount?: number;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
  subcategories?: CategoryPrimitive[];
}

export interface CategoryProps {
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
  subcategories?: Category[];
}

export class Category {
  private readonly id: string;
  private name: string;
  private slug: string;
  private idempotencyKey?: string;
  private description?: string;
  private icon?: string;
  private color?: string;
  private isActive: boolean;
  private order: number;
  private parentId?: string;
  private courseCount: number;
  private createdAt?: Date;
  private updatedAt?: Date;
  private deletedAt?: Date;
  private subcategories: Category[];

  constructor(
    id: string,
    name: string,
    slug: string,
    options?: {
      idempotencyKey?: string;
      description?: string;
      icon?: string;
      color?: string;
      isActive?: boolean;
      order?: number;
      parentId?: string;
      courseCount?: number;
      createdAt?: Date;
      updatedAt?: Date;
      deletedAt?: Date;
      subcategories?: Category[];
    },
  ) {
    this.id = id;
    this.name = name;
    this.slug = slug;
    this.idempotencyKey = options?.idempotencyKey;
    this.description = options?.description;
    this.icon = options?.icon;
    this.color = options?.color;
    this.isActive = options?.isActive ?? true;
    this.order = options?.order ?? 0;
    this.parentId = options?.parentId;
    this.courseCount = options?.courseCount ?? 0;
    this.createdAt = options?.createdAt
      ? new Date(options.createdAt)
      : new Date();
    this.updatedAt = options?.updatedAt
      ? new Date(options.updatedAt)
      : new Date();
    this.deletedAt = options?.deletedAt
      ? new Date(options.deletedAt)
      : undefined;
    this.subcategories = options?.subcategories ?? [];
  }

  getId(): string {
    return this.id;
  }

  getIdempotencyKey(): string | undefined {
    return this.idempotencyKey;
  }

  getName(): string {
    return this.name;
  }

  getSlug(): string {
    return this.slug;
  }

  getParentId(): string | undefined {
    return this.parentId;
  }

  getDescription(): string | undefined {
    return this.description;
  }

  getIcon(): string | undefined {
    return this.icon;
  }

  getColor(): string | undefined {
    return this.color;
  }

  getIsActive(): boolean {
    return this.isActive;
  }

  getOrder(): number {
    return this.order;
  }

  getCourseCount(): number {
    return this.courseCount;
  }

  getCreatedAt(): Date | undefined {
    return this.createdAt;
  }

  getUpdatedAt(): Date | undefined {
    return this.updatedAt;
  }

  getDeletedAt(): Date | undefined {
    return this.deletedAt;
  }

  getSubcategories(): Category[] {
    return this.subcategories;
  }

  setCourseCount(count: number) {
    this.courseCount = count;
  }

  setSubcategories(subcategories: Category[]) {
    this.subcategories = subcategories;
  }

  updateDetails(
    name: string,
    slug: string,
    description?: string,
    icon?: string,
    color?: string,
    order?: number,
    parentId?: string,
  ) {
    this.name = name;
    this.slug = slug;
    if (description !== undefined) this.description = description;
    if (icon !== undefined) this.icon = icon;
    if (color !== undefined) this.color = color;
    if (order !== undefined) this.order = order;
    if (parentId !== undefined) this.parentId = parentId;
  }

  toggleStatus() {
    this.isActive = !this.isActive;
  }

  markAsDeleted() {
    this.deletedAt = new Date();
    this.isActive = false;
  }

  restore() {
    this.deletedAt = undefined;
    this.isActive = true;
  }

  /**
   * Converts the Category entity into a plain object that is safe for caching or serialization.
   */
  toPrimitive(): CategoryPrimitive {
    return {
      id: this.id,
      name: this.name,
      slug: this.slug,
      idempotencyKey: this.idempotencyKey,
      description: this.description,
      icon: this.icon,
      color: this.color,
      isActive: this.isActive,
      order: this.order,
      parentId: this.parentId,
      courseCount: this.courseCount,
      createdAt: this.createdAt ? this.createdAt.toISOString() : undefined,
      updatedAt: this.updatedAt ? this.updatedAt.toISOString() : undefined,
      deletedAt: this.deletedAt ? this.deletedAt.toISOString() : undefined,
      subcategories: this.subcategories.map((sub) => sub.toPrimitive()),
    };
  }

  /**
   * Creates a Category entity from a plain object (a.k.a. primitive form), e.g. from a cache.
   */
  static fromPrimitive(obj: CategoryPrimitive): Category {
    return new Category(obj.id, obj.name, obj.slug, {
      idempotencyKey: obj.idempotencyKey,
      description: obj.description,
      icon: obj.icon,
      color: obj.color,
      isActive: obj.isActive,
      order: obj.order,
      parentId: obj.parentId,
      courseCount: obj.courseCount,
      createdAt: obj.createdAt ? new Date(obj.createdAt) : undefined,
      updatedAt: obj.updatedAt ? new Date(obj.updatedAt) : undefined,
      deletedAt: obj.deletedAt ? new Date(obj.deletedAt) : undefined,
      subcategories: obj.subcategories
        ? obj.subcategories.map(Category.fromPrimitive)
        : [],
    });
  }
}
