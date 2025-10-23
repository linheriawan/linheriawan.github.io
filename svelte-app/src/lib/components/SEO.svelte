<script>
    export let title = "Heriawan - Full-Stack Developer & Open Source Builder";
    export let description = "Full-stack developer building web applications with PHP & JavaScript, tinkering with Linux on SBCs, and exploring game development with Godot & Blender. Always learning.";
    export let url = "https://linheriawan.github.io";
    export let image = "https://linheriawan.github.io/cofee.jpeg";
    export let type = "website";
</script>

<svelte:head>
    <!-- Primary Meta Tags -->
    <title>{title}</title>
    <meta name="title" content={title} />
    <meta name="description" content={description} />

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content={type} />
    <meta property="og:url" content={url} />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:image" content={image} />
    <meta property="og:site_name" content="Heriawan's Portfolio" />

    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image" />
    <meta property="twitter:url" content={url} />
    <meta property="twitter:title" content={title} />
    <meta property="twitter:description" content={description} />
    <meta property="twitter:image" content={image} />

    <!-- Additional Meta -->
    <meta name="author" content="Heriawan" />
    <meta name="keywords" content="full-stack developer, PHP, JavaScript, SvelteKit, Linux, Godot, Blender, ESP32, Indonesia" />
</svelte:head>
