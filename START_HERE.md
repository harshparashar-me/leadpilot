# LeadPilot CRM - Quick Start Guide

Get your development environment up and running in 15 minutes.

---

## Prerequisites

Before starting, ensure you have:

- ✅ **Node.js** v18 or higher ([Download](https://nodejs.org/))
- ✅ **npm** or **yarn** package manager
- ✅ **Supabase** account ([Sign up](https://supabase.com/))
- ✅ **Git** for version control
- ✅ Code editor (VS Code recommended)

---

## Step 1: Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd LeadPilot_Project

# Install dependencies
npm install

# This will install:
# - React, TypeScript, Vite
# - Supabase client
# - Tailwind CSS, Radix UI
# - All other dependencies
```

**Expected time:** 2-3 minutes

---

## Step 2: Set Up Supabase

### 2.1 Create Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Click **"New Project"**
3. Choose organization and region
4. Set database password (save it!)
5. Wait for project to initialize (~2 minutes)

### 2.2 Get API Credentials

1. In your project, go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (starts with `eyJ...`)

### 2.3 Configure Environment

Create `.env` file in project root:

```bash
# Copy from .env.example if exists, or create new
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**⚠️ Important:** Never commit `.env` to Git!

---

## Step 3: Run Database Migrations

### 3.1 Open Supabase SQL Editor

1. In Supabase dashboard → **SQL Editor**
2. Click **"New Query"**

### 3.2 Run Migrations in Order

Execute each file in **SQL Editor** (copy-paste contents):

**Phase 1: Foundation**
```sql
-- File: supabase/migrations/20260102_crm_foundation.sql
-- Creates: activity_logs, record_notes, record_relationships, permission_overrides
```

**Phase 2: Automation**
```sql
-- File: supabase/migrations/20260116_workflows_email.sql
-- Creates: workflows, workflow_executions, email_accounts, email_templates, etc.
```

**Phase 3: Advanced Features**
```sql
-- File: supabase/migrations/20260213_pipeline_analytics.sql
-- Creates: pipelines, deal_stages, analytics_snapshots, channels, messages, etc.
```

**Phase 4: AI & Scaling**
```sql
-- File: supabase/migrations/20260320_ai_integrations.sql
-- Creates: ai_insights, ai_training_data, integrations, calendar_events, etc.
```

**Integration System**
```sql
-- File: supabase/migrations/20260415_integrations.sql
-- Creates: webhooks, meta_ads_leads, google_ads_leads, whatsapp_conversations, etc.
```

**Expected time:** 5 minutes (run all 5 files)

### 3.3 Verify Tables Created

1. Go to **Table Editor** in Supabase
2. You should see 34+ tables
3. Check that RLS policies are enabled

---

## Step 4: Start Development Server

```bash
# Start Vite dev server
npm run dev

# You should see:
# ➜  Local:   http://localhost:5174/
```

Open browser → `http://localhost:5174/`

**Expected time:** 30 seconds

---

## Step 5: Verify Everything Works

### 5.1 Check Landing Page

- ✅ Landing page loads
- ✅ Navigation works
- ✅ Sections render properly

### 5.2 Test CRM Dashboard

1. Click **"Get Started"** or **"Dashboard"**
2. Should see CRM interface
3. Sidebar navigation works
4. All pages load (Leads, Contacts, Deals, etc.)

### 5.3 Test Database Connection

1. Go to **Leads** page
2. Try creating a test lead
3. Should save to Supabase successfully

---

## Troubleshooting

### Issue: "Cannot connect to Supabase"

**Solution:**
- Check `.env` file has correct URL and key
- Verify no extra spaces in credentials
- Restart dev server (`Ctrl+C` then `npm run dev`)

### Issue: "Table does not exist"

**Solution:**
- Run all 5 migration files in order
- Check SQL Editor for errors
- Verify in Table Editor that tables exist

### Issue: "Module not found"

**Solution:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue: "Port 5174 already in use"

**Solution:**
```bash
# Kill process on port
# Windows:
netstat -ano | findstr :5174
taskkill /PID <PID> /F

# Mac/Linux:
lsof -ti:5174 | xargs kill
```

---

## Next Steps

### For Developers

1. **Read Documentation:**
   - [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md) - Navigation hub
   - [SYSTEM_ARCHITECTURE.md](SYSTEM_ARCHITECTURE.md) - Architecture
   - Phase docs (FEATURE_PHASE_*.md) for features

2. **Explore Code:**
   - `src/lib/` - Backend services
   - `src/components/` - UI components
   - `src/modules/` - Feature modules

3. **Test Features:**
   - Create workflows (Phase 2)
   - Try AI lead scoring (Phase 4)
   - Set up integrations (Meta Ads, WhatsApp)

### For Integration Setup

**Meta Ads Integration:**
- Read [INTEGRATION_PHASE_2_META_ADS.md](INTEGRATION_PHASE_2_META_ADS.md)
- Get Meta Business Manager access
- Configure lead forms

**WhatsApp Integration:**
- Read [INTEGRATION_PHASE_4_WHATSAPP.md](INTEGRATION_PHASE_4_WHATSAPP.md)
- Set up WhatsApp Business API
- Create message templates

**Webhooks:**
- Read [INTEGRATION_PHASE_1_WEBHOOKS.md](INTEGRATION_PHASE_1_WEBHOOKS.md)
- Configure webhook endpoints
- Test event delivery

---

## Production Deployment

### Build for Production

```bash
# Create optimized build
npm run build

# Output in: dist/
```

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
```

### Environment Variables

Add these in Vercel/hosting dashboard:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `META_ADS_ACCESS_TOKEN` (if using Meta Ads)
- `GOOGLE_ADS_CLIENT_ID` (if using Google Ads)
- `WHATSAPP_API_KEY` (if using WhatsApp)

---

## Project Structure Overview

```
LeadPilot_Project/
├── src/
│   ├── components/          # 25+ UI components
│   ├── lib/                 # 15+ service files
│   ├── modules/             # Feature modules (leads, deals, etc.)
│   ├── pages/               # Page components
│   ├── store/               # State management
│   └── types/               # TypeScript types
├── supabase/
│   └── migrations/          # 5 migration files (34 tables)
├── public/                  # Static assets
├── .env                     # Environment variables (create this)
└── package.json             # Dependencies
```

---

## Common Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run preview          # Preview production build

# Code Quality
npm run lint             # Run ESLint
npm run type-check       # TypeScript check

# Database
# (Run via Supabase SQL Editor)
```

---

## Support & Resources

**Documentation:**
- [README.md](README.md) - Project overview
- [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md) - All docs
- [SYSTEM_ARCHITECTURE.md](SYSTEM_ARCHITECTURE.md) - Architecture

**External Resources:**
- [Supabase Docs](https://supabase.com/docs)
- [React Docs](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)

**Need Help?**
1. Check documentation first
2. Review phase-specific guides
3. Check migration files for schema
4. Review service files in `src/lib/`

---

## Summary Checklist

- [ ] Node.js v18+ installed
- [ ] Supabase project created
- [ ] `.env` file configured
- [ ] All 5 migrations run successfully
- [ ] Dev server running (`npm run dev`)
- [ ] Can access http://localhost:5174/
- [ ] Can create test lead in CRM
- [ ] All features loading properly

**⏰ Total Setup Time:** ~15 minutes

**🎉 You're ready to develop!**

---

**Last Updated:** December 2025  
**Version:** 1.0.0  
**Status:** All phases complete ✅
