
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
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  revealItems.forEach(item => observer.observe(item));
} else {
  revealItems.forEach(item => item.classList.add('visible'));
}

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

/* Fuvar route calculator */
const BASE_ADDRESS = 'Nyíregyháza, Magyarország';
const BASE_COORDS = { lat: 47.9531, lon: 21.7271 };
const PRICE_PER_KM = 230;
const MINIMUM_PRICE = 12000;
const TRAILER_FEE = 10000;
const FLOOR_FEE_PER_FLOOR_PER_ITEM = 1500;
const URGENT_MULTIPLIER = 0.20;
const MAX_INTERMEDIATE_STOPS = 6;

const routeStops = document.getElementById('routeStops');
const addStopButton = document.getElementById('addStop');
const calculateButton = document.getElementById('calculateRoute');
const routeStatus = document.getElementById('routeStatus');
const routeResult = document.getElementById('routeResult');
const submitButton = document.getElementById('submitButton');
const calculationRequired = document.getElementById('calculationRequired');

let calculationCompleted = false;

function formatForint(value) {
  return new Intl.NumberFormat('hu-HU', {
    style: 'currency',
    currency: 'HUF',
    maximumFractionDigits: 0
  }).format(Math.round(value));
}

function formatDuration(seconds) {
  const totalMinutes = Math.round(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} perc`;
  return `${hours} óra ${minutes} perc`;
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function renumberStops() {
  const stops = [...document.querySelectorAll('[data-stop]')];
  stops.forEach((stop, index) => {
    stop.querySelector('.stop-index').textContent = index + 1;
    const label = stop.querySelector('label');
    const input = stop.querySelector('.route-address');
    const title = index === 0 ? 'Első felvételi vagy lerakási cím' : `${index + 1}. köztes cím`;
    label.childNodes[0].nodeValue = `${title} `;
    input.setAttribute('aria-label', title);
  });
  addStopButton.disabled = stops.length >= MAX_INTERMEDIATE_STOPS;
}

function markCalculationDirty() {
  calculationCompleted = false;
  if (submitButton) submitButton.disabled = true;
  if (calculationRequired) {
    calculationRequired.classList.remove('done');
    calculationRequired.textContent = 'Az űrlap elküldése előtt számítsa ki az útvonalat és az előzetes díjat.';
  }
}

function addRouteStop() {
  const currentStops = document.querySelectorAll('[data-stop]').length;
  if (currentStops >= MAX_INTERMEDIATE_STOPS) return;

  const stop = document.createElement('div');
  stop.className = 'route-stop';
  stop.dataset.stop = '';
  stop.innerHTML = `
    <span class="stop-index">${currentStops + 1}</span>
    <label>
      ${currentStops + 1}. köztes cím
      <input type="text" class="route-address" placeholder="Település, utca, házszám" autocomplete="street-address">
    </label>
    <button type="button" class="remove-stop" aria-label="Cím eltávolítása" title="Cím eltávolítása">×</button>
  `;
  routeStops.appendChild(stop);
  renumberStops();
  markCalculationDirty();
}

if (addStopButton) addStopButton.addEventListener('click', addRouteStop);

if (routeStops) {
  routeStops.addEventListener('click', event => {
    const removeButton = event.target.closest('.remove-stop');
    if (!removeButton) return;

    const stops = document.querySelectorAll('[data-stop]');
    if (stops.length <= 1) {
      const input = removeButton.closest('[data-stop]').querySelector('.route-address');
      input.value = '';
    } else {
      removeButton.closest('[data-stop]').remove();
    }
    renumberStops();
    markCalculationDirty();
  });

  routeStops.addEventListener('input', markCalculationDirty);
}

['cargoType', 'loadingHelp', 'floorCount', 'largeItemCount', 'hasLift', 'needsTrailer', 'urgentJob']
  .forEach(id => {
    const element = document.getElementById(id);
    if (element) element.addEventListener('change', markCalculationDirty);
  });

document.querySelectorAll('.priced-item, .item-quantity').forEach(element => {
  element.addEventListener('change', markCalculationDirty);
  element.addEventListener('input', markCalculationDirty);
});

async function geocodeAddress(address) {
  const params = new URLSearchParams({
    q: address,
    format: 'jsonv2',
    limit: '1',
    countrycodes: 'hu',
    addressdetails: '1'
  });

  const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
    headers: {
      'Accept': 'application/json',
      'Accept-Language': 'hu'
    }
  });

  if (!response.ok) throw new Error('A címkereső szolgáltatás átmenetileg nem elérhető.');

  const results = await response.json();
  if (!results.length) throw new Error(`Nem található ez a cím: ${address}`);

  return {
    lat: Number(results[0].lat),
    lon: Number(results[0].lon),
    displayName: results[0].display_name
  };
}


function getSelectedPricedItems() {
  return [...document.querySelectorAll('.extra-item-card')].flatMap(card => {
    const checkbox = card.querySelector('.priced-item');
    const quantityInput = card.querySelector('.item-quantity');

    if (!checkbox?.checked) return [];

    const quantity = Math.max(1, Number(quantityInput?.value) || 1);
    const unitPrice = Number(checkbox.dataset.price) || 0;

    return [{
      name: checkbox.dataset.name || 'Tétel',
      quantity,
      unitPrice,
      total: quantity * unitPrice
    }];
  });
}

async function calculateRoute() {
  const addressInputs = [...document.querySelectorAll('.route-address')];
  const enteredAddresses = addressInputs.map(input => input.value.trim()).filter(Boolean);

  if (!enteredAddresses.length) {
    showCalculatorError('Legalább egy felvételi vagy lerakási címet meg kell adni.');
    return;
  }

  routeStatus.className = 'calculator-status loading';
  routeStatus.textContent = 'A címek keresése és az útvonal számítása folyamatban van…';
  routeResult.hidden = true;
  calculateButton.disabled = true;
  calculateButton.textContent = 'Számítás…';

  try {
    const geocodedStops = [];

    // Public Nominatim policy: keep requests sequential and at most about one per second.
    for (let i = 0; i < enteredAddresses.length; i += 1) {
      if (i > 0) await wait(1100);
      const point = await geocodeAddress(enteredAddresses[i]);
      geocodedStops.push({
        original: enteredAddresses[i],
        ...point
      });
    }

    const points = [
      { original: BASE_ADDRESS, displayName: BASE_ADDRESS, ...BASE_COORDS },
      ...geocodedStops,
      { original: BASE_ADDRESS, displayName: BASE_ADDRESS, ...BASE_COORDS }
    ];

    const coordinates = points.map(point => `${point.lon},${point.lat}`).join(';');
    const routeUrl = `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=false&steps=false`;

    const routeResponse = await fetch(routeUrl, {
      headers: { 'Accept': 'application/json' }
    });

    if (!routeResponse.ok) throw new Error('Az útvonaltervező szolgáltatás átmenetileg nem elérhető.');

    const routeData = await routeResponse.json();
    if (routeData.code !== 'Ok' || !routeData.routes?.length) {
      throw new Error('A megadott címek között nem sikerült közúti útvonalat találni.');
    }

    const route = routeData.routes[0];
    const totalKm = route.distance / 1000;
    const roundedKm = Math.ceil(totalKm);
    const baseDistancePrice = Math.max(MINIMUM_PRICE, roundedKm * PRICE_PER_KM);

    const floorCount = Math.max(0, Number(document.getElementById('floorCount').value) || 0);
    const largeItemCount = Math.max(0, Number(document.getElementById('largeItemCount').value) || 0);
    const hasLift = document.getElementById('hasLift').checked;
    const needsTrailer = document.getElementById('needsTrailer').checked;
    const urgentJob = document.getElementById('urgentJob').checked;

    const floorFee = hasLift ? 0 : floorCount * largeItemCount * FLOOR_FEE_PER_FLOOR_PER_ITEM;
    const trailerFee = needsTrailer ? TRAILER_FEE : 0;
    const selectedItems = getSelectedPricedItems();
    const itemExtrasFee = selectedItems.reduce((sum, item) => sum + item.total, 0);
    const subtotal = baseDistancePrice + floorFee + trailerFee + itemExtrasFee;
    const urgentFee = urgentJob ? subtotal * URGENT_MULTIPLIER : 0;
    const estimatedPrice = subtotal + urgentFee;

    const legs = route.legs || [];
    const legDescriptions = legs.map((leg, index) => ({
      from: index === 0 ? BASE_ADDRESS : enteredAddresses[index - 1],
      to: index === enteredAddresses.length ? BASE_ADDRESS : enteredAddresses[index],
      km: Math.ceil(leg.distance / 1000),
      seconds: leg.duration
    }));

    renderRouteResult({
      points,
      legDescriptions,
      roundedKm,
      durationSeconds: route.duration,
      baseDistancePrice,
      floorFee,
      trailerFee,
      itemExtrasFee,
      selectedItems,
      urgentFee,
      estimatedPrice
    });

    fillHiddenFields({
      enteredAddresses,
      legDescriptions,
      roundedKm,
      durationSeconds: route.duration,
      baseDistancePrice,
      floorFee,
      trailerFee,
      itemExtrasFee,
      selectedItems,
      urgentFee,
      estimatedPrice
    });

    routeStatus.className = 'calculator-status';
    routeStatus.textContent = '';
    calculationCompleted = true;
    submitButton.disabled = false;
    calculationRequired.classList.add('done');
    calculationRequired.textContent = '✓ Az útvonal és az előzetes díj kiszámítva. Az ajánlatkérés elküldhető.';
  } catch (error) {
    showCalculatorError(error.message || 'A számítás nem sikerült.');
  } finally {
    calculateButton.disabled = false;
    calculateButton.textContent = 'Útvonal és becsült ár kiszámítása';
  }
}

function showCalculatorError(message) {
  routeStatus.className = 'calculator-status error';
  routeStatus.textContent = `${message} Ellenőrizze a címeket, és próbálja újra.`;
  routeResult.hidden = true;
  markCalculationDirty();
}

function renderRouteResult(data) {
  document.getElementById('totalDistance').textContent = `${data.roundedKm} km`;
  document.getElementById('totalDuration').textContent = formatDuration(data.durationSeconds);
  document.getElementById('estimatedPrice').textContent = formatForint(data.estimatedPrice);
  document.getElementById('floorFee').textContent = formatForint(data.floorFee);
  document.getElementById('trailerFee').textContent = formatForint(data.trailerFee);
  document.getElementById('itemExtrasFee').textContent = formatForint(data.itemExtrasFee);
  document.getElementById('urgentFee').textContent = formatForint(data.urgentFee);

  const legsContainer = document.getElementById('routeLegs');
  const selectedItemsHtml = data.selectedItems.length
    ? `<h3>Kiválasztott tárgyak</h3>${data.selectedItems.map(item => `
        <div class="route-leg">
          <span>${escapeHtml(item.name)} × ${item.quantity}</span>
          <strong>${formatForint(item.total)}</strong>
        </div>
      `).join('')}`
    : '';

  legsContainer.innerHTML = '<h3>Útszakaszok</h3>' + data.legDescriptions.map(leg => `
    <div class="route-leg">
      <span>${escapeHtml(leg.from)} → ${escapeHtml(leg.to)}</span>
      <strong>${leg.km} km • ${formatDuration(leg.seconds)}</strong>
    </div>
  `).join('') + selectedItemsHtml;

  routeResult.hidden = false;
  routeResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function fillHiddenFields(data) {
  const cargoType = document.getElementById('cargoType').value;
  const loadingHelp = document.getElementById('loadingHelp').value;
  const floorCount = document.getElementById('floorCount').value || '0';
  const largeItemCount = document.getElementById('largeItemCount').value || '0';
  const hasLift = document.getElementById('hasLift').checked ? 'Igen' : 'Nem';
  const needsTrailer = document.getElementById('needsTrailer').checked ? 'Igen' : 'Nem';
  const urgentJob = document.getElementById('urgentJob').checked ? 'Igen' : 'Nem';
  const selectedItemsText = data.selectedItems.length
    ? data.selectedItems.map(item =>
        `${item.name}: ${item.quantity} db × ${formatForint(item.unitPrice)} = ${formatForint(item.total)}`
      ).join('; ')
    : 'Nincs kiválasztott fix feláras tárgy';

  const fullRoute = [BASE_ADDRESS, ...data.enteredAddresses, BASE_ADDRESS].join(' → ');
  const legsText = data.legDescriptions
    .map(leg => `${leg.from} → ${leg.to}: ${leg.km} km, ${formatDuration(leg.seconds)}`)
    .join(' | ');

  document.getElementById('routeSummaryField').value = fullRoute;
  document.getElementById('routeLegsField').value = legsText;
  document.getElementById('distanceField').value = `${data.roundedKm} km`;
  document.getElementById('durationField').value = formatDuration(data.durationSeconds);
  document.getElementById('priceField').value = formatForint(data.estimatedPrice);
  document.getElementById('calculationField').value =
    `Távolsági díj: ${formatForint(data.baseDistancePrice)}; ` +
    `Emeletdíj: ${formatForint(data.floorFee)}; ` +
    `Utánfutó: ${formatForint(data.trailerFee)}; ` +
    `Tárgyfelárak: ${formatForint(data.itemExtrasFee)} (${selectedItemsText}); ` +
    `Sürgősségi felár: ${formatForint(data.urgentFee)}; ` +
    `Kilométerdíj: ${PRICE_PER_KM} Ft/km`;
  document.getElementById('cargoField').value =
    `Típus: ${cargoType}; Rakodás: ${loadingHelp}; ` +
    `Emelet: ${floorCount}; Nagy bútorok: ${largeItemCount}; ` +
    `Lift: ${hasLift}; Utánfutó: ${needsTrailer}; Sürgős: ${urgentJob}; ` +
    `Kiválasztott tárgyak: ${selectedItemsText}`;
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  })[character]);
}

if (calculateButton) calculateButton.addEventListener('click', calculateRoute);

const quoteForm = document.getElementById('quoteForm');

if (quoteForm) {
  quoteForm.addEventListener('submit', async event => {
    event.preventDefault();

    const status = document.getElementById('formStatus');

    if (!calculationCompleted) {
      status.className = 'form-status error';
      status.textContent = 'Előbb számítsa ki az útvonalat és az előzetes díjat.';
      return;
    }

    const formData = new FormData(quoteForm);
    status.className = 'form-status loading';
    status.textContent = 'Az ajánlatkérés küldése folyamatban van…';
    submitButton.disabled = true;
    submitButton.textContent = 'Küldés…';

    try {
      const response = await fetch(quoteForm.action, {
        method: 'POST',
        body: formData,
        headers: { 'Accept': 'application/json' }
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

renumberStops();
