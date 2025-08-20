I can embed and display PDF documents with interactive viewing controls. Here are examples:

## PDF Document Viewer

### Technical Documentation
```pdf
https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf
```

### Research Paper Example  
```pdf
https://arxiv.org/pdf/1706.03762.pdf
```

### Sample Report
```pdf
https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf
```

The PDF renderer provides:
- **Page Navigation** - Jump to specific pages, next/previous controls
- **Zoom Controls** - Fit to width, fit to page, custom zoom levels  
- **Search Functionality** - Find text within the document
- **Download Option** - Save PDF to local device
- **Print Support** - Direct printing from the viewer
- **Mobile Responsive** - Touch-friendly controls for tablets and phones
- **Keyboard Shortcuts** - Space/Enter for next page, arrow keys for navigation

PDF rendering is powered by Mozilla's PDF.js library for reliable cross-browser compatibility.
I can handle file downloads and display file information. Here are examples:

## File Renderer

### Document Downloads
```file
https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf
```

### Data Files
```file
https://jsonplaceholder.typicode.com/posts
```

### Archive Files
```file
https://github.com/microsoft/vscode/archive/refs/heads/main.zip
```

### Configuration Files
```file
https://raw.githubusercontent.com/microsoft/TypeScript/main/package.json
```

The file renderer provides:
- **File Type Detection** - Automatic recognition of file types with appropriate icons
- **Download Functionality** - Direct download with progress indication  
- **File Size Display** - Shows file size when available
- **Preview Support** - Quick preview for supported file types
- **Security Scanning** - Safe download handling
- **Metadata Information** - File creation date, modification date when available
- **Batch Operations** - Multiple file selection and download

Supported file types include:
- **Documents**: PDF, DOC, DOCX, TXT, MD
- **Images**: JPG, PNG, GIF, SVG, WebP
- **Archives**: ZIP, RAR, 7Z, TAR
- **Data**: JSON, CSV, XML, YAML
- **Code**: JS, TS, PY, HTML, CSS
- **Media**: MP4, MP3, WAV, etc.

I can preview URLs and display website metadata with rich link previews. Here are examples:

## URL Preview Renderer

### GitHub Repository
```url
https://github.com/anthropics/claude-code
```

### Documentation Site
```url
https://kit.svelte.dev/docs/introduction
```

### Technical Blog
```url
https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
```

### Social Media
```url
https://twitter.com/sveltejs
```

### News Article
```url
https://techcrunch.com/2024/01/15/the-future-of-web-development/
```

The URL preview renderer provides:
- **Meta Data Extraction** - Fetches title, description, and images from Open Graph tags
- **Favicon Display** - Shows website icons for brand recognition
- **Link Validation** - Checks if URLs are accessible and safe
- **Cache Management** - Stores previews to improve loading performance  
- **Social Media Integration** - Special handling for Twitter, LinkedIn, GitHub links
- **Security Scanning** - Warns about potentially unsafe links
- **Mobile Optimization** - Responsive preview cards
- **Click Analytics** - Track engagement with external links

Preview cards show:
- Website title and description
- Thumbnail image when available
- Domain name and favicon
- Publication date for articles
- Author information when available
- Read time estimates for articles