# 🔍 Debug Logs Guide

## 🎯 **Debug Logs Added**

I've added comprehensive debug logging throughout your authentication flow to help identify the exact issue. Here's what's being logged:

### **1. Middleware Debug Logs** (`middleware.ts`)

- 🔍 Request details (pathname, URL, headers, cookies)
- 🔑 Token verification process
- 🎫 Token details (if found)
- 🔄 Redirect decisions
- 💥 Error handling

### **2. Authentication Context Logs** (`auth-context.tsx`)

- 🔄 Session status changes
- 🔐 Sign in/out operations
- 🎯 Current authentication state
- ⏰ Timestamps for all operations

### **3. NextAuth Configuration Logs** (`auth.ts`)

- 🔑 JWT callback execution
- 🎫 Session callback execution
- ✅ User ID addition to tokens/sessions

### **4. SignIn Page Logs** (`signin/page.tsx`)

- 🔐 Login initiation (Google & Credentials)
- 📋 Sign in results
- ✅ Successful redirects
- ❌ Error handling

### **5. App Dashboard Logs** (`app/page.tsx`)

- 🏠 Component mounting
- 📊 Session status on page load
- 👤 User information

## 🚀 **How to Test and Debug**

### **Step 1: Deploy with Debug Logs**

```bash
git add .
git commit -m "Add comprehensive debug logs for authentication"
git push origin main
```

### **Step 2: Test the Authentication Flow**

1. **Open Browser Developer Tools**

   - Press F12 or right-click → Inspect
   - Go to Console tab

2. **Test Login Flow**:

   - Go to your deployed site
   - Click "Sign In"
   - Try to log in with Google or credentials
   - Watch the console for debug logs

3. **Test /app Access**:
   - After login, try to access `/app`
   - Watch for middleware logs
   - Check if redirects are happening

### **Step 3: Analyze the Logs**

Look for these key log patterns:

#### **🔍 Middleware Logs**

```
🔍 MIDDLEWARE DEBUG: { pathname: '/app', url: '...', cookies: '...' }
🔒 Protecting /app route: /app
🔑 Checking for token...
🎫 Token result: { hasToken: true/false, tokenKeys: [...], tokenId: '...' }
```

#### **🔄 AuthProvider Logs**

```
🔄 AuthProvider - Session status changed: { status: 'authenticated', hasSession: true, user: {...} }
🎯 AuthProvider - Current auth state: { isAuthenticated: true, loading: false, hasUser: true }
```

#### **🔐 SignIn Logs**

```
🔐 SignIn Page - Google sign in initiated
🔄 SignIn Page - Calling signIn with Google
📋 SignIn Page - Google sign in result: { error: null, url: '/app' }
✅ SignIn Page - Google sign in successful, redirecting to: /app
```

#### **🏠 Dashboard Logs**

```
🏠 App Dashboard - Component mounted: { hasSession: true, status: 'authenticated', user: {...} }
```

## 🔍 **What to Look For**

### **If you see 307 redirects:**

1. Check middleware logs for token verification
2. Look for "No token found" messages
3. Verify environment variables are set correctly

### **If authentication fails:**

1. Check NextAuth JWT/Session callback logs
2. Look for error messages in signin logs
3. Verify Google OAuth configuration

### **If session is lost:**

1. Check AuthProvider logs for session changes
2. Look for cookie-related issues
3. Verify NEXTAUTH_SECRET is set correctly

## 📋 **Debug Checklist**

- [ ] Deploy the changes with debug logs
- [ ] Open browser dev tools console
- [ ] Test login flow and watch logs
- [ ] Try accessing `/app` and watch middleware logs
- [ ] Check for any error messages
- [ ] Verify environment variables are set
- [ ] Look for token verification issues

## 🚨 **Common Issues to Check**

### **Issue: No middleware logs appearing**

**Solution**: Check that the middleware is running by looking for the initial debug log

### **Issue: Token not found in middleware**

**Solution**: Check NEXTAUTH_SECRET and cookie configuration

### **Issue: Session not persisting**

**Solution**: Check NextAuth callbacks and cookie settings

### **Issue: Redirect loops**

**Solution**: Look for conflicting redirect logic in middleware

## 📊 **Expected Log Flow**

**Successful Login Flow:**

1. 🔐 SignIn Page - Google sign in initiated
2. 🔄 SignIn Page - Calling signIn with Google
3. 📋 SignIn Page - Google sign in result: { error: null, url: '/app' }
4. ✅ SignIn Page - Google sign in successful, redirecting to: /app
5. 🔍 MIDDLEWARE DEBUG: { pathname: '/app', ... }
6. 🔒 Protecting /app route: /app
7. 🔑 Checking for token...
8. 🎫 Token result: { hasToken: true, ... }
9. ✅ Token found, allowing access to: /app
10. 🏠 App Dashboard - Component mounted: { hasSession: true, ... }

**Failed Login Flow:**

1. 🔐 SignIn Page - Google sign in initiated
2. 🔄 SignIn Page - Calling signIn with Google
3. 📋 SignIn Page - Google sign in result: { error: '...', url: null }
4. ❌ SignIn Page - Google sign in error: ...

The debug logs will help us identify exactly where the authentication flow is breaking down. Please test this and share the console output so we can pinpoint the issue!
