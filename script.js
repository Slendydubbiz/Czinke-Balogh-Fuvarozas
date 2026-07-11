
const menuBtn = document.querySelector('.menu-btn');
const menu = document.querySelector('.menu');

if (menuBtn && menu) {
  menuBtn.addEventListener('click', () => {
    const isOpen = menu.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });

  document.querySelectorAll('.menu a').forEach(link => {
    link.addEventListener('click', () => {
      menu.classList.remove('open');
      menuBtn.setAttribute('aria-expanded', 'false');
    });
  });
}

const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();

const revealItems = document.querySelectorAll('.reveal');
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

revealItems.forEach(item => observer.observe(item));

const cookieBanner = document.getElementById('cookieBanner');
const cookieAccept = document.getElementById('cookieAccept');

if (cookieBanner && localStorage.getItem('cbCookieAccepted') === 'yes') {
  cookieBanner.classList.add('hidden');
}

if (cookieAccept) {
  cookieAccept.addEventListener('click', () => {
    localStorage.setItem('cbCookieAccepted', 'yes');
    cookieBanner.classList.add('hidden');
  });
}


const quoteForm = document.getElementById('quoteForm');

if (quoteForm) {
  quoteForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const status = document.getElementById('formStatus');
    const submitButton = document.getElementById('submitButton');
    const formData = new FormData(quoteForm);

    status.className = 'form-status loading';
    status.textContent = 'Az ajánlatkérés küldése folyamatban van…';
    submitButton.disabled = true;
    submitButton.textContent = 'Küldés…';

    try {
      const response = await fetch(quoteForm.action, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      });

      const result = await response.json();

      if (!response.ok || result.success === 'false' || result.success === false) {
        throw new Error(result.message || 'Az elküldés nem sikerült.');
      }

      quoteForm.reset();
      window.location.href = 'koszonjuk.html';
    } catch (error) {
      status.className = 'form-status error';
      status.textContent =
        'Az üzenetet most nem sikerült elküldeni. Kérjük, próbálja újra, vagy hívjon minket a +36 50 126 7124 számon.';
      submitButton.disabled = false;
      submitButton.textContent = 'Ajánlatkérés elküldése';
      console.error(error);
    }
  });
}
