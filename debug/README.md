# 🔧 Debug Tools for Wolfpack Chat & API Issues

This directory contains comprehensive debugging tools to diagnose and fix issues with the Wolfpack application.

## 🚨 Current Issues Addressed

### 1. **Invalid API Key Error** (Menu/DJ Dashboard)
**Error**: `"Invalid API key"` when loading menu categories
**Root Cause**: Missing or incorrect Supabase environment variables

### 2. **404 Resource Errors** 
**Error**: `Failed to load resource: 404 (Not Found)`
**Root Cause**: Missing files or incorrect resource paths

### 3. **Wolfpack Chat Issues**
**Error**: Various chat-related functionality problems
**Root Cause**: Type mismatches, corrupted cookies, RPC function issues

---

## 🛠️ Debug Tools Available

### **API Key & Environment Issues**
- **File**: `api-key-debug.js`
- **Usage**: Load in browser console
- **Commands**: 
  - `debugAPIKeys()` - Check current API configuration
  - `fixAPIKeyIssues()` - Show fix suggestions

### **404 Resource Tracking**
- **File**: `resource-404-debug.js` 
- **Usage**: Auto-starts on localhost
- **Commands**:
  - `start404Monitoring()` - Track 404 errors
  - `get404Report()` - View failed requests
  - `check404Patterns()` - Check common issues

### **Chat System Debugging** 
- **File**: `master-debug.js` (combines all chat tools)
- **Usage**: Load in browser console
- **Commands**:
  - `runFullDiagnostic()` - Complete system check
  - `quickChatTest()` - Fast chat functionality test

### **Environment Variable Checker**
- **File**: `scripts/check-env.js`
- **Usage**: `node scripts/check-env.js`
- **Purpose**: Verify all required environment variables

---

## 🔥 Quick Fix Guide

### **Fix API Key Errors**

1. **Check your `.env.local` file** (should be in project root):
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

2. **Get the correct keys**:
   - Go to Supabase project → Settings → API
   - Copy Project URL, anon/public key, and service_role key
   - **Important**: Keep service_role key secret!

3. **Restart your development server** after updating environment variables

### **Fix 404 Errors**

1. **Load the 404 debug tool**:
   ```javascript
   // Copy content of resource-404-debug.js into browser console
   start404Monitoring();
   ```

2. **Check the report**:
   ```javascript
   get404Report();
   ```

3. **Common fixes**:
   - Missing favicon → Add `favicon.ico` to `public/` folder
   - Broken image URLs → Check for `undefined` in image src
   - Missing CSS/JS → Verify file paths in Next.js build

### **Fix Chat Issues**

1. **Run comprehensive diagnosis**:
   ```javascript
   // Copy content of master-debug.js into browser console
   runFullDiagnostic();
   ```

2. **Clear corrupted state**:
   ```javascript
   emergencyResetChat();
   ```

---

## 📋 Files Fixed

### **Menu Data Loading**
- ✅ **Fixed**: `lib/menu-data-public-fixed.ts` - Better error handling for API keys
- ✅ **Updated**: `app/(main)/menu/MenuServer.tsx` - Uses fixed data loader

### **Chat System**
- ✅ **Fixed**: Type mismatches in chat database schema
- ✅ **Updated**: Direct database operations instead of broken RPC functions
- ✅ **Added**: Comprehensive debugging tools

### **Wolfpack Interface**
- ✅ **Added**: `components/wolfpack/WolfpackChatChannels.tsx` - Public chat channels
- ✅ **Added**: `components/wolfpack/WolfpackChatInterface.tsx` - Complete chat UI
- ✅ **Added**: `app/(main)/wolfpack/channels/page.tsx` - Dedicated channels page
- ✅ **Updated**: Main wolfpack page with chat preview

---

## 🎯 Priority Fixes

### **Immediate (Do Now)**
1. **Environment Variables**: Run `node scripts/check-env.js` to verify setup
2. **API Keys**: Ensure Supabase keys are correct in `.env.local`
3. **Restart Server**: After updating environment variables

### **Next (If Issues Persist)**
1. **404 Debugging**: Load `resource-404-debug.js` to track missing resources
2. **Chat Testing**: Load `master-debug.js` and run `runFullDiagnostic()`
3. **Database Schema**: Verify RLS policies allow public menu access

---

## 🚀 Test Your Fixes

### **Test API Keys**
```bash
# 1. Check environment variables
node scripts/check-env.js

# 2. Start dev server
npm run dev

# 3. Check browser console for API key errors
```

### **Test 404 Issues**
```javascript
// In browser console:
start404Monitoring();
// Navigate around your app, then:
get404Report();
```

### **Test Chat System**
```javascript
// In browser console:
runFullDiagnostic();
// Should show all green checkmarks
```

---

## 📞 If You're Still Stuck

1. **Check the browser console** for specific error messages
2. **Run the diagnostic tools** to get detailed reports
3. **Verify your Supabase project** is active and accessible
4. **Check RLS policies** in Supabase for menu tables

The debugging tools provide detailed error messages and fix suggestions for each specific issue.