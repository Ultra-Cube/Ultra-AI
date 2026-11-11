# Role-Based Access Control (RBAC) System

## Overview

The Ultra AI Platform implements a comprehensive Role-Based Access Control (RBAC) system to manage user permissions and access to resources. This system provides fine-grained control over what users can do based on their assigned roles.

## Role Hierarchy

The system defines four role levels with hierarchical permissions:

### 1. USER (Basic User)
- **Level**: 1
- **Permissions**:
  - Read and update own profile
  - Create and read AI requests
  - Read and update workspace
  - Create and read tasks
- **Use Case**: Regular platform users

### 2. MODERATOR
- **Level**: 2
- **Permissions**: Inherits from USER, plus:
  - Read user information
  - Update and delete content
  - Read and update reports
- **Use Case**: Content moderation and community management

### 3. ADMIN (Administrator)
- **Level**: 3
- **Permissions**: Inherits from MODERATOR, plus:
  - Manage users (create, update, delete)
  - Manage content
  - Read system information
  - Read analytics
  - Manage blockchain rewards
- **Use Case**: Platform administration and management

### 4. SUPER_ADMIN (Super Administrator)
- **Level**: 4
- **Permissions**: Inherits from ADMIN, plus:
  - Manage system settings
  - Manage roles
  - Manage security settings
  - Manage infrastructure
- **Use Case**: System-level administration and configuration

## Permission System

Permissions are defined by:
- **Resource**: The entity being accessed (e.g., 'user', 'content', 'system')
- **Action**: The operation being performed (create, read, update, delete, manage)

The `manage` action grants all CRUD (Create, Read, Update, Delete) permissions for a resource.

## Usage

### 1. Protect Routes by Role

```typescript
import { requireRole, UserRole } from './rbac';

// Only ADMINs and SUPER_ADMINs can access
router.get('/admin/dashboard',
  requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  (req, res) => {
    // Handler code
  }
);
```

### 2. Protect Routes by Permission

```typescript
import { requirePermission } from './rbac';

// Requires 'user' manage permission
router.put('/users/:id',
  requirePermission('user', 'manage'),
  (req, res) => {
    // Handler code
  }
);
```

### 3. Require Minimum Role Level

```typescript
import { requireMinimumRole, UserRole } from './rbac';

// Requires at least MODERATOR role (MODERATOR, ADMIN, or SUPER_ADMIN)
router.get('/audit-logs',
  requireMinimumRole(UserRole.MODERATOR),
  (req, res) => {
    // Handler code
  }
);
```

### 4. Owner or Admin Access

```typescript
import { requireOwnerOrAdmin } from './rbac';

// User can access their own profile, or ADMINs can access any profile
router.get('/users/:userId/profile',
  requireOwnerOrAdmin('userId'),
  (req, res) => {
    // Handler code
  }
);
```

### 5. Check Permissions Programmatically

```typescript
import { hasPermission, UserRole } from './rbac';

const userRole = UserRole.MODERATOR;

if (hasPermission(userRole, 'content', 'delete')) {
  // User has permission to delete content
}
```

### 6. Validate User Management

```typescript
import { canManageUser, UserRole } from './rbac';

const managerRole = UserRole.ADMIN;
const targetRole = UserRole.USER;

if (canManageUser(managerRole, targetRole)) {
  // Admin can manage this user
}
```

## Database Schema

The `User` model includes a `role` field:

```prisma
enum UserRole {
  USER
  MODERATOR
  ADMIN
  SUPER_ADMIN
}

model User {
  id        String     @id @default(cuid())
  email     String     @unique
  passwordHash String
  role      UserRole   @default(USER)
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt

  @@index([email])
  @@index([role])
}
```

## API Responses

### Unauthorized (401)
User is not authenticated:

```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

### Forbidden (403)
User lacks required role:

```json
{
  "error": "Forbidden",
  "message": "This action requires one of the following roles: ADMIN, SUPER_ADMIN",
  "requiredRoles": ["ADMIN", "SUPER_ADMIN"],
  "userRole": "USER"
}
```

User lacks required permission:

```json
{
  "error": "Forbidden",
  "message": "You do not have permission to manage user",
  "requiredPermission": {
    "resource": "user",
    "action": "manage"
  }
}
```

## Testing

The RBAC system includes comprehensive test coverage:

- **Role Permission Tests**: 20+ tests for permission checking
- **Middleware Tests**: 30+ tests for access control
- **Integration Tests**: 15+ tests for protected routes

Run tests:

```bash
npm test -- rbac
```

## Security Considerations

1. **Default Role**: New users are assigned `USER` role by default
2. **Role Validation**: All role changes are validated before application
3. **Hierarchical Permissions**: Higher roles inherit permissions from lower roles
4. **Immutable SUPER_ADMIN**: Only SUPER_ADMINs can create or modify SUPER_ADMIN accounts
5. **Audit Logging**: All role changes should be logged for audit purposes

## Best Practices

### 1. Principle of Least Privilege
Assign users the minimum role required for their function.

### 2. Use Specific Permissions
Prefer `requirePermission()` over `requireRole()` when checking for specific actions.

### 3. Protect All Sensitive Routes
Always protect admin and sensitive routes with appropriate RBAC middleware.

### 4. Validate Target Roles
When allowing role updates, use `canManageUser()` to validate the manager can modify the target role.

### 5. Document Protected Routes
Clearly document which roles/permissions are required for each route.

## Migration

To add the role field to existing database:

```bash
# Generate Prisma migration
npx prisma migrate dev --name add_user_roles

# Apply migration to production
npx prisma migrate deploy
```

Update existing users (optional):

```typescript
// Set specific users as admin
await prisma.user.update({
  where: { email: 'admin@example.com' },
  data: { role: UserRole.ADMIN },
});
```

## Extending the System

### Add New Role

1. Update `UserRole` enum in both `schema.prisma` and `roles.ts`
2. Add role permissions to `ROLE_PERMISSIONS`
3. Update role hierarchy in `isSeniorRole()`
4. Add display name to `getRoleDisplayName()`
5. Run database migration
6. Update tests

### Add New Resource

1. Add resource permissions to relevant roles in `ROLE_PERMISSIONS`
2. Protect routes with `requirePermission(resource, action)`
3. Add tests for new resource protection

### Add Custom Permission Logic

```typescript
export function customPermissionCheck(user: User): boolean {
  // Custom logic
  return hasPermission(user.role, 'resource', 'action') && 
         additionalCondition();
}
```

## Examples

See [admin.routes.ts](./routes/admin.routes.ts) for complete implementation examples including:
- Dashboard access control
- User management endpoints
- System settings protection
- Audit log access
- Analytics access control
- Owner-or-admin pattern

## Architecture

```
┌─────────────────────────────────────────┐
│         API Request                    │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│    Authentication Middleware           │
│    (JWT verification)                  │
└────────────────┬────────────────────────┘
                 │ req.user = { id, email, role }
                 ▼
┌─────────────────────────────────────────┐
│    RBAC Middleware                     │
│    - requireRole()                     │
│    - requirePermission()               │
│    - requireMinimumRole()              │
│    - requireOwnerOrAdmin()             │
└────────────────┬────────────────────────┘
                 │
       ┌─────────┴──────────┐
       │                    │
       ▼                    ▼
   Allowed            Forbidden (403)
       │
       ▼
┌─────────────────────────────────────────┐
│    Route Handler                       │
│    (Business Logic)                    │
└─────────────────────────────────────────┘
```

## Support

For questions or issues with RBAC:
- Check the test files for usage examples
- Review [admin.routes.ts](./routes/admin.routes.ts) for implementation patterns
- Contact the development team

## License

Part of the Ultra AI Platform - All rights reserved.
