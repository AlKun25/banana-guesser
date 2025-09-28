# Environment Variables Setup Guide

## 🚨 URGENT: Fix Account Settings Error

Your application is showing a client-side error on the account-settings page because Stack Auth environment variables are missing.

## Required Environment Variables

Create or update your `.env.local` file with these variables:

```bash
# Stack Auth Configuration (REQUIRED)
NEXT_PUBLIC_STACK_PROJECT_ID=your-project-id-here
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=your-publishable-client-key-here
STACK_SECRET_SERVER_KEY=your-secret-server-key-here

# Upstash Redis Configuration (REQUIRED after migration)
UPSTASH_REDIS_REST_URL=your-upstash-redis-url-here
UPSTASH_REDIS_REST_TOKEN=your-upstash-redis-token-here

# fal.ai Configuration (REQUIRED for image generation)
FAL_KEY=your-fal-ai-key-here
```

## How to Get Stack Auth Keys

1. **Go to Stack Auth Dashboard**: [app.stack-auth.com](https://app.stack-auth.com)
2. **Create an Account** if you don't have one
3. **Create a New Project**
4. **Navigate to API Keys** (left sidebar)
5. **Create API Keys** and copy:
   - Project ID
   - Publishable Client Key  
   - Secret Server Key

## How to Get Redis Keys

1. **Go to Upstash Console**: [console.upstash.com](https://console.upstash.com/)
2. **Create a Redis Database** (choose "Global" type)
3. **Go to Details > REST API > .env**
4. **Copy the URL and Token**

## How to Get fal.ai Key

1. **Go to fal.ai**: [fal.ai](https://fal.ai)
2. **Sign up and get your API key**
3. **Copy the key**

## After Setting Environment Variables

1. **Restart your development server**:
   ```bash
   pnpm run dev
   ```

2. **Run the Redis migration** (if you haven't already):
   ```bash
   pnpm run migrate-to-redis
   ```

3. **Test the account settings page**:
   - Navigate to `/handler/account-settings`
   - Should now work without client-side errors

## Troubleshooting

- Make sure `.env.local` is in your project root
- Restart the development server after adding variables
- Check the browser console for specific error messages
- Verify all keys are correctly copied without extra spaces
