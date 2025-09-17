# 5. UI/UX Design Guidelines (Extensions)

- **Design System**: Reuse shadcn/ui; add MultiSelect variant (searchable combobox).
- **Color Updates**: Add Share accent (Purple #8B5CF6 for links); Filter chips (blue outline).
- **Typography/Interactions**: Same as [v1 UI/UX](../v1/ui-ux-design.md); add loading skeletons for dashboard cards.
- **Themes**: Extend dark mode for share view.

**Wireframes (Text)**:
- **Dashboard**: Header (search + filter bar), Grid (cards: title, badge, count, actions), Footer (pagination).
- **Filter Bar**: Dropdown cascade (category → assignee → date); chips for active.
- **Share Modal**: Generated link field (copy btn), PIN display, QR code placeholder, expiry selector.
- **Read-Only Table**: Muted actions; prominent "Print/Export" header; watermark "Shared View".

**Cross-reference**: Extends [v1/ui-ux-design.md](../v1/ui-ux-design.md) with v2-specific components (dashboard, multi-select, sharing UI).

## 5.2 Enhanced Schedule Viewing and Filtering UI/UX (US-002)

### Design Principles
- **Efficiency for Workload Review**: Prioritize quick filtering and bulk actions to enable team leads to assess assignee loads in <30 seconds.
- **Visual Hierarchy**: Use badges and highlights to draw attention to filtered/selected items; minimize clutter with progressive disclosure for bulk options.
- **Mobile-First Responsiveness**: Stacked views on small screens; large touch targets (≥48px) for checkboxes and buttons.
- **Feedback & Undo**: Immediate visual confirmation (chips, highlights) with easy undo to build user confidence in bulk operations.

### Component Specifications
- **Filter Bar** (Above Table): Flex row (sticky); shadcn Select for assignee (w-48, searchable); conditional Badge chip (e.g., "John (12/45) ×"); loading skeleton during extraction.
- **Enhanced Table** (`src/components/schedule-table.tsx`): shadcn Table with sortable headers; checkbox column (indeterminate support); row highlights (bg-accent/10) for filtered; inline editable cells (time, assignee, status via Select/Input).
- **Bulk Actions Sheet**: Slide-up modal/sheet on selection (≥1 row); shadcn Select for status changes; destructive Delete button; Apply button with loading spinner; warning for >50 selections.
- **Persistence Indicator**: Subtle save icon (green tick) in header post-change; toast on restore ("Preferences restored").
- **Empty States**: Illustrated card for no results ("No matching tasks—clear filter?") with CTA button.

### Visual Guidelines
- **Colors**: Primary #3B82F6 for filter buttons/chips; Success #10B981 for completed badges; Warning #F59E0B for bulk limits.
- **Icons**: Lucide Filter (20px, muted); CheckSquare for selection; RotateCcw for undo.
- **Interactions**: Hover scale 1.02; focus outline blue; animations <200ms (Framer Motion for sheet slide-in).
- **Feedback**: shadcn Toasts (top-right): Success for applies ("12 tasks updated"), Undo button (5s timeout); Error for overlaps ("Cannot apply—check conflicts").
- **Mobile Optimizations**: Cards stack vertically; swipe-to-select rows; bottom action sheet for bulk; increased padding (p-6).

### Wireframes (Text)
- **Filter Bar (Desktop)**: [Filter Icon] Filter by Assignee: [Dropdown ▼ "John Doe"] [Chip: John (12/45) ×]
- **Table Row (Filtered)**: ☐ 09:00 [Badge: John (green)] Clean Unit 101 [Select: Pending (yellow)] [Edit/Delete]
- **Bulk Sheet (Mobile)**: Header: "5 Selected" [Clear] | Status: [Pending ▼] [Apply] [Delete (red)]
- **Toast**: ✅ 12 tasks updated [Undo]

### Accessibility & Usability
- **ARIA Compliance**: live region for filter updates ("Showing 12 tasks"); ARIA-selected for rows; labels for all Selects ("Change status to...").
- **Keyboard Navigation**: Tab through filters/table; Space selects checkboxes; Shift+click multi-select; Esc closes sheets.
- **Testing Focus**: Usability tests with team leads (completion time <30s for filter+bulk); SUS >85; edge cases (no assignees, large datasets >200 entries).
- **Performance**: Filter <100ms re-render; bulk <500ms apply; virtualize table rows for scale.

**Cross-reference**: Builds on FR-2 (filtering/bulk) in [functional-requirements.md](./functional-requirements.md); mitigates risks in [docs/risks-US-002.md](../docs/risks-US-002.md).

## 5.3 Housekeeping-Specific UI/UX (US-003 Extensions)

### Design Principles for Low-Tech Users
- **Minimalism**: Reduce cognitive load with 1-2 actions per screen; use progressive disclosure (e.g., show housekeeper list first, then schedule form only when needed).
- **Large Interactive Elements**: Buttons ≥48x48px; dropdowns with large touch targets; high-contrast colors (contrast ratio ≥4.5:1 for text).
- **Guided Flows**: Stepper component for setup (Housekeepers → Units → Review); inline help text like "Select the housekeeper for this unit".
- **Avoid Complexity**: No multi-select, drag/drop, or nested menus; prefer flat lists and simple tables.

### Component Specifications
- **Housekeeper List (`HousekeeperList.tsx`)**: Card-based list with "Add New" button; each card shows name and edit/delete icons; search input for 10+ housekeepers.
- **Simplified Schedule Form**: Extend existing form with "Housekeeping Mode" toggle; hides advanced fields (multi-assignee, complex times); shows only Unit ID input, Housekeeper dropdown, Time Slot dropdown (Morning 9-12, Afternoon 1-4, Evening 5-8).
- **Individual Schedule View**: Full-width table filtered by housekeeper; columns: Unit, Time Slot, Status (dropdown: Pending/Completed); inline edit mode on click; prominent "Print This Schedule" button at top.
- **Print Layout**: Custom CSS for print media queries; A4 portrait; header with "Housekeeper: [Name] - Week of [Date]"; table with borders, large font (14px min); checkboxes as form inputs for manual marking; no sidebars or footers.

### Visual Guidelines
- **Icons & Labels**: Use simple icons (person for housekeepers, calendar for schedules, printer for print); labels like "Add Housekeeper" instead of "Create Assignee Profile".
- **Feedback**: Toast notifications for saves ("Schedule updated for John"); error alerts with simple messages ("Unit 101 already assigned—choose another").
- **Onboarding**: First-use modal or tour: "Welcome to Housekeeping Mode! 1. Add your team → 2. Enter units → 3. Print schedules." Skip option persists.
- **Mobile Optimizations**: Stack form fields vertically; swipe to edit rows; pinch-zoom friendly print preview.

### Wireframes (Text)
- **Housekeeper Setup**: [Add Button] | List: John Doe [Edit/Delete] | Jane Smith [Edit/Delete] | + Search bar
- **Entry Form**: Unit: [101] | Housekeeper: [Dropdown: John/Jane/All] | Time: [Morning/Afternoon/Evening] | [Add Entry] | [Save Week]
- **Individual View**: Header: "John's Schedule - Week of Sep 15" [Print] | Table: Unit | Time | Status [Pending dropdown] | Footer: Total Units: 26
- **Print Preview**: Clean table only; Week header; Checkboxes: ☐ Unit 101 - 9AM | ☐ Unit 102 - 10AM...

### Accessibility & Usability
- **ARIA Compliance**: Labels for all dropdowns ("Select housekeeper"); live regions for auto-saves ("Entry updated"); focus management for inline edits.
- **Keyboard Navigation**: Tab through form fields; Enter to add entries; Esc to cancel edits.
- **Testing Focus**: Usability sessions with low-tech users; measure completion time <5min for full workflow; error recovery (e.g., invalid unit ID shows "Please enter a number").

**Cross-reference**: Extends base guidelines with US-003 focus; compatible with shadcn/ui components; informs implementation in [technical-requirements.md](./technical-requirements.md).