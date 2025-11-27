function createCard(title = 'Untitled', description = 'No description') {
  const el = document.createElement('article');
  el.className = 'card';

  const h = document.createElement('h3');
  h.textContent = title;

  const p = document.createElement('p');
  p.textContent = description;

  const meta = document.createElement('div');
  meta.className = 'meta';

  const chip = document.createElement('span');
  chip.className = 'chip';
  chip.textContent = new Date().toLocaleDateString();

  const btn = document.createElement('button');
  btn.className = 'btn';
  btn.textContent = 'View';
  btn.style.padding = '6px 10px';
  btn.style.fontSize = '13px';

  btn.addEventListener('click', () => {
    alert(title + '\n\n' + description);
  });

  meta.appendChild(chip);
  meta.appendChild(btn);

  el.appendChild(h);
  el.appendChild(p);
  el.appendChild(meta);

  return el;
}

const cardsRoot = document.getElementById('cards');
const addBtn = document.getElementById('addBtn');
const filter = document.getElementById('filter');


const API_URL = "http://localhost:3000/api/data"; 

async function loadFromBackend() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error("Backend error");

    const data = await res.json();

    data.forEach(item => {
      cardsRoot.appendChild(
        createCard(item.title, item.description)
      );
    });

  } catch (err) {
    console.error("Failed to load backend:", err);
    cardsRoot.innerHTML =
      `<p style="color:#ff6b6b">Error connecting to backend</p>`;
  }
}

function addCard() {
  const title = prompt('Card title', 'New card');
  if (!title) return;

  const desc = prompt('Short description', 'A delightful new card');
  cardsRoot.prepend(createCard(title, desc || ''));
}

function applyFilter(query) {
  const text = (query || '').toLowerCase().trim();
  Array.from(cardsRoot.children).forEach(card => {
    const matches = card.textContent.toLowerCase().includes(text);
    card.style.display = matches ? '' : 'none';
  });
}

addBtn.addEventListener('click', addCard);
filter.addEventListener('input', e => applyFilter(e.target.value));

document.addEventListener('DOMContentLoaded', () => {
  loadFromBackend(); 
});