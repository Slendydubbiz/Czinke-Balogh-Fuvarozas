
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
