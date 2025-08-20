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
**Renderer Usage Logic**:
1. MarkdownRenderer :  Default renderer (fallback if no other renderer is match) for any text with pattern of ```[keyword]\n[data]```
2. ChartRenderer : Rendering Chart diagram with pattern of ```chart\n[data]```
3. CodeRenderer : Rendering programming code block, keyword should including: javascript, json, xml, python,typescript,etc
3. FileRenderer : Rendering File if pattern is ```file\n[data]```
4. ImageRenderer : Rendering image preview if pattern is ```image\n[data]```
5. MathRenderer : Rendering Mermaid diagram with pattern of ```math\n[data]``` or `$$...$$`, `$...$`, or LaTeX commands, but need strategy of how to rendering inline or as block
6. MediaRenderer : Rendering media player if pattern is ```audio\n[data]``` or ```video\n[data]```
7. MermaidRenderer : Rendering Mermaid diagram with pattern of ```mermaid\n[data]```
8. PdfRenderer : Rendering image preview if pattern is ```pdf\n[data]```
9. TableRenderer : Rendering table if pattern is ```table\n[json_data]``` or ```csv\n[csv_data]```
10. TimelineRenderer : Rendering timeline visualization if pattern is ```timeline\n[data]```
11. URLPreviewRenderer : Rendering URL if pattern is ```url\n[data]```
12. MarpRenderer : Rendering as Markdown (goes to markdownrenderer) if pattern is ```marp\n[data]``` (but have show marp button, which will open new window that really rendering marpit)

**Content Detection Logic**: MessageRenderer.svelte contains sophisticated content analysis that:
- Detects content types using regex patterns
- Prioritizes content types (Marp > Charts > Mermaid > Code > Math)
- Handles mixed content by routing to MarkdownRenderer
- Falls back to plain text for unrecognized content

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

### Environment Variables

- `OPENAI_API_KEY` - Required for chat API functionality (private env var)

### Build Output

- Static files generated in `build/` directory
- Configured for SPA deployment with fallback routing
- All content renderers are client-side only