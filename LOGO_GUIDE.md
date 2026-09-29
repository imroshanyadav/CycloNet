# CycloNet Logo Design Guide

## Logo Overview

The CycloNet logo is a custom SVG design that represents a tropical cyclone structure with modern styling.

## Design Elements

### 1. Outer Ring
- **Shape:** Circle with stroke (no fill)
- **Radius:** 14-17 units (scales with size)
- **Stroke Width:** 2-2.5px
- **Purpose:** Represents the outer circulation of the cyclone

### 2. Swirl Pattern
- **Shape:** Custom path creating spiral motion
- **Fill:** Gradient with 30% opacity
- **Purpose:** Visualizes the rotating wind bands and cyclonic motion

### 3. Central Eye
- **Shape:** Solid circle
- **Radius:** 4-5 units
- **Purpose:** Represents the calm eye at the center of the storm

### 4. Color Gradient
- **Start Color:** #06b6d4 (Cyan)
- **End Color:** #3b82f6 (Blue)
- **Direction:** Top-left to bottom-right (0% to 100%)
- **Purpose:** Modern, tech-forward appearance

## Sizes Used

### Dashboard Header (32×32px)
```svg
<svg width="32" height="32" viewBox="0 0 32 32">
  <circle cx="16" cy="16" r="14" stroke="..." strokeWidth="2"/>
  <path d="M16 6 C20 10, 26 16, 16 26 C6 16, 12 10, 16 6 Z" fill="..." opacity="0.3"/>
  <circle cx="16" cy="16" r="4" fill="..."/>
</svg>
```

### Landing Page (40×40px)
```svg
<svg width="40" height="40" viewBox="0 0 40 40">
  <circle cx="20" cy="20" r="17" stroke="..." strokeWidth="2.5"/>
  <path d="M20 7 C25 12, 33 20, 20 33 C7 20, 15 12, 20 7 Z" fill="..." opacity="0.25"/>
  <circle cx="20" cy="20" r="5" fill="..."/>
</svg>
```

## Full SVG Code

### 32px Version (App.tsx)
```tsx
<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="16" cy="16" r="14" stroke="url(#logo-gradient)" strokeWidth="2" fill="none"/>
  <path d="M16 6 C20 10, 26 16, 16 26 C6 16, 12 10, 16 6 Z" fill="url(#logo-gradient)" opacity="0.3"/>
  <circle cx="16" cy="16" r="4" fill="url(#logo-gradient)"/>
  <defs>
    <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#06b6d4" />
      <stop offset="100%" stopColor="#3b82f6" />
    </linearGradient>
  </defs>
</svg>
```

### 40px Version (LandingPage.tsx)
```tsx
<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="20" cy="20" r="17" stroke="url(#nav-logo-gradient)" strokeWidth="2.5" fill="none"/>
  <path d="M20 7 C25 12, 33 20, 20 33 C7 20, 15 12, 20 7 Z" fill="url(#nav-logo-gradient)" opacity="0.25"/>
  <circle cx="20" cy="20" r="5" fill="url(#nav-logo-gradient)"/>
  <defs>
    <linearGradient id="nav-logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#06b6d4" />
      <stop offset="100%" stopColor="#3b82f6" />
    </linearGradient>
  </defs>
</svg>
```

## Color Palette

| Element | Hex Color | RGB | Usage |
|---------|-----------|-----|-------|
| Cyan Start | #06b6d4 | rgb(6, 182, 212) | Gradient start, light accents |
| Blue End | #3b82f6 | rgb(59, 130, 246) | Gradient end, deep accents |

## Design Principles

### 1. Scalability
- Vector format ensures crisp rendering at any size
- ViewBox maintains aspect ratio
- Stroke widths scale proportionally

### 2. Minimalism
- Clean lines without unnecessary detail
- Single gradient for cohesive look
- Transparent swirl for depth without clutter

### 3. Meteorological Accuracy
- Outer ring = circulation boundary
- Swirl = rotating wind bands
- Central eye = calm center
- Represents actual cyclone structure

### 4. Modern Tech Aesthetic
- Gradient colors popular in modern UI
- SVG format for web optimization
- Works on dark and light backgrounds

## Usage Guidelines

### ✅ Do:
- Use on dark backgrounds (best visibility)
- Maintain aspect ratio when scaling
- Keep gradient direction consistent
- Use alongside "CycloNet" text branding

### ❌ Don't:
- Don't rotate or flip the logo
- Don't change the gradient colors
- Don't remove the central eye
- Don't add additional elements

## Alternative Variations (Future)

### Monochrome Version (for favicons/small sizes)
```svg
<!-- All elements use single color -->
<svg>
  <circle stroke="#06b6d4"/>
  <path fill="#06b6d4" opacity="0.3"/>
  <circle fill="#06b6d4"/>
</svg>
```

### Large Display Version (for splash screens)
- Increase sizes: 120×120px or larger
- Add subtle animation (rotation)
- Consider adding outer glow effect

## File Formats

### Current Implementation:
- **Format:** Inline SVG in TSX files
- **Advantages:** 
  - Direct styling control
  - No external file dependencies
  - Easy color changes via props

### Potential Exports:
- SVG file: `public/logo.svg`
- PNG (for fallback): `public/logo-32.png`, `public/logo-64.png`
- Favicon: `public/favicon.ico` (converted from SVG)

## Integration Examples

### React Component:
```tsx
<div className="flex items-center gap-2">
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <!-- Logo SVG code -->
  </svg>
  <span className="text-xl font-bold">CycloNet</span>
</div>
```

### Standalone Logo Component:
```tsx
// components/CycloNetLogo.tsx
interface LogoProps {
  size?: number;
  className?: string;
}

export function CycloNetLogo({ size = 32, className }: LogoProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 32 32" 
      className={className}
      fill="none"
    >
      {/* Logo elements */}
    </svg>
  );
}
```

## Brand Identity

### Primary Branding:
**Logo + Text:** "CycloNet" in uppercase, tracking-wider, font-bold

### Color Theme:
- **Primary:** Cyan-Blue gradient (#06b6d4 → #3b82f6)
- **Background:** Dark (#0a0a0a)
- **Text:** White (#ffffff)
- **Accents:** Glass morphism with subtle opacity

### Typography:
- **Headings:** IBM Plex Sans, Bold, Uppercase
- **Body:** IBM Plex Sans, Regular
- **Monospace:** IBM Plex Mono (for data/code)

---

**Design Created:** 2026-09-10  
**Version:** 1.0  
**Designer:** CycloNet Team
