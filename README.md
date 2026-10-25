# Nexus Chat App

Nexus is a real-time chat application with a Next.js frontend, an Express API, Supabase persistence, and Socket.IO events for messaging and presence.

## Stack

- Frontend: Next.js 15 App Router, React 19, TypeScript
- Styling: Tailwind CSS 4 and custom UI components
- Backend: Express 5 and TypeScript
- Database: Supabase PostgreSQL
- Authentication: JWT tokens, bcrypt password hashing, and route middleware
- Real-time features: Socket.IO
- Package manager: pnpm

## Features

- Email/password signup and login
- Protected dashboard routes
- Direct and group conversation support
- User search and conversation creation
- Paginated message loading
- Optimistic sending, retry, edit, delete, and reply flows
- Typing indicators and read receipts
- Online presence tracking
- Responsive landing, authentication, and chat interfaces
- Rate limiting on authentication endpoints

## Repository Layout

```text
chat-app/
├── backend/
│   ├── src/
│   │   ├── controllers/       Request handlers
│   │   ├── middlewares/       JWT authentication and request middleware
│   │   ├── routes/            Express API routes
│   │   ├── services/          Supabase queries and business rules
│   │   ├── socket/            Socket.IO server and events
│   │   └── types/             Backend database types
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/               App Router pages and layouts
│   │   ├── components/        Auth, chat, landing, common, and UI components
│   │   ├── hooks/             Chat state and socket hooks
│   │   ├── lib/               API client, socket client, auth, and types
│   │   └── middleware.ts      JWT route protection
│   ├── public/                Static assets
│   └── package.json
├── ARCHITECTURE.md
├── DEPLOYMENT_SETUP.md
└── README.md
```

## Prerequisites

- Node.js 18 or newer
- pnpm
- A Supabase project with the application schema
- Backend and frontend environment variables configured

## Local Development

Install dependencies independently in each package:

```bash
cd backend
pnpm install

cd ../frontend
pnpm install
```

Create `backend/.env`:

```env
PORT=8080
FRONTEND_URL=http://localhost:3000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=replace-with-a-long-random-secret
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
JWT_SECRET=replace-with-the-same-secret-used-by-the-backend
```

Do not commit either environment file. Never expose `SUPABASE_SERVICE_ROLE_KEY` to the frontend.

Start the backend in one terminal:

```bash
cd backend
pnpm dev
```

Start the frontend in another terminal:

```bash
cd frontend
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Frontend Scripts

Run these commands from `frontend/`:

| Command | Purpose |
|---|---|
| `pnpm dev` | Start the Next.js development server |
| `pnpm build` | Create a production build |
| `pnpm start` | Serve the production build |
| `pnpm typecheck` | Run TypeScript without emitting files |
| `pnpm test` | Run Vitest in watch mode |
| `pnpm test:coverage` | Run Vitest with coverage |
| `pnpm lint` | Run the configured Next.js lint command |

## Backend Scripts

Run these commands from `backend/`:

| Command | Purpose |
|---|---|
| `pnpm dev` | Run the TypeScript server with ts-node |
| `pnpm build` | Compile TypeScript to `dist/` |
| `pnpm start` | Run the compiled server |
| `pnpm watch` | Watch TypeScript compilation |
| `pnpm typecheck` | Run TypeScript without emitting files |
| `pnpm test` | Run Jest tests |
| `pnpm test:watch` | Run Jest in watch mode |
| `pnpm test:coverage` | Run Jest with coverage |
| `pnpm clean` | Remove the backend `dist/` directory |

## Application Routes

### Frontend pages

- `/` - Landing page
- `/login` - Login form
- `/signup` - Signup flow
- `/dashboard` - Protected chat dashboard
- `/contact` - Contact page
- `/privacy` - Privacy policy
- `/terms` - Terms of service

The middleware protects `/dashboard` and redirects authenticated users away from `/login` and `/signup`.

### Backend HTTP API

All protected endpoints require an `Authorization: Bearer <token>` header.

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/health` | Backend health check |
| `POST` | `/api/auth/signup` | Create an account and return a JWT |
| `POST` | `/api/auth/login` | Authenticate and return a JWT |
| `POST` | `/api/auth/verify` | Verify a JWT |
| `GET` | `/api/conversations` | List the current user's conversations |
| `GET` | `/api/conversations/:conversationId` | Fetch one conversation |
| `POST` | `/api/conversations` | Create a direct or group conversation |
| `GET` | `/api/users/search?q=...` | Search users |
| `GET` | `/api/messages/:conversationId` | Fetch paginated messages |
| `POST` | `/api/messages/:conversationId` | Send a message |
| `PUT` | `/api/messages/:conversationId/:messageId` | Edit a message |
| `DELETE` | `/api/messages/:conversationId/:messageId` | Soft-delete a message |

Authentication is rate-limited by IP by default to five login attempts per 15 minutes and three signups per hour. The limits can be changed with `AUTH_RATE_LIMIT_MAX` and `SIGNUP_RATE_LIMIT_MAX`.

## Real-Time Events

The browser connects to the backend through Socket.IO using the JWT from the auth cookie.

Client-to-server events:

- `join:conversation` with `{ conversationId }`
- `leave:conversation` with `{ conversationId }`
- `conversation:markRead` with `{ conversationId }`
- `typing:start` and `typing:stop` with `{ conversationId }`

Server-to-client events:

- `message:new`
- `message:update`
- `message:delete`
- `conversation:update`
- `conversation:new`
- `typing:start` and `typing:stop`
- `messages:read`
- `presence:online`, `presence:offline`, and `presence:list`

The client remembers joined conversation rooms and re-joins them after a socket reconnect. The message hook also handles optimistic messages and deduplicates socket/API delivery races.

## Authentication Notes

The backend signs JWTs containing the user ID and email. The frontend stores the token in a browser cookie named `token` with `SameSite=Lax`; it is not an HTTP-only cookie because the client reads it to authenticate Socket.IO and API requests. Use HTTPS in production so the `Secure` flag is applied.

## Deployment

The documented deployment targets are Vercel for the frontend and Render for the backend. See [DEPLOYMENT_SETUP.md](DEPLOYMENT_SETUP.md) for provider configuration and troubleshooting.

Typical production variables are:

- Render: `FRONTEND_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, and optionally `PORT`
- Vercel: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SUPABASE_URL`, and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Configure CORS with the exact deployed frontend URL. Multiple frontend origins can be separated by commas.

## Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) - Detailed architecture and data-flow notes
- [DEPLOYMENT_SETUP.md](DEPLOYMENT_SETUP.md) - Vercel and Render setup

## Security Basics

- Keep `.env` and `.env.local` files out of version control.
- Keep the Supabase service-role key on the backend only.
- Use a strong, stable `JWT_SECRET` in each deployed environment.
- Configure `FRONTEND_URL` narrowly instead of allowing arbitrary origins.
- Treat client-side JWT cookies as readable by JavaScript and protect production traffic with HTTPS.
