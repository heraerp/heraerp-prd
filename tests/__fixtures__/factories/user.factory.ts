/**
 * Test data factory for users
 */

export interface UserData {
  id?: string;
  email: string;
  password: string;
  name: string;
  role: 'owner' | 'admin' | 'manager' | 'user';
  organizationId?: string;
  permissions?: string[];
}

export class UserFactory {
  private static counter = 0;

  static create(overrides: Partial<UserData> = {}): UserData {
    const timestamp = Date.now();
    const uniqueId = `${timestamp}-${this.counter++}`;
    
    const defaults: UserData = {
      email: `test-user-${uniqueId}@example.com`,
      password: 'Test123!@#',
      name: `Test User ${uniqueId}`,
      role: 'user',
      permissions: []
    };

    return { ...defaults, ...overrides };
  }

  static createOwner(overrides: Partial<UserData> = {}): UserData {
    return this.create({
      role: 'owner',
      permissions: ['*'], // All permissions
      ...overrides
    });
  }

  static createAdmin(overrides: Partial<UserData> = {}): UserData {
    return this.create({
      role: 'admin',
      permissions: [
        'organizations:manage',
        'users:manage',
        'modules:manage',
        'settings:manage'
      ],
      ...overrides
    });
  }

  static createManager(overrides: Partial<UserData> = {}): UserData {
    return this.create({
      role: 'manager',
      permissions: [
        'entities:manage',
        'transactions:manage',
        'reports:view',
        'users:view'
      ],
      ...overrides
    });
  }

  static createReadOnlyUser(overrides: Partial<UserData> = {}): UserData {
    return this.create({
      role: 'user',
      permissions: [
        'entities:read',
        'transactions:read',
        'reports:view'
      ],
      ...overrides
    });
  }

  static createWithOrganization(organizationId: string, overrides: Partial<UserData> = {}): UserData {
    return this.create({
      organizationId,
      ...overrides
    });
  }

  static createBatch(count: number, overrides: Partial<UserData> = {}): UserData[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }

  static createTeam(organizationId: string): UserData[] {
    return [
      this.createOwner({ organizationId, name: 'Organization Owner' }),
      this.createAdmin({ organizationId, name: 'Admin User' }),
      this.createManager({ organizationId, name: 'Manager User' }),
      this.createReadOnlyUser({ organizationId, name: 'Read-Only User' })
    ];
  }

  static reset() {
    this.counter = 0;
  }
}