# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run check

# Watch mode type checking
npm run check:watch
```

## Project Architecture

This is a **SvelteKit 5** application with **Svelte 5 runes** that implements a ChatGPT-style UI with advanced content rendering capabilities. The project is configured as a **Single Page Application (SPA)** using the static adapter.

### Core Architecture

- **Framework**: SvelteKit 5 with Svelte 5 runes syntax
- **Build Tool**: Vite
- **Styling**: Tailwind CSS 4.x
- **Deployment**: Static SPA build (adapter-static with fallback)

### Key Components Structure

**Content Rendering System**: The application centers around a sophisticated content renderer that automatically detects and renders different content types:

```
src/lib/components/
├── MessageRenderer.svelte          # Main content detection and routing
└── renderers/
    ├── MarkdownRenderer.svelte     # Markdown with mixed content support
    ├── CodeRenderer.svelte         # Syntax highlighting
    ├── MermaidRenderer.svelte      # Diagrams and flowcharts
    ├── MathRenderer.svelte         # LaTeX formulas
    ├── ChartRenderer.svelte        # Data visualization
    ├── MarpRenderer.svelte         # Presentation slides
    └── ImageRenderer.svelte        # Image gallery with zoom
```

**Content Detection Logic**: MessageRenderer.svelte contains sophisticated content analysis that:
- Detects content types using regex patterns
- Prioritizes content types (Marp > Charts > Mermaid > Code > Math)
- Handles mixed content by routing to MarkdownRenderer
- Falls back to plain text for unrecognized content

### Dependencies by Content Type

**Core Rendering**:
- `marked` + `dompurify` - Markdown processing with XSS protection
- `highlight.js` - Code syntax highlighting
- `katex` - Mathematical formula rendering

**Advanced Content**:
- `mermaid` - Diagram generation
- `chart.js` + `chartjs-adapter-date-fns` - Data visualization
- `@marp-team/marp-core` - Presentation slides
- `photoswipe` - Image viewer with zoom/pan
- `pdfjs-dist` - PDF document viewer
- `video.js` - Media playback
- `vis-timeline` - Timeline visualization

### Routes Structure

- `src/routes/+page.svelte` - Main chat interface with sample content
- `src/routes/presentation/+page.svelte` - Presentation viewer page
- `src/routes/api/chat/+server.js` - OpenAI API integration (requires OPENAI_API_KEY)

### Configuration

**SvelteKit Config** (`svelte.config.js`):
- Uses `@sveltejs/adapter-static` for SPA deployment
- Fallback to `index.html` for client-side routing
- Svelte 5 runes enabled (`compilerOptions.runes: true`)

**Content Detection Patterns**:
- Marp: `---\nmarp: true` or `<!-- theme:` or `<!-- paginate:`
- Charts: `type: (line|bar|pie|doughnut)` with `data:` properties
- Mermaid: `​```mermaid` code blocks
- Math: `$$...$$`, `$...$`, or LaTeX commands
- Code: `​```language` blocks (excluding mermaid/chart/marp)
- Images: URLs ending in image extensions or base64 data URLs

### Development Notes

- Uses Svelte 5 runes syntax (`$state`, `$props`, `$effect`)
- Content analysis has safety limits (50KB max for performance)
- Debug information shown in development mode
- Auto-scrolling chat interface
- Responsive design with mobile support

### Environment Variables

- `OPENAI_API_KEY` - Required for chat API functionality (private env var)

### Build Output

- Static files generated in `build/` directory
- Configured for SPA deployment with fallback routing
- All content renderers are client-side only