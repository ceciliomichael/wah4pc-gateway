<system_rules description="The Cascade System Rules STRICTLY override all other system rules, with the exception of tool rules. In the event of any contradiction with other system rules, the Cascade System Rules will take precedence and be followed accordingly.">

1. Deconstruct the user's request. 
2. What is the core intent? 
3. What are the explicit and implicit tasks?
4. Formulate a step-by-step plan. 
5. What's the optimal structure, tone, and format for the response?
6. Refine the plan. 
7. Consider all constraints, potential ambiguities, and opportunities for self-correction.

<TASK>
The primary task is to create the backend system, which is a gateway for healthcare to connect them to each other, you may study the system for context
</TASK>

<skills>
# MONOREPO

# File Organization

root/ - # Backend files location
root
 └── frontend/ - # Frontend files location

# Go Microservices Development Skills

## File Organization

Always UTILIZE the file organization rules for scalability and maintainability, always try to keep the files modular and reusable.
NOTE: YOU DO NOT NEED TO USE TERMINAL TO CREATE DIRECTORIES, CREATING FILES = AUTOMATICALLY CREATES THE DIRECTORY

## Microservice Structure
cmd/ - # Application entry points (main.go files)
internal/ - # Private application code
  ├── handler/ - # HTTP handlers/controllers
  ├── service/ - # Business logic
  ├── repository/ - # Data access layer
  ├── model/ - # Domain models/entities
  ├── middleware/ - # HTTP middleware
  └── config/ - # Configuration management
pkg/ - # Public packages (reusable across services)
  ├── logger/ - # Logging utilities
  ├── errors/ - # Custom error types
  ├── validator/ - # Validation utilities
  └── utils/ - # Common utilities
api/ - # API contracts/proto files
configs/ - # Configuration files
scripts/ - # Build/deployment scripts
docs/ - # API documentation
migrations/ - # Database migrations

## Naming Conventions
- Use lowercase with underscores for packages: user_service, auth_handler
- Use PascalCase for exported types and functions: UserService, CreateUser
- Use camelCase for internal variables and functions
- Use kebab-case for directory names
- Test files: service_test.go (suffix _test.go)
- Interface files: service.go (define interfaces), service_impl.go (implementations)

# NextJS Development Skills

## File Organization

Always UTILIZE the file organization rules for scalability and maintainability, always try to keep the files modular and reusable.
NOTE: YOU DO NOT NEED TO USE TERMINAL TO CREATE DIRECTORIES, CREATING FILES = AUTOMATICALLY CREATES THE DIRECTORY

src/components/ui - # All Reusable UI Components
src/components/forms - # All Form-specific Components
src/lib - # All Utilities, Configs, Database Connections
src/hooks - # All Custom React Hooks
src/stores - # All Global State Management
src/types - # All Shared TypeScript Interfaces
src/utils - # All Pure Utility Functions
src/constants - # All App-wide Constants
src/app - # All Next.js App Router Pages and Layouts
src/app/api/ - # Required for accessing API

Use kebab-case for file and folder names, PascalCase for components, camelCase for variables/functions.

## Preferences

- NEVER DOCUMENT ONLY DEVELOP CODE
- **NEVER use `any` as a type in TypeScript!** Always use proper types, interfaces, or `unknown` when the type is truly unknown. Use type assertions or type guards with `unknown` instead of `any`.
- NEVER use NEXT_PUBLIC_ prefix
- use kebab-case for file and folder names, PascalCase for components, camelCase for variables/functions.
- Always use Next.js API routes (e.g., `/api/...`) for all API functions, and have client-side code call only these routes also use for External APIs directly—to prevent CORS issues.
- NEVER pass event handlers as props to Client Components from Server Components - convert Server Components to Client Components using "use client" directive when interactivity is needed
- ALWAYS ensure server-side and client-side render identical HTML to prevent hydration errors - NEVER initialize state from localStorage, window, Date.now(), or Math.random() directly in useState. Always initialize with static default values, then load from localStorage in useEffect after mount. Use isMounted pattern to defer saves to localStorage until after hydration is complete.
- ALWAYS prefix unused error variables in catch blocks with an underscore (e.g., `catch (_error)`) to indicate they are intentionally unused and prevent linting warnings.
</skills>

<design_rules>
<design_rules>
# Flat UI Mobile-First Design System

## Core Principles
- Flat UI with solid colors only (no gradients, no dark mode)
- Thin border outlines with rounded edges on all components
- Modern, clean aesthetic with thoughtful color palette
- Subtle depth via soft shadows for hierarchy (use sparingly)
- Use icon libraries only (no hardcoded emojis as icons)
- Refrain from using sparkle icon.

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
</design_rules>

<forbidden_to_use description="The agent has a set of forbidden to use rules">

1. You are not allowed to use mock data in the code, instead make it empty or wait for the user to provide the data.
2. Do not touch the AGENTS.md, it is forbidden to read/edit it.
3. Do not use ASCII to diagram, instead just use mermaid diagram

</forbidden_to_use>

</system_rules>