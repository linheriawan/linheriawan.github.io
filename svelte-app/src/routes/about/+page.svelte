<script>
    const experiences = [
        { period: 'Present', title: 'Full-Stack Developer', desc: 'Building web applications with PHP & JavaScript' },
        { period: 'Always', title: 'Linux Tinkerer', desc: 'Customizing distros for SBCs & embedded systems' },
        { period: 'Ongoing', title: 'DIY Maker', desc: 'Creating instruments and electronics from scratch' }
    ];

    const techStack = {
        'Languages': ['PHP', 'Python', 'JavaScript', 'Rust', 'C++'],
        'Frameworks': ['Slim PHP', 'Flask', 'SvelteKit'],
        'Game Dev': ['Godot', 'Blender', 'GDScript'],
        'Systems': ['Linux', 'Docker', 'Nginx', 'MySQL'],
        'Hardware': ['ESP32', 'Arduino', 'IoT Sensors']
    };
</script>

<div class="about-page">
    <section class="about-hero">
        <div class="container">
            <div class="hero-grid">
                <div class="hero-text">
                    <h1>About Me</h1>
                    <p class="tagline">Developer, Tinkerer, Coffee Enthusiast</p>
                    <p class="intro">
                        I'm Heriawan, a full-stack developer from Indonesia who loves building practical software,
                        experimenting with Linux on SBCs, and creating DIY instruments in my spare time.
                    </p>
                    <p class="intro">
                        My approach is simple: build things that work, keep experimenting, and don't take it too seriously.
                        Whether it's a web application, a custom Linux distro, or an electric guitar made from scratch,
                        I'm always tinkering with something new.
                    </p>
                    <p class="intro highlight-text">
                        I'm also the founder of the <a href="https://ak-sara.github.io" target="_blank" class="aksara-link-inline">Aksara Initiative</a>,
                        an open-source project focused on Indonesian digital literacy through tools like Aksara IS (no-code app builder),
                        Aksara Writer (document converter), and MerdekaOS (Indonesian Linux distro).
                    </p>
                </div>
                <div class="hero-image">
                    <img src="/cofee.jpeg" alt="Coffee fueled coding" class="profile-image">
                </div>
            </div>
        </div>
    </section>

    <section class="experience-section">
        <div class="container">
            <h2>What I Do</h2>
            <div class="experience-grid">
                {#each experiences as exp}
                    <div class="experience-card">
                        <div class="exp-period">{exp.period}</div>
                        <h3>{exp.title}</h3>
                        <p>{exp.desc}</p>
                    </div>
                {/each}
            </div>
        </div>
    </section>

    <section class="tech-section">
        <div class="container">
            <h2>Tech Stack</h2>
            <div class="tech-categories">
                {#each Object.entries(techStack) as [category, items]}
                    <div class="tech-category">
                        <h3>{category}</h3>
                        <div class="tech-items">
                            {#each items as item}
                                <span class="tech-item">{item}</span>
                            {/each}
                        </div>
                    </div>
                {/each}
            </div>
        </div>
    </section>

    <section class="contact-section">
        <div class="container">
            <h2>Get In Touch</h2>
            <p class="contact-text">
                Always open to interesting projects, collaborations, or just a chat about tech.
            </p>
            <div class="contact-links">
                <a href="https://github.com/linheriawan" target="_blank" class="contact-btn">
                    GitHub
                </a>
                <a href="https://linkedin.com/in/heriawan-agung-3b3a4969" target="_blank" class="contact-btn">
                    LinkedIn
                </a>
            </div>
        </div>
    </section>
</div>

<style>
    .about-page {
        background: #f8fafc;
        min-height: 100vh;
    }

    .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 2rem;
    }

    .about-hero {
        background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #3b82f6 100%);
        color: white;
        padding: 6rem 0;
    }

    .hero-grid {
        display: grid;
        grid-template-columns: 2fr 1fr;
        gap: 4rem;
        align-items: center;
    }

    .hero-text h1 {
        font-size: 3rem;
        font-weight: 800;
        margin-bottom: 1rem;
    }

    .tagline {
        font-size: 1.5rem;
        color: #93c5fd;
        margin-bottom: 2rem;
    }

    .intro {
        font-size: 1.125rem;
        line-height: 1.8;
        color: #dbeafe;
        margin-bottom: 1.5rem;
    }

    .highlight-text {
        background: rgba(251, 191, 36, 0.2);
        padding: 1rem;
        border-radius: 12px;
        border-left: 4px solid #fbbf24;
    }

    .aksara-link-inline {
        color: #fbbf24;
        font-weight: 700;
        text-decoration: underline;
        transition: color 0.2s ease;
    }

    .aksara-link-inline:hover {
        color: #f59e0b;
    }

    .profile-image {
        width: 100%;
        border-radius: 50%;
        border: 8px solid rgba(255, 255, 255, 0.2);
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    }

    .experience-section {
        padding: 5rem 0;
    }

    .experience-section h2 {
        font-size: 2.5rem;
        font-weight: 700;
        text-align: center;
        color: #1e3a8a;
        margin-bottom: 3rem;
    }

    .experience-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 2rem;
    }

    .experience-card {
        background: white;
        padding: 2rem;
        border-radius: 16px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        transition: all 0.3s ease;
    }

    .experience-card:hover {
        transform: translateY(-8px);
        box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
    }

    .exp-period {
        background: #3b82f6;
        color: white;
        display: inline-block;
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        font-size: 0.875rem;
        font-weight: 600;
        margin-bottom: 1rem;
    }

    .experience-card h3 {
        font-size: 1.5rem;
        font-weight: 700;
        color: #1e3a8a;
        margin-bottom: 0.5rem;
    }

    .experience-card p {
        color: #64748b;
        line-height: 1.6;
    }

    .tech-section {
        padding: 5rem 0;
        background: white;
    }

    .tech-section h2 {
        font-size: 2.5rem;
        font-weight: 700;
        text-align: center;
        color: #1e3a8a;
        margin-bottom: 3rem;
    }

    .tech-categories {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 2rem;
    }

    .tech-category h3 {
        font-size: 1.25rem;
        font-weight: 700;
        color: #1e40af;
        margin-bottom: 1rem;
    }

    .tech-items {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
    }

    .tech-item {
        background: #dbeafe;
        color: #1e40af;
        padding: 0.5rem 1rem;
        border-radius: 8px;
        font-size: 0.9rem;
        font-weight: 500;
    }

    .contact-section {
        padding: 5rem 0;
        text-align: center;
    }

    .contact-section h2 {
        font-size: 2.5rem;
        font-weight: 700;
        color: #1e3a8a;
        margin-bottom: 1rem;
    }

    .contact-text {
        font-size: 1.25rem;
        color: #64748b;
        margin-bottom: 2rem;
    }

    .contact-links {
        display: flex;
        gap: 1rem;
        justify-content: center;
        flex-wrap: wrap;
    }

    .contact-btn {
        padding: 1rem 2rem;
        background: #1e3a8a;
        color: white;
        text-decoration: none;
        border-radius: 12px;
        font-weight: 600;
        transition: all 0.3s ease;
    }

    .contact-btn:hover {
        background: #1e40af;
        transform: translateY(-2px);
        box-shadow: 0 8px 16px rgba(30, 58, 138, 0.3);
    }

    @media (max-width: 768px) {
        .hero-grid {
            grid-template-columns: 1fr;
            text-align: center;
        }

        .experience-grid {
            grid-template-columns: 1fr;
        }

        .tech-categories {
            grid-template-columns: 1fr;
        }
    }
</style>
