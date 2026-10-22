# SocietyFlow — Design Authority & Style Guide

Adapted from the primary design authority for web implementation.

## 1. Core Color System
- **Background**: `#FFFFFF` (Primary page background)
- **Surface**: `#F8F9FA` (Card surfaces, sub-sections, muted containers)
- **Primary Text & Action**: `#1A1A1A` (Headings, primary buttons, high-emphasis text)
- **Secondary Text**: `#6B7280` (Body copy, subtitles, descriptive labels)
- **Tertiary Text**: `#9CA3AF` (Placeholders, inactive elements, meta timestamps)
- **Hero / Brand Accent**: `#4F46E5` (Indigo brand accent, interactive highlights, focus states)
- **Hero Soft**: `#EEF2FF` (Tonal badges, icon container backgrounds, soft tag fills)
- **Border**: `#E5E7EB` (Clean 1px borders, dividing rules)

### Semantic Feedback Colors
- **Success**: `#10B981` (Approved, verified, active, compliant)
  - Success Soft: `#ECFDF5`
- **Warning**: `#F59E0B` (Pending review, action required, expiring)
  - Warning Soft: `#FFFBEB`
- **Error**: `#F43F5E` (Rejected, overdue, critical alert)
  - Error Soft: `#FFF1F2`
- **Information**: `#0EA5E9` (In progress, announcement, audit note)
  - Information Soft: `#F0F9FF`

## 2. Typography
- **Headings**: `Outfit`, sans-serif (tracking-tight, bold / semibold)
- **Body & Controls**: `Inter`, sans-serif (neutral, crystal legible, 400/500/600)

## 3. Geometry & Elevation
- **Card Radius**: `14px` (`rounded-xl` / `12px` to `16px`)
- **Button / Pill Radius**: `9999px` (Full pill for badges, primary pills, search inputs)
- **Interactive Control Radius**: `10px` (`rounded-lg`)
- **Shadows**: Subtle neutral shadows only (e.g. `0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)`). No heavy drop shadows.
- **No Gradients**: Clean, solid, modern flat design with subtle tinting and crisp 1px borders.

## 4. Iconography
- **Exclusively Ionicons 5** (`react-icons/io5`).
- Icons enclosed in subtle tonal `IconContainer` with `hero-soft` or semantic soft backgrounds.

## 5. Animation & Motion
- Spring transitions with staggered entrance (`staggerChildren: 0.06`, `damping: 24`, `stiffness: 260`).
- Micro-interactions: scale feedback (`whileTap: { scale: 0.98 }`), soft hover transitions (`transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1)`).
- Full support for `prefers-reduced-motion`.
