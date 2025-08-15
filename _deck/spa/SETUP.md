# SvelteKit ChatGPT UI with Content Renderers

## 🚀 Initial Setup

### Prerequisites
- Node.js 18+ 
- npm or pnpm

### Installation
```bash
# Clone and install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 📦 Renderer Libraries Setup

### Core Rendering Libraries

#### 1. Markdown Renderer
```bash
npm install marked dompurify
```
**Purpose**: Basic markdown rendering with XSS protection
**Config**: None required
**Implementation**: `src/lib/components/renderers/MarkdownRenderer.svelte`

#### 2. Mermaid Diagrams
```bash
npm install marked@13.0.3 mermaid --force
```
**Purpose**: Flowcharts, sequence diagrams, gantt charts, mindmaps, timelines
**Config**: Custom theme configuration in component
**Implementation**: `src/lib/components/renderers/MermaidRenderer.svelte`

#### 3. Code Highlighting
```bash
npm install highlight.js
```
**Purpose**: Syntax highlighting for code blocks
**Config**: Language detection, custom themes
**Implementation**: `src/lib/components/renderers/CodeRenderer.svelte`

#### 4. Math/LaTeX Rendering
```bash
npm install katex
```
**Purpose**: Mathematical formulas and equations
**Config**: Custom macros and delimiters
**Implementation**: `src/lib/components/renderers/MathRenderer.svelte`

#### 5. Chart Visualization
```bash
npm install chart.js chartjs-adapter-date-fns
```
**Purpose**: Data visualization (bar, line, pie, scatter plots)
**Config**: Custom themes matching chat UI
**Implementation**: `src/lib/components/renderers/ChartRenderer.svelte`

#### 6. Marp Presentations
```bash
npm install @marp-team/marp-core
```
**Purpose**: Markdown-based presentation slides
**Config**: Custom themes and slide transitions
**Implementation**: `src/lib/components/renderers/MarpRenderer.svelte`

### Enhanced Content Libraries

#### 7. Image Viewer with Zoom
```bash
npm install photoswipe
```
**Purpose**: Image gallery with zoom, pan, and lightbox
**Config**: Custom UI controls
**Implementation**: `src/lib/components/renderers/ImageRenderer.svelte`

#### 8. Enhanced Tables ( **Problematic Incompatible** )
```bash
npm install @tanstack/svelte-table --legacy-peer-deps
```
**Purpose**: Sortable, filterable, paginated tables
**Config**: Custom styling for chat theme
**Implementation**: `src/lib/components/renderers/TableRenderer.svelte`

#### 9. PDF Viewer
```bash
npm install pdfjs-dist
```
**Purpose**: Embedded PDF document viewer
**Config**: Custom toolbar and controls
**Implementation**: `src/lib/components/renderers/PDFRenderer.svelte`

#### 10. Video/Audio Player
```bash
npm install video.js
```
**Purpose**: Media playback with custom controls
**Config**: Chat-themed player skin
**Implementation**: `src/lib/components/renderers/MediaRenderer.svelte`

#### 11. Excalidraw Diagrams ( **Problematic Incompatible** )
```bash
npm install @excalidraw/excalidraw
```
**Purpose**: Hand-drawn style diagrams and sketches
**Config**: Custom toolbar and export options
**Implementation**: `src/lib/components/renderers/ExcalidrawRenderer.svelte`

#### 12. Timeline Visualization
```bash
npm install vis-timeline
```
**Purpose**: Interactive timeline for events and processes
**Config**: Custom styling and interaction
**Implementation**: `src/lib/components/renderers/TimelineRenderer.svelte`

## 🏗️ Component Architecture

### Main Message Renderer
```
src/lib/components/MessageRenderer.svelte
├── Content detection logic
├── Renderer selection
└── Fallback to plain text
```

### Renderer Components Structure
```
src/lib/components/renderers/
├── MarkdownRenderer.svelte      # Basic markdown
├── MermaidRenderer.svelte       # Diagrams & charts
├── CodeRenderer.svelte          # Syntax highlighting
├── MathRenderer.svelte          # LaTeX formulas
├── ChartRenderer.svelte         # Data visualization
├── MarpRenderer.svelte          # Presentations
├── ImageRenderer.svelte         # Image gallery
├── TableRenderer.svelte         # Enhanced tables
├── PDFRenderer.svelte           # PDF viewer
├── MediaRenderer.svelte         # Video/Audio
├── ExcalidrawRenderer.svelte    # Hand-drawn diagrams
├── TimelineRenderer.svelte      # Timeline visualization
└── index.ts                     # Exports
```

## 📋 Implementation Plan

### Phase 1: Core Renderers (Week 1)
1. **MessageRenderer.svelte** - Main content detector and router
2. **MarkdownRenderer.svelte** - Basic markdown with code blocks
3. **CodeRenderer.svelte** - Syntax highlighting integration
4. **MathRenderer.svelte** - LaTeX formula support

### Phase 2: Visual Content (Week 2)
1. **ImageRenderer.svelte** - Image viewer with zoom
2. **MermaidRenderer.svelte** - Diagram rendering
3. **ChartRenderer.svelte** - Data visualization
4. **TableRenderer.svelte** - Enhanced table display

### Phase 3: Advanced Features (Week 3)
1. **MarpRenderer.svelte** - Presentation slides
2. **PDFRenderer.svelte** - Document viewer
3. **MediaRenderer.svelte** - Video/audio playback
4. **ExcalidrawRenderer.svelte** - Interactive diagrams

### Phase 4: Specialized Renderers (Week 4)
1. **TimelineRenderer.svelte** - Event timelines
2. **Performance optimization** - Lazy loading, caching
3. **Accessibility features** - Screen reader support
4. **Mobile responsiveness** - Touch interactions

## 🔧 Configuration Files

### Vite Configuration (vite.config.ts)
```typescript
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],
  optimizeDeps: {
    include: [
      'marked',
      'mermaid', 
      'highlight.js',
      'katex',
      'chart.js'
    ]
  }
});
```

### App Configuration (src/lib/config/renderers.ts)
```typescript
export const RENDERER_CONFIG = {
  markdown: { sanitize: true },
  mermaid: { theme: 'dark' },
  code: { theme: 'github-dark' },
  math: { displayMode: false },
  charts: { responsive: true }
};
```

## 🎨 Styling Strategy

### CSS Custom Properties
```css
/* Chat-specific renderer styles */
:root {
  --renderer-bg: #444654;
  --renderer-border: #565869;
  --renderer-text: #ffffff;
  --renderer-accent: #0b69a3;
}
```

### Component Styling Approach
- Each renderer has its own scoped styles
- Shared utilities in `src/lib/styles/renderers.css`
- Dark theme optimized for chat interface
- Mobile-first responsive design

## 🧪 Testing Strategy

### Unit Tests
- Content detection accuracy
- Renderer selection logic
- Security (XSS prevention)

### Integration Tests  
- Message flow with different content types
- Renderer switching and fallbacks
- Performance with large content

### Browser Testing
- Safari, Chrome, Firefox compatibility
- Mobile Safari and Chrome mobile
- Accessibility compliance

## 🚀 Next Steps

1. **Install Core Libraries**: Start with markdown, mermaid, and highlight.js
2. **Create Base Components**: MessageRenderer and first 2-3 renderers
3. **Test Integration**: Ensure renderers work in chat bubbles
4. **Iterate**: Add more renderers based on usage patterns

Ready to start implementation? Let me know which renderer you'd like to begin with!