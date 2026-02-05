# 🗄️ Database Migration Instructions

## ✅ **One-Click Migration** (5 minutes)

### **Step 1: Open Supabase SQL Editor**
1. Go to: https://supabase.com/dashboard/project/tbiunmmvfbakwlzykpwq
2. Click **"SQL Editor"** in the left sidebar
3. Click **"New Query"**

### **Step 2: Copy & Paste**
1. Open file: `CONSOLIDATED-MIGRATION.sql` (in project root)
2. **Select All** (Ctrl+A)
3. **Copy** (Ctrl+C)
4. **Paste** into Supabase SQL Editor (Ctrl+V)

### **Step 3: Run**
1. Click **"Run"** button (or press F5)
2. Wait ~5-10 seconds
3. ✅ See success message: "All migrations completed successfully!"

---

## 📊 **What This Creates**

### **8 New Tables**:

| Table | Purpose |
|-------|---------|
| `reading_reflections` | JFT daily reading reflections |
| `meeting_checkins` | Meeting attendance (90 in 90) |
| `user_achievements` | Unlocked badges |
| `risky_contacts` | Safe Dial danger zone contacts |
| `close_calls` | Crisis intervention logs |
| `sponsor_notifications` | Risk alerts to sponsors |
| `meeting_reflections` | Pre/post meeting prompts |
| `daily_checkins.day_rating` | Day rating column (1-10) |

### **Features Enabled**:
- ✅ JFT Daily Readings with reflections
- ✅ Meeting Check-ins with 90 in 90 tracking
- ✅ Achievement badges (First Step, Centurion, Marathon, etc.)
- ✅ Safe Dial crisis intervention
- ✅ Risk Pattern Detection with sponsor alerts
- ✅ Meeting Reflections (pre/post prompts)

---

## 🔒 **Safety Features**

### **Transaction-Safe**:
- Wrapped in `BEGIN`/`COMMIT` transaction
- If ANY error occurs, entire migration rolls back
- No partial state (all-or-nothing)

### **Idempotent**:
- Uses `CREATE TABLE IF NOT EXISTS`
- Uses `DROP POLICY IF EXISTS` before creating
- Safe to run multiple times
- Won't break if tables already exist

### **RLS Enabled**:
- All tables have Row Level Security
- Users can ONLY see/modify their own data
- Sponsor notifications respect relationships
- Privacy-first by design

---

## ⚠️ **Troubleshooting**

### **Error: "relation already exists"**
✅ **Safe to ignore** - table already created, skipped

### **Error: "constraint already exists"**
✅ **Safe to ignore** - constraint already exists, skipped

### **Error: "foreign key violation"**
❌ **Problem** - Missing required tables:
- Make sure `auth.users` table exists
- Make sure `profiles` table exists
- Run migrations in order

### **Error: "permission denied"**
❌ **Problem** - Need admin access:
- Make sure you're logged into correct Supabase project
- Make sure you have admin/owner role

---

## 📝 **After Migration**

### **Verify Success**:
1. Go to **Table Editor** in Supabase
2. Check these tables exist:
   - `reading_reflections`
   - `meeting_checkins`
   - `user_achievements`
   - `risky_contacts`
   - `close_calls`
   - `sponsor_notifications`
   - `meeting_reflections`

### **Check RLS Policies**:
1. Click on any table
2. Click **"RLS Policies"** tab
3. Verify policies exist (2-4 per table)

---

## 🚀 **What Happens Next**

Once migration is complete:
- ✅ App will connect to new tables
- ✅ Features will work immediately
- ✅ No app restart needed (backend-only change)
- ✅ Existing data preserved

---

## 💾 **Backup (Optional)**

If you want to be extra safe:

1. Go to **Database** → **Backups**
2. Click **"Create Backup"**
3. Wait for backup to complete
4. Then run migration

(Backups are automatic daily, but manual is extra safe)

---

## ✅ **Ready?**

**File to copy**: `CONSOLIDATED-MIGRATION.sql` (in project root)  
**Destination**: Supabase SQL Editor  
**Time**: 5 minutes  
**Risk**: Low (safe, idempotent, transactional)

**Go for it!** 🚀
