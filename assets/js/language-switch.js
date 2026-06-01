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

function getHeroVideoSource() {
  const pathname = window.location.pathname.replace(/\\/g, '/').toLowerCase();
  const mappings = [
    { suffix: '/assets/index.html', src: '/assets/videos/homepage.mp4' },
    { suffix: '/index.html', src: '/assets/videos/homepage.mp4' },
    { suffix: '/assets/dental.html', src: '/assets/videos/dental.mp4' },
    { suffix: '/assets/medical.html', src: '/assets/videos/medical.mp4' },
  ];

  const match = mappings.find(item => pathname.endsWith(item.suffix));
  return match ? match.src : '';
}

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
    video.preload = 'none';

    let source = video.querySelector('source');
    if (!source) {
      source = document.createElement('source');
      source.type = 'video/mp4';
      video.appendChild(source);
    }
    // Prefer a local copy in /assets/videos/ if the file exists, otherwise fall back to the external URL
    const chooseVideoSrc = async (external) => {
      try {
        const filename = external.split('/').pop();
        const localPath = `/assets/videos/${filename}`;
        const resp = await fetch(localPath, { method: 'HEAD' });
        if (resp.ok) return localPath;
      } catch (e) {}
      return external;
    };

    chooseVideoSrc(videoSrc).then(finalSrc => { source.src = finalSrc; video.load(); });

    const markLoaded = () => video.classList.add('is-loaded');
    video.addEventListener('loadeddata', markLoaded, { once: true });
    video.addEventListener('loadedmetadata', markLoaded, { once: true });
    video.addEventListener('canplay', markLoaded, { once: true });

    // loaded state and play will be handled after we set the source (chooseVideoSrc resolves)
    const waitAndMark = () => {
      if (video.readyState >= 1) {
        markLoaded();
      } else {
        window.setTimeout(markLoaded, 1500);
      }
      video.play().catch(() => {});
    };

    // If source already set by chooseVideoSrc synchronously above, ensure we still attempt marking
    chooseVideoSrc(videoSrc).then(() => waitAndMark()).catch(() => waitAndMark());
  };

  const pageVideoSrc = getHeroVideoSource();

  heroVideos.forEach((video) => {
    // If the video already has a source (markup) and is in a playable state, mark it loaded immediately
    const existingSrc = video.querySelector('source')?.src || video.currentSrc;
    if (existingSrc && video.readyState >= 1) {
      video.classList.add('is-loaded');
      // try to play if possible
      video.play().catch(() => {});
      return;
    }

    const videoSrc = video.getAttribute('data-src') || pageVideoSrc;
    if (!videoSrc) {
      return;
    }

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            loadHeroVideo(video, videoSrc);
            observer.disconnect();
          }
        });
      }, { rootMargin: '200px 0px' });

      observer.observe(video);
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

