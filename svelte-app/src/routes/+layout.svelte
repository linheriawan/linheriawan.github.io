<script>
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import { browser } from '$app/environment';

    // Function for smooth scrolling
    const smoothScrollTo = (id) => {
        if (browser) {
            const element = document.getElementById(id);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        }
    };

    // Handle navigation
    const navigate = (url) => {
        if (url.startsWith('#')) {
            const id = url.substring(1);
            smoothScrollTo(id);
        } else {
            goto(url);
        }
    };

    onMount(() => {
        // Add event listeners for anchor links
        const handleClick = (e) => {
            const href = e.target.getAttribute('href');
            if (href?.startsWith('#')) {
                e.preventDefault();
                navigate(href);
            }
        };

        const anchors = document.querySelectorAll('a[href^="#"]');
        anchors.forEach(anchor => anchor.addEventListener('click', handleClick));

        return () => {
            anchors.forEach(anchor => anchor.removeEventListener('click', handleClick));
        };
    });
</script>

<div class="t-hm bg-blue-900 text-white">
    <header class="bg-blue-800 grid grid-cols-1 md:grid-cols-2 py-1 px-3">
        <a href="/" class="flex items-center gap-2" on:click|preventDefault={() => navigate('/')}>
            <img src="/cofee.jpeg" class="h-7 bg-clip-content rounded-full">
            [Heriawan]
        </a>
        <ul class="flex items-center justify-between md:justify-around gap-y-2">
            <li><a class="btn-hf" href="/" on:click|preventDefault={() => navigate('/')}>Home</a></li>
            <li><a class="btn-hf" href="#projects" on:click|preventDefault={() => navigate('#projects')}>Projects</a></li>
            <li><a class="btn-hf" href="/about" on:click|preventDefault={() => navigate('/about')}>About</a></li>
            <li><a class="btn-hf" href="/now" on:click|preventDefault={() => navigate('/now')}>Now</a></li>
            <li><a class="btn-hf" href="https://ak-sara.github.io" target="_blank">Aksara Initiative</a></li>
        </ul>
    </header>
    
    <main class="h-full overflow-scroll">
        <slot />
        
        <footer class="bg-blue-900 flex md:flex-row flex-col justify-between gap-2 p-3">
            <div class="grid grid-rows-1 gap-2">
                <a class="btn-hf" href="/about" on:click|preventDefault={() => navigate('/about')}>About</a>
            </div>
            <div class="grid grid-rows-1 gap-2">
                <a class="btn-hf" href="https://github.com/linheriawan" target="_blank">Github</a>
            </div>
            <div class="grid grid-rows-1 gap-2">
                <a class="btn-hf" href="#top" on:click|preventDefault={() => smoothScrollTo('top')}>Back to top</a>
            </div>
        </footer>    
    </main>
</div>

<style>
    .t-hm {
        display: grid;
        grid-template-rows: auto minmax(0, 1fr);
    }

    .stroke-black {
        -webkit-text-stroke: 1px black;
    }

    section {
        align-items: center;
        display: flex;
        -ms-flex-align: center;
        flex-wrap: wrap;
        margin: 0;
        padding: 15px;
        position: relative;
        width: 100%
    }

    section .content {
        width: 100vw;
    }

    .content--big {
        min-height: 175vh
    }

    .content--full {
        min-height: 100vh
    }

    .content--small {
        min-height: 40vh
    }

    .prlx__cont {
        clip: rect(0, auto, auto, 0);
        height: 100%;
        left: 0;
        overflow: hidden;
        position: absolute;
        top: 0;
        width: 100%;
        z-index: -100
    }

    .prlx__cont .prlx {
        position: fixed;
        top: 0;
        transform: translate3d(0, 0, 0);
        transform-style: preserve-3d;
        width: 100%;
        background-position: center;
        background-repeat: no-repeat;
        background-size: cover;
    }

    .btn-hf {
        height: fit-content;
        width: 100%;
        cursor: pointer;
        background-color: transparent;
        text-align: center;
        border-radius: 0.375rem;
        padding-top: 4px;
        padding-bottom: 4px;
        padding-left: 8px;
        padding-right: 8px;
        font-weight: 600;
        color: white;
    }

    .btn-hf:hover {
        background-color: #1d4ed8;
    }
</style>