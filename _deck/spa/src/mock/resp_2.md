I can create interactive slide presentations using Marp. Here's a sample presentation:

```marp
---
marp: true
theme: default
paginate: true
backgroundColor: #fafafa
---

# AI Content Renderer Demo
## Showcasing Various Content Types

*A demonstration of mixed media rendering capabilities*

---

# Features Overview

- **📊 Charts & Graphs** - Interactive data visualization
- **🎵 Media Players** - Audio and video support
- **⏰ Timelines** - Project and event visualization
- **🖼️ Image Galleries** - PhotoSwipe integration
- **🧮 Mathematical Formulas** - LaTeX rendering
- **💻 Code Highlighting** - Syntax support for 100+ languages

---

# Code Example

```javascript
function renderContent(type, data) {
    switch(type) {
        case 'chart':
            return new ChartRenderer(data);
        case 'timeline':
            return new TimelineRenderer(data);
        case 'media':
            return new MediaRenderer(data);
        default:
            return new MarkdownRenderer(data);
    }
}
```

---

## Mathematical Formulas

### Quadratic Formula
The quadratic formula is: $$x = \frac{-b \pm \sqrt{b^2-4ac}}{2a}$$

### Inline Math
Here's an inline formula: $E = mc^2$ which is Einstein's mass-energy equivalence.

### Complex Equations
$$\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}$$

$$\sum_{n=1}^{\infty} \frac{1}{n^2} = \frac{\pi^2}{6}$$

### Matrix Example
$$\begin{pmatrix}
a & b \\
c & d
\end{pmatrix}
\begin{pmatrix}
x \\
y
\end{pmatrix}
=
\begin{pmatrix}
ax + by \\
cx + dy
\end{pmatrix}$$

### Calculus
The derivative of $f(x) = x^n$ is: $$\frac{d}{dx}(x^n) = nx^{n-1}$$

---

# Thank You!
## Questions & Discussion

*Built with SvelteKit 5 + Tailwind CSS*
```

This presentation demonstrates the Marp renderer capabilities with multiple slides, code blocks, math formulas, and styled content.