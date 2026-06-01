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

function resolveVideoPath(filename) {
  const pathname = window.location.pathname.replace(/\\/g, '/');
  const segments = pathname.split('/').filter(Boolean);
  const pageName = segments[segments.length - 1] || '';
  const inAssetsHtml = pageName.endsWith('.html') && segments.includes('assets');
  return inAssetsHtml ? `videos/${filename}` : `assets/videos/${filename}`;
}

function getHeroVideoSource() {
  const pathname = window.location.pathname.replace(/\\/g, '/').toLowerCase();
  if (pathname.includes('dental.html')) {
    return resolveVideoPath('dental.mp4');
  }
  if (pathname.includes('medical.html')) {
    return resolveVideoPath('medical.mp4');
  }
  return resolveVideoPath('homepage.mp4');
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

  const loadHeroVideo = (video, videoSrc) => {
    if (!videoSrc || video.dataset.loaded === 'true') {
      return;
    }

    video.dataset.loaded = 'true';

    let source = video.querySelector('source');
    if (!source) {
      source = document.createElement('source');
      source.type = 'video/mp4';
      video.appendChild(source);
    }

    const filename = videoSrc.split('/').pop();
    const finalSrc = videoSrc.startsWith('/assets/videos/')
      ? resolveVideoPath(filename)
      : videoSrc;

    source.src = finalSrc;
    video.preload = 'auto';
    video.load();

    const markLoaded = () => video.classList.add('is-loaded');
    video.addEventListener('loadeddata', markLoaded, { once: true });
    video.addEventListener('loadedmetadata', markLoaded, { once: true });
    video.addEventListener('canplay', markLoaded, { once: true });

    video.play().catch(() => {});
    window.setTimeout(() => {
      if (!video.classList.contains('is-loaded')) {
        markLoaded();
        video.play().catch(() => {});
      }
    }, 1200);
  };

  const pageVideoSrc = getHeroVideoSource();

  heroVideos.forEach((video) => {
    const sourceEl = video.querySelector('source');
    const markupSrc = sourceEl?.getAttribute('src') || '';
    const videoSrc = video.getAttribute('data-src') || markupSrc || pageVideoSrc;

    if (!videoSrc) {
      return;
    }

    if (markupSrc && video.readyState >= 2) {
      video.classList.add('is-loaded');
      video.play().catch(() => {});
      return;
    }

    loadHeroVideo(video, videoSrc);
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

