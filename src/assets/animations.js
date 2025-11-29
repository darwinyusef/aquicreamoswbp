export function initAnimations() {
    // Intersection Observer para animaciones al scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                // Añadir delay escalonado para múltiples elementos
                const delay = index * 100;
                setTimeout(() => {
                    entry.target.classList.add('animate-fade-in-up');
                    entry.target.style.opacity = '1';
                }, delay);
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observar todos los elementos con la clase
    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    animatedElements.forEach(el => observer.observe(el));

    // Sticky titles behavior
    const stickyTitles = document.querySelectorAll('.sticky-title');
    const stickyObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting && entry.boundingClientRect.top < 100) {
                entry.target.classList.add('stuck');
            } else {
                entry.target.classList.remove('stuck');
            }
        });
    }, {
        threshold: [0, 1],
        rootMargin: '-80px 0px 0px 0px'
    });

    stickyTitles.forEach(title => stickyObserver.observe(title));

    // Parallax suave en scroll
    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                const scrolled = window.pageYOffset;
                const parallaxElements = document.querySelectorAll('.parallax-slow');

                parallaxElements.forEach((element, index) => {
                    const speed = 0.5 + (index * 0.1);
                    const yPos = -(scrolled * speed / 10);
                    element.style.transform = `translateY(${yPos}px)`;
                });

                ticking = false;
            });
            ticking = true;
        }
    });

    // Animaciones de entrada para tarjetas y elementos
    const cardObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                const delay = index * 150;
                setTimeout(() => {
                    if (entry.target.classList.contains('card-left')) {
                        entry.target.classList.add('animate-fade-in-left');
                    } else if (entry.target.classList.contains('card-right')) {
                        entry.target.classList.add('animate-fade-in-right');
                    } else {
                        entry.target.classList.add('animate-scale-in');
                    }
                    entry.target.style.opacity = '1';
                }, delay);
                cardObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const cards = document.querySelectorAll('.card-animate');
    cards.forEach(card => cardObserver.observe(card));

    // Contador animado para números
    const animateCounter = (element) => {
        const target = parseInt(element.getAttribute('data-target'));
        const duration = 2000;
        const step = target / (duration / 16);
        let current = 0;

        const updateCounter = () => {
            current += step;
            if (current < target) {
                element.textContent = Math.floor(current);
                requestAnimationFrame(updateCounter);
            } else {
                element.textContent = target;
            }
        };

        updateCounter();
    };

    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                counterObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    const counters = document.querySelectorAll('[data-target]');
    counters.forEach(counter => counterObserver.observe(counter));

    // Smooth scroll para links internos
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const offset = 80;
                const targetPosition = target.offsetTop - offset;
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Efecto de partículas al mover el mouse (opcional, sutil)
    const createParticle = (x, y) => {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.cssText = `
      position: fixed;
      width: 4px;
      height: 4px;
      background: rgba(130, 226, 86, 0.6);
      border-radius: 50%;
      pointer-events: none;
      left: ${x}px;
      top: ${y}px;
      z-index: 9999;
      animation: particleFade 1s ease-out forwards;
    `;
        document.body.appendChild(particle);
        setTimeout(() => particle.remove(), 1000);
    };

    // Agregar keyframe para partículas
    const style = document.createElement('style');
    style.textContent = `
    @keyframes particleFade {
      0% {
        opacity: 1;
        transform: translate(0, 0) scale(1);
      }
      100% {
        opacity: 0;
        transform: translate(var(--tx, 0), var(--ty, 20px)) scale(0);
      }
    }
  `;
    document.head.appendChild(style);

    // Activar partículas solo en elementos interactivos (moderado)
    let particleTimeout;
    document.addEventListener('mousemove', (e) => {
        const isInteractive = e.target.closest('a, button, .hover-lift');
        if (isInteractive && Math.random() > 0.95) {
            clearTimeout(particleTimeout);
            particleTimeout = setTimeout(() => {
                createParticle(e.clientX, e.clientY);
            }, 50);
        }
    });
}
