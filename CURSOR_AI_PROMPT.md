# Cursor AI Prompt for .NET Backend Global Logout Implementation

## 📋 Copy this prompt and paste it in Cursor AI:

---

```
I need to implement Auth0 Back-Channel Logout with SignalR for global logout functionality in my .NET backend. When a user logs out from one application, all other connected applications should automatically log out in real-time.

## Requirements:

1. **Auth0 Back-Channel Logout Endpoint**:
   - Create an endpoint at `/api/auth/logout-callback` that receives logout tokens from Auth0
   - Verify the logout token signature
   - Extract user ID (sub claim) from the token
   - Broadcast logout event via SignalR to all connected clients

2. **SignalR Hub**:
   - Create a `LogoutHub` class that allows clients to join/leave groups
   - Broadcast logout events to all connected clients or specific user groups

3. **Configuration**:
   - Add SignalR service registration in Program.cs (or Startup.cs)
   - Configure CORS to allow requests from frontend domains
   - Add Auth0 configuration in appsettings.json (Domain, ClientId, ClientSecret)

4. **Token Verification** (Basic Implementation):
   - Decode JWT logout token
   - Extract payload (sub, sid claims)
   - For production, add proper JWT signature verification using Auth0 public keys

## Tech Stack:
- .NET 8 (or .NET 7/6)
- SignalR
- Auth0
- JWT token handling

## File Structure to Create:

1. `Controllers/AuthController.cs` - Back-channel logout endpoint
2. `Hubs/LogoutHub.cs` - SignalR hub for real-time notifications
3. Update `Program.cs` - Register SignalR and configure CORS
4. Update `appsettings.json` - Add Auth0 configuration

## Code Requirements:

### AuthController.cs:
- POST endpoint at `/api/auth/logout-callback`
- Accept `logout_token` from form data
- Decode and verify JWT token (basic implementation)
- Extract user ID from token
- Broadcast logout event via SignalR with user ID and timestamp
- Return 200 OK on success

### LogoutHub.cs:
- Inherit from Hub
- Method: `JoinLogoutGroup(string userId)` - add user to group
- Method: `LeaveLogoutGroup(string userId)` - remove user from group
- Broadcast method: `UserLoggedOut` - notify all clients

### Program.cs:
- Add `builder.Services.AddSignalR()`
- Add CORS policy (allow all origins for now, or specific frontend domains)
- Map SignalR hub at `/hubs/logout`
- Enable CORS middleware

### appsettings.json:
- Add Auth0 section with:
  - Domain: "dev-4v4hx3vrjxrwitlc.us.auth0.com"
  - ClientId: "zYRUiCf30KOiUnBCELNgek3J4lm11pLR"
  - ClientSecret: (placeholder or environment variable)

## Example Logout Token Structure:
The logout token from Auth0 contains:
- `sub`: User ID (required)
- `sid`: Session ID (optional)
- `aud`: Audience (client ID)
- `iat`: Issued at
- `jti`: JWT ID

## Security Notes:
- For production, implement proper JWT signature verification
- Use environment variables for ClientSecret
- Add rate limiting to logout-callback endpoint
- Add logging for security events

## Expected Flow:
1. User clicks logout in frontend
2. Frontend calls Auth0 logout endpoint with `federated` parameter
3. Auth0 clears session and calls backend `/api/auth/logout-callback`
4. Backend verifies token and broadcasts via SignalR
5. All connected frontend clients receive logout event
6. Frontend clients log out automatically

Please implement this solution with:
- Proper error handling
- Logging for debugging
- Clean code structure
- Comments explaining the flow
- Production-ready code patterns

Generate all the necessary files with complete implementation.
```

---

## 🚀 How to Use:

1. **Copy the prompt above** (everything inside the ```)
2. **Open Cursor AI** in your .NET project folder
3. **Paste the prompt** in Cursor chat
4. **Let Cursor generate** all the code files
5. **Review and test** the generated code

## 📝 After Code Generation:

1. **Update appsettings.json**:
   ```json
   {
     "Auth0": {
       "Domain": "dev-4v4hx3vrjxrwitlc.us.auth0.com",
       "ClientId": "zYRUiCf30KOiUnBCELNgek3J4lm11pLR",
       "ClientSecret": "YOUR_SECRET_HERE"
     }
   }
   ```

2. **Install Required NuGet Packages** (if not already installed):
   ```bash
   dotnet add package Microsoft.AspNetCore.SignalR
   ```

3. **Configure Auth0 Back-Channel Logout**:
   - Go to Auth0 Dashboard
   - Applications → Your App → Advanced Settings → OAuth
   - Enable "Back-Channel Logout"
   - Set URL: `https://your-backend-domain.com/api/auth/logout-callback`

4. **Test the Implementation**:
   - Deploy backend
   - Test logout callback endpoint
   - Verify SignalR connection works

## ✅ Checklist After Implementation:

- [ ] AuthController.cs created with logout-callback endpoint
- [ ] LogoutHub.cs created with SignalR hub
- [ ] Program.cs updated with SignalR registration
- [ ] CORS configured properly
- [ ] appsettings.json has Auth0 configuration
- [ ] SignalR hub mapped at `/hubs/logout`
- [ ] Error handling implemented
- [ ] Logging added

---

**Note**: Agar Cursor kuch packages suggest kare ya code modify kare, review kar lo pehle. Production code ke liye proper JWT signature verification add karni hogi later.

