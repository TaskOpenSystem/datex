---
inclusion: fileMatch
fileMatchPattern: "**/marketplace/**,**/components/marketplace/**"
---

# Marketplace Style Guide

Khi làm việc với các trang và component trong marketplace, luôn tuân thủ các quy tắc style sau:

## Colors

### Primary Colors
- `ink` (#101618) - Màu chính cho text, borders, backgrounds tối
- `primary` (#00bfff) - Màu accent chính, buttons, links
- `accent-lime` (#ccff00) - Highlight, success states, active items
- `accent-orange` (#ff6b00) - Secondary accent, publisher badges
- `accent-pink` (#ff0099) - Error states, sale badges

### Background Colors
- `bg-white` - Card backgrounds, modals
- `bg-gray-50` - Secondary backgrounds, sections
- `bg-gray-100` - Footer sections, info boxes
- `bg-background-light` (#f6f7f9) - Main page background

## Borders & Shadows

### Border Style
- Luôn sử dụng `border-2 border-ink` cho các card, button, input chính
- Sử dụng `border-gray-200` cho các element phụ, inactive states
- Border radius: `rounded-lg` (default), `rounded-xl` cho cards lớn, `rounded-full` cho badges/pills

### Shadow System (Neo-brutalist)
```
shadow-hard-sm: 2px 2px 0px 0px #101618
shadow-hard: 4px 4px 0px 0px #101618  
shadow-hard-lg: 8px 8px 0px 0px #101618
```
- Sử dụng `shadow-hard-sm` cho buttons, small cards
- Sử dụng `shadow-hard` cho cards, modals
- Sử dụng `shadow-hard-lg` cho featured items, hero sections

## Typography

### Font Weights
- `font-black` - Headings, prices, important numbers
- `font-bold` - Labels, buttons, navigation
- `font-medium` - Body text, descriptions

### Text Styles
- Headings: `uppercase tracking-wide` hoặc `tracking-wider`
- Labels: `text-sm font-bold uppercase tracking-wide text-gray-500`
- Prices: `text-xl font-black text-ink` hoặc lớn hơn

## Components

### Buttons
```tsx
// Primary Button
className="rounded-xl border-2 border-ink bg-ink text-white font-bold shadow-hard-sm hover:-translate-y-1 hover:shadow-hard transition-all"

// Secondary Button  
className="rounded-xl border-2 border-ink bg-white text-ink font-bold hover:bg-gray-100 transition-colors"

// Accent Button
className="rounded-lg border-2 border-ink bg-primary text-white font-bold shadow-hard-sm hover:bg-accent-lime hover:text-ink transition-colors"

// Icon Button
className="h-10 w-10 rounded-lg border-2 border-ink bg-white flex items-center justify-center hover:bg-accent-lime transition-colors shadow-hard-sm"
```

### Cards
```tsx
// Standard Card
className="rounded-xl border-2 border-ink bg-white p-4 shadow-hard-sm hover:shadow-hard hover:-translate-y-1 transition-all"

// Featured Card
className="rounded-2xl border-2 border-ink bg-accent-lime p-6 shadow-hard hover:-translate-y-1 transition-transform"
```

### Form Inputs
```tsx
// Search Input Container
className="rounded-xl border-2 border-ink bg-white shadow-hard focus-within:shadow-hard-lg focus-within:-translate-y-1 transition-all"

// Input Field
className="border-none bg-transparent font-bold placeholder:text-gray-300 focus:ring-0 focus:outline-none text-ink"
```

### Modals
```tsx
// Overlay
className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 backdrop-blur-sm"

// Modal Container
className="bg-white rounded-xl border-2 border-ink shadow-hard-lg w-full max-w-md mx-4 overflow-hidden"

// Modal Header (dark)
className="bg-ink text-white px-6 py-4 border-b-2 border-ink"
```

### Status States
```tsx
// Completed/Success
className="bg-accent-lime/20 border-ink shadow-hard-sm"
icon: "bg-accent-lime text-ink"

// Active/Processing  
className="bg-primary/10 border-ink shadow-hard-sm"
icon: "bg-primary text-white"

// Error
className="bg-accent-pink/10 border-accent-pink shadow-hard-sm"
icon: "bg-accent-pink text-white"

// Pending/Inactive
className="bg-gray-50 border-gray-200"
icon: "bg-white text-gray-500"
```

### Tags & Badges
```tsx
// Standard Tag
className="inline-flex items-center gap-1 rounded-full border-2 border-ink bg-white px-3 py-1 text-xs font-black uppercase tracking-wider"

// Sale Badge
className="rounded border border-ink px-2 py-0.5 text-[10px] font-bold bg-accent-pink text-white"

// New Badge
className="rounded border border-ink px-2 py-0.5 text-[10px] font-bold bg-accent-lime text-ink"
```

## Icons
- Sử dụng Material Symbols Outlined: `<span className="material-symbols-outlined">icon_name</span>`
- Icon sizes: `text-sm`, `text-lg`, `text-2xl`, `text-3xl`

## Animations & Transitions

### Hover Effects
- Cards: `hover:-translate-y-1 hover:shadow-hard transition-all`
- Buttons: `hover:scale-105 transition-transform` hoặc `hover:-translate-y-1`
- Active: `active:scale-95`

### Loading States
- Spinner: `animate-spin` với icon `sync`
- Pulse: `animate-pulse` cho loading indicators
- Bounce: `animate-bounce` cho processing dots

## Layout Patterns

### Sidebar
- Width: `w-72`
- Border: `border-r-2 border-ink`
- Background: `bg-white`

### Main Content
- Background: `bg-background-light`
- Padding: `px-8 pb-12`
- Max width for content: `max-w-5xl mx-auto`

### Grid
- Cards grid: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6`

## Dividers
```tsx
// Dashed divider
className="border-t-2 border-gray-200 border-dashed"

// Solid divider
className="border-t-2 border-ink"
```
