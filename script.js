
const menuBtn = document.querySelector('.menu-btn');
const menu = document.querySelector('.menu');

menuBtn.addEventListener('click', () => {
  const isOpen = menu.classList.toggle('open');
  menuBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
});

document.querySelectorAll('.menu a').forEach(link => {
  link.addEventListener('click', () => menu.classList.remove('open'));
});

document.getElementById('year').textContent = new Date().getFullYear();

document.getElementById('quoteForm').addEventListener('submit', function(e) {
  e.preventDefault();

  const name = document.getElementById('name').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const from = document.getElementById('from').value.trim();
  const to = document.getElementById('to').value.trim();
  const item = document.getElementById('item').value.trim();
  const extra = document.getElementById('extra').value.trim();

  const subject = encodeURIComponent('Fuvarozási árajánlatkérés');
  const body = encodeURIComponent(
    `Név: ${name}\nTelefonszám: ${phone}\nFelvételi cím: ${from}\nLerakási cím: ${to}\nSzállítandó áru: ${item}\nEgyéb információ: ${extra}`
  );

  window.location.href = `mailto:heroo9182737465@gmail.com?subject=${subject}&body=${body}`;
});
