# Migration Notes for Branding + Onboarding Update

## Database Schema Changes

The following Prisma schema changes require a migration:

1. **User model**:

    - Kept: `name String` (required by Better Auth)
    - Added: `firstName String`, `lastName String` (primary identity fields)
    - Added: `onboardingCompletedAt DateTime?`
    - Note: `name` is auto-populated from `firstName + lastName` for Better Auth compatibility

2. **Player model**:
    - Changed: `name String` → `displayName String`

## Migration Steps

1. **Create and run the migration**:

    ```bash
    npx prisma migrate dev --name add_branding_and_onboarding
    ```

2. **Update existing data** (if any):

    - For existing users with `name`, you'll need to split into `firstName` and `lastName`
    - For existing players with `name`, rename to `displayName`

3. **Regenerate Prisma Client**:
    ```bash
    npx prisma generate
    ```

## Breaking Changes

-   All references to `user.name` must be updated to use `getUserFullName(user)`
-   All references to `player.name` must be updated to `player.displayName`
-   Registration form now requires separate `firstName` and `lastName` fields

## New Features

-   Logo component with chip icon
-   Brand colors in Tailwind config
-   Inter font family
-   Onboarding flow (welcome → league → players → first night → complete)
-   Onboarding status tracking
-   Dark mode by default
