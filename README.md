# 💬 Nexus Chat App

A modern, real-time chat application built with Next.js 15, featuring direct messaging, group chats, and AI assistance.

![Next.js](https://img.shields.io/badge/Next.js_15-000000?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)

## ✨ Features

- 🔐 **Secure Authentication** - JWT-based auth with Supabase
- 💬 **Real-time Messaging** - Instant message delivery
- 👥 **Group Chats** - Create and manage group conversations
- 🔍 **User Search** - Find and connect with users
- 🎨 **Modern UI** - Beautiful interface with Tailwind CSS and shadcn/ui
- 📱 **Responsive Design** - Works seamlessly on all devices
- 🌐 **Animated Backgrounds** - Canvas-based particle effects

## 🛠️ Tech Stack

### Frontend
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **UI Library:** React 19
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui, Radix UI
- **Icons:** Lucide React
- **Image Handling:** Next.js Image Optimization
- **State Management:** React Hooks

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** Supabase (PostgreSQL)
- **Authentication:** JWT + Supabase Auth
- **API:** RESTful API

### Development Tools
- **Package Manager:** npm/pnpm
- **Code Quality:** ESLint, TypeScript strict mode
- **Git:** Conventional Commits

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or pnpm package manager
- Supabase account and project
- Backend server running (see backend README)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/chat-app.git
cd chat-app/frontend
```

2. **Install dependencies**
```bash
npm install
# or
pnpm install
```

3. **Set up environment variables**

Create a `.env.local` file in the frontend root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=http://localhost:8080
```

4. **Run the development server**
```bash
npm run dev
# or
pnpm dev
```

5. **Open your browser**

Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/            # Authentication routes
│   │   ├── api/               # API route handlers
│   │   ├── dashboard/         # Main chat interface
│   │   └── page.tsx           # Landing page
│   ├── components/
│   │   ├── common/            # Reusable components
│   │   └── ui/                # shadcn/ui components
│   ├── lib/
│   │   ├── api/               # API client functions
│   │   ├── supabase/          # Supabase client setup
│   │   └── types/             # TypeScript type definitions
│   └── styles/                # Global styles
├── public/                     # Static assets
└── tsconfig.json              # TypeScript configuration
```

## 🔑 Key Features Implementation

### User Authentication
- Secure login/signup with JWT tokens
- Session management with HTTP-only cookies
- Protected routes with middleware

### Real-time Chat
- Conversation list with last message preview
- Message threading and timestamps
- User online status indicators
- Typing indicators (planned)

### User Search
- Debounced search for better performance
- Real-time user filtering
- One-click conversation creation

### Responsive Design
- Mobile-first approach
- Glassmorphism effects
- Smooth animations and transitions

## 🎨 UI Components

Built with shadcn/ui and custom components:
- Custom animated background with canvas
- Type animation for hero section
- Feature cards with hover effects
- Conversation items with avatars
- Search interface with debouncing

## 📝 Available Scripts

```bash
# Development
npm run dev          # Start dev server

# Production
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
```

## 🔐 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key | Yes |
| `NEXT_PUBLIC_API_URL` | Backend API URL | Yes |

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'feat: add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
