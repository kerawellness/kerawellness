function setLanguage(lang) {
  localStorage.setItem('preferred_language', lang);
  document.documentElement.setAttribute('lang', lang);
  document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
  
  // Update toggle button states on the page
  document.querySelectorAll('.btn-lang-en').forEach(btn => {
    if (lang === 'en') btn.classList.add('active');
    else btn.classList.remove('active');
  });
  document.querySelectorAll('.btn-lang-ar').forEach(btn => {
    if (lang === 'ar') btn.classList.add('active');
    else btn.classList.remove('active');
  });

  // Toggle RTL stylesheet dynamic behaviors if any
  window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }));
}

function getVideoFilenameForPage() {
  const pathname = window.location.pathname.replace(/\\/g, '/').toLowerCase();
  if (pathname.includes('dental')) {
    return 'dental.mp4';
  }
  if (pathname.includes('medical')) {
    return 'medical.mp4';
  }
  return 'homepage.mp4';
}

function getVideoSourceCandidates(filename) {
  return [
    `videos/${filename}`,
    `./videos/${filename}`,
    `assets/videos/${filename}`,
    `/videos/${filename}`,
    `/assets/videos/${filename}`,
  ];
}

function scrollToConsultation(event) {
  if (event && typeof event.preventDefault === 'function') {
    event.preventDefault();
  }
  const section = document.getElementById('consultation');
  if (section) {
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function bindConsultationCTAs() {
  document.querySelectorAll('#mobileCallbackTrigger, #openCallbackBtn').forEach((el) => {
    el.addEventListener('click', scrollToConsultation);
  });
}

window.scrollToConsultation = scrollToConsultation;

function setupHeroVideos() {
  const heroVideos = Array.from(document.querySelectorAll('.video-background video'));
  if (!heroVideos.length) {
    return;
  }

  heroVideos.forEach((video) => {
    // Ensure all critical mobile autoplay attributes are set in code
    video.muted = true;
    video.playsInline = true;
    video.loop = true;
    video.autoplay = true;
    video.setAttribute('muted', 'true');
    video.setAttribute('playsinline', 'true');
    video.setAttribute('webkit-playsinline', 'true');

    const filename = video.getAttribute('data-video-file') || getVideoFilenameForPage();
    const markupSrc = video.querySelector('source')?.getAttribute('src') || '';
    const candidates = [
      ...new Set([
        markupSrc,
        video.getAttribute('data-src'),
        ...getVideoSourceCandidates(filename),
      ].filter(Boolean)),
    ];

    const markLoaded = () => {
      video.classList.add('is-loaded');
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.log("Autoplay blocked. Registering interaction trigger.", err);
          const playOnInteraction = () => {
            const innerPromise = video.play();
            if (innerPromise !== undefined) {
              innerPromise.catch(() => {});
            }
            document.removeEventListener("click", playOnInteraction);
            document.removeEventListener("touchstart", playOnInteraction);
          };
          document.addEventListener("click", playOnInteraction);
          document.addEventListener("touchstart", playOnInteraction);
        });
      } else {
        const playOnInteraction = () => {
          video.play();
          document.removeEventListener("click", playOnInteraction);
          document.removeEventListener("touchstart", playOnInteraction);
        };
        document.addEventListener("click", playOnInteraction);
        document.addEventListener("touchstart", playOnInteraction);
      }
    };

    // If readyState is already loaded enough (HAVE_CURRENT_DATA or higher)
    if (video.readyState >= 2) {
      markLoaded();
      return;
    }

    // Set event listeners for standard loading/playability events
    video.addEventListener('loadeddata', markLoaded, { once: true });
    video.addEventListener('canplay', markLoaded, { once: true });

    // Explicitly try playing to kickstart loading/playback on some mobile browsers
    const initialPlayPromise = video.play();
    if (initialPlayPromise !== undefined) {
      initialPlayPromise.then(() => {
        markLoaded();
      }).catch(() => {
        // Handled in markLoaded fallback if it fails
      });
    }

    // Fallback load mechanism: if it fails to load natively after 2 seconds
    let fallbackTriggered = false;
    const triggerFallback = () => {
      if (fallbackTriggered) return;
      fallbackTriggered = true;

      video.removeEventListener('loadeddata', markLoaded);
      video.removeEventListener('canplay', markLoaded);

      let attempt = 0;
      let source = video.querySelector('source');
      if (!source) {
        source = document.createElement('source');
        source.type = 'video/mp4';
        video.appendChild(source);
      }

      const tryNextSource = () => {
        if (attempt >= candidates.length) {
          markLoaded();
          return;
        }

        const nextSrc = candidates[attempt];
        attempt += 1;

        // Changing video.src directly is much more reliable on mobile Safari than changing <source>
        if (nextSrc !== markupSrc) {
          video.src = nextSrc;
        } else {
          source.src = nextSrc;
        }
        video.preload = 'auto';
        video.load();

        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.then(() => {
            markLoaded();
          }).catch((err) => {
            console.log("Fallback source failed to play:", nextSrc, err);
            tryNextSource();
          });
        } else {
          markLoaded();
        }
      };

      tryNextSource();
    };

    // If there is an error event on the main source
    const sourceEl = video.querySelector('source');
    if (sourceEl) {
      sourceEl.addEventListener('error', () => {
        triggerFallback();
      });
    }

    // Fallback if the video doesn't play or load within 2 seconds
    setTimeout(() => {
      if (!video.classList.contains('is-loaded')) {
        triggerFallback();
      }
    }, 2000);
  });
}

// On DOM load, apply preferred language and setup responsive events
document.addEventListener('DOMContentLoaded', () => {
  const preferredLang = localStorage.getItem('preferred_language') || 'en';
  setLanguage(preferredLang);
  setupHeroVideos();
  bindConsultationCTAs();

  // Immediately reveal any hero videos that the browser already loaded before our JS ran
  document.querySelectorAll('.video-background video').forEach(v => {
    try {
      if (v && v.readyState >= 1) {
        v.classList.add('is-loaded');
      }
    } catch (e) {}
  });

  // Final fallback: ensure hero videos become visible after a short delay
  setTimeout(() => {
    document.querySelectorAll('.video-background video').forEach(v => {
      try {
        if (v && !v.classList.contains('is-loaded')) {
          v.classList.add('is-loaded');
        }
      } catch (e) {}
    });
  }, 1200);

  // Mobile Burger Menu Toggle
  const burgerBtn = document.getElementById('burgerMenuBtn');
  const navLinks = document.querySelector('.nav-links');

  if (burgerBtn && navLinks) {
    burgerBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      burgerBtn.classList.toggle('active');
      navLinks.classList.toggle('active');
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!navLinks.contains(e.target) && !burgerBtn.contains(e.target)) {
        burgerBtn.classList.remove('active');
        navLinks.classList.remove('active');
      }
    });

    // Close menu when clicking a page link inside the drawer
    navLinks.querySelectorAll('a').forEach(link => {
      if (link.getAttribute('href') !== '#' && !link.classList.contains('lang-btn')) {
        link.addEventListener('click', () => {
          burgerBtn.classList.remove('active');
          navLinks.classList.remove('active');
        });
      }
    });
  }

  // Handle dropdown toggle on mobile touch/click
  const navDropdown = document.querySelector('.nav-dropdown');
  if (navDropdown) {
    const dropdownLink = navDropdown.querySelector('a');
    if (dropdownLink) {
      dropdownLink.addEventListener('click', (e) => {
        if (window.innerWidth <= 991) {
          e.preventDefault();
          navDropdown.classList.toggle('active');
        }
      });
    }
  }
});

