# Auth0 Back-Channel Logout Setup Guide

## ✅ Step-by-Step Instructions

### Step 1: Auth0 Dashboard me jao

1. Open: https://manage.auth0.com
2. Login karo (if not already logged in)

### Step 2: Your Application select karo

1. Left sidebar me **Applications** click karo
2. Apni application select karo
   - **Client ID**: `zYRUiCf30KOiUnBCELNgek3J4lm11pLR`
   - Ya application name se search karo

### Step 3: Advanced Settings

1. Application page me **Settings** tab par hoge
2. Page scroll karke neeche jao
3. **Advanced Settings** button click karo (bottom right)

### Step 4: OAuth Tab

1. Advanced Settings window me **OAuth** tab click karo
2. Scroll down karo

### Step 5: Back-Channel Logout Enable karo

1. **Back-Channel Logout** section find karo
2. **Back-Channel Logout** toggle **ON** karo

### Step 6: Back-Channel Logout URL add karo

**Field me ye URL paste karo:**

```
https://dynamicpricing-api.dynamicpricingbuilder.com/api/auth/logout-callback
```

⚠️ **Important**: 
- URL exact hai - copy-paste karo
- No trailing slash
- HTTPS use karo (not HTTP)
- Full path include karo (`/api/auth/logout-callback`)

### Step 7: Save Changes

1. **Save Changes** button click karo (bottom of Advanced Settings window)
2. Main page par **Save Changes** button click karo (top right)

---

## 📸 Visual Guide

### Advanced Settings Location:
```
Application Settings
├── Basic Information
├── Quick Start
├── ... (other tabs)
└── Advanced Settings ⚙️
    ├── Grant Types
    ├── OAuth ⬅️ (Yahan par hai)
    │   ├── ...
    │   ├── Back-Channel Logout
    │   │   └── Back-Channel Logout URL ⬅️ (Yahan paste karo)
    │   └── ...
    └── ...
```

---

## ✅ Verification

After saving, verify:

1. ✅ **Back-Channel Logout** toggle ON hai
2. ✅ **Back-Channel Logout URL** field me correct URL hai:
   ```
   https://dynamicpricing-api.dynamicpricingbuilder.com/api/auth/logout-callback
   ```
3. ✅ Changes saved ho gaye hain

---

## 🧪 Testing

### Test 1: Backend Endpoint Check

```bash
# Health check (if available)
curl https://dynamicpricing-api.dynamicpricingbuilder.com/api/auth/logout-callback/health

# Or test if endpoint exists
curl -X POST https://dynamicpricing-api.dynamicpricingbuilder.com/api/auth/logout-callback
```

### Test 2: Auth0 Test Logout

1. Frontend se logout karo
2. Backend logs check karo - `/api/auth/logout-callback` hit hua ya nahi
3. SignalR event broadcast hua ya nahi

---

## 🔍 Troubleshooting

### Issue: Back-Channel Logout option nahi dikh raha

**Solution**: 
- Ensure you're on **OAuth** tab in Advanced Settings
- Some Auth0 plans me ye feature limited ho sakta hai
- Check Auth0 plan/features

### Issue: URL save nahi ho rahi

**Solution**:
- URL format check karo (HTTPS, no trailing slash)
- Special characters nahi hone chahiye
- URL accessible honi chahiye (backend deployed hai)

### Issue: Logout callback nahi aa raha

**Solution**:
1. Backend endpoint accessible hai verify karo
2. CORS configured hai check karo
3. Backend logs check karo
4. Auth0 Dashboard me URL correct hai verify karo

---

## 📋 Checklist

- [ ] Auth0 Dashboard opened
- [ ] Application selected
- [ ] Advanced Settings opened
- [ ] OAuth tab selected
- [ ] Back-Channel Logout toggle ON
- [ ] Back-Channel Logout URL added:
  ```
  https://dynamicpricing-api.dynamicpricingbuilder.com/api/auth/logout-callback
  ```
- [ ] Changes saved
- [ ] Backend endpoint accessible
- [ ] Test logout performed

---

## 🎯 Final Configuration

### Auth0 Dashboard:
```
Back-Channel Logout: ✅ Enabled
Back-Channel Logout URL: https://dynamicpricing-api.dynamicpricingbuilder.com/api/auth/logout-callback
```

### Backend Endpoint:
```
POST /api/auth/logout-callback
Accepts: application/x-www-form-urlencoded
Body: logout_token=<JWT_TOKEN>
```

### Frontend:
```
SignalR Hub: https://dynamicpricing-api.dynamicpricingbuilder.com/hubs/logout
Event: UserLoggedOut
```

---

**Once configured, Auth0 automatically call karega backend endpoint jab user logout karega!** 🚀

