# Account Settings Error - Troubleshooting Guide

## 🚨 Current Issue
Client-side exception on `/handler/account-settings` page on deployed app: https://bananaguesser.vercel.app/handler/account-settings

## ✅ What We've Verified
- [x] Environment variables are correctly set locally
- [x] Stack Auth package version is current (2.8.39)
- [x] Handler configuration looks correct
- [x] Redis migration completed successfully

## 🎯 Most Likely Causes

### 1. **Production Domain Not Configured in Stack Auth**
**Symptom**: Works locally but fails in production
**Solution**: 
1. Go to [Stack Auth Dashboard](https://app.stack-auth.com)
2. Navigate to your project
3. Go to "Domain & Handlers" tab
4. Add domain: `https://bananaguesser.vercel.app`
5. Set handler path: `/handler` (default)
6. Save and redeploy

### 2. **Missing Environment Variables in Vercel**
**Symptom**: Build succeeds but runtime errors
**Solution**:
1. Go to Vercel Dashboard
2. Navigate to project settings
3. Add Environment Variables:
   ```
   NEXT_PUBLIC_STACK_PROJECT_ID=4ad86557-1867-4a05-85ff-3f2208d8fa4d
   NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=pck_p6gap4rpdfcwyvk4hr7j13md71kf0xx2v98j1a59mrq8r
   STACK_SECRET_SERVER_KEY=ssk_qq9twpecf4p5c62pz00b13cyf8cvhe7rkraxkysp5vp4r
   UPSTASH_REDIS_REST_URL="https://apt-dingo-7387.upstash.io"
   UPSTASH_REDIS_REST_TOKEN="ARzbAAImcDIxMTRlMWVmMDVkNzA0YjI3YjNiMWZhNmM1ZjM4ZWMxZnAyNzM4Nw"
   FAL_KEY=0d2f24e2-b7d0-4b4e-9aa7-ab0314ac3a92:b74b4a3d4cadc6bb41f8bb3ec77083fe
   ```

### 3. **Production Mode Not Enabled**
**Symptom**: Development settings causing production issues
**Solution**:
1. Complete domain configuration (step 1)
2. Go to "Project Settings" tab in Stack Auth
3. Enable production mode

## 🧪 Testing Steps

### Local Test
1. Run `pnpm run dev`
2. Navigate to `http://localhost:3000/handler/account-settings`
3. Should work without errors

### Production Test
1. After configuring domain in Stack Auth
2. Redeploy on Vercel
3. Navigate to `https://bananaguesser.vercel.app/handler/account-settings`
4. Should work without client-side errors

## 🔍 Debug Commands

Check local Stack Auth configuration:
```bash
# Verify environment variables
grep STACK .env.local

# Test local build
pnpm run build
pnpm run start

# Check for build-time errors
pnpm run build 2>&1 | grep -i error
```

## 📞 Next Steps if Still Failing

1. **Check browser console** for specific error messages
2. **Check Vercel function logs** for server-side errors
3. **Contact Stack Auth support** on [Discord](https://discord.stack-auth.com)
4. **Verify all environment variables** are identical between local and production

## 🎯 Expected Resolution

After configuring the production domain in Stack Auth dashboard and ensuring environment variables are set in Vercel, the account-settings page should work correctly.
