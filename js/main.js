/* =========================
   SCROLL REVEAL
   Cross-browser fallback for animation-timeline
========================= */

document.addEventListener("DOMContentLoaded", () => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!("IntersectionObserver" in window)) return;

    /* -----------------------------------------------
       1. Navbar – shadow on scroll
       ----------------------------------------------- */
    const navbar = document.querySelector(".navbar");
    if (navbar) {
        const SHADOW = "0 2px 20px rgba(0,0,0,0.08)";
        const onScroll = () => {
            const scrolled = window.scrollY > 30;
            navbar.style.boxShadow = scrolled ? SHADOW : "none";
            navbar.style.background = scrolled
                ? "rgba(255, 255, 255, 0.92)"
                : "rgba(255, 255, 255, 0.85)";
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        onScroll();
    }

    /* -----------------------------------------------
       1b. Nav-link active toggle + mobile close
       ----------------------------------------------- */
    const navCollapse = document.querySelector("#mainNavbar");
    if (navCollapse) {
        const navLinks = navCollapse.querySelectorAll(".nav-link");
        navLinks.forEach((link) => {
            link.addEventListener("click", () => {
                // Toggle active class
                navLinks.forEach((l) => l.classList.remove("active"));
                link.classList.add("active");
                // Close mobile menu
                if (window.innerWidth < 992) {
                    const bsCollapse = bootstrap.Collapse.getInstance(navCollapse);
                    if (bsCollapse) bsCollapse.hide();
                }
            });
        });
    }

    /* -----------------------------------------------
       2. Elements that need scroll reveal
       ----------------------------------------------- */
    const revealTargets = document.querySelectorAll(
        ".section-title, " +
        ".payment-banner, " +
        ".location-badge, " +
        ".location-section h2, " +
        ".location-section p, " +
        ".map-container, " +
        ".zones span, " +
        ".footer .col-lg-3, " +
        ".footer-bottom, " +
        ".pricing-header, " +
        ".price-card"
    );

    /* -----------------------------------------------
       3. Inject reveal styles
       ----------------------------------------------- */
    const style = document.createElement("style");
    style.textContent = `
        .sr-hidden {
            opacity: 0;
            transform: translateY(40px);
        }

        .sr-visible {
            opacity: 1 !important;
            transform: translateY(0) !important;
            transition: opacity 0.6s ease-out, transform 0.6s ease-out;
        }
    `;
    document.head.appendChild(style);

    /* -----------------------------------------------
       4. Observer
       ----------------------------------------------- */
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("sr-visible");
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );

    /* -----------------------------------------------
       5. Apply hidden state + observe
       ----------------------------------------------- */
    revealTargets.forEach((el) => {
        el.classList.add("sr-hidden");
        observer.observe(el);
    });

    /* -----------------------------------------------
       6. Stagger delays for grouped items
       ----------------------------------------------- */
    document.querySelectorAll(".zones span").forEach((span, i) => {
        span.style.transitionDelay = `${i * 0.08}s`;
    });

    document.querySelectorAll(".price-card").forEach((card, i) => {
        card.style.transitionDelay = `${i * 0.1}s`;
    });

    document.querySelectorAll(".footer .col-lg-3").forEach((col, i) => {
        col.style.transitionDelay = `${i * 0.12}s`;
    });

    /* -----------------------------------------------
       7. service-card fallback
       CSS animation-timeline: view() is Chromium-only.
       In other browsers .service-card stays at opacity:0
       because the CSS sets it directly. This observer
       catches them as a fallback.
       ----------------------------------------------- */
    const serviceCards = document.querySelectorAll(".service-card");

    serviceCards.forEach((card) => {
        // Only add if CSS scroll-driven animation didn't fire
        // (i.e. card is still invisible after a tick)
        requestAnimationFrame(() => {
            const s = getComputedStyle(card);
            if (s.opacity === "0") {
                card.classList.add("sr-hidden");
                observer.observe(card);
            }
        });
    });
});
