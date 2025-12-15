# Pkr Trackr

An online poker cash-game league tracker built with Next.js 16, TypeScript, Prisma, and Better Auth.

## Features

- **League Management**: Create and manage poker leagues with multiple seasons
- **Night Tracking**: Track individual game nights with buy-ins and cash-outs
- **Player Management**: Support for both registered users and guest players
- **Invitations**: Email-based invitation system for league members
- **Leaderboards**: Multiple leaderboard views (Best Player, Top Winner, Best Performer, etc.)
- **Metrics**: Automatic calculation of ROI, performance scores, and more
- **Validation**: Ensures buy-ins equal cash-outs before finalizing nights

## Tech Stack

- **Next.js 16** (App Router)
- **TypeScript**
- **Prisma 7** with PostgreSQL
- **Better Auth** (email/password authentication)
- **Tailwind CSS**
- **shadcn/ui**
- **Zod** (validation)
- **npm**

## Prerequisites

- Node.js 18+ 
- PostgreSQL database

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/pkr-trackr?schema=public"

# Better Auth
BETTER_AUTH_SECRET="your-secret-key-here" # Generate with: openssl rand -base64 32
BETTER_AUTH_URL="http://localhost:3000"

# Next.js
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Database Setup

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed the database with demo data
npm run db:seed
```

The seed file creates:
- A demo user (email: `demo@pkr-trackr.com`, password: `demo123`)
- A demo league
- 6 sample players (mix of guest and user-linked)
- 1 active season
- 6 sample nights (5 finalized, 1 draft) with various buy-in amounts

**Note:** The seed will display the login credentials after running. You can use these to log in immediately.

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
pkr-trackr/
├── app/                    # Next.js App Router pages
│   ├── login/             # Authentication pages
│   ├── register/
│   ├── invite/            # Invite acceptance flow
│   ├── leagues/           # League management
│   └── api/               # API routes
├── components/
│   └── ui/                # shadcn/ui components
├── lib/                   # Shared utilities
│   ├── auth.ts            # Better Auth configuration
│   ├── prisma.ts          # Prisma client
│   └── utils.ts           # Utility functions
├── src/
│   └── server/
│       ├── actions/       # Server actions
│       ├── auth/          # Auth utilities
│       └── metrics/       # Metrics calculations
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Seed file
└── public/                 # Static assets
```

## Core Concepts

### Domain Model

- **User**: Authenticated users
- **League**: A poker league
- **LeagueMember**: User membership in a league (ACTIVE/PENDING/REVOKED, OWNER/ADMIN/MEMBER)
- **Player**: Can be a guest or linked to a user
- **Season**: A time period within a league
- **Night**: A single game night (DRAFT/FINAL)
- **Entry**: A player's participation in a night (buy-in and cash-out)

### Metrics

All metrics are computed automatically:

- **Per Entry**: Profit, ROI, Performance Score, Table Share, Pot-Weighted Score
- **Per Season**: Total Profit, Total Buy-in, Season ROI, Season Score, Nights Played, Best Single Night, Best Table Share

### Validation Rules

- Money is stored in integer cents only
- A night cannot be finalized unless `sum(buyIns) === sum(cashOuts)`
- All performance metrics are computed, never manually edited

## Usage

### Creating a League

1. Register/Login
2. Click "Create League"
3. Fill in league name and description
4. You'll be automatically added as OWNER

### Inviting Members

1. Go to your league's Settings tab
2. Enter an email address
3. Click "Send Invite"
4. Share the invite link with the user
5. They'll be added as PENDING until they accept

### Managing Nights

1. Create a Season (Settings tab)
2. Go to Nights tab
3. Click "New Night"
4. Add entries for each player
5. Finalize the night when buy-ins equal cash-outs

### Viewing Leaderboards

Navigate to the Leaderboards tab to see:
- Best Player (by Season ROI)
- Top Winner (by Total Profit)
- Best Performer (by Season Score)
- Most Action (by Total Buy-in)
- Best Night (by single night score)
- Biggest Table Take (by best table share)

## Development

### Database Migrations

```bash
# Create a new migration
npx prisma migrate dev --name migration-name

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

### Prisma Studio

View and edit your database:

```bash
npx prisma studio
```

## Admin Dashboard

Currently, Pkr Trackr uses a **league-based permission system** rather than a global admin dashboard:

- **League Owners** can manage their league (invite members, create seasons, finalize nights)
- **League Admins** can manage most league functions (invite members, create seasons)
- **League Members** can view and participate in their leagues

There is **no system-wide admin dashboard** in the current implementation. Each league operates independently with its own owners and admins.

If you need a global admin dashboard to manage all leagues, users, and system settings, this would need to be added as a separate feature.

## License

MIT
