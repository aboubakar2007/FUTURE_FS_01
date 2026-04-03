/**
 * Portfolio Web App
 * Main JavaScript File
 */

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────
const CONFIG = {
  // En production (Render), on utilise un chemin relatif (car le backend sert le frontend).
  // En local, on pointe vers le backend.
  API_BASE_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:3000' 
    : ''
};

// ─────────────────────────────────────────────────────────────────────────────
// DOM ELEMENTS
// ─────────────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // UI Elements
  const cursorGlow = document.getElementById('cursorGlow');
  const navHeader = document.getElementById('navHeader');
  const mobileToggle = document.getElementById('mobileToggle');
  const navLinks = document.getElementById('navLinks');
  const navCta = document.getElementById('navCta');
  const filterBtns = document.querySelectorAll('.filter-btn');
  const projects = document.querySelectorAll('.project-card');
  const footerYear = document.getElementById('footerYear');

  // Form Elements
  const contactForm = document.getElementById('contactForm');
  const messageInput = document.getElementById('message');
  const charCount = document.getElementById('charCount');
  const formStatus = document.getElementById('form-status');
  const submitBtn = document.getElementById('submitBtn');

  // Set current year in footer
  if (footerYear) {
    footerYear.textContent = new Date().getFullYear();
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CUSTOM CURSOR GLOW
  // ─────────────────────────────────────────────────────────────────────────────
  if (cursorGlow && window.matchMedia('(pointer: fine)').matches) {
    let mouseX = 0, mouseY = 0;
    let currentX = 0, currentY = 0;

    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    // Smooth following using rAF
    const animateCursor = () => {
      // Easing factor (lower = smoother but slower)
      currentX += (mouseX - currentX) * 0.1;
      currentY += (mouseY - currentY) * 0.1;

      cursorGlow.style.transform = `translate(${currentX}px, ${currentY}px)`;
      requestAnimationFrame(animateCursor);
    };

    animateCursor();

    // Hide if mouse leaves window
    document.addEventListener('mouseleave', () => {
      cursorGlow.style.opacity = '0';
    });
    document.addEventListener('mouseenter', () => {
      cursorGlow.style.opacity = '0.5';
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // NAVIGATION & STICKY HEADER
  // ─────────────────────────────────────────────────────────────────────────────
  const handleScroll = () => {
    if (window.scrollY > 50) {
      navHeader.classList.add('scrolled');
    } else {
      navHeader.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll(); // Init Check

  // Mobile Menu Toggle
  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.contains('is-open');
      if (isOpen) {
        navLinks.classList.remove('is-open');
        mobileToggle.setAttribute('aria-expanded', 'false');
      } else {
        navLinks.classList.add('is-open');
        mobileToggle.setAttribute('aria-expanded', 'true');
      }
    });

    // Close menu when clicking a link
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('is-open');
        mobileToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Active Link Highlighting using Intersection Observer
  const sections = document.querySelectorAll('section[id]');
  const navMap = new Map();
  document.querySelectorAll('.nav-link').forEach(link => {
    navMap.set(link.dataset.section, link);
  });

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Remove active from all
        navMap.forEach(link => link.classList.remove('active'));
        // Add to current
        const id = entry.target.getAttribute('id');
        if (navMap.has(id)) {
          navMap.get(id).classList.add('active');
        }
      }
    });
  }, { rootMargin: '-40% 0px -60% 0px' }); // Trigger relatively near the top

  sections.forEach(section => sectionObserver.observe(section));

  // ─────────────────────────────────────────────────────────────────────────────
  // INTERSECTION OBSERVERS (Scroll Animations)
  // ─────────────────────────────────────────────────────────────────────────────
  const animateElements = document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right');

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');

        // Target is visible, stop observing if we only want it once.
        // Uncomment below line to animate only once
        // observer.unobserve(entry.target);

        // Trigger progress bars if it's a skill card
        if (entry.target.classList.contains('skill-card')) {
          const bars = entry.target.querySelectorAll('.skill-bar-fill');
          bars.forEach(bar => bar.classList.add('animated'));
        }
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

  animateElements.forEach(el => revealObserver.observe(el));

  // ─────────────────────────────────────────────────────────────────────────────
  // ANIMATED COUNTERS (Hero Stats)
  // ─────────────────────────────────────────────────────────────────────────────
  const statElements = document.querySelectorAll('.stat-value');

  const animateValue = (obj, start, end, duration) => {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Ease out quad
      const easeOut = progress * (2 - progress);
      obj.innerHTML = Math.floor(easeOut * (end - start) + start);
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        // Ensure final number is exact and optionally format it
        obj.innerHTML = end;
        if (end > 10) obj.innerHTML += '+';
      }
    };
    window.requestAnimationFrame(step);
  };

  const statObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = parseInt(entry.target.dataset.target, 10);
        animateValue(entry.target, 0, target, 2000);
        observer.unobserve(entry.target); // Only count up once
      }
    });
  });

  statElements.forEach(el => statObserver.observe(el));

  // ─────────────────────────────────────────────────────────────────────────────
  // PROJECT FILTERING
  // ─────────────────────────────────────────────────────────────────────────────
  if (filterBtns.length > 0 && projects.length > 0) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        // Update active class
        filterBtns.forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        e.target.classList.add('active');
        e.target.setAttribute('aria-selected', 'true');

        const filter = e.target.dataset.filter;

        projects.forEach(project => {
          // Reset animation classes for smooth re-triggering
          project.classList.remove('is-visible');

          if (filter === 'all' || project.dataset.category === filter) {
            project.classList.remove('is-hidden');
            // Small timeout to allow display:block to apply before re-animating opacity
            setTimeout(() => {
              project.classList.add('is-visible');
            }, 50);
          } else {
            project.classList.add('is-hidden');
          }
        });
      });
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // FORM HANDLING
  // ─────────────────────────────────────────────────────────────────────────────

  // Character count for textarea
  if (messageInput && charCount) {
    messageInput.addEventListener('input', () => {
      const len = messageInput.value.length;
      charCount.textContent = `${len} / 5000`;
      if (len > 4900) {
        charCount.style.color = 'var(--color-error)';
      } else {
        charCount.style.color = 'var(--color-text-muted)';
      }

      // Clear error state on input
      messageInput.classList.remove('is-invalid');
      document.getElementById('message-error').textContent = '';
    });
  }

  // Input validation clearing
  const clearErrorsOnInput = () => {
    const inputs = document.querySelectorAll('.form-input');
    inputs.forEach(input => {
      input.addEventListener('input', () => {
        input.classList.remove('is-invalid');
        const errorSpan = document.getElementById(`${input.id}-error`);
        if (errorSpan) errorSpan.textContent = '';
      });
    });
  };
  clearErrorsOnInput();

  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Simple Honeypot Check (if bots fill it, reject silently)
      const hp = document.getElementById('website').value;
      if (hp) {
        console.warn('Bot detected by honeypot.');
        return; // Silently abort
      }

      // Hide previous status
      formStatus.className = 'form-status';
      formStatus.textContent = '';

      // Basic client-side validation
      let isValid = true;
      const nom = document.getElementById('nom').value.trim();
      const email = document.getElementById('email').value.trim();
      const message = document.getElementById('message').value.trim();

      if (nom.length < 2) {
        document.getElementById('nom').classList.add('is-invalid');
        document.getElementById('nom-error').textContent = 'Veuillez entrer au moins 2 caractères.';
        isValid = false;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        document.getElementById('email').classList.add('is-invalid');
        document.getElementById('email-error').textContent = 'Veuillez entrer une adresse e-mail valide.';
        isValid = false;
      }

      if (message.length < 10) {
        document.getElementById('message').classList.add('is-invalid');
        document.getElementById('message-error').textContent = 'Votre message doit contenir au moins 10 caractères.';
        isValid = false;
      }

      if (!isValid) return;

      // Loading state
      submitBtn.disabled = true;
      submitBtn.classList.add('is-loading');

      try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/send-mail`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ nom, email, message })
        });

        const data = await response.json();

        if (response.ok && data.success) {
          // Success
          formStatus.textContent = data.message || 'Votre message a bien été envoyé. Merci !';
          formStatus.classList.add('show', 'success');
          contactForm.reset();
          if (charCount) charCount.textContent = '0 / 5000';
        } else {
          // Server Error
          formStatus.textContent = data.error || "Une erreur s'est produite. Veuillez réessayer.";
          formStatus.classList.add('show', 'error');
        }

      } catch (error) {
        console.error('Fetch error:', error);
        formStatus.textContent = "Impossible de joindre le serveur. Veuillez vérifier votre connexion.";
        formStatus.classList.add('show', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.classList.remove('is-loading');
      }
    });
  }
});
