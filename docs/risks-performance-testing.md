
# HK-Schedules v2 Risks, Performance & Testing Strategy

**Version**: 1.0  
**Date**: September 2025  
**Epic**: BE-001 Multi-Schedule Management and Team Collaboration Enhancement  
**Risk Level**: Medium (Brownfield complexity, migration challenges)  
**Performance Target**: <1s dashboard load, <500KB bundle  
**Test Coverage Goal**: 95% for new code, 80% overall  
**MTTR Target**: <4 hours for critical issues  

## ⚠️ Risk Assessment

### 1. Migration Risks (High Impact, Medium Probability)

#### Risk: Data Loss During Migration
**Description**: v1 to v2 data transformation fails, resulting in lost schedules/tasks  
**Impact**: Critical - Business data destruction  
**Probability**: Medium (5-15%) - Depends on v1 data quality  
**Mitigation Strategy**:
- **Pre-Migration**: Automatic backup creation, data validation, user consent for large datasets
- **During Migration**: Transactional approach, progressive validation, detailed error logging
- **Post-Migration**: Comprehensive validation script, 24-hour rollback window

**Detection & Recovery**:
```typescript
// Post-migration integrity check
function verifyMigrationIntegrity(): MigrationHealth {
  const v2State = storage.getStoreState();
  const issues = [];
  
  // Count validation
  const v2TotalEntries = v2State.schedules.reduce((sum, s) => sum + s.entries.length, 0);
  const migrationInfo = v2State.migrationInfo;
  
  if (migrationInfo && v2TotalEntries < migrationInfo.migratedCount * 0.9) {
    issues.push(`Entry count mismatch: ${v2TotalEntries} vs expected ${migrationInfo.migratedCount}`);
  }
  
  // Sample validation (first 10 entries)
  v2State.schedules.slice(0, 10).forEach((schedule, i) => {
    schedule.entries.forEach((entry, j) => {
      if (!entry.task || entry.task.length === 0) {
        issues.push(`Schedule ${i}, Entry ${j}: Empty task`);
      }
      if (!entry.assignees?.length) {
        issues.push(`Schedule ${i}, Entry ${j}: No assignees`);
      }
    });
  });
  
  return {
    healthy: issues.length === 0,
    issues,
    confidence: issues.length === 0 ? 100 : (v2TotalEntries / (migrationInfo?.totalCount || 1)) * 100,
  };
}
```

**Recovery Procedures**:
- **Immediate**: Fallback to v1 compatibility mode
- **Short-term**: Restore from timestamped backup (`housekeeperSchedules-backup-*`)
- **Long-term**: Manual reconstruction from CSV exports
- **Prevention**: Automated backup before any migration attempt

#### Risk: Migration Performance Degradation
**Description**: Large v1 datasets (>100 schedules) cause browser freezing during migration  
**Impact**: High - Poor user experience, potential crashes  
**Probability**: Low (2-5%) - Most users have <20 schedules  
**Mitigation Strategy**:
- **Chunked Processing**: Process 5 entries per animation frame (16ms budget)
- **Progress Indicators**: Real-time progress with estimated completion time
- **Pause/Resume**: Allow users to pause long migrations
- **Web Workers**: Offload transformation to background thread
- **User Warnings**: Pre-notify users with >50 schedules

**Performance Monitoring**:
```typescript
// Migration performance wrapper
function monitorMigrationPerformance(callback: () => Promise<void>) {
  const startTime = performance.now();
  const startMemory = performance.memory?.usedJSHeapSize || 0;
  let processed = 0;
  
  return callback().then(result => {
    const duration = performance.now() - startTime;
    const memoryUsed = (performance.memory?.usedJSHeapSize || 0) - startMemory;
    
    const metrics = {
      duration,
      memoryUsed,
      schedulesProcessed: result.migratedCount,
      avgTimePerSchedule: duration / result.migratedCount,
      performanceScore: calculatePerformanceScore(duration, result.migratedCount),
    };
    
    if (metrics.duration > 5000) { // >5s warning
      console.warn('Slow migration detected:', metrics);
      showMigrationWarning(metrics);
    }
    
    // Track for analytics
    trackMigrationPerformance(metrics);
    
    return { result, metrics };
  });
}

function showMigrationWarning(metrics: MigrationMetrics) {
  const remainingTime = Math.round(metrics.avgTimePerSchedule * (50 - metrics.schedulesProcessed));
  toast.warning(
    'Large Migration Detected',
    `This may take ${Math.ceil(remainingTime / 1000)} more seconds. You can pause and resume later.`
  );
}
```

### 2. Performance Risks (Medium Impact, High Probability)

#### Risk: Bundle Size Explosion
**Description**: New dependencies (React Select: 45KB) push initial load over performance budget  
**Impact**: Medium - Slower Time to Interactive, higher bounce rate  
**Probability**: High (70-90%) - UI libraries are heavy  
**Mitigation Strategy**:
- **Bundle Budget**: 500KB total (current: 85KB v1 + 124KB v2 = 209KB, 58% headroom)
- **Code Splitting**: Manual chunks for v2 features, lazy loading for routes
- **Tree Shaking**: Import specific functions (date-fns, lodash-es)
- **Dynamic Imports**: Load heavy components only when needed
- **Critical Path**: Inline critical CSS/JS, defer non-essential

**Bundle Monitoring**:
```typescript
// CI/CD bundle size check
export class BundleMonitor {
  private v1Baseline = 85000; // 85KB gzip
  private budget = 500000; // 500KB total
  private growthThreshold = 1.1; // 10% week-over-week
  
  analyzeBundle(stats: any): BundleAnalysis {
    const v2Size = this.calculateV2Contribution(stats);
    const totalSize = this.calculateTotalSize(stats);
    const weekOverWeek = this.getWeekOverWeekGrowth();
    
    const analysis: BundleAnalysis = {
      status: 'healthy',
      v1Size: this.v1Baseline,
      v2Size,
      totalSize,
      headroom: this.budget - totalSize,
      growth: weekOverWeek,
      recommendations: [],
      warnings: [],
    };
    
    // Budget alerts
    if (totalSize > this.budget * 0.8) {
      analysis.status = 'warning';
      analysis.recommendations.push('Review largest dependencies (react-select 45KB)');
    }
    
    if (totalSize > this.budget) {
      analysis.status = 'critical';
      analysis.recommendations.push('Bundle exceeds budget - immediate action required');
    }
    
    // Growth alerts
    if (weekOverWeek > this.growthThreshold) {
      analysis.warnings.push(`Bundle grew ${(weekOverWeek * 100 - 100).toFixed(1)}% week-over-week`);
    }
    
    // v2 impact analysis
    if (v2Size > 100000) { // >100KB v2 contribution
      analysis.warnings.push('v2 features represent significant bundle weight');
    }
    
    return analysis;
  }
  
  private calculateV2Contribution(stats: any): number {
    return Object.entries(stats)
      .filter(([chunkName]) => 
        // v2 feature chunks
        chunkName.includes('v2') ||
        // v2 dependencies
        ['zustand', 'react-router', 'react-hook-form', 'react-select'].some(dep => 
          chunkName.includes(dep)
        )
      )
      .reduce((sum, [_, chunkData]) => sum + (chunkData.renderedSize || 0), 0);
  }
}
```

**Bundle Optimization Techniques**:
```typescript
// 1. Dynamic imports for routes
const Dashboard = lazy(() => import('./dashboard/Dashboard'));
const ScheduleEditor = lazy(() => import('./schedule/ScheduleEditor'));

// 2. Tree-shaken imports
import { format, parseISO } from 'date-fns'; // 3KB vs 12KB full
import { create } from 'zustand'; // Only store creator

// 3. Manual chunking (vite.config.ts)
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Isolate v2 features
          'v2-store': ['zustand'],
          'v2-router': ['react-router-dom'],
          'v2-forms': ['react-hook-form', 'zod'],
          'v2-select': ['react-select'], // 45KB isolated
          // v1 legacy
          'v1-core': ['src/App.tsx', 'src/components/v1'],
        },
      },
    },
  },
});

// 4. Critical CSS inlining
// vite.config.ts
css: {
  devSourcemap: true,
  // Extract only above-the-fold CSS
  extract: false, // Inline for faster FCP
},
```

#### Risk: React Re-render Performance Issues
**Description**: Zustand store updates cause excessive component re-renders, especially in Dashboard with 50+ schedules  
**Impact**: High - Choppy UI, poor perceived performance  
**Probability**: Medium (30-50%) - Common React optimization challenge  
**Mitigation Strategy**:
- **Granular Selectors**: Store slices prevent full re-renders
- **Shallow Comparison**: Object/array equality optimization
- **Virtualization**: react-window for large lists
- **Memoization**: React.memo for pure components
- **Batching**: Store updates batched with React 18 automatic batching

**Re-render Optimization**:
```typescript
// src/lib/store-optimized.ts
import { shallow } from 'zustand/shallow';
import { useMemo, useCallback } from 'react';

export const useOptimizedStore = () => {
  // Granular selectors - only re-render when specific data changes
  const scheduleCount = useStore(state => state.schedules.length);
  const currentFilters = useStore(state => state.filters, shallow);
  const visibleSchedules = useStore(state => {
    // Expensive filtering memoized at store level
    return state.filteredSchedules;
  }, shallow);
  
  // Component-specific selectors
  const useScheduleById = useCallback((id: string) => {
    return useStore(state => state.getScheduleById(id));
  }, []);
  
  return {
    scheduleCount,
    currentFilters,
    visibleSchedules,
    useScheduleById,
  };
};

// Memoized components
const ScheduleCard = memo(({ schedule }) => {
  // Only re-renders when schedule prop changes
  return (
    <div className="schedule-card">
      <h3>{schedule.title}</h3>
      <p>{schedule.category}</p>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison
  return prevProps.schedule.id === nextProps.schedule.id &&
         prevProps.schedule.updatedAt === nextProps.schedule.updatedAt;
});

// Virtualized dashboard for 50+ schedules
import { FixedSizeList as List } from 'react-window';

function VirtualizedDashboard({ schedules, height = 600 }) {
  const Row = ({ index, style }) => (
    <div style={style}>
      <ScheduleCard schedule={schedules[index]} />
    </div>
  );
  
  if (schedules.length < 20) {
    // Use regular list for small datasets (better accessibility)
    return (
      <div className="schedule-grid">
        {schedules.map(schedule => (
          <ScheduleCard key={schedule.id} schedule={schedule} />
        ))}
      </div>
    );
  }
  
  return (
    <List
      height={height}
      itemCount={schedules.length}
      itemSize={120} // Fixed height for virtualization
      width="100%"
      itemData={schedules}
    >
      {Row}
    </List>
  );
}
```

**Performance Monitoring**:
```typescript
// src/lib/performance-monitor.ts
export class PerformanceMonitor {
  private reRenderCounts = new Map<string, number>();
  private slowThreshold = 16; // 60fps frame budget
  private criticalThreshold = 50; // Critical re-render threshold
  
  trackComponentRender(componentName: string, renderDuration: number) {
    const count = (this.reRenderCounts.get(componentName) || 0) + 1;
    this.reRenderCounts.set(componentName, count);
    
    if (renderDuration > this.slowThreshold) {
      console.warn(
        `${componentName} render took ${renderDuration.toFixed(2)}ms ` +
        `(${count} renders total)`
      );
    }
    
    if (count > this.criticalThreshold) {
      console.error(
        `🚨 ${componentName} has rendered ${count} times - ` +
        `optimization needed!`
      );
    }
  }
  
  monitorStoreUpdates(store) {
    const originalSubscribe = store.subscribe;
    
    store.subscribe = (listener, selector, equalityFn) => {
      let renderCount = 0;
      let lastUpdate = 0;
      
      const wrappedListener = () => {
        const start = performance.now();
        listener();
        const duration = performance.now() - start;
        
        renderCount++;
        lastUpdate = Date.now();
        
        // Detect excessive re-renders
        if (renderCount > 10 && Date.now() - lastUpdate < 5000) {
          console.warn(
            `Store listener re-rendered ${renderCount} times in 5s - ` +
            `consider granular selectors`
          );
        }
        
        this.trackComponentRender('StoreListener', duration);
      };
      
      return originalSubscribe.call(store, wrappedListener, selector, equalityFn);
    };
    
    return store;
  }
  
  // Integration with React Profiler
  setupReactProfiler() {
    if (import.meta.env.DEV) {
      // why-did-you-render setup
      if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined') {
        __REACT_DEVTOOLS_GLOBAL_HOOK__.inject(this);
      }
    }
  }
}

// Usage in components
function usePerformanceTracking(componentName: string) {
  const perf = usePerformanceMonitor();
  
  const startMeasure = useCallback(() => {
    if (import.meta.env.DEV) {
      performance.mark(`${componentName}-start`);
    }
  }, [componentName]);
  
  const endMeasure = useCallback((renderType = 'render') => {
    if (import.meta.env.DEV) {
      performance.mark(`${componentName}-end`);
      performance.measure(
        `${componentName} ${renderType}`,
        `${componentName}-start`,
        `${componentName}-end`
      );
      
      const measure = performance.getEntriesByName(
        `${componentName} ${renderType}`
      )[0];
      
      if (measure.duration > 16) { // Missed frame budget
        perf.trackComponentRender(componentName, measure.duration);
      }
    }
  }, [componentName, perf]);
  
  useEffect(() => {
    startMeasure();
    return () => endMeasure();
  });
  
  return { startMeasure, endMeasure };
}

// Higher-order component for monitoring
function withPerformanceMonitoring<T extends {}>(
  Component: React.ComponentType<T>
) {
  return function MonitoredComponent(props: T) {
    const { startMeasure, endMeasure } = usePerformanceTracking(Component.displayName || 'Component');
    
    useEffect(() => {
      startMeasure();
      return () => endMeasure('render');
    });
    
    return <Component {...props} />;
  };
}

const MonitoredDashboard = withPerformanceMonitoring(Dashboard);
```

### 3. Browser Compatibility & Edge Cases (Low Impact, Medium Probability)

#### Risk: localStorage Quota Exceeded
**Description**: v2 structured data + metadata exceeds browser storage limits (5MB typical)  
**Impact**: Medium - Data loss on save, user frustration  
**Probability**: Low-Medium (10-20%) - Power users with 100+ schedules  
**Mitigation Strategy**:
- **Proactive Monitoring**: Real-time quota tracking with visual indicators
- **Intelligent Cleanup**: Auto-archive old schedules (>90 days)
- **Export Automation**: Scheduled backup downloads for large datasets
- **Graceful Degradation**: Read-only mode when quota critical
- **Browser-Specific Handling**: Safari has stricter limits (different strategy)

**Quota Management System**:
```typescript
// src/lib/storage-quota-manager.ts
export class StorageQuotaManager {
  private warningThreshold = 0.7; // 70% warning
  private criticalThreshold = 0.9; // 90% critical
  private autoExportThreshold = 0.95; // 95% auto-export
  
  async getQuotaStatus(): Promise<QuotaStatus> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        if (!estimate) return this.getFallbackStatus();
        
        const usage = estimate.usage || 0;
        const quota = estimate.quota || 5242880; // 5MB default
        const percentage = usage / quota;
        
        return {
          status: this.calculateStatus(percentage),
          usage,
          quota,
          percentage: Math.round(percentage * 100),
          headroom: quota - usage,
          estimatedDaysUntilFull: this.estimateTimeUntilFull(usage, quota),
          recommendations: this.generateRecommendations(percentage),
        };
      } catch (error) {
        console.warn('Quota estimation failed:', error);
        return this.getFallbackStatus();
      }
    }
    
    return this.getFallbackStatus();
  }
  
  private calculateStatus(percentage: number): 'healthy' | 'warning' | 'critical' {
    if (percentage >= this.autoExportThreshold) return 'critical';
    if (percentage >= this.criticalThreshold) return 'warning';
    if (percentage >= this.warningThreshold) return 'caution';
    return 'healthy';
  }
  
  private getFallbackStatus(): QuotaStatus {
    // Estimate from localStorage usage
    let totalSize = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const value = localStorage.getItem(localStorage.key(i)!) || '';
      totalSize += new Blob([value]).size;
    }
    
    const estimatedQuota = 5242880; // Conservative 5MB
    const percentage = totalSize / estimatedQuota;
    
    return {
      status: this.calculateStatus(percentage),
      usage: totalSize,
      quota: estimatedQuota,
      percentage: Math.round(percentage * 100),
      headroom: estimatedQuota - totalSize,
      estimatedDaysUntilFull: Math.round((estimatedQuota - totalSize) / (1024 * 50)), // 50KB/day avg
      recommendations: this.generateRecommendations(percentage),
      method: 'estimated',
    };
  }
  
  private estimateTimeUntilFull(usage: number, quota: number): number {
    const dailyGrowth = 50 * 1024; // 50KB average daily growth
    const headroom = quota - usage;
    return Math.max(1, Math.round(headroom / dailyGrowth));
  }
  
  private generateRecommendations(percentage: number): string[] {
    const recommendations: string[] = [];
    
    if (percentage > 0.6) {
      recommendations.push('Review and archive old schedules');
    }
    
    if (percentage > 0.75) {
      recommendations.push('Export your data as a backup');
    }
    
    if (percentage > 0.85) {
      recommendations.push('Storage is running low - consider cleanup');
    }
    
    if (percentage > 0.95) {
      recommendations.push('Critical storage warning - export immediately');
    }
    
    return recommendations;
  }
  
  // Auto-export when critical
  async triggerAutoExport(): Promise<boolean> {
    const status = await this.getQuotaStatus();
    
    if (status.status !== 'critical') return false;
    
    try {
      // Generate comprehensive backup
      const backupData = {
        version: 2,
        exportDate: new Date().toISOString(),
        exportReason: 'storage_quota',
        schedules: useStore.getState().schedules,
        shares: useStore.getState().shares,
        storageStatus: status,
      };
      
      const json = JSON.stringify(backupData, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `hk-schedules-emergency-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      // Show notification
      toast.success(
        'Emergency Backup Created',
        'Your data has been automatically exported due to storage limits. Please review and cleanup your schedules.'
      );
      
      // Switch to read-only mode
      useStore.setState({ readOnlyMode: true });
      
      return true;
    } catch (error) {
      console.error('Auto-export failed:', error);
      toast.error('Auto-export failed - manual backup required');
      return false;
    }
  }
  
  // Cleanup suggestions
  getCleanupRecommendations(): CleanupSuggestion[] {
    const state = useStore.getState();
    const suggestions: CleanupSuggestion[] = [];
    
    // Old schedules (>90 days)
    const oldSchedules = state.schedules.filter(s => {
      const daysOld = (Date.now() - new Date(s.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
      return daysOld > 90;
    });
    
    if (oldSchedules.length > 0) {
      suggestions.push({
        type: 'archive_old',
        description: `Archive ${oldSchedules.length} schedules older than 90 days`,
        estimatedSavings: oldSchedules.length * 1024 * 5, // ~5KB per schedule
        action: () => archiveOldSchedules(oldSchedules),
      });
    }
    
    // Empty shares (expired)
    const expiredShares = state.shares.filter(s => new Date() > s.expiresAt);
    if (expiredShares.length > 0) {
      suggestions.push({
        type: 'cleanup_shares',
        description: `Remove ${expiredShares.length} expired share links`,
        estimatedSavings: expiredShares.length * 1024, // ~1KB per share
        action: () => useStore.getState().cleanupExpiredShares(),
      });
    }
    
    // Duplicate schedules (same title + date)
    const duplicates = findDuplicateSchedules(state.schedules);
    if (duplicates.length > 0) {
      suggestions.push({
        type: 'remove_duplicates',
        description: `Merge or remove ${duplicates.length} duplicate schedules`,
        estimatedSavings: duplicates.length * 1024 * 3, // ~3KB per duplicate
        action: () => handleDuplicates(duplicates),
      });
    }
    
    return suggestions.sort((a, b) => b.estimatedSavings - a.estimatedSavings);
  }
}

// Types
export interface QuotaStatus {
  status: 'healthy' | 'caution' | 'warning' | 'critical';
  usage: number;
  quota: number;
  percentage: number;
  headroom: number;
  estimatedDaysUntilFull: number;
  recommendations: string[];
  method?: 'native' | 'estimated';
}

export interface CleanupSuggestion {
  type: string;
  description: string;
  estimatedSavings: number;
  action: () => void | Promise<void>;
}

// Usage in components
function StorageStatusIndicator() {
  const quota = useStorageQuota();
  const suggestions = useCleanupSuggestions();
  
  if (quota.status === 'healthy') return null;
  
  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <CardTitle className="text-destructive">
          Storage {quota.status.toUpperCase()}
        </CardTitle>
        <CardDescription>
          {quota.percentage}% full ({formatBytes(quota.usage)} of {formatBytes(quota.quota)})
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-2">
          {quota.recommendations.map((rec, i) => (
            <Alert key={i} variant="destructive">
              <AlertDescription>{rec}</AlertDescription>
            </Alert>
          ))}
          
          {suggestions.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium mb-2">Quick Fixes</h4>
              <div className="space-y-1">
                {suggestions.slice(0, 3).map((suggestion, i) => (
                  <Button
                    key={i}
                    variant="ghost"
                    size="sm"
                    onClick={suggestion.action}
                    className="justify-start w-full text-left"
                  >
                    {suggestion.description}
                    <span className="ml-auto text-xs opacity-60">
                      +{formatBytes(suggestion.estimatedSavings)} saved
                    </span>
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

#### Risk: Mobile Performance & Responsiveness
**Description**: Complex v2 UI (filters, multi-select, dashboard grid) performs poorly on mobile  
**Impact**: High - Primary use case for field supervisors  
**Probability**: Medium (40%) - Mobile-first design but added complexity  
**Mitigation Strategy**:
- **Progressive Enhancement**: Core functionality works on all devices
- **Touch-Optimized UI**: 44px minimum touch targets
- **Simplified Mobile Views**: Collapsible filters, card stack instead of grid
- **Lazy Loading**: Images/charts load below the fold
- **Network Resilience**: Offline-first with service worker caching

**Mobile Optimization**:
```typescript
// src/lib/device-detector.ts
export class DeviceOptimizer {
  static isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
      .test(navigator.userAgent) || window.innerWidth < 768;
  }
  
  static isLowPowerDevice() {
    // Check for low-end devices
    const connection = (navigator as any).connection;
    return connection?.effectiveType === '2g' || 
           connection?.effectiveType === '3g' ||
           'deviceMemory' in navigator && navigator.deviceMemory < 4;
  }
  
  static optimizeForDevice() {
    if (this.isMobile()) {
      // Mobile optimizations
      document.documentElement.classList.add('mobile');
      
      // Reduce motion for better battery
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        document.documentElement.classList.add('reduce-motion');
      }
    }
    
    if (this.isLowPowerDevice()) {
      // Low-power optimizations
      document.documentElement.classList.add('low-power');
      
      // Disable animations, reduce image quality
      this.applyLowPowerOptimizations();
    }
  }
  
  private static applyLowPowerOptimizations() {
    // Disable non-essential animations
    const style = document.createElement('style');
    style.textContent = `
      .animate-slide, .fade-in { animation: none !important; }
      .hover-effect { transition: none !important; }
    `;
    document.head.appendChild(style);
  }
}

// Mobile-first responsive components
function ResponsiveDashboard() {
  const isMobile = DeviceOptimizer.isMobile();
  
  return (
    <div className={cn(
      'dashboard',
      isMobile ? 'mobile-layout' : 'desktop-layout'
    )}>
      {isMobile ? <MobileDashboard /> : <DesktopDashboard />}
    </div>
  );
}

// Touch-optimized multi-select for mobile
function MobileMultiSelect({ options, value, onChange }) {
  return (
    <div className="mobile-select">
      {/* Larger touch targets */}
      <div className="selection-chips">
        {value.map((item, i) => (
          <button
            key={i}
            className="chip touch-target"
            style={{ minWidth: '44px', minHeight: '44px' }}
            onClick={() => onChange(value.filter((_, j) => j !== i))}
          >
            {item.label}
            <X className="w-4 h-4 ml-1" />
          </button>
        ))}
      </div>
      
      {/* Collapsible search */}
      <CollapsibleSearch 
        options={options}
        onSelect={(option) => onChange([...value, option])}
      />
    </div>
  );
}
```

### 4. Security & Privacy Risks (Low Impact, Medium Probability)

#### Risk: Share Link Exposure
**Description**: Generated share links with weak PIN protection could expose internal schedules  
**Impact**: Low-Medium - Internal team data, no financial info  
**Probability**: Medium (20-30%) - Default sharing behavior  
**Mitigation Strategy**:
- **Time-Limited Links**: 7-day default expiry (1-90 days configurable)
- **PIN Protection**: 4-digit PIN with SHA-256 hashing (10,000 combinations)
- **Access Logging**: Track access count and timestamps
- **Rate Limiting**: 10 attempts per hour per share ID
- **User Education**: Clear warnings about link sharing

**Share Security Implementation**:
```typescript
// src/lib/share-security.ts
export class ShareSecurityManager {
  private readonly PIN_LENGTH = 4;
  private readonly MAX_ATTEMPTS = 10;
  private readonly ATTEMPT_WINDOW = 60 * 60 * 1000; // 1 hour
  
  // Generate secure random PIN
  generateSecurePIN(): string {
    let pin: string;
    do {
      pin = Math.floor(1000 + Math.random() * 9000).toString();
    } while (this.isWeakPIN(pin)); // Avoid 0000, 1234, etc.
    
    return pin;
  }
  
  private isWeakPIN(pin: string): boolean {
    const weakPINs = ['0000', '1111', '1234', '4321', '9999', 'abcd'];
    return weakPINs.includes(pin);
  }
  
  // Secure PIN hashing
  async hashPIN(pin: string): Promise<string> {
    if (!this.validatePINFormat(pin)) {
      throw new Error('Invalid PIN format');
    }
    
    const encoder = new TextEncoder();
    const data = encoder.encode(`hk-schedules:${pin}`); // Salted
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  
  async verifyPIN(provided: string, storedHash: string): Promise<boolean> {
    const providedHash = await this.hashPIN(provided);
    return providedHash === storedHash;
  }
  
  private validatePINFormat(pin: string): boolean {
    return /^\d{4}$/.test(pin) && pin.length === 4;
  }
  
  // Rate limiting per share
  async checkRateLimit(shareId: string): Promise<boolean> {
    const key = `share-attempts-${shareId}`;
    const attempts = JSON.parse(localStorage.getItem(key) || '[]') as number[];
    const now = Date.now();
    
    // Filter attempts within window
    const recentAttempts = attempts.filter((timestamp: number) => 
      now - timestamp < this.ATTEMPT_WINDOW
    );
    
    if (recentAttempts.length >= this.MAX_ATTEMPTS) {
      console.warn(`Rate limit exceeded for share ${shareId}`);
      return false;
    }
    
    // Add current attempt
    recentAttempts.push(now);
    localStorage.setItem(key, JSON.stringify(recentAttempts));
    
    return true;
  }
  
  // Generate share token with entropy
  generateShareToken(): string {
    const array = new Uint32Array(8);
    crypto.getRandomValues(array);
    return Array.from(array, (num) => num.toString(16).padStart(8, '0')).join('');
  }
  
  // Validate share expiry with buffer
  isShareExpired(expiresAt: Date, bufferMinutes = 5): boolean {
    const now = new Date();
    const expiryWithBuffer = new Date(expiresAt.getTime() - bufferMinutes * 60 * 1000);
    return now > expiryWithBuffer;
  }
}

// Share validation workflow
export async function validateShareAccess(
  shareId: string, 
  providedPIN?: string
): Promise<ShareAccessResult> {
  try {
    // 1. Rate limiting
    const rateLimitOk = await ShareSecurityManager.checkRateLimit(shareId);
    if (!rateLimitOk) {
      return {
        valid: false,
        reason: 'too_many_attempts',
        message: 'Too many incorrect attempts. Please try again later.',
      };
    }
    
    // 2. Lookup share
    const share = useStore.getState().getShareById(shareId);
    if (!share) {
      return {
        valid: false,
        reason: 'not_found',
        message: 'Share link not found.',
      };
    }
    
    // 3. Check expiry
    if (ShareSecurityManager.isShareExpired(share.expiresAt)) {
      return {
        valid: false,
        reason: 'expired',
        message: 'This share link has expired.',
      };
    }
    
    // 4. PIN validation (if required)
    if (share.pinHash) {
      if (!providedPIN) {
        return {
          valid: false,
          reason: 'pin_required',
          message: 'Please enter the 4-digit PIN to access this schedule.',
        };
      }
      
      const pinValid = await ShareSecurityManager.verifyPIN(providedPIN, share.pinHash);
      if (!pinValid) {
        // Log failed attempt
        await ShareSecurityManager.checkRateLimit(shareId); // Updates counter
        return {
          valid: false,
          reason: 'invalid_pin',
          message: 'Incorrect PIN. Please try again.',
          attemptsRemaining: 10 - await this.getAttemptCount(shareId),
        };
      }
    }
    
    // 5. Success - increment access
    useStore.getState().incrementShareAccess(shareId);
    
    const schedule = useStore.getState().getScheduleById(share.scheduleId);
    if (!schedule) {
      return {
        valid: false,
        reason: 'schedule_not_found',
        message: 'Schedule not available.',
      };
    }
    
    return {
      valid: true,
      schedule,
      share,
      accessCount: share.accessCount + 1,
      message: 'Access granted.',
    };
    
  } catch (error) {
    console.error('Share validation error:', error);
    return {
      valid: false,
      reason: 'system_error',
      message: 'System error. Please try again.',
    };
  }
}
```

**Security Headers & CSP** (for future cloud deployment):
```typescript
// vite.config.ts - Content Security Policy
export default defineConfig({
  define: {
    __CSP_NONCE__: JSON.stringify(crypto.randomUUID()), // Dynamic nonce
  },
  
  // Security headers for development
  server: {
    headers: {
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Development
        "style-src 'self' 'unsafe-inline'",
        "connect-src 'self' http://localhost:4000", // API proxy
        "img-src 'self' data: blob:",
        "localStorage-allowed 'self'",
      ].join('; '),
      
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
    },
  },
});
```

### 5. Accessibility & UX Risks (Medium Impact, Low Probability)

#### Risk: Complex UI Breaks Screen Readers
**Description**: Multi-select, dynamic forms, and dashboard grid not accessible to screen reader users  
**Impact**: High - Excludes users with disabilities  
**Probability**: Medium (30-40%) - Complex UI patterns  
**Mitigation Strategy**:
- **ARIA Compliance**: Proper roles, states, and relationships
- **Keyboard Navigation**: Full tab order and focus management
- **Screen Reader Testing**: NVDA, VoiceOver, JAWS
- **Semantic HTML**: Native elements where possible
- **Live Regions**: Announcements for dynamic content

**Accessibility Implementation**:
```typescript
// src/components/accessible-multi-select.tsx
function AccessibleMultiSelect({ options, value, onChange, label }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const buttonRef = useRef(null);
  
  // ARIA live region for announcements
  const [announcement, setAnnouncement] = useState('');
  
  const handleSelection = useCallback((option) => {
    const newValue = value.includes(option.value) 
      ? value.filter(v => v !== option.value)
      : [...value, option.value];
    
    onChange(newValue);
    
    // Announce change
    setAnnouncement(
      newValue.length === 0 
        ? 'No selections'
        : `${newValue.length} options selected`
    );
    
    setTimeout(() => setAnnouncement(''), 1000);
  }, [value, onChange]);
  
  return (
    <div className="relative">
      {/* ARIA live region */}
      {announcement && (
        <div 
          className="sr-only" 
          aria-live="polite" 
          aria-atomic="true"
          role="status"
        >
          {announcement}
        </div>
      )}
      
      {/* Labeled button for screen readers */}
      <button
        ref={buttonRef}
        className="w-full text-left p-3 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-haspopup="listbox"
        aria-labelledby="assignee-label"
        role="combobox"
        aria-controls="assignee-list"
        aria-describedby="assignee-instructions"
      >
        <span id="assignee-label" className="block text-sm font-medium mb-1">
          {label}
        </span>
        
        <div className="flex items-center justify-between">
          {/* Current selections */}
          <div className="flex flex-wrap gap-1 max-w-full">
            {value.length === 0 ? (
              <span className="text-muted-foreground" id="assignee-placeholder">
                Select team members
              </span>
            ) : (
              value.slice(0, 3).map((val, i) => (
                <span
                  key={i}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary text-primary-foreground"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      handleSelection({ value: val, label: val });
                    }
                  }}
                >
                  {val}
                  <X 
                    className="w-3 h-3 ml-1 cursor-pointer" 
                    onClick={() => handleSelection({ value: val, label: val })}
                    aria-label={`Remove ${val}`}
                  />
                </span>
              ))
            )}
            {value.length > 3 && (
              <span className="text-xs text-muted-foreground">
                +{value.length - 3} more
              </span>
            )}
          </div>
          
          {/* Expand/collapse indicator */}
          <span className="ml-2">
            {isExpanded ? '▲' : '▼'}
          </span>
        </div>
        
        {/* Instructions for screen readers */}
        <div id="assignee-instructions" className="sr-only">
          {value.length > 0 
            ? `${value.length} options selected. Press space or enter to expand and select more.`
            : 'No options selected. Press space or enter to expand the list.'
          }
        </div>
      </button>
      
      {/* Expandable list */}
      {isExpanded && (
        <ul
          id="assignee-list"
          role="listbox"
          className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto"
          aria-labelledby="assignee-label"
        >
          {/* Search input for large lists */}
          {options.length > 10 && (
            <li className="sticky top-0 bg-white p-2 border-b">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Type to search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                />
              </div>
            </li>
          )}
          
          {/* Filtered options */}
          {options
            .filter(option => 
              !searchTerm || 
              option.label.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .map((option, index) => {
              const isSelected = value.includes(option.value);
              
              return (
                <li
                  key={option.value}
                  role="option"
                  aria-selected={isSelected}
                  className={cn(
                    'p-3 cursor-pointer hover:bg-gray-50 focus:bg-gray-50',
                    isSelected && 'bg-primary/10 text-primary font-medium'
                  )}
                  onClick={() => handleSelection(option)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelection(option);
                    }
                  }}
                  tabIndex={0}
                >
                  <div className="flex items-center gap-3">
                    {/* Visual indicator */}
                    <div className={cn(
                      'w-4 h-4 rounded border-2',
                      isSelected 
                        ? 'border-primary bg-primary' 
                        : 'border-gray-300'
                    )} />
                    
                    <span>{option.label}</span>
                    
                    {isSelected && (
                      <span className="ml-auto text-xs text-primary font-medium">
                        Selected
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          
          {/* No results */}
          {options.filter(option => 
            !searchTerm || 
            option.label.toLowerCase().includes(searchTerm.toLowerCase())
          ).length === 0 && (
            <li className="p-3 text-gray-500 text-center">
              No team members match "{searchTerm}"
            </li>
          )}
        </ul>
      )}
      
      {/* Instructions */}
      <div id="assignee-instructions" className="sr-only mt-1 text-xs text-gray-500">
        Use arrow keys to navigate, enter to select, escape to close.
      </div>
    </div>
  );
}

// Usage with form integration
function AccessibleTeamAssignment({ fieldName = 'assignees' }) {
  const { watch, setValue } = useFormContext();
  const currentAssignees = watch(fieldName) || [];
  
  const options = useMemo(() => [
    { value: 'john.doe@company.com', label: 'John Doe (Lead Housekeeper)' },
    { value: 'jane.smith@company.com', label: 'Jane Smith (Senior)' },
    { value: 'mike.johnson@company.com', label: 'Mike Johnson (Maintenance)' },
    { value: 'sarah.wilson@company.com', label: 'Sarah Wilson (Part-time)' },
  ], []);
  
  const handleChange = useCallback((newValue: string[]) => {
    setValue(fieldName, newValue);
  }, [setValue, fieldName]);
  
  return (
    <FormField
      control={control}
      name={fieldName}
      render={() => (
        <FormItem>
          <FormLabel>Team Assignment</FormLabel>
          <AccessibleMultiSelect
            options={options}
            value={currentAssignees}
            onChange={handleChange}
            label="Select team members for this task"
          />
          <FormDescription>
            Choose one or more team members. Use the search to find specific people.
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
```

**Accessibility Testing**:
```typescript
// tests/accessibility.spec.ts
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import AccessibleMultiSelect from '../src/components/accessible-multi-select';

expect.extend(toHaveNoViolations);

describe('Accessibility Testing', () => {
  it('should have no axe violations', async () => {
    const { container } = render(
      <AccessibleMultiSelect 
        options={testOptions}
        value={[]}
        onChange={vi.fn()}
        label="Test label"
      />
    );
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
  
  it('should be keyboard navigable', async () => {
    render(<AccessibleMultiSelect options={testOptions} value={[]} onChange={vi.fn()} />);
    
    // Focus the component
    const button = screen.getByRole('combobox');
    await userEvent.tab();
    expect(button).toHaveFocus();
    
    // Open with space/enter
    await userEvent.keyboard(' ');
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    
    // Navigate with arrows
    const firstOption = screen.getAllByRole('option')[0];
    await userEvent.keyboard('ArrowDown');
    expect(firstOption).toHaveFocus();
    
    // Select with enter
    await userEvent.keyboard('Enter');
    expect(screen.getByRole('status')).toBeInTheDocument(); // Announcement
    
    // Close with escape
    await userEvent.keyboard('Escape');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
  
  it('should work with screen readers', async () => {
    // This requires actual screen reader testing
    // Mock ARIA announcements
    const mockAnnounce = vi.fn();
    const originalLive = document.querySelector('[aria-live]');
    
    render(<AccessibleMultiSelect options={testOptions} value={[]} onChange={vi.fn()} />);
    
    // Select an option
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(screen.getByRole('option', { name: /john/i }));
    
    // Should announce selection
    expect(mockAnnounce).toHaveBeenCalledWith('1 option selected');
  });
});
```

## 🧪 Comprehensive Testing Strategy

### Testing Philosophy & Structure

#### Test Pyramid Implementation
```
           E2E (5-10%)
        ╱─────────────╲
       /               \
Integration (20-30%)    Component (40-50%)
 ╱───────────────────╲ ╱───────────────────╲
Unit (30-40%)          Mocking & Isolation
```

#### Test Categories & Coverage Goals
| Test Type | Scope | Coverage Goal | Tools | Priority |
|-----------|-------|---------------|-------|----------|
| **Unit** | Store actions, utilities, pure functions | 95% | Vitest, Jest | High |
| **Component** | React components, form validation | 90% | React Testing Library | High |
| **Integration** | Store + components, API flows | 85% | Vitest, MSW | Medium |
| **E2E** | User workflows, migration | 100% critical paths | Cypress, Playwright | High |
| **Accessibility** | ARIA, keyboard nav, screen readers | 100% | axe-core, pa11y | High |
| **Performance** | Load times, memory usage | N/A (benchmarks) | Lighthouse, Web Vitals | Medium |
| **Security** | XSS, injection, auth flows | 100% critical | OWASP ZAP, Snyk | Medium |

### 1. Unit Testing Strategy

#### Store Testing Patterns
```typescript
// tests/store.unit.spec.ts
import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';
import { useScheduleStore } from '../src/lib/store';
import type { Schedule } from '../src/types';

// Mock dependencies
vi.mock('../src/lib/storage', () => ({
  storage: {
    getStoreState: vi.fn(() => ({ schedules: [], shares: [] })),
    setStoreState: vi.fn(() => true),
  },
}));

describe('Schedule Store Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useScheduleStore.setState({ schedules: [], shares: [] });
  });
  
  describe('Schedule CRUD', () => {
    it('creates valid schedule', async () => {
      const { result } = renderHook(() => useScheduleStore());
      
      const scheduleData: Omit<Schedule, 'id' | 'createdAt' | 'updatedAt'> = {
        title: 'Test Schedule',
        category: 'shift',
        startDate: new Date('2025-01-15'),
        entries: [{
          id: 'entry-1',
          time: '09:00-12:00',
          task: 'Clean rooms',
          assignees: ['John Doe'],
          status: 'pending',
          duration: 180,
          createdAt: new Date(),
          updatedAt: new Date(),
        }],
      };
      
      let createdSchedule;
      await act(async () => {
        createdSchedule = result.current.addSchedule(scheduleData);
      });
      
      expect(createdSchedule).toMatchObject({
        ...scheduleData,
        id: expect.any(String),
        version: 2,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        isArchived: false,
      });
      
      expect(createdSchedule.entries).toHaveLength(1);
      expect(createdSchedule.entries[0].task).toBe('Clean rooms');
      expect(result.current.schedules).toHaveLength(1);
    });
    
    it('rejects invalid schedule data', async () => {
      const { result } = renderHook(() => useScheduleStore());
      
      const invalidData = {
        title: '', // Required field
        category: 'shift',
        startDate: new Date(),
        entries: [], // Required entries
      } as any;
      
      await expect(async () => {
        await act(async () => {
          result.current.addSchedule(invalidData);
        });
      }).rejects.toThrow('title');
      
      expect(result.current.schedules).toHaveLength(0);
    });
    
    it('updates schedule with partial data', async () => {
      const { result } = renderHook(() => useScheduleStore());
      
      // Create initial
      let scheduleId;
      await act(async () => {
        const schedule = result.current.addSchedule({
          title: 'Original',
          category: 'shift',
          startDate: new Date(),
          entries: [],
        });
        scheduleId = schedule.id;
      });
      
      // Update
      const updatedTitle = 'Updated Title';
      let updatedSchedule;
      await act(async () => {
        updatedSchedule = result.current.updateSchedule(scheduleId, { title: updatedTitle });
      });
      
      expect(updatedSchedule).not.toBeNull();
      expect(updatedSchedule.title).toBe(updatedTitle);
      expect(updatedSchedule.updatedAt).toBeGreaterThan(updatedSchedule.createdAt);
      expect(result.current.schedules[0]).toBe(updatedSchedule);
    });
    
    it('archives schedule (soft delete)', async () => {
      const { result } = renderHook(() => useScheduleStore());
      
      let scheduleId;
      await act(async () => {
        const schedule = result.current.addSchedule({
          title: 'To Archive',
          category: 'shift',
          startDate: new Date(),
          entries: [],
        });
        scheduleId = schedule.id;
      });
      
      const success = await act(async () => {
        return result.current.archiveSchedule(scheduleId);
      });
      
      expect(success).toBe(true);
      const archived = result.current.schedules.find(s => s.id === scheduleId);
      expect(archived).not.toBeUndefined();
      expect(archived.isArchived).toBe(true);
      expect(archived.title).toBe('To Archive'); // Data preserved
    });
  });
  
  describe('Share Operations', () => {
    beforeEach(() => {
      // Mock crypto for PIN hashing
      global.crypto.subtle.digest = vi.fn().mockImplementation(async () => {
        const encoder = new TextEncoder();
        const data = encoder.encode('testpin');
        // Mock hash
        const hashBuffer = new ArrayBuffer(32);
        const hashArray = new Uint8Array(hashBuffer);
        for (let i = 0; i < hashArray.length; i++) {
          hashArray[i] = data[i % data.length];
        }
        return hashBuffer;
      });
    });
    
    it('creates share with PIN protection', async () => {
      const { result } = renderHook(() => useScheduleStore());
      
      // Create schedule
      const schedule = await act(async () => {
        return result.current.addSchedule({
          title: 'Share Test',
          category: 'shift',
          startDate: new Date(),
          entries: [],
        });
      });
      
      const pin = '1234';
      const expiresDays = 7;
      
      let shareConfig;
      await act(async () => {
        shareConfig = result.current.createShare(schedule.id, pin, expiresDays);
      });
      
      expect(shareConfig).toBeDefined();
      expect(shareConfig.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      expect(shareConfig.scheduleId).toBe(schedule.id);
      expect(shareConfig.pinHash).toBeDefined();
      expect(shareConfig.pinHash).toHaveLength(64); // SHA-256
      expect(shareConfig.accessCount).toBe(0);
      expect(shareConfig.expiresAt).toBeInstanceOf(Date);
      
      // Verify expiry calculation
      const expectedExpiry = new Date();
      expectedExpiry.setDate(expectedExpiry.getDate() + expiresDays);
      expect(shareConfig.expiresAt.getTime()).toBeCloseTo(expectedExpiry.getTime(), 1000);
      
      expect(result.current.shares).toHaveLength(1);
    });
    
    it('validates share with correct PIN', async () => {
      const { result } = renderHook(() => useScheduleStore());
      
      // Setup
      const schedule = await act(async () => {
        return result.current.addSchedule({
          title: 'Validate Test',
          category: 'shift',
          startDate: new Date(),
          entries: [],
        });
      });
      
      const pin = '5678';
      let shareConfig;
      await act(async () => {
        shareConfig = result.current.createShare(schedule.id, pin, 1);
      });
      
      // Validate with correct PIN
      const validatedSchedule = await act(async () => {
        return result.current.validateShare(shareConfig.id, pin);
      });
      
      expect(validatedSchedule).toBeDefined();
      expect(validatedSchedule.id).toBe(schedule.id);
      expect(validatedSchedule.title).toBe('Validate Test');
      
      // Access count should increment
      expect(result.current.shares[0].accessCount).toBe(1);
    });
    
    it('rejects share with incorrect PIN', async () => {
      const { result } = renderHook(() => useScheduleStore());
      
      const schedule = await act(async () => {
        return result