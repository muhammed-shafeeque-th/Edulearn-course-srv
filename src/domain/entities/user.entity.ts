export class User {
  constructor(
    private readonly id: string,
    private name: string,
    private avatar: string,
    private email?: string,
    private updatedAt?: Date,
  ) {
    this.updatedAt = updatedAt ? new Date(updatedAt) : new Date();
  }

  // Getters
  getId(): string {
    return this.id;
  }
  getName(): string {
    return this.name;
  }
  getEmail(): string | undefined {
    return this.email;
  }
  getAvatar(): string {
    return this.avatar;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  // Update review
  update(avatar: string, name: string): void {
    this.name = name;
    this.avatar = avatar;
    this.updatedAt = new Date();
  }
}
