<script>
    import { onMount } from 'svelte';
    import SEO from '$lib/components/SEO.svelte';

    const skills = [
        { icon: '🚀', name: 'Aksara Initiative', desc: 'Indonesian Digital Literacy' },
        { icon: '🎮', name: 'Game Dev', desc: 'Godot & Blender Learning' },
        { icon: '🐧', name: 'Linux Tinkerer', desc: 'SBC & Custom Distros' },
        { icon: '⚡', name: 'Web Dev', desc: 'Slim PHP, Flask, SvelteKit' }
    ];

    const personalProjects = [
        {
            title: 'Aksara Initiative',
            badge: 'Current Focus',
            desc: 'Building Indonesian digital literacy tools - Aksara IS, Aksara Writer, and MerdekaOS',
            tech: ['SvelteKit', 'Rust', 'Linux'],
            github: 'https://github.com/Ak-sara'
        },
        {
            title: 'Game Dev Experiments',
            badge: 'Learning',
            desc: 'Exploring game development with Godot and creating 3D models in Blender',
            tech: ['Godot', 'Blender', 'GDScript'],
            github: 'https://github.com/linheriawan'
        },
        {
            title: 'ESP32 IoT Projects',
            badge: 'Active',
            desc: 'Exploring ESP32 microcontroller for IoT devices, sensors, and embedded systems',
            tech: ['ESP32', 'C++', 'Arduino'],
            github: 'https://github.com/linheriawan'
        },
        {
            title: 'DIY Instruments',
            badge: 'Hobby',
            desc: 'Building electric guitars and string instruments from scratch with custom electronics',
            tech: ['Electronics', 'Woodwork', 'Audio'],
            github: 'https://github.com/linheriawan'
        }
    ];

    onMount(() => {
        // Professional parallax implementation
        const parallaxElements = document.querySelectorAll('.prlx');

        parallaxElements.forEach(el => {
            const imgSrc = el.getAttribute('data-img-src');
            if (imgSrc) {
                el.style.backgroundImage = `url('${imgSrc}')`;
                el.style.backgroundRepeat = 'no-repeat';
                el.style.backgroundPosition = 'center';
                el.style.backgroundSize = 'cover';
                el.style.height = '100%';
            }
        });

        const handleScroll = () => {
            const scrolled = window.pageYOffset;
            parallaxElements.forEach(el => {
                const speed = parseFloat(el.getAttribute('data-speed')) || 3;
                const yPos = -(scrolled / speed);
                el.style.transform = `translate3d(0, ${yPos}px, 0)`;
            });
        };

        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    });
</script>

<SEO />

<!-- Hero Section -->
<section id="top" class="hero-section">
    <div class="hero-content">
        <div class="hero-text">
            <h1 class="hero-title">
                Hi, I'm <span class="text-gradient">Heriawan</span>
            </h1>
            <p class="hero-subtitle">
                Full-Stack Developer • Open Source Builder • Lifelong Learner
            </p>
            <p class="hero-description">
                I build web applications with PHP and JavaScript, tinker with Linux on SBCs,
                and explore game development with Godot & Blender in my spare time.
                Also working on the <span class="highlight">Aksara Initiative</span> - tools for Indonesian digital literacy.
            </p>
            <p class="hero-note">
                Always experimenting. Always learning. Fueled by coffee.
            </p>
            <div class="hero-cta">
                <a href="#projects" class="cta-button primary">See Projects</a>
                <a href="/now" class="cta-button secondary">What I'm Doing Now</a>
            </div>
        </div>
        <div class="hero-image">
            <img src="/PnM.png" alt="Pome and Milk Logo" class="floating-image">
        </div>
    </div>
</section>

<!-- Skills Showcase -->
<section class="skills-section">
    <h2 class="section-title">What I Do</h2>
    <div class="skills-grid">
        {#each skills as skill}
            <div class="skill-card">
                <div class="skill-icon">{skill.icon}</div>
                <h3 class="skill-name">{skill.name}</h3>
                <p class="skill-desc">{skill.desc}</p>
            </div>
        {/each}
    </div>
</section>

<!-- Personal Projects with Parallax -->
<section id="projects" class="parallax-section">
    <div class="prlx__cont">
        <div class="prlx" data-img-src="/coffeecigs.jpg" data-speed="3"></div>
    </div>
    <div class="section-overlay">
        <h2 class="section-title-light">💼 Personal Projects</h2>
        <p class="section-subtitle-light">Side projects, experiments, and things I build for fun</p>
        <div class="project-cards">
            {#each personalProjects as project}
                <div class="project-card modern">
                    <div class="project-header">
                        <h3>{project.title}</h3>
                        <span class="project-badge">{project.badge}</span>
                    </div>
                    <p class="project-description">{project.desc}</p>
                    <div class="project-tech">
                        {#each project.tech as tech}
                            <span class="tech-tag">{tech}</span>
                        {/each}
                    </div>
                    <div class="project-links">
                        <a href={project.github} target="_blank" class="project-link">
                            <span>🔗 GitHub</span>
                        </a>
                    </div>
                </div>
            {/each}
        </div>

        <!-- Aksara Initiative Callout -->
        <div class="aksara-callout">
            <div class="callout-content">
                <h3>🚀 The Aksara Initiative</h3>
                <p>
                    I'm also building something bigger - the <strong>Aksara Initiative</strong>,
                    a collection of open-source projects aimed at Indonesian digital literacy.
                    This includes <strong>Aksara IS</strong> (no-code app builder),
                    <strong>Aksara Writer</strong> (document converter), and <strong>MerdekaOS</strong> (Indonesian Linux distro).
                </p>
                <a href="https://ak-sara.github.io" target="_blank" class="aksara-link">
                    Visit Aksara Initiative →
                </a>
            </div>
        </div>
    </div>
</section>

<!-- Linux & IoT with Parallax -->
<section class="parallax-section dark">
    <div class="prlx__cont">
        <div class="prlx" data-img-src="/ny.jpg" data-speed="3"></div>
    </div>
    <div class="section-overlay">
        <h2 class="section-title-light">🐧 Linux & IoT Exploration</h2>
        <p class="section-subtitle-light">Custom distros & embedded systems experimentation</p>
        <div class="appliance-content">
            <div class="appliance-text">
                <div class="feature-box">
                    <h3>MerdekaOS & ESP32 Tinkering</h3>
                    <p>
                        Through the Aksara Initiative, I'm building <strong>MerdekaOS</strong> - a custom Linux distribution
                        focused on Indonesian users, combining lightweight efficiency with local language support.
                    </p>
                    <p class="mt-3">
                        Alongside that, I explore ESP32 microcontrollers for IoT projects - from sensors to
                        embedded systems. The quest is always about learning, experimenting, and creating
                        something useful (or at least interesting).
                    </p>
                    <div class="tech-highlights">
                        <span class="highlight-item">🖥️ MerdekaOS</span>
                        <span class="highlight-item">📡 ESP32</span>
                        <span class="highlight-item">🔧 Arduino</span>
                        <span class="highlight-item">⚙️ IoT Sensors</span>
                    </div>
                </div>
            </div>
            <div class="appliance-image">
                <img src="/melon.png" alt="MerdekaOS & ESP32" class="device-image">
            </div>
        </div>
    </div>
</section>

<!-- DIY Weird Projects -->
<section class="weird-section">
    <h2 class="section-title-dark">🎨 The Weird & Wonderful</h2>
    

    <div class="weird-showcase">
        <div class="weird-hero">
            <img src="/toronto.jpg" alt="DIY Projects" class="weird-hero-image">
        </div>
        <p class="section-subtitle-dark">"If there's nothing to innovate, then... just make it look like it is"</p>

        <div class="weird-projects">
            <div class="weird-card">
                <div class="weird-icon">🎸</div>
                <h3>Electric String Instruments</h3>
                <p>DIY electric guitar, violin, and cello - from scratch with custom pickups and electronics</p>
                <div class="weird-tags">
                    <span>Electronics</span>
                    <span>Woodworking</span>
                    <span>Audio</span>
                </div>
                <div class="project-links">
                    <a href="https://github.com/linheriawan" target="_blank" class="project-link small">
                        View on GitHub
                    </a>
                </div>
            </div>

            <div class="weird-card">
                <div class="weird-icon">🎼</div>
                <h3>Acoustic Guitar</h3>
                <p>Classical guitar built from carefully selected wood, crafted by hand for perfect resonance</p>
                <div class="weird-tags">
                    <span>Woodcraft</span>
                    <span>Traditional</span>
                    <span>Handmade</span>
                </div>
                <div class="project-links">
                    <a href="https://github.com/linheriawan" target="_blank" class="project-link small">
                        View on GitHub
                    </a>
                </div>
            </div>
        </div>
    </div>
</section>

<style>
    /* Hero Section */
    .hero-section {
        min-height: 90vh;
        background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #3b82f6 100%);
        display: flex;
        align-items: center;
        padding: 4rem 2rem;
        position: relative;
        overflow: hidden;
    }

    .hero-content {
        max-width: 1200px;
        margin: 0 auto;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 4rem;
        align-items: center;
        z-index: 1;
    }

    .hero-title {
        font-size: clamp(2.5rem, 5vw, 4rem);
        font-weight: 800;
        color: white;
        margin-bottom: 1rem;
        line-height: 1.1;
    }

    .text-gradient {
        background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }

    .hero-subtitle {
        font-size: 1.5rem;
        color: #93c5fd;
        margin-bottom: 1.5rem;
        font-weight: 500;
    }

    .hero-description {
        font-size: 1.125rem;
        color: #dbeafe;
        line-height: 1.8;
        margin-bottom: 1rem;
    }

    .hero-note {
        font-size: 1rem;
        color: #93c5fd;
        font-style: italic;
        margin-bottom: 2rem;
        opacity: 0.9;
    }

    .highlight {
        color: #fbbf24;
        font-weight: 600;
    }

    .pnm-brand {
        font-size: 1.4em;
        font-weight: 700;
        color: #f59e0b;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
    }

    .hero-cta {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
    }

    .cta-button {
        padding: 1rem 2rem;
        border-radius: 12px;
        font-weight: 600;
        text-decoration: none;
        transition: all 0.3s ease;
        display: inline-block;
    }

    .cta-button.primary {
        background: #fbbf24;
        color: #1e3a8a;
        box-shadow: 0 4px 15px rgba(251, 191, 36, 0.3);
    }

    .cta-button.primary:hover {
        background: #f59e0b;
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(251, 191, 36, 0.4);
    }

    .cta-button.secondary {
        background: rgba(255, 255, 255, 0.1);
        color: white;
        border: 2px solid rgba(255, 255, 255, 0.3);
        backdrop-filter: blur(10px);
    }

    .cta-button.secondary:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: translateY(-2px);
    }

    .hero-image {
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .floating-image {
        max-width: 100%;
        height: auto;
        animation: float 3s ease-in-out infinite;
        filter: drop-shadow(0 10px 30px rgba(0, 0, 0, 0.3));
    }

    @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-20px); }
    }

    /* Skills Section */
    .skills-section {
        padding: 5rem 2rem;
        background: #f8fafc;
    }

    .section-title {
        font-size: 2.5rem;
        font-weight: 700;
        text-align: center;
        margin-bottom: 3rem;
        color: #1e3a8a;
    }

    .skills-grid {
        max-width: 1000px;
        margin: 0 auto;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 2rem;
    }

    .skill-card {
        background: white;
        padding: 2rem;
        border-radius: 16px;
        text-align: center;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        transition: all 0.3s ease;
    }

    .skill-card:hover {
        transform: translateY(-8px);
        box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
    }

    .skill-icon {
        font-size: 3rem;
        margin-bottom: 1rem;
    }

    .skill-name {
        font-size: 1.25rem;
        font-weight: 600;
        color: #1e3a8a;
        margin-bottom: 0.5rem;
    }

    .skill-desc {
        color: #64748b;
        font-size: 0.95rem;
    }

    /* Parallax Sections */
    .parallax-section {
        min-height: 100vh;
        position: relative;
        display: flex;
        align-items: center;
        padding: 4rem 2rem;
    }

    .section-overlay {
        position: relative;
        z-index: 10;
        max-width: 1200px;
        margin: 0 auto;
        width: 100%;
    }

    .section-title-light {
        font-size: clamp(2rem, 4vw, 3rem);
        font-weight: 700;
        color: white;
        text-align: center;
        margin-bottom: 1rem;
        text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.5);
    }

    .section-subtitle-light {
        font-size: 1.25rem;
        color: #dbeafe;
        text-align: center;
        margin-bottom: 3rem;
        text-shadow: 1px 1px 4px rgba(0, 0, 0, 0.5);
    }

    /* Project Cards */
    .project-cards {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 2rem;
    }

    .project-card.modern {
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        border-radius: 16px;
        padding: 2rem;
        transition: all 0.3s ease;
    }

    .project-card.modern:hover {
        transform: translateY(-8px);
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
    }

    .project-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
    }

    .project-header h3 {
        font-size: 1.5rem;
        font-weight: 700;
        color: #1e3a8a;
    }

    .project-badge {
        background: #3b82f6;
        color: white;
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 600;
    }

    .project-description {
        color: #475569;
        line-height: 1.6;
        margin-bottom: 1.5rem;
    }

    .project-tech {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-bottom: 1.5rem;
    }

    .tech-tag {
        background: #dbeafe;
        color: #1e40af;
        padding: 0.25rem 0.75rem;
        border-radius: 8px;
        font-size: 0.85rem;
        font-weight: 500;
    }

    .project-links {
        display: flex;
        gap: 1rem;
    }

    .project-link {
        flex: 1;
        padding: 0.75rem 1rem;
        background: #1e3a8a;
        color: white;
        text-align: center;
        border-radius: 8px;
        text-decoration: none;
        font-weight: 600;
        transition: all 0.2s ease;
    }

    .project-link:hover {
        background: #1e40af;
        transform: scale(1.05);
    }

    .project-link.small {
        padding: 0.5rem 1rem;
        font-size: 0.9rem;
    }

    /* Appliance Content */
    .appliance-content {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 3rem;
        align-items: center;
    }

    .feature-box {
        background: rgba(255, 255, 255, 0.95);
        border-radius: 16px;
        padding: 2.5rem;
    }

    .feature-box h3 {
        font-size: 2rem;
        font-weight: 700;
        color: #1e3a8a;
        margin-bottom: 1.5rem;
    }

    .feature-box p {
        color: #475569;
        line-height: 1.8;
        margin-bottom: 1rem;
    }

    .mt-3 {
        margin-top: 1rem;
    }

    .tech-highlights {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        margin-top: 2rem;
    }

    .highlight-item {
        background: #3b82f6;
        color: white;
        padding: 0.5rem 1rem;
        border-radius: 20px;
        font-size: 0.9rem;
        font-weight: 600;
    }

    .device-image {
        width: 100%;
        height: auto;
        border-radius: 16px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    }

    /* Weird Section */
    .weird-section {
        padding: 5rem 2rem;
        background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
    }

    .section-title-dark {
        font-size: 2.5rem;
        font-weight: 700;
        text-align: center;
        color: #1e3a8a;
        margin-bottom: 1rem;
    }

    .section-subtitle-dark {
        font-size: 1.25rem;
        text-align: center;
        color: #475569;
        margin-bottom: 3rem;
        font-style: italic;
    }

    .weird-showcase {
        max-width: 1200px;
        margin: 0 auto;
    }

    .weird-hero {
        margin-bottom: 3rem;
        border-radius: 24px;
        overflow: hidden;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
    }

    .weird-hero-image {
        width: 100%;
        height: auto;
        display: block;
    }

    .weird-projects {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 2rem;
    }

    .weird-card {
        background: white;
        border-radius: 16px;
        padding: 2rem;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        transition: all 0.3s ease;
    }

    .weird-card:hover {
        transform: translateY(-8px);
        box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
    }

    .weird-icon {
        font-size: 3rem;
        margin-bottom: 1rem;
    }

    .weird-card h3 {
        font-size: 1.5rem;
        font-weight: 700;
        color: #1e3a8a;
        margin-bottom: 1rem;
    }

    .weird-card p {
        color: #475569;
        line-height: 1.6;
        margin-bottom: 1.5rem;
    }

    .weird-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-bottom: 1.5rem;
    }

    .weird-tags span {
        background: #dbeafe;
        color: #1e40af;
        padding: 0.25rem 0.75rem;
        border-radius: 8px;
        font-size: 0.85rem;
        font-weight: 500;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
        .hero-content {
            grid-template-columns: 1fr;
            gap: 2rem;
            text-align: center;
        }

        .hero-cta {
            justify-content: center;
        }

        .appliance-content {
            grid-template-columns: 1fr;
        }

        .project-cards {
            grid-template-columns: 1fr;
        }

        .weird-projects {
            grid-template-columns: 1fr;
        }

        .skills-grid {
            grid-template-columns: 1fr 1fr;
        }
    }

    @media (max-width: 480px) {
        .skills-grid {
            grid-template-columns: 1fr;
        }
    }
    /* Aksara Callout */
    .aksara-callout {
        margin-top: 4rem;
        padding: 3rem;
        background: linear-gradient(135deg, rgba(251, 191, 36, 0.95), rgba(245, 158, 11, 0.95));
        border-radius: 24px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        text-align: center;
    }

    .callout-content h3 {
        font-size: 2rem;
        font-weight: 700;
        color: #1e3a8a;
        margin-bottom: 1.5rem;
    }

    .callout-content p {
        font-size: 1.125rem;
        color: #1e3a8a;
        line-height: 1.8;
        max-width: 800px;
        margin: 0 auto 2rem;
    }

    .aksara-link {
        display: inline-block;
        padding: 1rem 2.5rem;
        background: #1e3a8a;
        color: white;
        text-decoration: none;
        border-radius: 12px;
        font-weight: 700;
        font-size: 1.125rem;
        transition: all 0.3s ease;
        box-shadow: 0 4px 15px rgba(30, 58, 138, 0.3);
    }

    .aksara-link:hover {
        background: #1e40af;
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(30, 58, 138, 0.4);
    }
</style>
