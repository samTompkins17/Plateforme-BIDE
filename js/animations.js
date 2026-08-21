/* =========================
   TYPEWRITER ANIMATION
   Hero text typewriter effect
========================= */

document.addEventListener('DOMContentLoaded', () => {

    // =========================
    // Typewriter – hero text animation
    // =========================
    const typewriterEl = document.querySelector('.hero-typewriter');

    if (!typewriterEl) return;

    const text = typewriterEl.getAttribute('data-text') || '';
    const textSpan = typewriterEl.querySelector('.typewriter-text');

    // Inject styles: cursor blink + responsive typewriter
    const style = document.createElement('style');
    style.textContent = `
        @keyframes cursorBlink {
            0%, 100% { opacity: 1; }
            50%      { opacity: 0; }
        }

        .hero-typewriter {
            display: inline-block;
            max-width: 100%;
        }

        .typewriter-text {
            display: inline;
        }

        .typewriter-cursor {
            display: inline-block;
            animation: cursorBlink 0.7s step-end infinite;
            font-weight: 300;
            margin-left: 2px;
        }

        /* Tablet – beat .hero h1 specificity */
        @media (max-width: 991px) {
            .hero .hero-typewriter {
                font-size: 32px;
            }
        }

        /* Mobile */
        @media (max-width: 767px) {
            .hero .hero-typewriter {
                font-size: 24px;
                line-height: 1.2;
            }
        }

        /* Small mobile */
        @media (max-width: 400px) {
            .hero .hero-typewriter {
                font-size: 20px;
                line-height: 1.2;
            }
        }
    `;
    document.head.appendChild(style);

    // Timing constants
    const TYPING_SPEED     = 60;    // ms per character when typing
    const ERASING_SPEED    = 30;    // ms per character when erasing
    const PAUSE_AFTER_TYPE = 2500;  // pause before erasing
    const PAUSE_AFTER_ERASE = 600;  // pause before re-typing

    function typeChar(index, callback) {
        if (index <= text.length) {
            textSpan.textContent = text.slice(0, index);
            setTimeout(() => typeChar(index + 1, callback), TYPING_SPEED);
        } else if (callback) {
            callback();
        }
    }

    function eraseChar(index, callback) {
        if (index >= 0) {
            textSpan.textContent = text.slice(0, index);
            setTimeout(() => eraseChar(index - 1, callback), ERASING_SPEED);
        } else if (callback) {
            callback();
        }
    }

    function startLoop() {
        typeChar(0, () => {
            setTimeout(() => {
                eraseChar(text.length, () => {
                    setTimeout(startLoop, PAUSE_AFTER_ERASE);
                });
            }, PAUSE_AFTER_TYPE);
        });
    }

    // Kick off after a short delay so the hero is visible
    setTimeout(startLoop, 400);

});
