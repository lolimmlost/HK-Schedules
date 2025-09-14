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