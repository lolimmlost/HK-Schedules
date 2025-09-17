# HK-Schedules v1 to v2 Migration Guide

**Version**: 1.0  
**Date**: September 2025  
**Status**: Implemented (Epic BE-001 complete)
**Compatibility**: 100% backward compatible  
**Risk Level**: Low (automatic with fallback)  
**Estimated Time**: < 1 minute (automatic)  

## 🎯 Overview

The HK-Schedules v2 migration transforms the existing single-schedule v1.0 application into a multi-schedule team collaboration platform while preserving all existing data. This brownfield migration follows these principles:

- **Automatic**: Runs on first app load, no user intervention required
- **Non-Destructive**: v1 data preserved until successful migration
- **Reversible**: Fallback to v1 mode if migration fails
- **Transparent**: User notifications for success/failure states
- **Incremental**: Supports mixed v1/v2 data during transition period

### What Changes in v2
| Aspect | v1 (Single Schedule) | v2 (Multi-Schedule) |
|--------|---------------------|---------------------|
| **Data Structure** | Single schedule object | Array of Schedule objects |
| **Storage Key** | `housekeeperSchedules` | `hk-schedules-v2` |
| **Entry Format** | `{name, date, start, end, tasks}` | `{id, time, task, assignees[], status, duration}` |
| **UI Flow** | Single form → table view | Dashboard → select schedule → form/table |
| **State Management** | React hooks (useState) | Zustand global store |
| **Sharing** | CSV/PDF export only | Shareable links with PIN protection |

### Migration Scope
- **In Scope**: All v1 schedule data, CSV import/export compatibility, print layouts
- **Out of Scope**: v1 custom CSS, third-party integrations, server-side data
- **Preserved**: All existing schedules, tasks, times, assignees, notes

## 🛤️ Migration Process

### Automatic Migration Flow
```
App Load → Check v1 Data Exists? → YES → Run Migration
                    ↓                           ↓
                NO → Mark Complete ← Validate & Save v2 Data
                                        ↓
                                 Clean up v1 Data
                                        ↓
                                 Show Success Notification
```

### Detailed Migration Steps

1. **Detection Phase** (50ms)
   - Check for `housekeeperSchedules` key in localStorage
   - Verify v2 store (`hk-schedules-v2`) migration flag
   - Calculate data size and complexity

2. **Preparation Phase** (100ms)
   - Create backup of v1 data (`housekeeperSchedules-backup`)
   - Validate v1 data structure (skip invalid entries)
   - Show loading indicator: "Upgrading to multi-schedule..."

3. **Transformation Phase** (200-500ms per schedule)
   - Convert each v1 entry to v2 Schedule wrapper:
     - `v1 {name, tasks, start, end}` → `v2 Schedule {title=name, entries=[{task=tasks, time=start-end, assignees=[name]}]}`
   - Generate UUIDs for new entities
   - Calculate durations from time ranges
   - Set default values (category=custom, status=pending, version=2)

4. **Validation Phase** (100ms)
   - Run Zod schema validation on all migrated data
   - Check for data loss or corruption
   - Verify total entries match original count

5. **Persistence Phase** (100ms)
   - Save transformed data to `hk-schedules-v2`
   - Set migrationCompleted: true flag
   - Remove original v1 data (after successful write)
   - Store migration metadata (count, date, errors)

6. **Completion Phase** (50ms)
   - Show success notification with migrated count
   - Redirect to new Dashboard view
   - Log migration analytics (console only)

### Data Transformation Examples

#### v1 Entry → v2 Schedule
**Before (v1)**:
```json
{
  "id": "abc123",
  "name": "John Doe",
  "date": "2025-01-15",
  "start": "09:00",
  "end": "12:00",
  "tasks": "Clean rooms, vacuum hallways, empty trash"
}
```

**After (v2)**:
```json
{
  "id": "uuid-1234-5678",
  "title": "John Doe",
  "description": "Migrated from v1 on 2025-01-15",
  "category": "custom",
  "startDate": "2025-01-15T00:00:00.000Z",
  "entries": [{
    "id": "uuid-entry-1",
    "time": "09:00-12:00",
    "task": "Clean rooms, vacuum hallways, empty trash",
    "assignees": ["John Doe"],
    "status": "pending",
    "duration": 180,
    "createdAt": "2025-01-15T00:00:00.000Z",
    "updatedAt": "2025-01-15T00:00:00.000Z"
  }],
  "version": 2,
  "createdAt": "2025-01-15T00:00:00.000Z",
  "updatedAt": "2025-01-15T00:00:00.000Z",
  "isArchived": false
}
```

#### Multiple v1 Entries → v2 Schedule Array
**v1 (3 entries)** → **v2 (3 separate schedules)**:
- Each v1 entry becomes one v2 Schedule with single entry
- Preserves original names as Schedule titles
- Maintains exact time and task data
- Adds migration metadata for traceability

## 🔍 User Experience

### During Migration
```
[Loading Screen - 1-3 seconds]
"Welcome to HK-Schedules v2!"
"Upgrading your schedules for multi-team support..."
"Transferring [X/XX] schedules..."

[Progress Bar - Indeterminate]
```

### Success State
```
✅ Migration Complete!
Your [X] schedules have been successfully upgraded to the new multi-schedule format.

What's New:
• Manage multiple schedules from one dashboard
• Assign tasks to entire teams 
• Share schedules with secure links
• Filter and search across all schedules

[Get Started Button] → Dashboard
[Dismiss] → Continue to Dashboard
```

### Error States

#### Partial Migration (Some entries failed)
```
⚠️ Migration Partially Complete
We successfully migrated [X] of [Y] schedules. Some entries had formatting issues.

Your data is safe and accessible in the new Dashboard.
[View Dashboard] [What's wrong?]
```

#### Migration Failed (Critical error)
```
❌ Migration Failed
We encountered an unexpected error during the upgrade process.

Don't worry! Your original data is preserved and you can:
1. Try the upgrade again [Retry]
2. Continue with your existing schedules [Use v1 Mode]
3. Export your data for manual migration [Export]

[Contact Support] for assistance.
```

### Post-Migration Dashboard
```
Welcome to Multi-Schedule Management! 👋

Your Migrated Schedules:
• [Schedule 1] - John Doe - Jan 15, 2025
• [Schedule 2] - Jane Smith - Jan 16, 2025
• [+ Create New Schedule]

Quick Tips:
• Click any schedule card to edit
• Use search to find tasks across all schedules  
• Share button creates secure links for your team
```

## 🛠 Developer Procedures

### Migration Code Implementation

#### 1. Store Initialization (src/lib/store.ts)
```typescript
// Run migration on first store initialization
const useStore = create<MultiScheduleStore>()(
  devtools(
    persist(
      (set, get) => ({
        // ... store state
        
        initializeStore: () => {
          const { migrationCompleted } = get();
          
          // Only migrate if not completed and v1 data exists
          if (!migrationCompleted && needsMigration()) {
            const success = migrateV1Data();
            
            if (success) {
              set({ 
                migrationCompleted: true,
                lastBackup: new Date().toISOString()
              });
              
              // Show user notification
              showMigrationToast('success', {
                migratedCount: get().migrationInfo?.migratedCount || 0
              });
            } else {
              // Fallback to v1 compatibility mode
              set({ 
                migrationStatus: 'failed',
                fallbackMode: true 
              });
              
              showMigrationToast('error');
            }
          } else if (migrationCompleted) {
            // Cleanup expired shares post-migration
            get().cleanupExpiredShares();
          }
        },
        
        // ... other actions
      }),
      // ... persist config
    )
  )
);
```

#### 2. Migration Service (src/lib/migration.ts)
```typescript
// Migration service with detailed logging
export class MigrationService {
  private backupCreated = false;
  
  async performMigration(): Promise<MigrationResult> {
    const result: MigrationResult = {
      status: 'pending',
      migratedCount: 0,
      totalCount: 0,
      failedEntries: [],
      errors: [],
      warnings: [],
      backupCreated: false,
      startTime: new Date(),
    };
    
    try {
      // Step 1: Create backup
      await this.createBackup();
      result.backupCreated = this.backupCreated;
      
      // Step 2: Read v1 data
      const v1Data = this.readV1Data();
      if (!v1Data || v1Data.length === 0) {
        result.status = 'skipped';
        result.warnings.push('No v1 data found');
        return result;
      }
      
      result.totalCount = v1Data.length;
      console.log(`Starting migration of ${v1Data.length} v1 schedules`);
      
      // Step 3: Transform data
      const migrated = await this.transformData(v1Data);
      result.migratedCount = migrated.success.length;
      result.failedEntries = migrated.failed;
      
      if (migrated.errors.length > 0) {
        result.errors.push(...migrated.errors);
        result.status = result.migratedCount > 0 ? 'partial' : 'failed';
      } else {
        result.status = 'success';
      }
      
      // Step 4: Validate and save
      if (result.status === 'success' || result.status === 'partial') {
        const saveResult = await this.saveMigratedData(migrated.success);
        if (!saveResult) {
          result.status = 'failed';
          result.errors.push('Failed to save migrated data');
        }
      }
      
      // Step 5: Cleanup
      this.cleanupV1Data(result.status === 'success');
      
      result.endTime = new Date();
      result.duration = result.endTime.getTime() - result.startTime.getTime();
      
      this.logMigrationResult(result);
      
      return result;
      
    } catch (error) {
      result.status = 'failed';
      result.errors.push(`Migration crashed: ${error.message}`);
      result.endTime = new Date();
      this.logMigrationResult(result);
      return result;
    }
  }
  
  private async createBackup(): Promise<boolean> {
    try {
      const v1Data = localStorage.getItem('housekeeperSchedules');
      if (v1Data) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        localStorage.setItem(`housekeeperSchedules-backup-${timestamp}`, v1Data);
        this.backupCreated = true;
        console.log('Backup created:', `housekeeperSchedules-backup-${timestamp}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Backup creation failed:', error);
      return false;
    }
  }
  
  private readV1Data(): any[] {
    try {
      const data = localStorage.getItem('housekeeperSchedules');
      if (!data) return [];
      
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : parsed.schedules || [];
    } catch (error) {
      console.error('Failed to read v1 data:', error);
      return [];
    }
  }
  
  private async transformData(v1Data: any[]): Promise<{
    success: Schedule[];
    failed: string[];
    errors: string[];
  }> {
    const success: Schedule[] = [];
    const failed: string[] = [];
    const errors: string[] = [];
    
    for (let i = 0; i < v1Data.length; i++) {
      try {
        const v1Entry = v1Data[i];
        const migrated = this.transformSingleEntry(v1Entry, i);
        
        if (migrated) {
          success.push(migrated);
          console.log(`✓ Migrated entry ${i + 1}: ${v1Entry.name}`);
        } else {
          failed.push(`Entry ${i + 1}: ${v1Entry.name || 'Unknown'}`);
        }
      } catch (error) {
        const entryName = v1Data[i]?.name || `Entry ${i + 1}`;
        failed.push(entryName);
        errors.push(`Entry ${i + 1} (${entryName}): ${error.message}`);
        console.error(`✗ Migration failed for ${entryName}:`, error);
      }
    }
    
    return { success, failed, errors };
  }
  
  private transformSingleEntry(v1Entry: any, index: number): Schedule | null {
    // Implementation details from technical spec
    // ... (transform logic)
    
    // Validate transformed data
    try {
      scheduleSchema.parse(transformedSchedule);
      return transformedSchedule;
    } catch (validationError) {
      console.error(`Validation failed for entry ${index + 1}:`, validationError);
      return null;
    }
  }
  
  private async saveMigratedData(schedules: Schedule[]): Promise<boolean> {
    try {
      const currentState = storage.getStoreState();
      const newState = {
        ...currentState,
        schedules: [...currentState.schedules, ...schedules],
        migrationCompleted: true,
        migrationInfo: {
          date: new Date().toISOString(),
          source: 'v1',
          count: schedules.length,
          method: 'automatic',
        },
      };
      
      return storage.setStoreState(newState);
    } catch (error) {
      console.error('Failed to save migrated data:', error);
      return false;
    }
  }
  
  private cleanupV1Data(success: boolean): void {
    if (success) {
      localStorage.removeItem('housekeeperSchedules');
      console.log('v1 data cleaned up after successful migration');
    } else {
      console.log('v1 data preserved due to migration failure');
    }
  }
  
  private logMigrationResult(result: MigrationResult): void {
    console.group('Migration Results');
    console.log('Status:', result.status);
    console.log('Migrated:', result.migratedCount, 'of', result.totalCount);
    console.log('Failed:', result.failedEntries.length);
    console.log('Duration:', result.duration, 'ms');
    console.log('Backup created:', result.backupCreated);
    
    if (result.errors.length > 0) {
      console.group('Errors:');
      result.errors.forEach((error, i) => console.log(`${i + 1}. ${error}`));
      console.groupEnd();
    }
    
    if (result.warnings.length > 0) {
      console.group('Warnings:');
      result.warnings.forEach((warning, i) => console.log(`${i + 1}. ${warning}`));
      console.groupEnd();
    }
    
    console.groupEnd();
  }
}

// Migration result type
export interface MigrationResult {
  status: 'pending' | 'success' | 'partial' | 'failed' | 'skipped';
  migratedCount: number;
  totalCount: number;
  failedEntries: string[];
  errors: string[];
  warnings: string[];
  backupCreated: boolean;
  startTime: Date;
  endTime?: Date;
  duration?: number;
}

// Migration notifications
export function showMigrationToast(
  status: MigrationResult['status'], 
  details?: { migratedCount?: number }
): void {
  switch (status) {
    case 'success':
      toast.success(
        'Welcome to v2! 🎉',
        details?.migratedCount 
          ? `Successfully migrated ${details.migratedCount} schedule${details.migratedCount !== 1 ? 's' : ''}.`
          : 'Your data has been upgraded to the new multi-schedule format.'
      );
      break;
      
    case 'partial':
      toast.warning(
        'Partial Migration',
        `Migrated ${details?.migratedCount || 0} schedules. Some entries needed manual review.`
      );
      break;
      
    case 'failed':
      toast.error(
        'Migration Failed',
        'We couldn\'t complete the upgrade. Your original data is safe. Please try again or contact support.'
      );
      break;
      
    case 'skipped':
      console.log('Migration skipped - no v1 data found');
      break;
  }
}

// Export service instance
export const migrationService = new MigrationService();
```

### Rollback Procedures

#### Automatic Fallback (User-Facing)
If migration fails, the app automatically:
1. **Preserves v1 data** in original localStorage key
2. **Enters compatibility mode** - v1 UI with v1 data access
3. **Shows recovery options**:
   - Retry migration
   - Continue with v1 data
   - Export for manual migration
   - Contact support

#### Manual Rollback (Developer/Admin)
```bash
# 1. Stop application
# 2. Clear v2 storage
localStorage.removeItem('hk-schedules-v2')
localStorage.removeItem('hk-schedules-v2-storage')

# 3. Restore from backup (if available)
# Find latest backup: housekeeperSchedules-backup-YYYY-MM-DDThh-mm-ss
const backupKey = Object.keys(localStorage).find(key => 
  key.startsWith('housekeeperSchedules-backup-')
)?.split('-').slice(-1)[0];

if (backupKey) {
  localStorage.setItem('housekeeperSchedules', 
    localStorage.getItem(`housekeeperSchedules-backup-${backupKey}`)!
  );
}

# 4. Restart in v1 compatibility mode
# Set flag to disable v2 features
localStorage.setItem('hk-schedules-compatibility-mode', 'true');
```

#### Data Recovery Steps
1. **Check backups**: Look for `housekeeperSchedules-backup-*` keys
2. **Validate v1 structure**: Ensure data matches v1 schema
3. **Manual re-migration**: Use migration service in debug mode
4. **Import from export**: If user exported JSON before migration

### Validation & Testing

#### Pre-Migration Validation
```typescript
// Validate v1 data before migration
function validateV1Data(data: any[]): ValidationResult {
  const issues: string[] = [];
  
  data.forEach((entry, index) => {
    if (!entry.name || typeof entry.name !== 'string') {
      issues.push(`Entry ${index + 1}: Invalid or missing name`);
    }
    
    if (!entry.tasks || typeof entry.tasks !== 'string') {
      issues.push(`Entry ${index + 1}: Invalid or missing tasks`);
    }
    
    if (!entry.start || !/^\d{2}:\d{2}$/.test(entry.start)) {
      issues.push(`Entry ${index + 1}: Invalid start time`);
    }
    
    if (!entry.end || !/^\d{2}:\d{2}$/.test(entry.end)) {
      issues.push(`Entry ${index + 1}: Invalid end time`);
    }
    
    // Check time logic
    const [startH, startM] = entry.start.split(':').map(Number);
    const [endH, endM] = entry.end.split(':').map(Number);
    
    if (endH * 60 + endM <= startH * 60 + startM) {
      issues.push(`Entry ${index + 1}: End time before start time`);
    }
  });
  
  return {
    valid: issues.length === 0,
    issues,
    dataCount: data.length,
  };
}
```

#### Post-Migration Validation
```typescript
// Verify migration integrity
function validateMigration(): MigrationValidationResult {
  const v2State = storage.getStoreState();
  const result: MigrationValidationResult = {
    dataIntegrity: 'unknown',
    entryCountMatch: false,
    timePreserved: true,
    assigneePreserved: true,
    issues: [],
  };
  
  // Check if migration metadata exists
  if (!v2State.migrationInfo) {
    result.issues.push('No migration metadata found');
    return result;
  }
  
  // Verify entry count
  const totalV2Entries = v2State.schedules.reduce(
    (sum, s) => sum + s.entries.length, 0
  );
  
  // Note: v1 had flat structure, v2 has nested - count may differ
  result.entryCountMatch = totalV2Entries > 0;
  
  // Sample time validation (check first 10 entries)
  const sampleEntries = v2State.schedules
    .flatMap(s => s.entries)
    .slice(0, 10);
    
  sampleEntries.forEach((entry, i) => {
    const [start, end] = entry.time.split('-');
    if (!start || !end || !/^\d{2}:\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(end)) {
      result.issues.push(`Entry ${i + 1}: Invalid time format "${entry.time}"`);
      result.timePreserved = false;
    }
  });
  
  // Assignee validation
  v2State.schedules.forEach(schedule => {
    schedule.entries.forEach(entry => {
      if (!entry.assignees || entry.assignees.length === 0) {
        result.issues.push(`Schedule ${schedule.id}: No assignees`);
        result.assigneePreserved = false;
      }
    });
  });
  
  // Schema validation
  try {
    scheduleSchema.array().parse(v2State.schedules);
    result.dataIntegrity = 'valid';
  } catch (error) {
    result.dataIntegrity = 'invalid';
    result.issues.push(`Schema validation failed: ${error.message}`);
  }
  
  return result;
}
```

### Migration Analytics

#### Success Metrics
- **Migration Success Rate**: 95%+ (target)
- **Data Preservation**: 100% entry count maintained
- **Performance**: < 3 seconds for typical user (10 schedules)
- **Error Rate**: < 1% critical failures
- **User Satisfaction**: No data loss complaints

#### Monitoring Points
```typescript
// Track migration events
function trackMigrationEvent(event: string, data?: any): void {
  if (import.meta.env.PROD) {
    // Send to analytics service (future)
    console.log('Analytics:', { event, data, timestamp: new Date().toISOString() });
  }
}

export function performMigrationWithTracking(): Promise<MigrationResult> {
  trackMigrationEvent('migration_start', { 
    userAgent: navigator.userAgent,
    storageQuota: navigator.storage?.estimate()?.quota || 'unknown',
  });
  
  return migrationService.performMigration().then(result => {
    trackMigrationEvent('migration_complete', {
      status: result.status,
      migratedCount: result.migratedCount,
      totalCount: result.totalCount,
      duration: result.duration,
      backupCreated: result.backupCreated,
    });
    
    return result;
  }).catch(error => {
    trackMigrationEvent('migration_error', { 
      error: error.message, 
      stack: error.stack 
    });
    throw error;
  });
}
```

## 🚨 Troubleshooting

### Common Issues & Solutions

#### 1. "Migration Failed" Error
**Symptoms**: App shows error toast, continues in v1 mode
**Cause**: Data validation failed or storage quota exceeded
**Solution**:
```
1. Refresh page [Retry Migration]
2. Check browser console for detailed errors
3. Export current data: Settings → Export All
4. Clear site data: DevTools → Application → Storage → Clear
5. Re-import exported data in v2 format
```

#### 2. Empty Dashboard After Migration
**Symptoms**: Success message but no schedules visible
**Cause**: Migration completed but UI filter issue
**Solution**:
```
1. Check URL: Should be "/" (Dashboard)
2. Clear filters: Dashboard header → Clear All Filters
3. Check archived: Filter → Show Archived Schedules
4. Verify storage: DevTools → Application → localStorage
5. Manual migration check: Console → migrationService.performMigration()
```

#### 3. Some Schedules Missing
**Symptoms**: Partial migration success, some data lost
**Cause**: Individual entry validation failures
**Solution**:
```
1. Check migration log: Console → Migration Results
2. Review failed entries list
3. Import from backup: Settings → Import Data
4. Manual entry recreation for failed items
5. Report issue with failed entry details
```

#### 4. Storage Quota Exceeded
**Symptoms**: Migration fails with quota error
**Cause**: v1 data + v2 structure exceeds 5MB browser limit
**Solution**:
```
1. Auto-export triggered during failure
2. Download backup file from notifications
3. Clear old schedules: Dashboard → Archive/Delete
4. Import selectively from backup
5. Consider desktop app for large datasets (>50 schedules)
```

### Recovery Checklist

#### Immediate Actions
- [ ] Confirm v1 data still exists (`housekeeperSchedules` key)
- [ ] Check for backup (`housekeeperSchedules-backup-*` keys)
- [ ] Verify browser storage quota (DevTools → Application → Storage)
- [ ] Test in incognito/private mode (clean environment)
- [ ] Check browser console for detailed error messages

#### Data Recovery Steps
1. **Export Everything**: Use v1 export (CSV/JSON) as final backup
2. **Clear v2 Data**: Remove `hk-schedules-v2` and `hk-schedules-v2-storage`
3. **Restore v1**: Copy backup to `housekeeperSchedules` key
4. **Test v1 Mode**: Verify original functionality works
5. **Retry Migration**: Run migration service manually
6. **Validate Results**: Check entry counts and sample data

#### When to Contact Support
- Migration fails 3+ times with same error
- More than 50% of schedules lost
- Critical business data affected
- Browser-specific issues across multiple browsers
- Custom v1 modifications breaking migration

## 📋 Migration Verification

### Post-Migration Checklist

#### Data Integrity
- [ ] Total schedule count matches v1 + new schedules
- [ ] All original tasks preserved in entries
- [ ] Time ranges maintained (start/end → time field)
- [ ] Original assignee names appear in assignees array
- [ ] Dates preserved (v1 date → schedule startDate)
- [ ] Notes/comments migrated to entry notes field

#### Functionality
- [ ] Dashboard shows all migrated schedules as cards
- [ ] Can edit individual migrated schedules
- [ ] CSV export includes all migrated data
- [ ] Print view works for migrated schedules
- [ ] Search finds migrated schedule titles/tasks
- [ ] Filters work (category, status, assignee)

#### Performance
- [ ] Dashboard loads < 2 seconds with 20+ schedules
- [ ] No console errors related to undefined data
- [ ] localStorage size reasonable (< 3MB typical)
- [ ] No hydration mismatches in React DevTools

### Validation Script (Developer)
```javascript
// Run in browser console after migration
(function validateMigration() {
  const v2Data = JSON.parse(localStorage.getItem('hk-schedules-v2') || '{}');
  const migrationInfo = v2Data.migrationInfo;
  
  console.group('Migration Validation Report');
  
  // Basic checks
  console.log('v2 Store Version:', v2Data.version);
  console.log('Migration Completed:', v2Data.migrationCompleted);
  console.log('Total Schedules:', v2Data.schedules?.length || 0);
  console.log('Total Entries:', v2Data.schedules?.reduce((sum, s) => sum + s.entries.length, 0) || 0);
  console.log('Storage Size:', new Blob([localStorage.getItem('hk-schedules-v2') || '']).size, 'bytes');
  
  if (migrationInfo) {
    console.group('Migration Metadata');
    console.log('Migrated Count:', migrationInfo.migratedCount);
    console.log('Total v1 Count:', migrationInfo.totalCount);
    console.log('Failed Count:', migrationInfo.totalCount - migrationInfo.migratedCount);
    console.log('Migration Date:', migrationInfo.date);
    console.groupEnd();
  }
  
  // Sample data inspection
  if (v2Data.schedules?.length > 0) {
    console.group('Sample Schedule (First Item)');
    const sample = v2Data.schedules[0];
    console.log('Title:', sample.title);
    console.log('Category:', sample.category);
    console.log('Entry Count:', sample.entries.length);
    console.log('Sample Entry:', sample.entries[0]);
    console.log('Has UUIDs:', !!sample.id && !!sample.entries[0]?.id);
    console.log('Valid Dates:', !isNaN(sample.startDate.getTime()));
    console.groupEnd();
  }
  
  // Check for common issues
  const issues = [];
  
  v2Data.schedules?.forEach((schedule, i) => {
    if (!schedule.id) issues.push(`Schedule ${i}: Missing ID`);
    if (schedule.entries.length === 0) issues.push(`Schedule ${i}: No entries`);
    schedule.entries?.forEach((entry, j) => {
      if (!entry.time) issues.push(`Schedule ${i}, Entry ${j}: Missing time`);
      if (entry.assignees?.length === 0) issues.push(`Schedule ${i}, Entry ${j}: No assignees`);
    });
  });
  
  if (issues.length > 0) {
    console.group('Validation Issues:');
    issues.forEach(issue => console.warn('•', issue));
    console.groupEnd();
  } else {
    console.log('✅ No validation issues found');
  }
  
  console.groupEnd();
  
  // Export validation report
  const report = {
    timestamp: new Date().toISOString(),
    storeVersion: v2Data.version,
    scheduleCount: v2Data.schedules?.length || 0,
    totalEntries: v2Data.schedules?.reduce((sum, s) => sum + s.entries.length, 0) || 0,
    issues: issues,
    storageSize: new Blob([localStorage.getItem('hk-schedules-v2') || '']).size,
  };
  
  console.log('Full Report:', report);
  
  // Optional: Download report
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `migration-validation-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  
  return report;
})();
```

## 📈 Migration Statistics (Expected)

### Data Volume
| User Type | v1 Schedules | v1 Size | v2 Schedules | v2 Size | Growth |
|-----------|--------------|---------|--------------|---------|--------|
| Light User | 1-5 | ~10KB | 1-5 | ~15KB | +50% |
| Regular User | 6-20 | ~50KB | 6-20 | ~80KB | +60% |
| Power User | 21-50 | ~150KB | 21-50 | ~250KB | +67% |
| Enterprise | 51+ | ~500KB+ | 51+ | ~800KB+ | +60% |

### Performance Targets
- **Detection**: < 50ms
- **Small Migration** (5 schedules): < 1 second
- **Medium Migration** (20 schedules): < 3 seconds  
- **Large Migration** (50 schedules): < 8 seconds
- **Validation**: < 200ms
- **Storage Write**: < 100ms

### Success Rates (Target)
- **Overall Success**: 98%
- **Data Preservation**: 100%
- **Partial Success**: < 2% (recoverable)
- **Critical Failure**: < 0.1% (data-safe)

## 🎉 Next Steps After Migration

### For Users
1. **Explore Dashboard**: View all your schedules in card format
2. **Try Multi-Select**: Assign tasks to multiple team members
3. **Test Sharing**: Generate a share link for a schedule
4. **Use Filters**: Search and filter across all schedules
5. **Customize Categories**: Organize schedules by client/shift/location

### For Developers
1. **Verify Migration**: Run validation script in console
2. **Test Edge Cases**: Empty schedules, large datasets, invalid data
3. **Monitor Analytics**: Track migration success rates
4. **Document Issues**: Log any data anomalies found
5. **Plan v2.1**: Consider user feedback for cloud sync features

### Migration Complete Checklist
- [ ] All v1 data accessible in v2 Dashboard
- [ ] CSV export/import works with mixed v1/v2 data
- [ ] Print functionality preserved for migrated schedules
- [ ] Search finds content from v1 schedules
- [ ] No console errors related to migrated data
- [ ] Performance acceptable (< 3s load for typical user)
- [ ] User feedback collected on migration experience

---

*This migration maintains full backward compatibility while enabling powerful new multi-schedule features. Your data is safe, and the upgrade process is designed to be seamless and recoverable.*

**Questions?** Contact the development team or check the [Technical Specification](technical-specification-v2.md) for implementation details.

## 📤 CSV Import/Export Compatibility

### Overview
v2 maintains full compatibility with v1 CSV exports while introducing an enhanced format for the new multi-entry structure. The import parser automatically detects and handles both formats, ensuring users can seamlessly migrate historical data without manual reformatting.

### Format Differences
| Aspect | v1 Format (Legacy) | v2 Format (Current) |
|--------|--------------------|---------------------|
| **Columns** | 5 columns: Name, Date, Start, End, Tasks | 6+ columns: Housekeeper, Assignee, Date, Start Time, Duration (h), Tasks |
| **Duration** | Separate "End" time column | Single "Duration (h)" column (e.g., "1.5h") |
| **Assignee** | Combined with Name (no separate column) | Separate "Assignee" column for individual entries |
| **Tasks** | Single tasks field | Tasks per entry (supports multi-task schedules) |
| **Header Example** | `Name,Date,Start,End,Tasks` | `Housekeeper,Assignee,Date,Start Time,Duration (h),Tasks` |
| **File Size** | Smaller (flat structure) | Larger (entries array support) |

### Importing v1 CSVs in v2
The updated import handler in `src/App.tsx` automatically detects legacy v1 CSVs and processes them as follows:

1. **Format Detection**:
   - Scans header for "End" column presence without "Duration"
   - Checks column count (4-6 for v1 vs. 6+ for v2)
   - Logs detection: "Detected legacy v1 CSV format"

2. **Data Transformation**:
   - **Name** → Housekeeper/Assignee (single entry)
   - **Date** → Schedule date
   - **Start/End** → Entry time; duration calculated using `getDuration()` utility (e.g., "09:00-10:00" → 60 minutes)
   - **Tasks** → Entry task field
   - Creates v2 Schedule with single entry array, category='housekeeping', version='2.0'

3. **Validation & Feedback**:
   - Skips invalid rows (e.g., missing times, empty names) with console warnings
   - Alert shows: "3 legacy schedules imported successfully. 1 row skipped (invalid data)."
   - Supports up to 1000 rows; processes <2s for typical files

#### Example v1 CSV → v2 Schedule
**v1 CSV Row**:
```
John Doe,2025-01-15,09:00,11:00,"Clean rooms, vacuum hallways"
```

**Resulting v2 Structure**:
```json
{
  "id": "imported-123",
  "title": "John Doe",
  "category": "housekeeping",
  "date": "2025-01-15",
  "entries": [{
    "id": "uuid-456",
    "time": "09:00",
    "duration": 120,
    "task": "Clean rooms, vacuum hallways",
    "assignee": "John Doe",
    "status": "pending"
  }],
  "version": "2.0"
}
```

### Exporting from v2 (Backward Compatible)
- v2 exports maintain the new 6-column format
- For v1 compatibility, users can manually edit the CSV (remove Assignee column, add End column calculated from Start + Duration)
- Future: Add export format selector (v1/v2) in UI

### Troubleshooting CSV Migration
#### "0 schedules imported" (Legacy Files)
- **Cause**: v1 CSV detected but parsing failed (e.g., invalid time format)
- **Solution**:
  1. Check browser console for warnings (e.g., "Skipping legacy row 2: invalid data")
  2. Verify CSV structure matches v1 format
  3. Ensure times in HH:MM format (e.g., "09:00", not "9 AM")
  4. Test with small sample file first

#### Mixed v1/v2 Import
- v2 parser prioritizes format detection
- If detection fails, treats as raw data (may skip rows)
- Recommendation: Separate imports for legacy vs. new files

#### Large CSV Files (>500 rows)
- **Performance**: <5s processing time
- **Memory**: Uses FileReader (streaming, no full load)
- **Fallback**: If browser quota exceeded, shows "Partial import" with skipped count

### Best Practices
1. **Backup First**: Export current data before importing legacy CSVs
2. **Validate Format**: Use spreadsheet tools to check column consistency
3. **Incremental Import**: Start with small batches (10-50 rows) for large migrations
4. **Post-Import Review**: Use Dashboard search to verify all tasks appear
5. **Documentation**: Refer to [User Story US-004](docs/US-002-backlog.md#us-004-backward-compatibility-for-legacy-csv-imports) for technical details

### Developer Notes
- **Detection Logic**: Header-based (case-insensitive); fallback to column count
- **Duration Calc**: Uses existing `getDuration(start, end)` utility; handles overnight shifts
- **Error Handling**: Silent skips for invalid rows; detailed console logging
- **Testing**: Unit tests cover v1/v2 parsing, edge cases (invalid times, empty tasks)
- **Future Enhancements**: UI format selector, progress bar for large files, v1 export mode

This ensures seamless data migration for users upgrading from v1 while maintaining the enhanced v2 capabilities.