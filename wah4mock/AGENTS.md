<design_rules>
# Flat UI Mobile-First Design System

## Core Principles
- Flat UI with solid colors only (no gradients, no dark mode)
- Thin border outlines with rounded edges on all components
- Modern, clean aesthetic with thoughtful color palette
- Subtle depth via soft shadows for hierarchy (use sparingly)
- Use icon libraries only (no hardcoded emojis as icons)

## Strictly Avoid
- Floating elements and decorative non-functional embellishments
- Focus outlines/rings (maintain accessibility via other means)
- Horizontal overflow from absolute elements
- Desktop-first styling patterns
- Generic "safe" palettes (default blues, purples, tech gradients)
- Excessive white space as a crutch for layout
- Card-heavy layouts without visual variety

## Color & Aesthetic Philosophy
- Intentional over safe: choose colors with purpose, not defaults
- Warmth and character: consider earthy tones, muted naturals, or bold accents
- Contrast matters: ensure hierarchy through deliberate color relationships
- Avoid the "startup template" look: no generic hero + 3 cards + blue CTA
- Simple does not mean bland: minimal can still have personality
- Let the content/brand guide palette, not statistical averages

## Full Viewport (Main Sections Only)
- Hero and primary sections should fill 100vh (min-h-screen or min-h-dvh)
- Secondary/content sections: auto height based on content

## Mobile-First Responsive (Mandatory)
- Base: 320px+ (default styles, no prefix)
- Tablet: 768px+ (md: prefix)
- Desktop: 1024px+ (lg: prefix)

### Layout Patterns
- Mobile: single column, full width, px-4
- Tablet: 2 columns where appropriate, px-6
- Desktop: multi-column grids, max-width container, px-8

### Touch Targets
- All interactive elements: minimum 44px height and width
- Adequate spacing between tap targets

### Typography Scaling
- Headings: smaller on mobile, scale up per breakpoint
- Body: base size on mobile, slightly larger on desktop

### Spacing Scaling
- Reduce padding/margins on mobile
- Increase progressively for tablet and desktop
- Gaps in grids: tighter on mobile, wider on desktop

### Absolute Elements
- Use responsive offsets to prevent overflow
- Test positioning at all breakpoints

## Placement & Centering Rules
- Vertical + horizontal center: use flexbox (flex + items-center + justify-center)
- Never use absolute positioning for main content centering
- For hero sections: flex column, center both axes, text-center on mobile
- Stack elements vertically on mobile, horizontal on desktop
- Images: block level, max-width 100%, auto height to prevent overflow

## Container Rules
- Always wrap page content in a max-width container on desktop
- Container centered with auto margins
- Fluid width on mobile (no max-width constraint)
- Consistent horizontal padding at every breakpoint

## Grid & Flex Patterns
- Mobile: flex-col or grid-cols-1 (single column always)
- Tablet: grid-cols-2 or flex-row with wrap
- Desktop: grid-cols-3 or grid-cols-4 based on content
- Gap scaling: gap-4 mobile, gap-6 tablet, gap-8 desktop
- Flex items: use flex-1 or width percentages, never fixed pixel widths

## Component Placement
- Buttons: full width on mobile (w-full), auto width on tablet+ (md:w-auto)
- Form inputs: always full width, stack labels above inputs
- Cards: full width mobile, 2-up tablet, 3-up desktop
- Navigation: hamburger menu on mobile, horizontal links on desktop
- Modals/dialogs: nearly full screen on mobile with small margin, centered box on desktop

## Image & Media Handling
- Always responsive: w-full, h-auto
- Object-fit cover for background-style images
- Aspect ratio containers to prevent layout shift
- Hide decorative images on mobile if they cause clutter

## Overflow Prevention
- Root containers: overflow-x-hidden if needed
- No negative margins that extend beyond viewport
- Absolute elements: inset values must be responsive (inset-4 md:inset-8)
- Test at 320px width - nothing should cause horizontal scroll
</design_rules>