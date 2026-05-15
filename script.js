/* ========================================
   سوق التراث - Heritage Market JavaScript
   ======================================== */

// ===== Mock API Layer =====
const MockAPI = {
  async get(endpoint) {
    try {
      const cached = localStorage.getItem('mockApi_' + endpoint);
      if (cached) {
        return JSON.parse(cached);
      }
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error('فشل في تحميل البيانات');
      const data = await response.json();
      localStorage.setItem('mockApi_' + endpoint, JSON.stringify(data));
      return data;
    } catch (error) {
      console.error('API GET Error:', error);
      return null;
    }
  },

  async post(endpoint, newData, collection) {
  try {
    let data = await this.get(endpoint);
    if (!data || !data[collection]) return null;

    newData.id = data[collection].length > 0 
      ? Math.max(...data[collection].map(item => item.id)) + 1 
      : 1;

    data[collection].push(newData);

    localStorage.setItem('mockApi_' + endpoint, JSON.stringify(data));
    return newData;
  } catch (error) {
    console.error('API POST Error:', error);
    return null;
  }
}
};

// ===== Toast Notification =====
function showToast(message, type = 'success') {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.style.background = type === 'success' ? '#148F77' : type === 'error' ? '#c0392b' : '#D4A853';
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// ===== Dark Mode =====
function initDarkMode() {
  const toggle = document.getElementById('darkToggle');
  if (!toggle) return;
  
  const saved = localStorage.getItem('darkMode');
  if (saved === 'true') {
    document.documentElement.classList.add('dark');
    updateDarkToggle(toggle);
  }

  toggle.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
    const isDark = document.documentElement.classList.contains('dark');
    localStorage.setItem('darkMode', isDark);
    updateDarkToggle(toggle);
    showToast(isDark ? 'تم تفعيل الوضع الليلي 🌙' : 'تم تفعيل الوضع النهاري ☀️', 'info');
  });
}

function updateDarkToggle(btn) {
  const isDark = document.documentElement.classList.contains('dark');
  btn.innerHTML = isDark ? '☀️ نهاري' : '🌙 ليلي';
}

// ===== Mobile Menu =====
function initMobileMenu() {
  const hamburger = document.getElementById('navHamburger');
  const navLinks = document.getElementById('navLinks');
  if (!hamburger || !navLinks) return;

  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navLinks.classList.toggle('show');
  });

  // Close menu on link click
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('active');
      navLinks.classList.remove('show');
    });
  });
}

// ===== Active Nav Link =====
function setActiveNav() {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === page || (page === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });
}

// ===== Scroll Animations =====
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('.animate-on-scroll').forEach(el => {
    observer.observe(el);
  });
}

// ===== Back to Top =====
function initBackToTop() {
  const btn = document.getElementById('backToTop');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
      btn.classList.add('show');
    } else {
      btn.classList.remove('show');
    }
  });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// ===== Favorites =====
function getFavorites() {
  return JSON.parse(localStorage.getItem('favorites') || '[]');
}

function toggleFavorite(productId) {
  let favorites = getFavorites();
  const index = favorites.indexOf(productId);
  if (index > -1) {
    favorites.splice(index, 1);
    showToast('تم إزالة المنتج من المفضلة ');
  } else {
    favorites.push(productId);
    showToast('تم إضافة المنتج إلى المفضلة ');
  }
  localStorage.setItem('favorites', JSON.stringify(favorites));
  updateFavButtons();
}

function updateFavButtons() {
  const favorites = getFavorites();
  document.querySelectorAll('.fav-btn').forEach(btn => {
    const id = parseInt(btn.dataset.id);
    if (favorites.includes(id)) {
      btn.classList.add('active');
      btn.textContent = '❤️';
    } else {
      btn.classList.remove('active');
      btn.textContent = '🤍';
    }
  });
}

// ===== Load Products from JSON =====
let allProducts = [];

async function loadProducts() {
  const container = document.getElementById('productsContainer');
  if (!container) return;

  container.innerHTML = '<div class="loading-container"><div class="spinner"></div><p class="loading-text">جاري تحميل المنتجات...</p></div>';

  try {
    const response = await fetch('products.json');
    if (!response.ok) throw new Error('Network error');
    allProducts = await response.json();
    renderProducts(allProducts);
    initFilters();
  } catch (error) {
    container.innerHTML = '<p style="text-align:center;color:var(--accent-red);">عذراً، حدث خطأ أثناء تحميل المنتجات. يرجى المحاولة لاحقاً.</p>';
    console.error('Error loading products:', error);
  }
}

function renderProducts(products) {
  const container = document.getElementById('productsContainer');
  if (!container) return;

  const favorites = getFavorites();

  if (products.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:2rem;">لا توجد منتجات مطابقة لبحثك.</p>';
    return;
  }

  container.innerHTML = products.map((product, index) => `
    <div class="card animate-on-scroll" style="animation-delay: ${index * 0.1}s">
      <div class="card-img-wrapper">
        <img src="${product.image}" alt="${product.name}" class="card-img" onerror="this.src='https://picsum.photos/seed/product${product.id}/400/300'">
        <span class="card-badge">${product.category}</span>
      </div>
      <div class="card-body">
        <h3 class="card-title">${product.name}</h3>
        <p class="card-text">${product.description}</p>
        <div class="card-footer">
          <span class="card-price">${product.price}</span>
          <button class="fav-btn ${favorites.includes(product.id) ? 'active' : ''}" data-id="${product.id}" onclick="toggleFavorite(${product.id})">
            ${favorites.includes(product.id) ? '❤️' : '🤍'}
          </button>
        </div>
      </div>
    </div>
  `).join('');

  initScrollAnimations();
}

// ===== Search & Filter =====
function initFilters() {
  const searchInput = document.getElementById('searchInput');
  const filterBtns = document.querySelectorAll('.filter-btn');

  if (searchInput) {
    searchInput.addEventListener('input', () => applyFilters());
  }

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      applyFilters();
    });
  });
}

function applyFilters() {
  const searchInput = document.getElementById('searchInput');
  const activeFilter = document.querySelector('.filter-btn.active');
  
  const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
  const category = activeFilter ? activeFilter.dataset.category : 'الكل';

  let filtered = allProducts;

  if (query) {
    filtered = filtered.filter(p => 
      p.name.toLowerCase().includes(query) || 
      p.description.toLowerCase().includes(query) ||
      p.category.toLowerCase().includes(query)
    );
  }

  if (category && category !== 'الكل') {
    filtered = filtered.filter(p => p.category === category);
  }

  renderProducts(filtered);
}

// ===== Load API Data (GET from db.json) =====
async function loadOffers() {
  const container = document.getElementById('offersContainer');
  if (!container) return;

  container.innerHTML = '<div class="loading-container"><div class="spinner"></div><p class="loading-text">جاري تحميل العروض...</p></div>';

  const data = await MockAPI.get('db.json');

  if (!data || !data.offers) {
    container.innerHTML = '<p style="text-align:center;color:var(--text-muted);">لا توجد عروض حالياً.</p>';
    return;
  }

  renderOffers(data.offers);
}

function renderOffers(offers) {
  const container = document.getElementById('offersContainer');
  if (!container) return;

  container.innerHTML = offers.map((offer, index) => `
    <div class="offer-card animate-on-scroll" style="animation-delay: ${index * 0.1}s">
      <span class="offer-badge">${offer.discount} خصم</span>
      <h3 class="offer-title">${offer.title}</h3>
      <p class="offer-desc">${offer.description}</p>
      <div class="offer-valid">📅 ساري حتى: ${offer.validUntil}</div>
    </div>
  `).join('');

  initScrollAnimations();
}

// ===== Load Reviews (GET from db.json) =====
async function loadReviews() {
  const container = document.getElementById('reviewsContainer');
  if (!container) return;

  const data = await MockAPI.get('db.json');

  if (!data || !data.reviews) return;

  const reviews = data.reviews;
  container.innerHTML = reviews.map((review, index) => `
    <div class="review-card animate-on-scroll" style="animation-delay: ${index * 0.1}s">
      <div class="review-header">
        <span class="review-name">👤 ${review.name}</span>
        <span class="review-stars">${'⭐'.repeat(review.rating)}</span>
      </div>
      <p class="review-text">"${review.comment}"</p>
      <span class="review-date">📅 ${review.date}</span>
    </div>
  `).join('');

  initScrollAnimations();
}

// ===== POST Review (Add new review via form) =====
function initReviewForm() {
  const form = document.getElementById('reviewForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nameInput = document.getElementById('reviewName');
    const commentInput = document.getElementById('reviewComment');
    const ratingInput = document.getElementById('reviewRating');

    // Validate
    let valid = true;

    if (!nameInput.value.trim()) {
      showFieldError(nameInput, 'الاسم مطلوب');
      valid = false;
    } else {
      clearFieldError(nameInput);
    }

    if (!commentInput.value.trim()) {
      showFieldError(commentInput, 'التعليق مطلوب');
      valid = false;
    } else {
      clearFieldError(commentInput);
    }

    if (!valid) return;

    const today = new Date();
    const dateStr = `${today.getFullYear()}/${String(today.getMonth()+1).padStart(2,'0')}/${String(today.getDate()).padStart(2,'0')}`;

    const newReview = {
      name: nameInput.value.trim(),
      rating: parseInt(ratingInput.value),
      comment: commentInput.value.trim(),
      date: dateStr
    };

    const result = await MockAPI.post('db.json', newReview,'reviews');

    if (result) {
      showToast('تم إضافة مراجعتك بنجاح! شكراً لك 🌟');
      form.reset();
      loadReviews();
    } else {
      showToast('حدث خطأ أثناء إضافة المراجعة', 'error');
    }
  });
}

// ===== Contact Form Validation =====
function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nameInput = document.getElementById('contactName');
    const emailInput = document.getElementById('contactEmail');
    const messageInput = document.getElementById('contactMessage');

    let valid = true;

    // Name validation
    if (!nameInput.value.trim()) {
      showFieldError(nameInput, 'الاسم مطلوب');
      valid = false;
    } else if (nameInput.value.trim().length < 2) {
      showFieldError(nameInput, 'الاسم يجب أن يكون حرفين على الأقل');
      valid = false;
    } else {
      clearFieldError(nameInput);
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailInput.value.trim()) {
      showFieldError(emailInput, 'البريد الإلكتروني مطلوب');
      valid = false;
    } else if (!emailRegex.test(emailInput.value.trim())) {
      showFieldError(emailInput, 'البريد الإلكتروني غير صالح');
      valid = false;
    } else {
      clearFieldError(emailInput);
    }

    // Message validation
    if (!messageInput.value.trim()) {
      showFieldError(messageInput, 'الرسالة مطلوبة');
      valid = false;
    } else if (messageInput.value.trim().length < 10) {
      showFieldError(messageInput, 'الرسالة يجب أن تكون ١٠ أحرف على الأقل');
      valid = false;
    } else {
      clearFieldError(messageInput);
    }

    const newMessage = {
      name: nameInput.value.trim(),
      email: emailInput.value.trim(),
      message: messageInput.value.trim(),
      date: new Date().toISOString()
    };

    const result = await MockAPI.post('db.json', newMessage, 'messages');

    if (result) {
      showToast('تم إرسال رسالتك بنجاح! سنتواصل معك قريباً 📩');
      form.reset();
    } else {
      showToast('حدث خطأ أثناء الإرسال', 'error');
    }
  });

  // Real-time validation on input
  const inputs = form.querySelectorAll('.form-input, .form-textarea');
  inputs.forEach(input => {
    input.addEventListener('input', () => {
      if (input.value.trim()) {
        clearFieldError(input);
      }
    });
  });
}

function showFieldError(input, message) {
  input.classList.add('error');
  const errorEl = input.parentElement.querySelector('.error-msg');
  if (errorEl) {
    errorEl.textContent = '⚠️ ' + message;
    errorEl.classList.add('show');
  }
}

function clearFieldError(input) {
  input.classList.remove('error');
  const errorEl = input.parentElement.querySelector('.error-msg');
  if (errorEl) {
    errorEl.classList.remove('show');
  }
}

// ===== Random Product Button =====
async function initRandomProduct() {
  const btn = document.getElementById('randomProductBtn');
  const display = document.getElementById('randomProductDisplay');
  if (!btn || !display) return;

  btn.addEventListener('click', async () => {
    if (allProducts.length === 0) {
      try {
        const response = await fetch('products.json');
        allProducts = await response.json();
      } catch (e) {
        showToast('حدث خطأ في تحميل المنتجات', 'error');
        return;
      }
    }

    const randomIndex = Math.floor(Math.random() * allProducts.length);
    const product = allProducts[randomIndex];

    display.innerHTML = `
      <div class="random-product-inner">
        <img src="${product.image}" alt="${product.name}" onerror="this.src='https://picsum.photos/seed/random${product.id}/400/300'">
        <div>
          <h3 style="margin-bottom:0.5rem;color:var(--accent-blue);">${product.name}</h3>
          <p style="margin-bottom:0.5rem;">${product.description}</p>
          <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap;">
            <span class="card-price" style="font-size:1.4rem;">${product.price}</span>
            <span class="card-category" style="font-size:0.9rem;">${product.category}</span>
          </div>
        </div>
      </div>
    `;
    display.classList.add('show');
    display.style.animation = 'none';
    display.offsetHeight; // trigger reflow
    display.style.animation = 'fadeInUp 0.5s ease';
  });
}

// ===== Load Featured Products on Home =====
async function loadFeaturedProducts() {
  const container = document.getElementById('featuredProducts');
  if (!container) return;

  try {
    const response = await fetch('products.json');
    const products = await response.json();
    const featured = products.slice(0, 4); // Show first 4 products

    const favorites = getFavorites();

    container.innerHTML = featured.map((product, index) => `
      <div class="card animate-on-scroll" style="animation-delay: ${index * 0.15}s">
        <div class="card-img-wrapper">
          <img src="${product.image}" alt="${product.name}" class="card-img" onerror="this.src='https://picsum.photos/seed/feat${product.id}/400/300'">
          <span class="card-badge">${product.category}</span>
        </div>
        <div class="card-body">
          <h3 class="card-title">${product.name}</h3>
          <p class="card-text">${product.description}</p>
          <div class="card-footer">
            <span class="card-price">${product.price}</span>
            <button class="fav-btn ${favorites.includes(product.id) ? 'active' : ''}" data-id="${product.id}" onclick="toggleFavorite(${product.id})">
              ${favorites.includes(product.id) ? '❤️' : '🤍'}
            </button>
          </div>
        </div>
      </div>
    `).join('');

    initScrollAnimations();
  } catch (error) {
    container.innerHTML = '<p style="text-align:center;color:var(--text-muted);">عذراً، لم نتمكن من تحميل المنتجات المميزة.</p>';
  }
}

// ===== Initialize Everything =====
document.addEventListener('DOMContentLoaded', () => {
  // Global features
  initDarkMode();
  initMobileMenu();
  setActiveNav();
  initScrollAnimations();
  initBackToTop();

  // Page-specific features
  loadProducts();
  loadOffers();
  loadReviews();
  loadFeaturedProducts();
  initRandomProduct();
  initContactForm();
  initReviewForm();
});
