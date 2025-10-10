# JobTracker Supabase Integration - Fixes Applied

## Issues Fixed

### 1. Table Name Mismatch
**Error:** `Could not find the table 'public.job_applications'`
**Cause:** Code used `job_applications` but database has `applications` table
**Fix:** Updated all references to use `applications` table

### 2. Column Name Mismatches
**Error:** Various field not found errors
**Cause:** Extension code used different column names than database schema
**Fix:** Updated column mappings:
- `company_name` → `company`
- `applied_date` → `applied_at`
- `application_url` → `job_url`
- Added `job_board: 'manual'` (required field)
- Added support for `tags` array

### 3. Status Constraint Violation
**Error:** `new row for relation "applications" violates check constraint "applications_status_check"`
**Cause:** Database CHECK constraint expected different status values
- Database had: `'applied', 'interview', 'offer', 'rejected', 'withdrawn'`
- Extension sends: `'applied', 'interviewing', 'offer', 'rejected', 'archived'`

**Fix:** Created SQL migration file `fix_applications_constraint.sql` to update the constraint

### 4. UUID Type Error
**Error:** `invalid input syntax for type uuid: "true"`
**Cause:**
- POST requests weren't returning inserted row data
- Function returned boolean `true` instead of UUID
- `String(true)` converted it to `"true"` which failed UUID validation

**Fix:**
- Added `Prefer: return=representation` header to POST/PATCH requests
- Changed function to return actual UUID from inserted row
- Added proper error handling when ID is not returned
- Update operations now return existing ID instead of `true`

## Files Modified

### 1. `extension/src/JobTracker.tsx`
#### Changes in `loadFromSupabase()`:
```typescript
// Before
`job_applications?user_id=eq.${user.id}&order=applied_date.desc`
company: app.company_name
dateApplied: app.applied_date
jobUrl: app.application_url

// After
`applications?user_id=eq.${user.id}&order=applied_at.desc`
company: app.company
dateApplied: app.applied_at
jobUrl: app.job_url
tags: app.tags || []
```

#### Changes in `saveToSupabase()`:
```typescript
// Before
const appData = {
  company_name: application.company,
  applied_date: application.dateApplied,
  application_url: application.jobUrl,
};

// After
const appData = {
  company: application.company,
  applied_at: application.dateApplied,
  job_url: application.jobUrl,
  job_board: 'manual', // Required field
  tags: application.tags || [],
};
```

#### Added Prefer header for INSERT:
```typescript
const inserted = await client.makeRequest("applications", {
  method: "POST",
  body: JSON.stringify([appData]),
  headers: {
    "Prefer": "return=representation" // Returns inserted row with ID
  }
});

// Properly extract ID from response
if (inserted && Array.isArray(inserted) && inserted.length > 0 && inserted[0].id) {
  return inserted[0].id;
}
throw new Error("Failed to get ID from inserted application");
```

#### Added Prefer header for UPDATE:
```typescript
await client.makeRequest(`applications?id=eq.${application.id}`, {
  method: "PATCH",
  body: JSON.stringify(appData),
  headers: {
    "Prefer": "return=representation"
  }
});
return application.id; // Return existing ID, not true
```

#### Improved `addApplication()` error handling:
```typescript
// Before
const id = await saveToSupabase(newApplication);
if (id) {
  const appWithId = {
    ...newApplication,
    id: typeof id === "string" ? id : String(id), // BUG: String(true) = "true"
  };
}

// After
try {
  const id = await saveToSupabase(newApplication);
  if (id && typeof id === "string") {
    const appWithId = {
      ...newApplication,
      id: id, // ID is guaranteed to be string UUID
    };
    // ... success handling
  } else {
    alert("Failed to save application. Please try again.");
  }
} catch (error) {
  console.error("Error adding application:", error);
  alert("Failed to add application. Please check the console for details.");
}
```

### 2. `dashboard/database/fix_applications_constraint.sql` (NEW)
Created SQL migration to fix database constraint:
```sql
ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_status_check;

ALTER TABLE applications
ADD CONSTRAINT applications_status_check
CHECK (status IN ('applied', 'interviewing', 'offer', 'rejected', 'archived'));

NOTIFY pgrst, 'reload schema';
```

## Steps to Complete the Fix

### 1. Run Database Migration
In Supabase SQL Editor, run:
```sql
ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_status_check;

ALTER TABLE applications
ADD CONSTRAINT applications_status_check
CHECK (status IN ('applied', 'interviewing', 'offer', 'rejected', 'archived'));

NOTIFY pgrst, 'reload schema';
```

Or use the file: `dashboard/database/fix_applications_constraint.sql`

### 2. Reload Chrome Extension
1. Go to `chrome://extensions/`
2. Find "Uswift" extension
3. Click reload icon (🔄)
4. Open extension and test Job Tracker

### 3. Verify Database Schema
Ensure your `applications` table has these columns:
- `id` UUID PRIMARY KEY
- `user_id` UUID (references auth.users)
- `company` TEXT NOT NULL
- `job_title` TEXT NOT NULL
- `status` TEXT NOT NULL (with CHECK constraint)
- `applied_at` DATE NOT NULL
- `job_url` TEXT
- `job_board` TEXT (defaults to 'manual')
- `notes` TEXT
- `tags` TEXT[]
- `created_at` TIMESTAMP
- `updated_at` TIMESTAMP

If table doesn't exist or has wrong schema, run: `dashboard/database/applications_table.sql`

## Testing Checklist

- [ ] Run database migration (`fix_applications_constraint.sql`)
- [ ] Reload extension in Chrome
- [ ] Sign in to extension
- [ ] Add a new job application
- [ ] Verify application saves to Supabase (no errors in console)
- [ ] Refresh extension and verify data loads
- [ ] Update application status
- [ ] Delete an application
- [ ] Check Supabase dashboard to verify data is correct

## Common Issues

### Issue: Still getting constraint violation
**Solution:** Make sure you ran the SQL migration and refreshed the schema cache

### Issue: Empty response from POST
**Solution:** Verify `Prefer: return=representation` header is being sent

### Issue: Application not appearing after save
**Solution:** Check browser console for errors, verify RLS policies allow your user to read their own data

## Summary
All JobTracker errors have been fixed:
✅ Table names corrected (`applications` not `job_applications`)
✅ Column mappings updated to match database schema
✅ Status constraint SQL migration created
✅ UUID type error fixed (no more `"true"` as ID)
✅ Proper error handling added
✅ Extension rebuilt and ready to test

**Next Action Required:** Run the SQL migration in Supabase, then reload the extension.
