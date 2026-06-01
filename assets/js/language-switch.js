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

  const loadHeroVideo = (video, candidates) => {
    if (!candidates.length || video.dataset.loaded === 'true') {
      return;
    }

    video.dataset.loaded = 'true';
    video.muted = true;
    video.playsInline = true;

    let source = video.querySelector('source');
    if (!source) {
      source = document.createElement('source');
      source.type = 'video/mp4';
      video.appendChild(source);
    }

    const markLoaded = () => {
      video.classList.add('is-loaded');
      video.play().catch(() => {});
    };

    video.addEventListener('loadeddata', markLoaded, { once: true });
    video.addEventListener('canplay', markLoaded, { once: true });

    let attempt = 0;

    const trySource = () => {
      if (attempt >= candidates.length) {
        markLoaded();
        return;
      }

      const nextSrc = candidates[attempt];
      attempt += 1;
      source.src = nextSrc;
      video.preload = 'auto';
      video.load();
    };

    video.addEventListener('error', () => {
      trySource();
    });

    trySource();

    window.setTimeout(() => {
      if (!video.classList.contains('is-loaded')) {
        markLoaded();
      }
    }, 1500);
  };

  heroVideos.forEach((video) => {
    const filename =
      video.getAttribute('data-video-file') || getVideoFilenameForPage();
    const markupSrc = video.querySelector('source')?.getAttribute('src') || '';
    const candidates = [
      ...new Set([
        markupSrc,
        video.getAttribute('data-src'),
        ...getVideoSourceCandidates(filename),
      ].filter(Boolean)),
    ];

    if (!candidates.length) {
      return;
    }

    if (video.readyState >= 2 && markupSrc) {
      video.classList.add('is-loaded');
      video.play().catch(() => {});
      return;
    }

    loadHeroVideo(video, candidates);
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

