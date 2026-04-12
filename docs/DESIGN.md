# Bionic Design System

> This file is the authoritative design reference for all UI implementation.
> Every coding agent must read this before building or modifying any UI component.

---

## 1. Visual Theme & Atmosphere

**Concept**: "The Agency That Runs Your Infrastructure"

Bionic's visual language draws from retrofuturism — the aesthetic of institutions that feel
both timeless and ahead of their time. Think the TVA from Loki, the Fantastic Four's
headquarters, mission control rooms from the 1960s space race. Heavy, structured, authoritative
— but lit with the warm amber glow of something alive and intelligent.

**Psychological tone**: Calm authority. This system is watching, thinking, acting.
The operator is in control, but the machine is always working.

**Key principles**:
- Darkness that feels intentional, not empty
- Orange that signals intelligence, not alarm
- Monospace elements that ground everything in operational reality
- Grid-based layouts that communicate structure and reliability
- No decorative elements without function

---

## 2. Color Palette

### Background Scale

```
--bg-base:     #0A0A0A  /* Space — the primary canvas */
--bg-surface:  #111111  /* Cards, panels, elevated content */
--bg-elevated: #1A1A1A  /* Modals, dropdowns, tooltips */
--bg-hover:    #222222  /* Interactive hover states */
```

### Border Scale

```
--border-subtle:  #2A2A2A  /* Dividers, card edges (default) */
--border-default: #333333  /* More visible separators */
--border-strong:  #444444  /* High-contrast borders */
```

### Accent — Anthropic Orange × TVA Amber

```
--accent:       #E8611A  /* Primary accent — use sparingly */
--accent-dim:   #E8611A20 /* Background tints, glows */
--accent-hover: #F07030  /* Hover state for accent elements */
--accent-muted: #A04010  /* Subdued accent for secondary use */
```

### Text Scale

```
--text-primary:   #F5F5F5  /* Main content */
--text-secondary: #888888  /* Supporting info */
--text-muted:     #555555  /* Placeholder, disabled */
--text-inverse:   #0A0A0A  /* Text on accent backgrounds */
```

### Semantic Status Colors

```
--status-critical: #E5484D  /* Immediate attention required */
--status-warning:  #F59E0B  /* Caution, degraded state */
--status-success:  #22C55E  /* Healthy, completed */
--status-info:     #3B82F6  /* Informational */
--status-neutral:  #64748B  /* Inactive, archived */
```

### Status with Opacity (for badge backgrounds)

```
--status-critical-bg: #E5484D20
--status-warning-bg:  #F59E0B20
--status-success-bg:  #22C55E20
--status-info-bg:     #3B82F620
```

---

## 3. Typography

### Font Families

```
--font-heading: 'Space Grotesk', sans-serif  /* Headers, titles, nav labels */
--font-body:    'Inter', sans-serif          /* Body text, descriptions */
--font-mono:    'JetBrains Mono', monospace  /* IDs, code, status labels, timestamps */
```

### Type Scale

```
/* Display */
--text-display:  2rem / 700 / Space Grotesk    /* Page titles */
--text-title:    1.5rem / 600 / Space Grotesk  /* Section headers */
--text-heading:  1.125rem / 600 / Space Grotesk /* Card headers */
--text-subhead:  0.875rem / 500 / Space Grotesk /* Labels, nav items */

/* Body */
--text-body:     1rem / 400 / Inter            /* Primary reading text */
--text-body-sm:  0.875rem / 400 / Inter        /* Secondary text */
--text-caption:  0.75rem / 400 / Inter         /* Supplementary info */

/* Mono */
--text-mono:     0.875rem / 400 / JetBrains Mono  /* IDs, fingerprints, status values */
--text-mono-sm:  0.75rem / 400 / JetBrains Mono   /* Timestamps, small labels */
```

### Usage Rules

- Use Space Grotesk for anything a human reads as a label or decision point
- Use Inter for anything a human reads as narrative or description
- Use JetBrains Mono for machine-generated values: IDs, fingerprints, cron expressions, timestamps, status codes
- ALL CAPS in monospace = operational category label (e.g., "CRITICAL", "PENDING JOBS")
- Never mix fonts within the same visual unit

---

## 4. Spacing & Layout

### Spacing Scale (4px base)

```
--space-1:  4px    /* Micro gaps, inline spacing */
--space-2:  8px    /* Compact internal padding */
--space-3:  12px   /* Default internal padding */
--space-4:  16px   /* Card padding, section gaps */
--space-5:  20px   /* Generous padding */
--space-6:  24px   /* Large section spacing */
--space-8:  32px   /* Between major sections */
--space-12: 48px   /* Page-level breathing room */
```

### Layout

```
--max-width:     1024px  /* Main content max width */
--page-padding:  24px    /* Horizontal page padding */
--nav-height:    56px    /* Fixed navigation height */
--card-radius:   8px     /* Card border radius */
--badge-radius:  4px     /* Badge/tag border radius */
```

### Grid Patterns

- Dashboard stats: 2-col on mobile, 4-col on desktop
- Detail views: single column, max 680px
- List views: full width, no max constraint
- Always use `gap-4` (16px) between cards

---

## 5. Component Styles

### Card

```
background:    var(--bg-surface)
border:        1px solid var(--border-subtle)
border-radius: var(--card-radius)
padding:       var(--space-4)
/* NO box-shadow — flatness is intentional */
```

Elevated card (for modals/dropdowns):

```
background:    var(--bg-elevated)
border:        1px solid var(--border-default)
```

Accent card (alert/important state):

```
border-left:   2px solid var(--accent)
padding-left:  calc(var(--space-4) - 2px)
```

### Badge / Status Chip

```
font:           var(--text-mono-sm)
font-weight:    500
padding:        2px 8px
border-radius:  var(--badge-radius)
text-transform: uppercase
letter-spacing: 0.05em

/* Critical */
background: var(--status-critical-bg)
color:      var(--status-critical)
border:     1px solid color-mix(in srgb, var(--status-critical) 30%, transparent)

/* Warning */
background: var(--status-warning-bg)
color:      var(--status-warning)
border:     1px solid color-mix(in srgb, var(--status-warning) 30%, transparent)

/* Success */
background: var(--status-success-bg)
color:      var(--status-success)
border:     1px solid color-mix(in srgb, var(--status-success) 30%, transparent)

/* Neutral (muted, skipped, archived) */
background: var(--bg-elevated)
color:      var(--text-secondary)
border:     1px solid var(--border-subtle)
```

### Navigation

```
background:    var(--bg-surface)
border-bottom: 1px solid var(--border-subtle)
height:        var(--nav-height)

/* Logo wordmark */
font:           var(--text-heading) / Space Grotesk / 700
color:          var(--accent)
letter-spacing: 0.15em
text-transform: uppercase

/* Nav links */
font:           var(--text-mono-sm)
color:          var(--text-secondary)
text-transform: uppercase
letter-spacing: 0.08em
transition:     color 150ms ease

/* Nav link hover / active */
color: var(--accent)
```

### Stat Card (Dashboard metric)

```
/* Container */
background:    var(--bg-surface)
border:        1px solid var(--border-subtle)
border-radius: var(--card-radius)
padding:       var(--space-4)

/* Label */
font:           var(--text-mono-sm)
color:          var(--text-secondary)
text-transform: uppercase
letter-spacing: 0.08em
margin-bottom:  var(--space-2)

/* Value */
font:  var(--text-display) / Space Grotesk / 700
color: var(--text-primary)

/* Accent state (when value requires attention) */
border-color: color-mix(in srgb, var(--accent) 50%, transparent)
value color:  var(--accent)

/* Critical state (alerts, errors) */
border-color: color-mix(in srgb, var(--status-critical) 50%, transparent)
value color:  var(--status-critical)
```

### Status Indicator (● dot)

```
/* Online / Running */
color:   var(--status-success)
content: "● RUNNING"
font:    var(--text-mono-sm)

/* Degraded */
color:   var(--status-warning)
content: "● DEGRADED"

/* Offline */
color:   var(--status-critical)
content: "● OFFLINE"

/* Unknown */
color:   var(--text-muted)
content: "● UNKNOWN"
```

### Section Header (within a card)

```
font:           var(--text-mono-sm)
color:          var(--text-secondary)
text-transform: uppercase
letter-spacing: 0.1em
font-weight:    500
margin-bottom:  var(--space-3)
```

### Offline / Empty State

```
/* Container */
display:         flex
flex-direction:  column
align-items:     center
justify-content: center
min-height:      60vh
gap:             var(--space-4)

/* Icon */
font-size: 3rem
color:     var(--accent)
content:   "◈"  /* Bionic's empty state symbol */

/* Title */
font:  var(--text-title) / Space Grotesk / 600
color: var(--text-primary)

/* Instruction (monospace) */
font:  var(--text-mono)
color: var(--text-secondary)
```

### Data Row (event / action list item)

```
display:       flex
align-items:   center
gap:           var(--space-3)
padding:       var(--space-2) 0
border-bottom: 1px solid var(--border-subtle)

/* Remove border from last child */
:last-child { border-bottom: none }
```

---

## 6. Tailwind CSS Mapping

Since Bionic uses Tailwind CSS, use these mappings:

```
bg-bg-base            → background: #0A0A0A
bg-bg-surface         → background: #111111
bg-bg-elevated        → background: #1A1A1A
border-border-subtle  → border-color: #2A2A2A
border-border-default → border-color: #333333
text-text-primary     → color: #F5F5F5
text-text-secondary   → color: #888888
text-text-muted       → color: #555555
text-accent           → color: #E8611A
bg-accent             → background: #E8611A
text-status-critical  → color: #E5484D
text-status-warning   → color: #F59E0B
text-status-success   → color: #22C55E
font-heading          → Space Grotesk
font-mono             → JetBrains Mono
```

---

## 7. Quality Standards (L1 / L2 / L3)

Based on the 3-layer quality model:

### L1 — Functional Quality (ALL screens, mandatory)

- [ ] Information is displayed correctly and user can navigate without confusion
- [ ] Colors use the defined palette — no hardcoded hex values outside the design system
- [ ] Tailwind classes map to semantic tokens above
- [ ] Offline/empty states are handled with the standard ◈ pattern
- [ ] Status values use the correct badge style (CRITICAL=red, WARNING=amber, SUCCESS=green)
- [ ] Timestamps always use JetBrains Mono
- [ ] IDs and fingerprints always use JetBrains Mono
- [ ] Section labels are uppercase monospace

### L2 — Experience Quality (primary screens: Dashboard, Alerts, Actions)

- [ ] Loading states are handled (not just blank screens)
- [ ] Error states show what happened and what to do
- [ ] Stat cards highlight abnormal values with accent/critical colors
- [ ] Data tables have consistent row patterns with subtle dividers
- [ ] Navigation active state is visually clear

### L3 — Delight Quality (onboarding, first impression screens)

- [ ] The ◈ symbol appears in meaningful empty states
- [ ] Accent orange creates intentional focal points, not decoration
- [ ] The retrofuturist aesthetic is coherent — institutional and precise

---

## 8. Do's and Don'ts

### DO

- Use `font-mono` for all machine-generated values (IDs, status codes, cron expressions)
- Use `font-heading` (Space Grotesk) for labels humans act on
- Keep cards flat — no shadows, no gradients on surfaces
- Use the accent orange sparingly — one focal point per screen
- Use uppercase monospace for ALL operational category labels
- Use the ◈ symbol for empty states
- Keep borders thin (1px) and subtle

### DON'T

- Don't use gradients on UI surfaces (gradients are for backgrounds only, if at all)
- Don't use box-shadow on cards
- Don't use colors outside the defined palette
- Don't mix fonts within the same component
- Don't use `rounded-full` (pill shape) for operational badges — use `rounded` (4px)
- Don't use bright white (`#FFFFFF`) — use `--text-primary` (`#F5F5F5`)
- Don't use teal, cyan, mint, or green as primary accent colors

---

## 9. AI Agent Instructions

When building or modifying any Bionic UI component:

1. **Read this file first.** Do not proceed without verifying the color, typography, and component specs above.
2. **L1 is mandatory.** Every screen must pass all L1 checks before shipping.
3. **Use the ◈ symbol** for all empty/offline states.
4. **Monospace for machines.** Any value generated by the system (IDs, timestamps, status codes, fingerprints, cron expressions) must use JetBrains Mono.
5. **Orange is the focal point.** Use `text-accent` or `bg-accent` only for the single most important element on a screen.
6. **No new colors.** If a color is not in section 2, it doesn't belong in Bionic's UI.
7. **Flat surfaces.** No shadows, no gradients on cards or panels.
8. **The retrofuturist tone.** Uppercase labels, monospace data, dark surfaces, amber glow. This is mission control, not a consumer app.

---

_Last updated: 2026-04-13_
_Maintained by: Claude (design decisions) / Claude Code (implementation)_
