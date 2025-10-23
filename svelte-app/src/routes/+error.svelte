<script>
    import { page } from '$app/stores';
</script>

<div class="error-page">
    <div class="error-container">
        <div class="error-icon">☕</div>
        <h1 class="error-code">{$page.status || 404}</h1>
        <h2 class="error-title">
            {#if $page.status === 404}
                Lost in the Code
            {:else}
                Something Broke
            {/if}
        </h2>
        <p class="error-message">
            {#if $page.status === 404}
                This page doesn't exist. Maybe grab a coffee while I build it?
            {:else}
                {$page.error?.message || 'An unexpected error occurred. Time for more coffee.'}
            {/if}
        </p>
        <div class="error-actions">
            <a href="/" class="btn-home">
                <i class="fas fa-home"></i> Back Home
            </a>
            <a href="/now" class="btn-now">
                <i class="fas fa-clock"></i> What I'm Doing Now
            </a>
            <a href="/about" class="btn-about">
                <i class="fas fa-user"></i> About Me
            </a>
        </div>
        <p class="error-note">
            Still tinkering. Still learning. Still fueled by coffee.
        </p>
    </div>
</div>

<style>
    .error-page {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #3b82f6 100%);
        color: white;
        padding: 2rem;
    }

    .error-container {
        max-width: 600px;
        text-align: center;
    }

    .error-icon {
        font-size: 6rem;
        margin-bottom: 1rem;
        animation: steam 2s ease-in-out infinite;
    }

    @keyframes steam {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
    }

    .error-code {
        font-size: 8rem;
        font-weight: 900;
        margin: 0;
        line-height: 1;
        text-shadow: 4px 4px 8px rgba(0, 0, 0, 0.3);
        background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }

    .error-title {
        font-size: 2.5rem;
        font-weight: 700;
        margin: 1rem 0;
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
    }

    .error-message {
        font-size: 1.25rem;
        line-height: 1.6;
        margin: 1.5rem 0;
        opacity: 0.95;
    }

    .error-actions {
        display: flex;
        gap: 1rem;
        justify-content: center;
        flex-wrap: wrap;
        margin: 2rem 0;
    }

    .error-actions a {
        padding: 0.875rem 1.75rem;
        border-radius: 12px;
        text-decoration: none;
        font-weight: 600;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        transition: all 0.3s ease;
        font-size: 1rem;
    }

    .btn-home {
        background: white;
        color: #1e3a8a;
    }

    .btn-home:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(255, 255, 255, 0.3);
    }

    .btn-now {
        background: rgba(255, 255, 255, 0.2);
        color: white;
        border: 2px solid white;
    }

    .btn-now:hover {
        background: rgba(255, 255, 255, 0.3);
    }

    .btn-about {
        background: rgba(255, 255, 255, 0.2);
        color: white;
        border: 2px solid white;
    }

    .btn-about:hover {
        background: rgba(255, 255, 255, 0.3);
    }

    .error-note {
        margin-top: 2rem;
        font-size: 1rem;
        font-style: italic;
        opacity: 0.9;
        padding: 1rem;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 8px;
    }

    @media (max-width: 768px) {
        .error-icon {
            font-size: 4rem;
        }

        .error-code {
            font-size: 5rem;
        }

        .error-title {
            font-size: 1.75rem;
        }

        .error-message {
            font-size: 1.1rem;
        }

        .error-actions {
            flex-direction: column;
        }

        .error-actions a {
            width: 100%;
            justify-content: center;
        }
    }
</style>
