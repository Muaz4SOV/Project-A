# Auth0 Callback URL Configuration Guide

## Problem
Vercel creates multiple deployment URLs, and Auth0 requires each callback URL to be explicitly whitelisted. Currently getting "Callback URL mismatch" errors.

## Solution: Add These URLs to Auth0

### Step 1: Go to Auth0 Dashboard
1. Login to [Auth0 Dashboard](https://manage.auth0.com)
2. Navigate to **Applications** → Your Application (Client ID: `zYRUiCf30KOiUnBCELNgek3J4lm11pLR`)
3. Go to **Settings** tab

### Step 2: Add Allowed Callback URLs
In the **Allowed Callback URLs** field, add ALL these URLs (one per line):

```
https://project-a-flax.vercel.app/callback
https://project-a-git-main-muhammad-muazs-projects-cc9bdaf8.vercel.app/callback
https://project-bdl7tbrhh-muhammad-muazs-projects-cc9bdaf8.vercel.app/callback
https://project-i3j3zfwhe-muhammad-muazs-projects-cc9bdaf8.vercel.app/callback
```

**OR** use wildcard pattern (if supported by your Auth0 plan):
```
https://project-a-flax.vercel.app/callback
https://*.vercel.app/callback
```

### Step 3: Add Allowed Logout URLs
In the **Allowed Logout URLs** field, add:

```
https://project-a-flax.vercel.app
https://project-a-git-main-muhammad-muazs-projects-cc9bdaf8.vercel.app
https://project-bdl7tbrhh-muhammad-muazs-projects-cc9bdaf8.vercel.app
https://project-i3j3zfwhe-muhammad-muazs-projects-cc9bdaf8.vercel.app
```

**OR** use wildcard pattern:
```
https://project-a-flax.vercel.app
https://*.vercel.app
```

### Step 4: Add Allowed Web Origins (for CORS)
In the **Allowed Web Origins** field, add:

```
https://project-a-flax.vercel.app
https://project-a-git-main-muhammad-muazs-projects-cc9bdaf8.vercel.app
https://project-bdl7tbrhh-muhammad-muazs-projects-cc9bdaf8.vercel.app
https://project-i3j3zfwhe-muhammad-muazs-projects-cc9bdaf8.vercel.app
```

**OR** use wildcard:
```
https://project-a-flax.vercel.app
https://*.vercel.app
```

## Important Notes

1. **Each URL must include the `/callback` path** for Callback URLs
2. **Do NOT include `/callback`** for Logout URLs and Web Origins
3. **Use HTTPS** (not HTTP)
4. **No trailing slashes** at the end
5. **Save changes** after adding URLs

## Long-term Solution

If you get new preview URLs with each deployment, consider:

1. **Use a Custom Domain** on Vercel - Then you only need to add one domain
2. **Use Wildcards** - `https://*.vercel.app/callback` (if your Auth0 plan supports it)
3. **Add URLs as needed** - Add new preview URLs to Auth0 whenever they appear

## Testing

After adding the URLs:
1. Try logging in on each of the 3 Vercel URLs
2. The callback should work without errors
3. Logout should also work properly

