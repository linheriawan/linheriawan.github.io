# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Start development server
bun run dev

# Build for production
bun run build

# Preview production build
bun run preview

# Type checking
bun run check

# Watch mode type checking
bun run check:watch
```

## Project Architecture

This is a **SvelteKit 5** application with **Svelte 5 runes** that implements a ChatGPT-style UI with advanced content rendering capabilities. The project is configured as a **Single Page Application (SPA)** using the static adapter.

### Overview
This project is to make ai chat application to have rich rendering capabilities, previous successfull rendering data is when it only need to rendering 1 renderer inside a message bubble. 

To closely mimic the real ai response we use src/mock/*.md file to illustrate how is the response that should be render as one answer. the challange is using $effect will continously triggering renderer initialisation until the message stream is done (received complete message stream).

### Principle
** DO's **
- Prioritise goals from overview
- ask for confirmation before executing plan, get deeper undestranding of what is the priority to solve and is it gonna have impact for other code 
- consider replacing current file, than try to fix/edit complicated logic on code more than 400 lines

** DONT **
- make console.log masively so browser debug will be harder (there is repetitive initialiazation with $effect and message stream)
- leave unused file/old implementation/testing script uncleaned

### Core Architecture

- **Framework**: SvelteKit 5 with Svelte 5 runes syntax
- **Build Tool**: Vite
- **Styling**: Tailwind CSS 4.x
- **Deployment**: Static SPA build (adapter-static with fallback)

### Key Components Structure - NEW ARCHITECTURE

**Centralized Content Rendering System**: The application uses a **markdown-first approach** with embedded special renderers, all controlled by MessageRenderer.svelte:

```
src/lib/components/
├── MessageRenderer.svelte          # MAIN PROCESSOR - handles ALL content detection, markdown processing, and renderer mounting
└── renderers/
    ├── TableRenderer.svelte        # Table/CSV data visualization
    ├── ChartRenderer.svelte        # Chart.js data visualization
    ├── MermaidRenderer.svelte      # Diagrams and flowcharts
    ├── TimelineRenderer.svelte     # Timeline visualization
    ├── ImageRenderer.svelte        # Image gallery with zoom
    ├── MediaRenderer.svelte        # Audio/video player
    ├── PDFRenderer.svelte          # PDF document viewer
    ├── FileRenderer.svelte         # File download links
    ├── URLPreviewRenderer.svelte   # URL preview cards
    ├── CodeRenderer.svelte         # Syntax highlighting (handled by MessageRenderer)
    ├── MathRenderer.svelte         # LaTeX formulas (handled by MessageRenderer)
    └── MarpRenderer.svelte         # Presentation slides (handled by MessageRenderer)
```

**NEW RENDERER ARCHITECTURE**:
- **MessageRenderer.svelte** is the SINGLE point of content processing
- Uses `marked.js` with custom renderer to detect special code blocks
- Processes content as markdown by default
- Embeds special renderers dynamically using Svelte's `mount()` function
- Each special renderer gets proper initialization and completion logging

**Special Block Detection Patterns**:
1. ```csv\n[data]``` → TableRenderer
2. ```table\n[data]``` → TableRenderer  
3. ```chart\n[data]``` → ChartRenderer
4. ```mermaid\n[data]``` → MermaidRenderer
5. ```timeline\n[data]``` → TimelineRenderer
6. ```image\n[data]``` → ImageRenderer
7. ```audio\n[data]``` or ```video\n[data]``` → MediaRenderer
8. ```pdf\n[data]``` → PDFRenderer
9. ```file\n[data]``` → FileRenderer
10. ```url\n[data]``` → URLPreviewRenderer
11. ```marp\n[data]``` → Stays as markdown with presentation button
12. Programming languages (js, python, etc.) → Syntax highlighting (built into MessageRenderer)
13. Math formulas `$$...$$` or `$...$` → KaTeX rendering (built into MessageRenderer)

**Content Processing Flow**:
1. MessageRenderer receives content
2. Uses marked.js custom renderer to detect special code blocks
3. Registers complete blocks in specialBlocks Map
4. Processes as markdown with placeholders for special blocks
5. Sanitizes HTML with DOMPurify
6. Mounts appropriate renderer components to placeholders
7. Each renderer logs initialization and completion

### Dependencies by Content Type

**Core Rendering**:
1 `marked` + `dompurify` - Markdown processing with XSS protection
2 `highlight.js` - Code syntax highlighting
3 `katex` - Mathematical formula rendering

**Advanced Content**:
4 `mermaid` - Diagram generation
5 `chart.js` + `chartjs-adapter-date-fns` - Data visualization
6 `@marp-team/marp-core` - Presentation slides
7 `vis-timeline` - Timeline visualization

8 `photoswipe` - Image viewer with zoom/pan
9 PDF renderer should use native brower plugin (using iframe to display pdf)
10 Media playback should use native html5, uninstall video.js from package
11 Table renderer, should make custom table render, as simple as the way rendering table for MD 
12 URLPreview, FileRenderer, should be applied using simple logic

### Routes Structure

- `src/routes/+page.svelte` - Main chat interface with sample content
- `src/routes/presentation/+page.svelte` - Presentation viewer page
- `src/routes/api/chat/+server.js` - OpenAI API integration (requires OPENAI_API_KEY)

### Configuration

**SvelteKit Config** (`svelte.config.js`):
- Uses `@sveltejs/adapter-static` for SPA deployment
- Fallback to `index.html` for client-side routing
- Svelte 5 runes enabled (`compilerOptions.runes: true`)

### Development Notes

- Uses Svelte 5 runes syntax (`$state`, `$props`, `$effect`)
- Content analysis has safety limits (50KB max for performance)
- Debug information shown in development mode
- Auto-scrolling chat interface
- Responsive design with mobile support

### Rendering Architecture Changes (Aug 2024)

**MAJOR FIXES APPLIED**: Fixed critical streaming-related rendering issues:

**PROBLEMS SOLVED**:
- ❌ **Premature initialization**: Renderers triggered before complete content received during streaming
- ❌ **Container binding issues**: Elements not available when `$effect` runs due to conditional rendering  
- ❌ **Cleanup interference**: `$effect` cleanup functions clearing content immediately after creation
- ❌ **Multiple mounting**: Components re-mounted repeatedly during streaming causing bandwidth waste
- ❌ **Dynamic import timeouts**: TimelineRenderer stuck on loading with timeout errors

**SOLUTIONS IMPLEMENTED**:

**1. Initialization Pattern Fixes**:
- **TableRenderer**: Replaced `onMount` with `$effect`, fixed container binding with `style="display"` instead of conditional rendering
- **TimelineRenderer**: Replaced `onMount` with `$effect`, replaced dynamic imports with static imports, removed cleanup interference  
- **MediaRenderer**: Added proper `!player` checks to prevent re-initialization, fixed container binding timing
- **ChartRenderer**: Replaced dual `onMount`+`$effect` with single `$effect`, fixed canvas binding, added Chart.js controller registration
- **MermaidRenderer**: Replaced `onMount` with `$effect`, added content completion validation

**2. Content Completion Validation**:
- Added completion checks for streaming content (CSV tables, JSON charts, mermaid syntax, media URLs)
- Renderers only initialize when complete content blocks are received
- Prevents parse errors and malformed output during streaming

**3. Container Binding Pattern**:
```svelte
<!-- BEFORE: Conditional rendering breaks binding -->
{#if !isLoading}
  <div bind:this={container}></div>
{/if}

<!-- AFTER: Always present, conditionally visible -->
<div bind:this={container} style="display: {isLoading ? 'none' : 'block'}"></div>
```

**4. Cleanup Function Safety**:
- Removed aggressive cleanup that cleared content during streaming
- Let Svelte handle DOM cleanup naturally on component destroy
- Only cleanup external resources (timeline.destroy(), chart.destroy()) when actually needed

**5. Import Optimizations**:
- TimelineRenderer: Static imports instead of dynamic imports (eliminated timeouts)
- ChartRenderer: Proper Chart.js controller registration (BarController, LineController, etc.)
- MessageRenderer: Duplicate mounting prevention with placeholder children check

**Key Implementation Details**:
- All renderers use `$effect(() => { if (browser && container && content && !initialized) ... })` pattern
- Content completion validation prevents premature rendering during streaming
- Container elements always present in DOM, visibility controlled by CSS
- Static imports preferred over dynamic imports for better performance and reliability

**Demo Commands for Testing**:
- Send "1" - Mixed content with 11 different renderers
- Send "2" - Presentations and Math formulas  
- Send "3" - PDF documents, File downloads, URL previews
- Send "4" - is to test small amount of renderer usage

### Environment Variables

- `OPENAI_API_KEY` - Required for chat API functionality (private env var)

### Build Output

- Static files generated in `build/` directory
- Configured for SPA deployment with fallback routing
- All content renderers are client-side only