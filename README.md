# Banana Guesser 🍌

An AI-powered competitive word guessing game where players create challenges with sentences, AI generates visual clues, and others race to solve them using timed word reveals.

## 🎮 How It Works

1. **Create a Challenge**: Enter a sentence (up to 25 words) and AI generates an image representing it
2. **Word Purchasing**: Other players spend Game Credits (GC) to reveal individual words for 20 seconds
3. **Race to Solve**: First player to guess the complete sentence wins the prize pool
4. **Earn Credits**: Winners get rewarded with Game Credits, and you earn credits for creating popular challenges

## ✨ Features

- 🤖 **AI Image Generation** - Powered by fal.ai for high-quality visual clues
- 🔐 **Secure Authentication** - Stack Auth integration with user profiles
- ⏱️ **Timed Word Access** - Strategic 20-second reveals create competitive gameplay
- 💰 **Game Credits System** - Earn and spend GC for word reveals and prizes
- 🎯 **Real-time Updates** - Live challenge status and wallet updates
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile
- ☁️ **Redis Backend** - Fast, scalable data storage with Upstash

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- Accounts needed:
  - [Stack Auth](https://app.stack-auth.com) (authentication)
  - [fal.ai](https://fal.ai) (AI image generation)
  - [Upstash Redis](https://console.upstash.com) (database)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/banana-guesser.git
   cd banana-guesser
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Set up environment variables**

   Create a `.env.local` file in the project root:
   ```env
   # Stack Auth Configuration (Required)
   NEXT_PUBLIC_STACK_PROJECT_ID=your-project-id-here
   NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=your-publishable-client-key-here
   STACK_SECRET_SERVER_KEY=your-secret-server-key-here

   # Upstash Redis Configuration (Required)
   UPSTASH_REDIS_REST_URL=your-upstash-redis-url-here
   UPSTASH_REDIS_REST_TOKEN=your-upstash-redis-token-here

   # fal.ai Configuration (Required)
   FAL_KEY=your-fal-ai-key-here
   ```

4. **Get your API keys**

   **Stack Auth:**
   - Go to [app.stack-auth.com](https://app.stack-auth.com)
   - Create a new project
   - Navigate to API Keys in the sidebar
   - Copy Project ID, Publishable Client Key, and Secret Server Key

   **Upstash Redis:**
   - Go to [console.upstash.com](https://console.upstash.com/)
   - Create a Redis database (choose "Global" type)
   - Go to Details > REST API > .env tab
   - Copy the URL and Token

   **fal.ai:**
   - Go to [fal.ai](https://fal.ai)
   - Sign up and get your API key
   - Copy the key

5. **Run the Redis migration** (first time setup)
   ```bash
   npm run migrate-to-redis
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

7. **Open the app**

   Navigate to [http://localhost:3000](http://localhost:3000) in your browser

## 🎯 Game Mechanics

### Creating Challenges
- Enter a sentence that others will guess
- AI generates a visual representation
- Set a prize amount in Game Credits
- Your challenge goes live for others to play

### Playing Challenges
- View AI-generated images with hidden words
- Spend GC to reveal individual words for 20 seconds
- Use revealed words as clues to guess the full sentence
- First correct guess wins the prize pool

### Credit System
- Start with initial Game Credits
- Earn more by creating popular challenges
- Spend credits strategically on word reveals
- Credits refill over time

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Stack Auth
- **Database**: Upstash Redis
- **AI Images**: fal.ai Flux model
- **Icons**: Lucide React
- **Deployment**: Vercel-ready

## 📁 Project Structure

```
src/
├── app/                 # Next.js app router
│   ├── api/            # API routes
│   ├── challenge/      # Challenge pages
│   └── credits/        # Credits management
├── components/         # React components
│   ├── Dashboard.tsx   # Main game dashboard
│   ├── ChallengeCard.tsx # Individual challenge UI
│   └── CreateChallengeModal.tsx
├── lib/               # Utilities
│   ├── types.ts       # TypeScript definitions
│   ├── data.ts        # Redis data layer
│   └── rate-limiter.ts # API rate limiting
└── stack/             # Stack Auth configuration
```

## 🚀 Deployment

The app is ready for deployment on Vercel:

1. Push your code to GitHub
2. Connect to Vercel
3. Add your environment variables in Vercel dashboard
4. Deploy!

## 🎮 Demo

[Live Demo Coming Soon]

*Screenshots and gameplay videos will be added here*

## 📊 API Endpoints

- `GET /api/challenges` - List all active challenges
- `POST /api/challenges` - Create new challenge
- `GET /api/challenges/[id]` - Get specific challenge
- `POST /api/challenges/[id]/purchase` - Purchase word access
- `POST /api/challenges/[id]/guess-word` - Submit word guess
- `GET /api/wallet/[userId]` - Get user wallet balance
- `GET /api/credits/[userId]` - Get credit status
- `POST /api/credits/[userId]` - Refill credits

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [fal.ai](https://fal.ai) for AI image generation
- [Stack Auth](https://stack-auth.com) for authentication
- [Upstash](https://upstash.com) for Redis hosting
- [Vercel](https://vercel.com) for hosting platform

---

Built with ❤️ for the AI + Gaming community. Happy guessing! 🍌