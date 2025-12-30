# Meta Ads Integration Setup Guide

## Overview
This guide will help you connect your real Facebook/Meta Ads account to LeadPilot CRM.

## Prerequisites
- Facebook Developer Account
- Facebook Business Account with Ad Account
- Meta App created in Facebook Developer Console

## Step 1: Create Meta App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click **"My Apps"** → **"Create App"**
3. Select **"Business"** as app type
4. Fill in app details:
   - App Name: `LeadPilot CRM`
   - App Contact Email: Your email
5. Click **"Create App"**

## Step 2: Configure OAuth Settings

1. In your app dashboard, go to **Settings** → **Basic**
2. Note down your **App ID** and **App Secret**
3. Click **"Add Platform"** → Select **"Website"**
4. Add your site URL: `http://localhost:5174` (for development)
5. For production, add your production URL

## Step 3: Configure OAuth Redirect URIs

1. Go to **Products** → **Facebook Login** → **Settings**
2. Add **Valid OAuth Redirect URIs**:
   - Development: `http://localhost:5174/integrations/meta-ads/callback`
   - Production: `https://yourdomain.com/integrations/meta-ads/callback`

## Step 4: Request Permissions

1. Go to **Products** → **Facebook Login** → **Settings** → **Advanced**
2. Add the following permissions:
   - `ads_read` - Read ad account data
   - `ads_management` - Manage ads
   - `business_management` - Access business manager
   - `leads_retrieval` - Retrieve lead data

## Step 5: Configure Environment Variables

Create or update your `.env` file in the project root:

```env
# Meta Ads Integration
VITE_META_APP_ID=your_app_id_here
VITE_META_APP_SECRET=your_app_secret_here
```

**⚠️ Security Note:** 
- For production, the App Secret should be stored securely on the backend
- The current implementation uses the secret in the frontend for simplicity
- In production, create a backend endpoint to exchange the OAuth code for tokens

## Step 6: Test the Integration

1. Start your development server: `npm run dev`
2. Navigate to **Integrations** → **Meta Ads**
3. Click **"Connect Facebook"**
4. You'll be redirected to Facebook login
5. Log in and authorize the app
6. You'll be redirected back to LeadPilot
7. Your ad accounts should appear in the connected accounts list

## Step 7: Production Setup

### Backend Token Exchange (Recommended)

For production, create a backend endpoint to securely exchange the OAuth code:

```javascript
// Backend endpoint: /api/meta-ads/oauth-callback
app.post('/api/meta-ads/oauth-callback', async (req, res) => {
  const { code } = req.body;
  
  const tokenURL = 'https://graph.facebook.com/v18.0/oauth/access_token';
  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID,
    client_secret: process.env.META_APP_SECRET,
    redirect_uri: process.env.META_REDIRECT_URI,
    code: code
  });

  const response = await fetch(`${tokenURL}?${params.toString()}`);
  const data = await response.json();
  
  // Store token securely in database
  // Return success
});
```

Then update `src/lib/meta-ads.ts` to call this endpoint instead of direct API call.

## Troubleshooting

### Error: "Invalid OAuth Redirect URI"
- Make sure the redirect URI in Facebook app settings matches exactly
- Check for trailing slashes
- Ensure protocol (http/https) matches

### Error: "App Not Setup"
- Make sure Facebook Login product is added to your app
- Verify OAuth settings are configured

### Error: "Permissions Not Granted"
- Check that all required permissions are requested
- User must grant all permissions during OAuth flow

### No Ad Accounts Found
- Ensure your Facebook account has an active Ad Account
- Check Business Manager settings
- Verify ad account permissions

## API Limits

- Meta Ads API has rate limits
- Standard tier: 200 calls per hour per user
- For higher limits, apply for advanced access

## Support

For issues:
1. Check Facebook Developer Console for app status
2. Review Meta Ads API documentation
3. Check browser console for detailed error messages

