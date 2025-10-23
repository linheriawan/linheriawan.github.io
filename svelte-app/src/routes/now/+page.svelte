<script>
    import SEO from '$lib/components/SEO.svelte';

    const lastUpdated = 'October 2025';

    const currentFocus = [
        {
            icon: '🎮',
            title: 'Learning Godot Engine',
            description: 'Exploring game development by building a simple platformer. Learning GDScript, scene management, and 2D physics. Still very much a beginner, but enjoying the creative process.',
            links: []
        },
        {
            icon: '⚡',
            title: 'ESP32 Experiments',
            description: 'Tinkering with ESP32 microcontrollers for IoT projects. Testing different sensors (temperature, motion, light) and learning about wireless communication protocols.',
            links: []
        },
        {
            icon: '🎨',
            title: 'Blender 3D Modeling',
            description: 'Teaching myself 3D modeling for game assets and visualization. Following tutorials and practicing basic modeling, texturing, and lighting.',
            links: []
        },
        {
            icon: '🚀',
            title: 'Building Aksara Initiative',
            description: 'Primary focus: developing tools for Indonesian digital literacy. Working on Aksara Writer (document converter), planning Aksara IS (no-code builder), and researching MerdekaOS (Linux distro).',
            links: [
                { text: 'Aksara Initiative Website', url: 'https://ak-sara.github.io' },
                { text: 'GitHub Organization', url: 'https://github.com/Ak-sara' }
            ]
        }
    ];

    const techLearning = [
        'Godot Engine & GDScript',
        'Blender 3D Modeling',
        'ESP32 & Arduino',
        'Rust Programming',
        'Linux Distribution Development'
    ];

    const reading = [
        'Game design patterns and architecture',
        'Embedded systems programming',
        'Open-source community building',
        'Technical documentation writing'
    ];
</script>

<SEO
    title="What I'm Doing Now - Heriawan"
    description="Learning Godot & Blender, tinkering with ESP32, building Aksara Initiative. Updated October 2025."
    url="https://linheriawan.github.io/now"
/>

<div class="now-page">
    <section class="now-hero">
        <div class="container">
            <div class="hero-badge">Updated: {lastUpdated}</div>
            <h1>What I'm Doing Now</h1>
            <p class="subtitle">
                This is a <a href="https://nownownow.com/about" target="_blank" class="now-link">now page</a>.
                It's a snapshot of what I'm currently focused on. I'll update it monthly as things evolve.
            </p>
            <p class="honesty-note">
                I'm at the exploration phase - learning new things, building projects, and figuring out what works.
                Some of these will become solid skills, others are just experiments. That's the process.
            </p>
        </div>
    </section>

    <section class="focus-section">
        <div class="container">
            <h2>Current Focus</h2>
            <div class="focus-grid">
                {#each currentFocus as item}
                    <div class="focus-card">
                        <div class="focus-icon">{item.icon}</div>
                        <div class="focus-content">
                            <h3>{item.title}</h3>
                            <p>{item.description}</p>
                            {#if item.links.length > 0}
                                <div class="focus-links">
                                    {#each item.links as link}
                                        <a href={link.url} target="_blank" class="focus-link">
                                            <i class="fas fa-external-link-alt"></i>
                                            {link.text}
                                        </a>
                                    {/each}
                                </div>
                            {/if}
                        </div>
                    </div>
                {/each}
            </div>
        </div>
    </section>

    <section class="learning-section">
        <div class="container">
            <div class="learning-grid">
                <div class="learning-column">
                    <h2>Tech I'm Learning</h2>
                    <ul class="learning-list">
                        {#each techLearning as tech}
                            <li>{tech}</li>
                        {/each}
                    </ul>
                </div>
                <div class="learning-column">
                    <h2>Reading About</h2>
                    <ul class="learning-list">
                        {#each reading as topic}
                            <li>{topic}</li>
                        {/each}
                    </ul>
                </div>
            </div>
        </div>
    </section>

    <section class="links-section">
        <div class="container">
            <h2>Follow Along</h2>
            <p class="links-intro">
                Want to see what I'm actually building? Check out my work on GitHub.
            </p>
            <div class="social-links">
                <a href="https://github.com/linheriawan" target="_blank" class="social-btn github">
                    <i class="fab fa-github"></i>
                    Personal GitHub
                </a>
                <a href="https://github.com/Ak-sara" target="_blank" class="social-btn aksara">
                    <i class="fab fa-github"></i>
                    Aksara Initiative
                </a>
                <a href="https://linkedin.com/in/heriawan-agung-3b3a4969" target="_blank" class="social-btn linkedin">
                    <i class="fab fa-linkedin"></i>
                    LinkedIn
                </a>
            </div>
        </div>
    </section>
</div>

<style>
    .now-page {
        background: #f8fafc;
        min-height: 100vh;
    }

    .container {
        max-width: 900px;
        margin: 0 auto;
        padding: 0 2rem;
    }

    /* Hero Section */
    .now-hero {
        background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #3b82f6 100%);
        color: white;
        padding: 6rem 0 4rem;
        text-align: center;
    }

    .hero-badge {
        display: inline-block;
        background: rgba(251, 191, 36, 0.2);
        border: 2px solid #fbbf24;
        color: #fbbf24;
        padding: 0.5rem 1.5rem;
        border-radius: 50px;
        font-size: 0.9rem;
        font-weight: 600;
        margin-bottom: 1.5rem;
    }

    .now-hero h1 {
        font-size: 3rem;
        font-weight: 800;
        margin-bottom: 1.5rem;
    }

    .subtitle {
        font-size: 1.25rem;
        line-height: 1.8;
        margin-bottom: 1.5rem;
        opacity: 0.95;
    }

    .now-link {
        color: #93c5fd;
        font-weight: 600;
        text-decoration: underline;
        transition: color 0.2s;
    }

    .now-link:hover {
        color: white;
    }

    .honesty-note {
        font-size: 1.125rem;
        line-height: 1.8;
        background: rgba(255, 255, 255, 0.1);
        padding: 1.5rem;
        border-radius: 12px;
        border-left: 4px solid #93c5fd;
        margin-top: 2rem;
        font-style: italic;
    }

    /* Focus Section */
    .focus-section {
        padding: 5rem 0;
    }

    .focus-section h2 {
        font-size: 2.5rem;
        font-weight: 700;
        text-align: center;
        color: #1e3a8a;
        margin-bottom: 3rem;
    }

    .focus-grid {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    .focus-card {
        background: white;
        border-radius: 16px;
        padding: 2rem;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        display: flex;
        gap: 1.5rem;
        transition: all 0.3s ease;
    }

    .focus-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
    }

    .focus-icon {
        font-size: 3rem;
        flex-shrink: 0;
    }

    .focus-content h3 {
        font-size: 1.5rem;
        font-weight: 700;
        color: #1e3a8a;
        margin-bottom: 0.75rem;
    }

    .focus-content p {
        color: #64748b;
        line-height: 1.7;
        margin-bottom: 1rem;
    }

    .focus-links {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        margin-top: 1rem;
    }

    .focus-link {
        color: #3b82f6;
        text-decoration: none;
        font-weight: 600;
        font-size: 0.95rem;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        transition: color 0.2s;
    }

    .focus-link:hover {
        color: #1e40af;
    }

    .focus-link i {
        font-size: 0.85rem;
    }

    /* Learning Section */
    .learning-section {
        padding: 5rem 0;
        background: white;
    }

    .learning-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 3rem;
    }

    .learning-column h2 {
        font-size: 2rem;
        font-weight: 700;
        color: #1e3a8a;
        margin-bottom: 1.5rem;
    }

    .learning-list {
        list-style: none;
        padding: 0;
        margin: 0;
    }

    .learning-list li {
        padding: 0.75rem 0;
        color: #64748b;
        font-size: 1.05rem;
        border-bottom: 1px solid #e2e8f0;
        position: relative;
        padding-left: 2rem;
    }

    .learning-list li::before {
        content: '→';
        position: absolute;
        left: 0;
        color: #3b82f6;
        font-weight: 700;
    }

    .learning-list li:last-child {
        border-bottom: none;
    }

    /* Links Section */
    .links-section {
        padding: 5rem 0;
        text-align: center;
    }

    .links-section h2 {
        font-size: 2.5rem;
        font-weight: 700;
        color: #1e3a8a;
        margin-bottom: 1rem;
    }

    .links-intro {
        font-size: 1.25rem;
        color: #64748b;
        margin-bottom: 2rem;
    }

    .social-links {
        display: flex;
        gap: 1rem;
        justify-content: center;
        flex-wrap: wrap;
    }

    .social-btn {
        padding: 1rem 2rem;
        border-radius: 12px;
        text-decoration: none;
        font-weight: 600;
        display: inline-flex;
        align-items: center;
        gap: 0.75rem;
        transition: all 0.3s ease;
        font-size: 1rem;
    }

    .social-btn i {
        font-size: 1.25rem;
    }

    .social-btn.github {
        background: #24292e;
        color: white;
    }

    .social-btn.github:hover {
        background: #1a1e22;
        transform: translateY(-2px);
        box-shadow: 0 8px 16px rgba(36, 41, 46, 0.3);
    }

    .social-btn.aksara {
        background: #667eea;
        color: white;
    }

    .social-btn.aksara:hover {
        background: #5568d3;
        transform: translateY(-2px);
        box-shadow: 0 8px 16px rgba(102, 126, 234, 0.3);
    }

    .social-btn.linkedin {
        background: #0077b5;
        color: white;
    }

    .social-btn.linkedin:hover {
        background: #006399;
        transform: translateY(-2px);
        box-shadow: 0 8px 16px rgba(0, 119, 181, 0.3);
    }

    /* Mobile Responsive */
    @media (max-width: 768px) {
        .now-hero h1 {
            font-size: 2rem;
        }

        .subtitle {
            font-size: 1.125rem;
        }

        .focus-card {
            flex-direction: column;
            text-align: center;
        }

        .focus-icon {
            font-size: 2.5rem;
        }

        .learning-grid {
            grid-template-columns: 1fr;
        }

        .social-links {
            flex-direction: column;
        }

        .social-btn {
            width: 100%;
            justify-content: center;
        }
    }
</style>
