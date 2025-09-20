# Word Reveal Game - Setup Instructions

## Prerequisites
- Node.js 18+ installed
- StackAuth account (https://app.stack-auth.com)
- fal.ai account (https://fal.ai)

## Environment Setup

1. Create a `.env.local` file in the project root with the following variables:

```bash
# StackAuth Configuration
NEXT_PUBLIC_STACK_PROJECT_ID=your-project-id-here
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=your-publishable-client-key-here
STACK_SECRET_SERVER_KEY=your-secret-server-key-here

# fal.ai Configuration
FAL_KEY=your-fal-ai-key-here
```

## Getting API Keys

### StackAuth
1. Go to https://app.stack-auth.com
2. Create a new project
3. Create API keys from the left sidebar
4. Copy the Project ID, Publishable Client Key, and Secret Server Key

### fal.ai
1. Go to https://fal.ai
2. Sign up and get your API key
3. Copy the key to FAL_KEY in your .env.local

## Running the Application

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open http://localhost:3000 in your browser

## How to Use

1. Sign up/Sign in using StackAuth
2. Create challenges by clicking the + button
3. Enter a sentence (max 25 words)
4. AI will generate an image for your sentence
5. Other players can purchase word access for $5/20 seconds
6. First player to guess the complete sentence wins $50!

## Features Implemented

✅ StackAuth authentication
✅ Challenge creation with AI image generation
✅ Word purchase system with 20-second timer
✅ Sentence guessing with rewards
✅ User wallet system
✅ Real-time word access countdown
✅ Responsive UI with Tailwind CSS

## Architecture

- **Frontend**: Next.js 14 with TypeScript and Tailwind CSS
- **Authentication**: StackAuth
- **Database**: JSON file storage (simplified for hackathon)
- **AI Images**: fal.ai Flux model
- **Payments**: Integrated with user wallet system

## API Endpoints

- `GET /api/challenges` - List all challenges
- `POST /api/challenges` - Create new challenge
- `GET /api/challenges/[id]` - Get specific challenge
- `POST /api/challenges/[id]/generate` - Generate AI image
- `POST /api/challenges/[id]/purchase` - Purchase word access
- `POST /api/challenges/[id]/guess` - Submit sentence guess
- `GET /api/wallet/[userId]` - Get user wallet balance
