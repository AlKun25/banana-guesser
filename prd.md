# Word Reveal Game - PRD

## Product Overview
A competitive word-guessing game where users buy temporary access to reveal hidden words in AI-generated images, race to solve complete sentences, and earn money by creating challenges.

## Core Value Proposition
- **For Players**: Solve puzzles collaboratively while competing for first-solver rewards
- **For Creators**: Monetize creative sentence challenges through word access fees
- **For Community**: Build a shared knowledge base of solved challenges

## Key Features

### 1. Dashboard Page
- **Challenge Grid**: Card-based layout displaying challenges
- **Challenge Cards**: Show AI-generated images with hidden sentence overlays
- **Visual States**: 
  - Grayed out words (purchasable)
  - Green words (already purchased by others)
  - Blank spaces for unpurchased words
- **Add Challenge Button**: Floating action button for creating new challenges

### 2. Challenge Creation Flow
- **Input**: Single sentence (max 25 words)
- **Processing**: AI generates image representing the sentence
- **Word Selection**: System automatically identifies key words to hide
- **Publishing**: Challenge goes live on dashboard

### 3. Challenge Playing Flow
- **Word Purchase**: Click grayed-out word → payment → 20-second exclusive access
- **Image Reveal**: Show image without that specific word during exclusive window
- **Timer Display**: Countdown showing when word becomes public
- **Sentence Guessing**: Input field to guess complete sentence
- **Success State**: Unlock challenge for all + earn reward money

### 4. Payment & Access System
- **Word Pricing**: Dynamic pricing per word
- **Exclusive Access**: 20-second private viewing window
- **Public Release**: Word becomes visible to all users after timer
- **Loading States**: Image generation progress indicators

## User Flows

### Creator Journey
1. Click floating + button
2. Enter sentence (≤25 words)
3. AI generates representative image
4. System identifies purchasable words
5. Challenge published to dashboard

### Player Journey
1. Browse dashboard challenges
2. Select interesting challenge
3. View available words (green = free, gray = purchasable)
4. Purchase word access
5. View exclusive image for 20 seconds
6. Attempt sentence guess
7. Win reward if first to solve

## Tech Stack

### Core Framework
- **Frontend/Backend**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Hosting**: Vercel

### Database & Storage
- **Database**: In-memory store (JSON files for persistence)
- **File Storage**: Direct image URLs from fal.ai

### Authentication & Payments
- **Auth**: StackAuth
- **Payments**: StackAuth payment system

### AI & Image Generation
- **Image API**: fal.ai
- **Model**: Gemini Flash Image 2.5
- **Processing**: Server-side API routes

### Key Dependencies
```json
{
  "dependencies": {
    "next": "^14.0.0",
    "@stackauth/react": "latest",
    "fal-ai": "latest"
  }
}
```

## Technical Requirements

### API Routes Structure
```
/api/challenges/              # GET, POST challenges
/api/challenges/[id]          # GET specific challenge
/api/challenges/[id]/purchase # POST purchase word access
/api/challenges/[id]/generate # POST generate challenge image
/api/challenges/[id]/guess    # POST submit sentence guess
```

### Database Schema (JSON Files)
```
data/challenges.json      # All challenges
data/purchases.json       # User purchases & timers
data/users.json          # Basic user data
```

### Component Structure
```
components/
├── ChallengeCard.tsx     # Dashboard challenge display
├── WordSelector.tsx      # Interactive word selection
├── PaymentModal.tsx      # Purchase flow
├── Timer.tsx             # Countdown component
└── GuessInput.tsx        # Sentence guessing
```

## MVP Scope (3-Hour Hackathon)

### Must Have
✅ Basic dashboard with challenge cards  
✅ Challenge creation (text input + image generation)  
✅ Word purchase flow  
✅ 20-second exclusive access timer  
✅ Basic sentence guessing  
✅ StackAuth integration  

### Nice to Have
⭐ Dynamic word pricing  
⭐ User wallet/earnings tracking  
⭐ Challenge difficulty ratings  
⭐ Sound effects for word reveals  

### Out of Scope
❌ Advanced image editing  
❌ Multi-language support  
❌ Complex user profiles  
❌ Challenge categories/tags  

## Data Models

### Challenge
```
{
  id: string
  sentence: string
  imageUrl: string
  words: Array<{
    text: string
    position: number
    isPurchased: boolean
    purchasedBy: string | null
    purchaseTime: Date | null
  }>
  createdBy: string
  solvedBy: string | null
  isActive: boolean
}
```

### User Purchase
```
{
  userId: string
  challengeId: string
  wordIndex: number
  purchaseTime: Date
  accessExpiresAt: Date
}
```

## Implementation Notes

### Critical Path
1. Set up Next.js project with StackAuth
2. Create basic dashboard UI
3. Implement image generation pipeline
4. Build word selection and payment flow
5. Add timer-based access control
6. Integrate sentence guessing logic

### Technical Considerations
- **Image Generation**: Cache generated images to avoid regeneration
- **Timer Sync**: Use server-side timestamps for accurate countdowns
- **Payment Flow**: Handle async payment confirmation
- **State Management**: Consider React Context for user purchases
- **Error Handling**: Graceful fallbacks for API failures

---

**Target Launch**: End of hackathon day  
**Team Focus**: Frontend experience + payment integration + AI pipeline