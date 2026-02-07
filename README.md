# betterMind 🧠

> A non-clinical, AI-assisted mental wellness platform built with TypeScript, React Native, Next.js, Express, and PostgreSQL.

[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🎯 Project Overview

**betterMind** is a full-stack mental wellness platform that demonstrates modern web and mobile development practices. Built specifically to showcase proficiency in the Nouri tech stack, it features:

- 🤖 **AI-Powered Conversations** - Chat with an empathetic AI using Google Gemini
- 🎙️ **Voice Support** - Text-to-speech with ElevenLabs for natural voice responses
- 📱 **Multi-Platform** - Web (Next.js) and Mobile (React Native) applications
- 🔐 **Secure Authentication** - JWT + Google OAuth
- 💾 **Persistent Storage** - PostgreSQL database with full conversation history
- 🎨 **Type-Safe** - 100% TypeScript with shared types across the stack

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend (Web)** | Next.js 14, React 18, TypeScript, Tailwind CSS |
| **Frontend (Mobile)** | React Native (Expo), TypeScript |
| **Backend** | Express.js, Node.js, TypeScript |
| **Database** | PostgreSQL 15 |
| **AI** | Google Gemini API |
| **Voice** | ElevenLabs API |
| **Auth** | JWT, Google OAuth |
| **State Management** | Zustand, React Query |
| **Testing** | Jest, React Testing Library |
| **DevOps** | Docker, Docker Compose |

## 📁 Monorepo Structure

```
betterMind/
├── apps/
│   ├── api/              # Express REST API (✅ Complete)
│   ├── web/              # Next.js web app (🚧 In Progress)
│   └── mobile/           # React Native app (🚧 In Progress)
├── packages/
│   └── shared/           # Shared TypeScript types (✅ Complete)
├── docs/                 # Documentation (✅ Complete)
├── scripts/              # Setup scripts
└── docker-compose.yml    # PostgreSQL setup
```

## 🚀 Quick Start

### Automated Setup (Recommended)

```bash
# Run the setup script
chmod +x scripts/setup.sh
./scripts/setup.sh
```

### Manual Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Set up environment variables
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
cp apps/mobile/.env.example apps/mobile/.env
# Edit the .env files with your API keys

# 3. Start PostgreSQL
docker-compose up -d

# 4. Build shared package
cd packages/shared && pnpm run build && cd ../..

# 5. Start development servers
pnpm run dev
```

### Access the Applications

- 🌐 **Web App**: http://localhost:3000
- 🔌 **API**: http://localhost:3001
- 📱 **Mobile**: Scan QR code from Expo
- 📚 **API Docs**: http://localhost:3001/api/v1/docs

## 🔑 Required API Keys

You'll need to obtain the following API keys:

1. **Google OAuth** ([Get it here](https://console.cloud.google.com/))
   - Create OAuth 2.0 Client ID
   - Add `http://localhost:3000` to authorized origins

2. **Google Gemini** ([Get it here](https://makersuite.google.com/app/apikey))
   - Free tier available
   - Used for AI conversations

3. **ElevenLabs** ([Get it here](https://elevenlabs.io/))
   - Free tier available
   - Used for text-to-speech

See [SETUP.md](./SETUP.md) for detailed instructions.

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [SETUP.md](./SETUP.md) | Detailed setup instructions |
| [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) | Complete project overview |
| [INTERVIEW_PREP.md](./INTERVIEW_PREP.md) | Interview preparation guide |
| [docs/architecture.md](./docs/architecture.md) | Architecture decisions (ADRs) |

## 🎓 Key Features & Learning Points

### Backend (Express + PostgreSQL)
- ✅ RESTful API design with consistent error handling
- ✅ JWT authentication + Google OAuth integration
- ✅ PostgreSQL with raw SQL (demonstrates SQL knowledge)
- ✅ Connection pooling and transaction support
- ✅ Input validation with express-validator
- ✅ Comprehensive error handling middleware
- ✅ External API integrations (Gemini, ElevenLabs)
- ✅ Well-commented code throughout

### Frontend (Next.js + React Native)
- ✅ Next.js 14 with App Router
- ✅ React Native with Expo
- ✅ Shared TypeScript types for type safety
- ✅ Axios API client with interceptors
- ✅ Secure token storage (localStorage/SecureStore)
- ✅ Tailwind CSS for styling

### Database Design
- ✅ Normalized schema with proper relationships
- ✅ UUID primary keys
- ✅ Foreign key constraints
- ✅ Cascade deletes
- ✅ Indexes on frequently queried columns

### Type Safety
- ✅ 100% TypeScript codebase
- ✅ Shared types between frontend and backend
- ✅ Type-safe API client
- ✅ Compile-time error detection

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests for specific app
cd apps/api && pnpm test

# Run with coverage
pnpm test -- --coverage

# Watch mode
pnpm test:watch
```

## 📊 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login with email/password
- `POST /api/v1/auth/google` - Login with Google OAuth
- `GET /api/v1/auth/me` - Get current user profile
- `PATCH /api/v1/auth/profile` - Update user profile

### Conversations
- `POST /api/v1/conversations` - Create new conversation
- `GET /api/v1/conversations` - List all conversations
- `GET /api/v1/conversations/:id` - Get conversation with messages
- `POST /api/v1/conversations/:id/messages` - Send a message
- `POST /api/v1/conversations/:conversationId/messages/:messageId/voice` - Generate voice
- `DELETE /api/v1/conversations/:id` - Delete conversation

## 🔒 Security Features

- 🔐 Bcrypt password hashing (10 rounds)
- 🎫 JWT tokens with expiration
- 🔑 Google OAuth verification
- 🛡️ SQL injection prevention (parameterized queries)
- ✅ Input validation on all endpoints
- 🚫 CORS configuration
- 🔒 Secure token storage

## 🎯 Interview Preparation

This project was built specifically to prepare for a Nouri interview. It demonstrates:

✅ **Full-Stack Development** - Backend, web, and mobile
✅ **TypeScript Expertise** - 100% TypeScript codebase
✅ **API Design** - RESTful principles and best practices
✅ **Database Design** - Normalized schema with proper relationships
✅ **Authentication** - JWT and OAuth implementation
✅ **External APIs** - Integration with third-party services
✅ **Code Quality** - Well-documented and tested code
✅ **Tech Stack Match** - Exact technologies used at Nouri

See [INTERVIEW_PREP.md](./INTERVIEW_PREP.md) for detailed preparation guide.

## 🚧 Project Status

### ✅ Completed
- Backend API (Express + PostgreSQL)
- Database schema and migrations
- Authentication system (JWT + Google OAuth)
- AI integration (Google Gemini)
- Voice integration (ElevenLabs)
- Shared TypeScript types
- API client for web and mobile
- Comprehensive documentation
- Docker setup

### 🚧 In Progress
- Web app UI components and pages
- Mobile app screens and navigation
- State management implementation
- Additional tests

## 🤝 Contributing

This is a personal project for interview preparation, but suggestions and improvements are welcome!

## 📝 License

MIT License - see LICENSE file for details

## 👨‍💻 Author

Built by Robin Fievet as a technical showcase for Nouri interview preparation.

**Interview Date**: February 11, 2026

---

## 💡 Quick Tips

- 📖 Start with [SETUP.md](./SETUP.md) for installation
- 🎯 Read [INTERVIEW_PREP.md](./INTERVIEW_PREP.md) before the interview
- 🏗️ Check [docs/architecture.md](./docs/architecture.md) for design decisions
- 💬 All code is heavily commented for learning purposes

**Good luck with your interview! 🚀**
