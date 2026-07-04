// ================= PAGE LOADER =================
setTimeout(function () {
  const loader = document.getElementById('page-loader');
  if (!loader) return;
  loader.classList.add('loader-done');
  setTimeout(function () { if (loader.parentNode) loader.parentNode.removeChild(loader); }, 900);
}, 2200);

// ================= CONFIGURATION =================
// REPLACE THIS LINK with your own Google Sheet "Published to Web" CSV link
const SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRFzkJ2WsHAkOHZNxM_HVZ8I5H2hUVn5D6vlLt0PjIG49-H9ZqdALvKZqxUhoUm6pRZemP3qpH2pMoi/pub?output=csv";

// Static Brand Data (Images & Descriptions don't change often)
const brandsStaticData = {
  Chettinad: {
    logo: "Images/Chettinad_logo.jpg",
    desc: "Chettinad Cement is a major wholesale partner known for high-quality concrete solutions.",
  },
  ACC: {
    logo: "Images/ACC_logo.png",
    desc: "ACC Limited is one of India's leading manufacturers of cement and ready-mix concrete.",
  },
  UltraTech: {
    logo: "Images/Ultratech_logo.jpg",
    desc: "UltraTech Cement is the largest manufacturer of grey cement and ready mix concrete in India.",
  },
  Ramco: {
    logo: "Images/Ramco_logo.png",
    desc: "Ramco Cements is known for its strong dealer network and high-durability products.",
  },
  Dalmia: {
    logo: "Images/Dalmia_logo.webp",
    desc: "Dalmia Bharat delivers innovative and sustainable building materials.",
  },
  Maha: {
    logo: "Images/maha_logo.png",
    desc: "Maha Cement offers ordinary portland cement and other special blends.",
  },
};

const tileAdhesiveStaticData = {
  "Hardworker": {
    logo: "Images/Hardworker_logo.jpeg",
    desc: "Ramco Hard Worker Tile Fix offers high-strength adhesion for various tiling needs.",
  },
};

// Fallback Data (Used if Google Sheet fails or during setup)
const fallbackPriceData = [
  { Product: "Cement", Brand: "Chettinad", Type: "PPC", Price: "" },
  { Product: "Cement", Brand: "Chettinad", Type: "OPC 53", Price: "" },
  { Product: "Cement", Brand: "ACC", Type: "PPC", Price: "" },
  { Product: "Cement", Brand: "ACC", Type: "OPC 53", Price: "" },
  { Product: "Cement", Brand: "UltraTech", Type: "PPC", Price: "" },
  { Product: "Cement", Brand: "UltraTech", Type: "OPC 53", Price: "" },
  { Product: "Cement", Brand: "Ramco", Type: "PPC", Price: "" },
  { Product: "Cement", Brand: "Ramco", Type: "OPC 53", Price: "" },
  { Product: "Cement", Brand: "Dalmia", Type: "PPC", Price: "" },
  { Product: "Cement", Brand: "Dalmia", Type: "OPC 53", Price: "" },
  { Product: "Cement", Brand: "Maha", Type: "PPC", Price: "" },
  { Product: "Cement", Brand: "Maha", Type: "OPC 53", Price: "" },
  { Product: "Tile Adhesive", Brand: "Hardworker", Type: "Standard", Price: "" },
];

// ================= IMAGE FORMAT HELPER =================
// Tries .jpg → .jpeg → .png → .webp in order, then falls back to brand logo
function onTypeImgError(img, basePath, fallback) {
  const exts = ['jpeg', 'png', 'webp'];
  const tried = parseInt(img.dataset.tried || '0');
  if (tried < exts.length) {
    img.dataset.tried = tried + 1;
    img.src = basePath + '.' + exts[tried];
  } else {
    img.onerror = null; // stop further errors
    img.src = fallback;
  }
}

// ================= MAIN INITIALIZATION =================
// Run immediately if the script is at the end of the body
fetchPrices();

async function fetchPrices() {
  const grid = document.getElementById("productsGrid");

  try {
    // Attempt to fetch from Google Sheet
    const response = await fetch(SHEET_CSV_URL);

    if (!response.ok) throw new Error("Sheet not found");

    const csvText = await response.text();

    // Basic validation: Check if it looks like HTML (e.g. login page)
    if (
      csvText.trim().toLowerCase().startsWith("<!doctype html") ||
      csvText.trim().toLowerCase().startsWith("<html")
    ) {
      throw new Error("Fetched data appears to be HTML, not CSV");
    }

    const priceData = parseCSV(csvText);

    // Validate that we actually got some data with a "Brand" field
    if (priceData.length === 0 || !priceData[0].hasOwnProperty("Brand")) {
      throw new Error("CSV missing 'Brand' column or empty");
    }

    renderGrid(priceData);
    renderTileGrid(priceData);
    setupDynamicForms(priceData);
  } catch (error) {
    console.error("Could not load prices from sheet. Reason:", error);
    
    // Use fallback data so the page isn't empty
    if (typeof fallbackPriceData !== "undefined") {
      renderGrid(fallbackPriceData);
      renderTileGrid(fallbackPriceData);
      setupDynamicForms(fallbackPriceData);
      
      // Optionally add a small notice that prices are for enquiry only
      console.log("Using local fallback data due to fetch error.");
    } else {
      // Hard fallback message if even fallback data is missing
      const grid = document.getElementById("productsGrid");
      if (grid) {
        grid.innerHTML = `<div style="color:#fff; text-align:center; padding:40px;"><p>Prices could not be loaded. Please contact us.</p></div>`;
      }
    }
  }
}

function parseCSV(csvText) {
  const lines = csvText.split("\n");
  const result = [];
  if (lines.length < 1) return [];

  // Parse headers and trim quotes if present
  const headers = lines[0]
    .split(",")
    .map((h) => h.trim().replace(/^"|"$/g, ""));

  for (let i = 1; i < lines.length; i++) {
    // Handle potential quoting in CSV lines (simple split)
    // Note: For robust CSV parsing, a regex or library is better,
    // but simple split works for simple pricing data.
    const currentline = lines[i].split(",");

    if (currentline.length < 2) continue; // Skip empty lines

    let obj = {};
    for (let j = 0; j < headers.length; j++) {
      const val = currentline[j] ? currentline[j].trim() : "";
      // Clean quotes if basic CSV structure
      obj[headers[j]] = val.replace(/^"|"$/g, "");
    }
    result.push(obj);
  }
  return result;
}

// ================= FORM DYNAMIC POPULATION =================
function setupDynamicForms(priceList) {
  // Extract unique brands and their types from the sheet data
  const brandTypes = {};
  priceList.forEach(item => {
    const brand = item.Brand ? item.Brand.trim() : "";
    const type = item.Type ? item.Type.trim() : "";
    if (!brand || !type) return;
    if (!brandTypes[brand]) brandTypes[brand] = new Set();
    brandTypes[brand].add(type);
  });

  // Since there might be multiple forms across different pages, queryall
  const brandSelects = document.querySelectorAll("select#brand, select[id='brand']");
  const typeInputs = document.querySelectorAll("input#type, select#type, [id='type']");

  if (brandSelects.length === 0 || typeInputs.length === 0) return;

  // Convert any string input type fields into true selects (so it works on un-edited HTML pages too)
  typeInputs.forEach(typeEl => {
    const parent = typeEl.parentNode;
    if (typeEl.tagName.toLowerCase() === "input" && parent) {
      const select = document.createElement("select");
      select.id = "type";
      select.required = true;
      select.disabled = true;
      select.innerHTML = '<option value="">Select Brand First</option>';
      parent.replaceChild(select, typeEl);

      const label = parent.querySelector('label[for="type"]');
      if (label) label.textContent = "Product Type:";
    }
  });

  // Re-query the type selects now that they are guaranteed to be selects
  const typeSelects = document.querySelectorAll("select[id='type']");

  brandSelects.forEach((brandSelect, index) => {
    // Attempt to pair the brand dropdown with the nearest type dropdown in the same form
    const form = brandSelect.closest("form");
    const typeSelect = form ? form.querySelector("select[id='type']") : typeSelects[index];

    if (!typeSelect) return;

    // Populate brand dropdown based exactly on sheet
    brandSelect.innerHTML = '<option value="">Select Brand</option>';
    Object.keys(brandTypes).sort().forEach(brand => {
      const opt = document.createElement("option");
      opt.value = brand;
      opt.textContent = brand;
      brandSelect.appendChild(opt);
    });

    // Handle change event
    brandSelect.addEventListener("change", function () {
      const chosenBrand = this.value;
      typeSelect.innerHTML = '<option value="">Select Product Type</option>';

      if (brandTypes[chosenBrand]) {
        Array.from(brandTypes[chosenBrand]).sort().forEach(type => {
          const opt = document.createElement("option");
          opt.value = type;
          opt.textContent = type;
          typeSelect.appendChild(opt);
        });
        typeSelect.disabled = false;
      } else {
        typeSelect.disabled = true;
      }
    });
  });
}

function renderGrid(priceList) {
  const grid = document.getElementById("productsGrid");
  if (!grid) return;

  grid.innerHTML = ""; // Clear loading text

  // Group prices by Brand — order comes from the sheet
  const brandGroups = {};
  const brandOrder = []; // preserve sheet order

  priceList.forEach((item) => {
    const productName = item.Product ? item.Product.trim().toLowerCase() : "";
    if (productName && productName !== "cement") return;

    const brandName = item.Brand ? item.Brand.trim() : "Unknown";
    if (!brandGroups[brandName]) {
      brandGroups[brandName] = [];
      brandOrder.push(brandName); // first time seen
    }
    brandGroups[brandName].push(item);
  });

  // Render a card for every brand found in the sheet.
  // Use brandsStaticData for logo/desc if available; fall back gracefully.
  brandOrder.forEach((brandName) => {
    const staticInfo = brandsStaticData[brandName] || {
      logo: "Images/Amsam_logo_transparent.png", // generic fallback
      desc: `${brandName} cement products available at Amsam Agency.`,
    };

    const card = document.createElement("a");
    card.className = "counter-box parallax-card";
    card.href = "javascript:void(0)";

    card.onclick = function (e) {
      if (e.target.closest('.type-order-btn')) return;
      toggleCard(this);
    };

    const products = brandGroups[brandName];
    let typesHtml = `<div class="types-carousel">`;

    products.forEach(prod => {
      let typeBasePath;
      let imgVal = prod['Image Number'] || prod['image number'] || prod['Image number'] || prod['Image'] || prod.image_number;
      if (imgVal && imgVal.trim()) {
        imgVal = imgVal.trim();
        if (!imgVal.toLowerCase().startsWith('image_')) {
          imgVal = 'Image_' + imgVal;
        }
        typeBasePath = `Images/${imgVal}`;
      } else {
        const typeSlug = (prod.Type || 'Standard').replace(/\s+/g, '_');
        typeBasePath = `Images/${brandName}_${typeSlug}`;
      }
      const fallbackImg = staticInfo.logo;

      const priceDisplay = (prod.Price && prod.Price.trim()) ? `₹${prod.Price.trim()}` : `Contact us`;
      const priceForOrder = (prod.Price && prod.Price.trim()) ? prod.Price.trim() : 'Not mentioned';

      typesHtml += `
            <div class="type-card">
                <div class="type-card-name">${prod.Type || 'Standard'}</div>
                <div class="type-card-img-wrap">
                    <img src="${typeBasePath}.jpg" alt="${brandName} ${prod.Type}" 
                         class="type-card-img" data-tried="0"
                         onerror="onTypeImgError(this, '${typeBasePath}', '${fallbackImg}')">
                </div>
                <div class="type-card-price">${priceDisplay}</div>
                <button class="type-order-btn" onclick="orderSpecific('${brandName}', '${prod.Type || 'Standard'}', '${priceForOrder}', '${prod.Product || 'Cement'}'); event.stopPropagation();">Order Now</button>
            </div>
        `;
    });
    typesHtml += `</div>`;

    const hasManyTypes = products.length > 2;
    const scrollHintHtml = hasManyTypes ? `<div class="scroll-hint-overlay"><span class="sh-label">Scroll</span><div class="sh-track"><div class="ch"></div><div class="ch"></div><div class="ch"></div></div></div>` : '';

    card.innerHTML = `
        <div class="card-left-content">
            <img src="${staticInfo.logo}" alt="${brandName} logo" class="brand-logo">
            <h2>${brandName}</h2>
            <div class="expand-hint">
                <span class="expand-icon">+</span>
                <span class="expand-text">View Types</span>
            </div>
        </div>
        ${typesHtml}
        ${scrollHintHtml}
    `;

    grid.appendChild(card);
  });

  // Initialize Parallax if it's the parallax container
  if (grid.classList.contains("parallax-container")) {
    initParallax();
  }
}

// ================= PARALLAX LOGIC =================
function initParallax() {
  const parallaxItems = document.querySelectorAll(".parallax-container .parallax-card");
  if (!parallaxItems.length) return;

  const HEADER_H = 70;

  function updateParallax() {
    if (document.body.classList.contains("split-active")) return;

    const visibleH = window.innerHeight - HEADER_H;
    const centerY = HEADER_H + visibleH / 2;
    const spread = visibleH * 0.5;

    parallaxItems.forEach((item) => {
      const rect = item.getBoundingClientRect();
      const itemCenterY = rect.top + rect.height / 2;
      const dist = itemCenterY - centerY;

      let ratio = dist / spread;
      if (ratio > 1) ratio = 1;
      if (ratio < -1) ratio = -1;

      const absRatio = Math.abs(ratio);
      
      // Parallax: Vertical shift based on distance from center
      // Items at the bottom move slightly faster (offset upwards)
      // Items at the top move slightly slower (offset downwards)
      const offset = dist * 0.12; 
      const scale = 1 - absRatio * 0.08;   // Subtle scale
      const opacity = 1 - absRatio * 0.6;    // Subtle fade

      item.style.transform = `translateY(${offset}px) scale(${scale})`;
      item.style.opacity = Math.max(opacity, 0.2);
    });
  }

  window.addEventListener("scroll", () => {
    requestAnimationFrame(updateParallax);
  });

  window.addEventListener("resize", () => {
    requestAnimationFrame(updateParallax);
  });

  updateParallax();
}

function renderTileGrid(priceList) {
  const grid = document.getElementById("tileAdhesiveGrid");
  if (!grid) return;

  grid.innerHTML = ""; // Clear loading text

  const brandGroups = {};
  const brandOrder = [];

  if (priceList) {
    priceList.forEach((item) => {
      const productName = item.Product ? item.Product.trim().toLowerCase() : "";
      if (productName !== "tile adhesive") return;

      const brandName = item.Brand ? item.Brand.trim() : "Unknown";
      if (!brandGroups[brandName]) {
        brandGroups[brandName] = [];
        brandOrder.push(brandName);
      }
      brandGroups[brandName].push(item);
    });
  }

  // Show message if no tile adhesive products found in sheet
  if (brandOrder.length === 0) {
    grid.innerHTML = `
      <div style="color:#fff; text-align:center; padding:40px; font-size:1.1rem;">
        <p style="font-size:2rem; margin-bottom:10px;">🚧</p>
        <p><strong>Tile Adhesive catalog coming soon.</strong></p>
        <p style="margin-top:8px; color:#9ecbff;">Contact us directly for current availability and pricing.</p>
        <a href="https://wa.me/918248644610" target="_blank" style="display:inline-block; margin-top:20px; background:#25d366; color:#fff; padding:12px 28px; border-radius:50px; text-decoration:none; font-weight:600;">📲 WhatsApp Us</a>
      </div>`;
    return;
  }

  brandOrder.forEach((brandName) => {
    const staticInfo = brandsStaticData[brandName] || tileAdhesiveStaticData[brandName] || {
      logo: "Images/Amsam_logo_transparent.png",
      desc: `${brandName} products available at Amsam Agency.`,
    };

    const card = document.createElement("a");
    card.className = "counter-box parallax-card";
    card.href = "javascript:void(0)";

    card.onclick = function (e) {
      if (e.target.closest('.type-order-btn')) return;
      toggleCard(this);
    };

    const products = brandGroups[brandName];
    let typesHtml = `<div class="types-carousel">`;

    products.forEach(prod => {
      let typeBasePath;
      let imgVal = prod['Image Number'] || prod['image number'] || prod['Image number'] || prod['Image'] || prod.image_number;
      if (imgVal && imgVal.trim()) {
        imgVal = imgVal.trim();
        if (!imgVal.toLowerCase().startsWith('image_')) {
          imgVal = 'Image_' + imgVal;
        }
        typeBasePath = `Images/${imgVal}`;
      } else {
        const typeSlug = (prod.Type || 'Standard').replace(/\s+/g, '_');
        typeBasePath = `Images/${brandName}_${typeSlug}`;
      }
      const fallbackImg = staticInfo.logo;

      const priceDisplay = (prod.Price && prod.Price.trim()) ? `₹${prod.Price.trim()}` : `Contact us`;
      const priceForOrder = (prod.Price && prod.Price.trim()) ? prod.Price.trim() : 'Not mentioned';

      typesHtml += `
            <div class="type-card">
                <div class="type-card-name">${prod.Type || 'Standard'}</div>
                <div class="type-card-img-wrap">
                    <img src="${typeBasePath}.jpg" alt="${brandName} ${prod.Type}" 
                         class="type-card-img" data-tried="0"
                         onerror="onTypeImgError(this, '${typeBasePath}', '${fallbackImg}')">
                </div>
                <div class="type-card-price">${priceDisplay}</div>
                <button class="type-order-btn" onclick="orderSpecific('${brandName}', '${prod.Type || 'Standard'}', '${priceForOrder}', '${prod.Product || 'Tile Adhesive'}'); event.stopPropagation();">Order Now</button>
            </div>
        `;
    });
    typesHtml += `</div>`;

    const hasManyTypes = products.length > 2;
    const scrollHintHtml = hasManyTypes ? `<div class="scroll-hint-overlay"><span class="sh-label">Scroll</span><div class="sh-track"><div class="ch"></div><div class="ch"></div><div class="ch"></div></div></div>` : '';

    card.innerHTML = `
        <div class="card-left-content">
            <img src="${staticInfo.logo}" alt="${brandName} logo" class="brand-logo">
            <h2>${brandName}</h2>
            <div class="expand-hint">
                <span class="expand-icon">+</span>
                <span class="expand-text">View Types</span>
            </div>
        </div>
        ${typesHtml}
        ${scrollHintHtml}
    `;

    grid.appendChild(card);
  });

  // Initialize Parallax if it's the parallax container
  if (grid.classList.contains("parallax-container")) {
    initParallax();
  }
}

// ================= MODAL LOGIC =================
const modal = document.getElementById("productModal");
const closeModalBtn = document.querySelector(".close-modal");

// Legacy Open Modal Function
function openModal(brandName, staticInfo, products) {
  document.getElementById("modalLogo").src = staticInfo.logo;
  document.getElementById("modalTitle").textContent = brandName;
  document.getElementById("modalDesc").textContent = staticInfo.desc;

  // Populate Price Table
  const tbody = document.getElementById("priceTableBody");
  tbody.innerHTML = "";

  if (products.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;">Prices updating soon...</td></tr>`;
  } else {
    products.forEach((prod) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
                <td>${prod.Type || "Standard"}</td>
                <td class="price-tag">₹${prod.Price || "Call"}</td>
                <td>
                    <a href="javascript:void(0)" 
                       class="order-link" 
                       onclick="orderSpecific('${brandName}', '${prod.Type}', '${prod.Price}')">
                       Order
                    </a>
                </td>
            `;
      tbody.appendChild(tr);
    });
  }

  // Set "General Enquire" button
  const category = products.length > 0 && products[0].Product ? products[0].Product : "Cement";
  document.getElementById("modalEnquireBtn").onclick = () =>
    orderSpecific(brandName, "General Enquiry", "N/A", category);

  modal.classList.add("active");
  document.body.style.overflow = "hidden"; // Prevent background scroll while modal open

  // Update URL Hash for back button support
  history.pushState({ modal: true }, "", "#modal-open");
}

// ================= CARD EXPAND/COLLAPSE =================
function toggleCard(card) {
  // Close any other expanded card first and reset their icons
  document.querySelectorAll('.counter-box.expanded, .parallax-card.expanded').forEach(other => {
    if (other !== card) {
      other.classList.remove('expanded');
      const otherIcon = other.querySelector('.expand-icon');
      const otherText = other.querySelector('.expand-text');
      if (otherIcon) otherIcon.textContent = '+';
      if (otherText) otherText.textContent = 'View Types';
    }
  });

  card.classList.toggle('expanded');

  // Swap icon and text
  const icon = card.querySelector('.expand-icon');
  const text = card.querySelector('.expand-text');
  if (card.classList.contains('expanded')) {
    if (icon) icon.textContent = '−';
    if (text) text.textContent = 'Minimize';
    setTimeout(() => {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  } else {
    if (icon) icon.textContent = '+';
    if (text) text.textContent = 'View Types';
  }

  // Recalculate parallax positions
  window.dispatchEvent(new Event('scroll'));
}

// Close Modal Helper
function closeModal() {
  modal.classList.remove("active");
  document.body.style.overflow = "auto";
}

// Handle Back Button
window.addEventListener("popstate", (event) => {
  // If we go back and the modal is active, close it
  if (modal.classList.contains("active")) {
    closeModal();
  }
});

// Close Button Click
if (closeModalBtn) {
  closeModalBtn.onclick = () => {
    // If modal is open, go back in history to trigger popstate
    if (modal.classList.contains("active")) {
      window.history.back();
    }
  };
}

// Close on click outside
window.onclick = (event) => {
  if (event.target == modal) {
    if (modal.classList.contains("active")) {
      window.history.back();
    }
  }
};

// Order Specific Item
function orderSpecific(brand, type, price, category = "Cement") {
  const phoneNumber = "918248644610";
  let text = "";

  // Normalize category for display (Title Case)
  const displayCategory = category.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

  if (price !== "N/A") {
    text = `Hello, I would like to order ${brand} ${displayCategory} (${type}). \nSeen Price: ₹${price}. \nPlease confirm availability.`;
  } else {
    text = `Hello, I would like to enquire about ${brand} ${displayCategory}.`;
  }

  window.open(
    `https://wa.me/${phoneNumber}?text=${encodeURIComponent(text)}`,
    "_blank",
  );
}

// ================= EXISTING LOGIC (Scroll, Nav, Enquire Forms) =================

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    if (e.target.classList.contains("nav-arrow")) {
      return; // Let the dropdown toggle logic handle this
    }
    e.preventDefault();
    const target = document.querySelector(this.getAttribute("href"));
    if (target) {
      const nav = document.getElementById("nav");
      const hamburger = document.getElementById("hamburger");
      if (nav && hamburger) {
        nav.classList.remove("active");
        hamburger.classList.remove("active");
        document.querySelectorAll(".nav-dropdown.active").forEach((dropdown) => {
          dropdown.classList.remove("active");
        });
      }
      window.scrollTo({
        top: target.offsetTop - 70,
        behavior: "smooth",
      });
    }
  });
});

// Hamburger
const hamburger = document.getElementById("hamburger");
const nav = document.getElementById("nav");
if (hamburger && nav) {
  hamburger.addEventListener("click", function () {
    hamburger.classList.toggle("active");
    nav.classList.toggle("active");
  });
  document.addEventListener("click", function (e) {
    if (!nav.contains(e.target) && !hamburger.contains(e.target)) {
      nav.classList.remove("active");
      hamburger.classList.remove("active");
      // Close any open dropdowns when menu closes
      document.querySelectorAll(".nav-dropdown.active").forEach((dropdown) => {
        dropdown.classList.remove("active");
      });
    }
  });

  // Handle dropdown arrow click natively
  const dropdownToggles = document.querySelectorAll(".nav-dropdown > a");
  dropdownToggles.forEach((toggle) => {
    toggle.addEventListener("click", function (e) {
      if (e.target.classList.contains("nav-arrow")) {
        e.preventDefault();
        e.stopPropagation(); // stop smooth scroll logic from intercepting
        this.parentElement.classList.toggle("active");
      } else {
        // It's a click on 'Products', let the browser navigate normally
        if (window.innerWidth <= 768 && nav && hamburger) {
          nav.classList.remove("active");
          hamburger.classList.remove("active");
        }
      }
    });
  });
}

// WhatsApp Form
const whatsappForm = document.getElementById("whatsappForm");
if (whatsappForm) {
  whatsappForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const name = document.getElementById("name").value.trim();
    const address = document.getElementById("address").value.trim();
    const date = document.getElementById("date").value;
    const brand = document.getElementById("brand").value;
    const type = document.getElementById("type").value.trim();
    const quantity = document.getElementById("quantity").value.trim();

    const message = `Hello Amsam Agency,\n\nName: ${name}\nDelivery Location: ${address}\nDelivery Date: ${date}\nBrand: ${brand}\nCement Type: ${type}\nQuantity: ${quantity} bags`;
    const phoneNumber = "918248644610";
    window.open(
      "https://wa.me/" + phoneNumber + "?text=" + encodeURIComponent(message),
      "_blank",
    );
  });
}

// Callback Form
const callbackForm = document.getElementById("callbackForm");
if (callbackForm) {
  callbackForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const name = document.getElementById("cb-name").value.trim();
    const phone = document.getElementById("cb-phone").value.trim();
    const location = document.getElementById("cb-location").value.trim();
    const submitBtn = callbackForm.querySelector("button[type='submit']");
    const originalBtnText = submitBtn.innerText;

    // Show loading state
    submitBtn.innerText = "Sending...";
    submitBtn.disabled = true;

    // Web App URL provided by user
    const SCRIPT_URL =
      "https://script.google.com/macros/s/AKfycbxZXKDtzIOV77mVzSFX7jHMutLwSbW5--exMe1XHfqAjstbJT3VHeMGo6PVSpULlnC1/exec";

    fetch(SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: name, phone: phone, location: location }),
    })
      .then(() => {
        alert(
          `Thank you, ${name}! Your request has been sent. We will call you at ${phone} shortly.`,
        );
        callbackForm.reset();
      })
      .catch((error) => {
        console.error("Error!", error.message);
        alert("Something went wrong. Please try again or call us directly.");
      })
      .finally(() => {
        submitBtn.innerText = originalBtnText;
        submitBtn.disabled = false;
      });
  });
}

// ================= ANIMATIONS =================
// Trigger animations when elements scroll into view
const observerOptions = {
  threshold: 0.1, // Trigger when 10% of element is visible
  rootMargin: "0px 0px -50px 0px", // Trigger slightly before bottom
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      observer.unobserve(entry.target); // Only animate once
    }
  });
}, observerOptions);

document.querySelectorAll(".animate-on-scroll").forEach((el) => {
  observer.observe(el);
});

// ================= COUNTER ANIMATION =================
const counterObserver = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const counters = entry.target.querySelectorAll(".achieve-number");
        counters.forEach((counter) => {
          const target = +counter.getAttribute("data-target");
          const duration = 2000; // 2 seconds
          const increment = target / (duration / 16); // 60fps

          let current = 0;
          const updateCounter = () => {
            current += increment;
            if (current < target) {
              counter.innerText = Math.ceil(current).toLocaleString();
              requestAnimationFrame(updateCounter);
            } else {
              // Final formatting
              if (target >= 1000) {
                counter.innerText = target.toLocaleString() + "+";
              } else {
                counter.innerText = target + "+";
              }
            }
          };
          updateCounter();
        });
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.5 },
); // Trigger when 50% visible

const achievementsSection = document.querySelector(".achievements-container");
if (achievementsSection) {
  counterObserver.observe(achievementsSection);
}

// ================= MATERIAL CALCULATOR LOGIC =================
document.addEventListener('DOMContentLoaded', () => {
  const calcModal = document.getElementById('calcModal');
  const floatCalcBtn = document.getElementById('floatCalc');
  const navCalcBtns = document.querySelectorAll('.nav-calc-btn');
  const calcClose = document.querySelector('.calc-close');

  if (!calcModal) return;

  // ---- Open / Close ----
  function openModal(e) {
    if (e) e.preventDefault();
    calcModal.classList.add('show');
  }
  function closeModal() {
    calcModal.classList.remove('show');
  }

  if (floatCalcBtn) floatCalcBtn.addEventListener('click', openModal);
  navCalcBtns.forEach(btn => btn.addEventListener('click', openModal));
  if (calcClose) calcClose.addEventListener('click', closeModal);
  calcModal.addEventListener('click', (e) => { if (e.target === calcModal) closeModal(); });

  // ---- Product Dropdown Switching ----
  const calcProductSelect = document.getElementById('calcProductSelect');
  const panelCement = document.getElementById('panelCement');
  const panelTile   = document.getElementById('panelTile');

  function switchCalcPanel(which) {
    if (panelCement) panelCement.style.display = (which === 'cement') ? '' : 'none';
    if (panelTile)   panelTile.style.display   = (which === 'tile')   ? '' : 'none';
  }

  if (calcProductSelect) {
    // Set initial state based on dropdown default value
    switchCalcPanel(calcProductSelect.value);
    calcProductSelect.addEventListener('change', () => switchCalcPanel(calcProductSelect.value));
  }

  // ---- CEMENT Calculation ----
  // Formula: area (sq ft) × ratio (bags per sq ft) → round up
  const workTypeSelect = document.getElementById('workType');
  const calcLength     = document.getElementById('calcLength');
  const calcHeight     = document.getElementById('calcHeight');
  const areaInput      = document.getElementById('areaInput');
  const calcResult     = document.getElementById('calcResult');

  function calculateCementBags() {
    if (!calcResult) return;
    let area = 0;
    if (calcLength && calcHeight) {
      area = (parseFloat(calcLength.value) || 0) * (parseFloat(calcHeight.value) || 0);
    } else if (areaInput) {
      area = parseFloat(areaInput.value) || 0;
    }
    const ratio = parseFloat(workTypeSelect ? workTypeSelect.value : 0) || 0;
    const bags  = area > 0 ? Math.ceil(area * ratio) : 0;
    calcResult.innerText = bags + ' Bags';
  }

  if (workTypeSelect) workTypeSelect.addEventListener('change', calculateCementBags);
  if (calcLength)     calcLength.addEventListener('input', calculateCementBags);
  if (calcHeight)     calcHeight.addEventListener('input', calculateCementBags);
  if (areaInput)      areaInput.addEventListener('input', calculateCementBags);

  // ---- TILE ADHESIVE Calculation ----
  // Formula: area sq ft → sq m (÷ 10.764) × kg/m² ÷ 20 kg per bag → round up
  const tileWorkType = document.getElementById('tileWorkType');
  const tileLength   = document.getElementById('tileLength');
  const tileHeight   = document.getElementById('tileHeight');
  const tileResult   = document.getElementById('tileResult');

  function calculateTileBags() {
    if (!tileResult) return;
    const lenFt  = parseFloat(tileLength  ? tileLength.value  : 0) || 0;
    const htFt   = parseFloat(tileHeight  ? tileHeight.value  : 0) || 0;
    const kgPerM2 = parseFloat(tileWorkType ? tileWorkType.value : 4) || 4;
    const areaSqFt = lenFt * htFt;
    const areaSqM  = areaSqFt / 10.764;
    const totalKg  = areaSqM * kgPerM2;
    const bags     = areaSqFt > 0 ? Math.ceil(totalKg / 20) : 0;
    tileResult.innerText = bags + ' Bags';
  }

  if (tileWorkType) tileWorkType.addEventListener('change', calculateTileBags);
  if (tileLength)   tileLength.addEventListener('input', calculateTileBags);
  if (tileHeight)   tileHeight.addEventListener('input', calculateTileBags);
});

// ================= GOOGLE REVIEWS INTEGRATION =================
// To fetch reviews dynamically from your Google Sheet:
// 1. In your Google Sheet, create a new tab called "Reviews" with columns: Name, Date, Stars, Text, Source, AvatarBg
// 2. Go to File > Share > Publish to web. Choose the "Reviews" tab and select "Comma-separated values (.csv)".
// 3. Paste the published CSV URL below. If empty, the website uses the built-in fallback reviews.
const REVIEWS_CSV_URL = ""; 

const defaultReviews = [
  {
    name: "Senthil Kumar",
    avatarBg: "avatar-bg-1",
    date: "1 week ago",
    stars: 5,
    text: "Excellent service and genuine pricing. We purchased 450 bags of ACC cement for our commercial project in Erode. Prompt delivery on site. Strongly recommend Amsam Agency for wholesale requirements.",
    source: "google"
  },
  {
    name: "Ramanathan P.",
    avatarBg: "avatar-bg-2",
    date: "3 weeks ago",
    stars: 5,
    text: "Being a builder in Tiruppur, I always prefer Amsam Agency for bulk supply. Their cement grades are always fresh and standard, and their prices are unbeatable. Very transparent dealer.",
    source: "justdial"
  },
  {
    name: "Meenakshi Sundaram",
    avatarBg: "avatar-bg-3",
    date: "1 month ago",
    stars: 5,
    text: "Very reliable delivery. Ordered 150 bags of Chettinad PPC and Ramco cement. The coordination was seamless, and the transport vehicle arrived exactly on time as promised.",
    source: "google"
  },
  {
    name: "Ganesh K.",
    avatarBg: "avatar-bg-4",
    date: "1 month ago",
    stars: 5,
    text: "We ordered Ramco Hard Worker tile adhesive and UltraTech cement for our house renovation. The quality is top-notch, and the proprietor Mr. Janaa guided us nicely on the quantity needed.",
    source: "google"
  },
  {
    name: "Karthikeyan B.",
    avatarBg: "avatar-bg-5",
    date: "2 months ago",
    stars: 5,
    text: "One of the oldest and most trusted wholesale cement suppliers in Punjai Puliyampatti. They maintain a solid stock of multiple premium brands. Customer support is very polite.",
    source: "justdial"
  }
];

fetchReviews();

async function fetchReviews() {
  const track = document.getElementById("reviewsCarouselTrack");
  if (!track) return; // Exit early if we are not on the homepage

  if (!REVIEWS_CSV_URL) {
    initReviewsCarousel(defaultReviews);
    return;
  }

  try {
    const response = await fetch(REVIEWS_CSV_URL);
    if (!response.ok) throw new Error("Reviews sheet not found");
    const csvText = await response.text();
    
    // Basic validation: Check if it looks like HTML (e.g. login page)
    if (
      csvText.trim().toLowerCase().startsWith("<!doctype html") ||
      csvText.trim().toLowerCase().startsWith("<html")
    ) {
      throw new Error("Fetched data appears to be HTML, not CSV");
    }

    const parsedReviews = parseCSV(csvText);
    
    // Validate we got reviews with at least name and text
    if (parsedReviews.length > 0 && (parsedReviews[0].hasOwnProperty("Name") || parsedReviews[0].hasOwnProperty("name"))) {
      const formattedReviews = parsedReviews.map((item, idx) => {
        const nameVal = item.Name || item.name || "Verified Customer";
        const textVal = item.Text || item.text || item.Review || item.review || "";
        const dateVal = item.Date || item.date || "Recently";
        const starsVal = parseInt(item.Stars || item.stars || item.Rating || item.rating) || 5;
        const sourceVal = (item.Source || item.source || "google").trim().toLowerCase();
        const avatarBgVal = item.AvatarBg || item.avatarBg || item.avatar_bg || `avatar-bg-${(idx % 5) + 1}`;
        
        return {
          name: nameVal.trim(),
          avatarBg: avatarBgVal.trim(),
          date: dateVal.trim(),
          stars: starsVal,
          text: textVal.trim(),
          source: sourceVal
        };
      }).filter(r => r.text !== ""); // Only display if it has a comment

      if (formattedReviews.length > 0) {
        initReviewsCarousel(formattedReviews);
      } else {
        throw new Error("Parsed reviews list is empty");
      }
    } else {
      throw new Error("Invalid reviews CSV structure");
    }
  } catch (err) {
    console.warn("Could not load reviews from sheet. Using fallback reviews.", err.message);
    initReviewsCarousel(defaultReviews);
  }
}

function initReviewsCarousel(reviews) {
  const track = document.getElementById("reviewsCarouselTrack");
  if (!track) return;

  track.innerHTML = ""; // Clear loader/spinner

  reviews.forEach(rev => {
    const card = document.createElement("div");
    card.className = "review-slide-card";

    // Create stars HTML
    let starsHtml = "";
    for (let i = 0; i < 5; i++) {
      starsHtml += `<span class="star ${i < rev.stars ? 'filled' : ''}">★</span>`;
    }

    // Get source icons (Google vs Justdial)
    let sourceIconSvg = "";
    if (rev.source === "google") {
      sourceIconSvg = `
        <svg viewBox="0 0 24 24" fill="#EA4335">
          <path d="M12.24 10.285V13.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.579-7.859-8s3.53-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l2.427-2.334C17.955 2.192 15.34 1 12.24 1 6.033 1 1 6.033 1 12.24s5.033 11.24 11.24 11.24c6.478 0 10.793-4.537 10.793-10.983 0-.746-.08-1.32-.176-1.713H12.24z"/>
        </svg>`;
    } else {
      sourceIconSvg = `
        <svg viewBox="0 0 24 24" fill="#007bff">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
        </svg>`;
    }

    const initials = rev.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();

    card.innerHTML = `
      <div class="review-card-top">
        <div class="review-user">
          <div class="review-avatar ${rev.avatarBg || 'avatar-bg-1'}">${initials}</div>
          <div class="review-user-info">
            <div class="review-user-name">${rev.name}</div>
            <div class="review-date">${rev.date}</div>
          </div>
        </div>
        <div class="review-card-rating">
          ${starsHtml}
        </div>
      </div>
      <div class="review-text">"${rev.text}"</div>
      <div class="review-card-footer">
        <span class="verified-badge">
          <svg viewBox="0 0 20 20"><path d="M10 0C4.48 0 0 4.48 0 10s4.48 10 10 10 10-4.48 10-10S15.52 0 10 0zm-2 15l-5-5 1.41-1.41L8 12.17l7.59-7.59L17 6l-9 9z"/></svg>
          Verified Customer
        </span>
        <span class="source-icon" title="${rev.source === 'google' ? 'Google Review' : 'Justdial Review'}">
          ${sourceIconSvg}
        </span>
      </div>
    `;

    track.appendChild(card);
  });

  // Slide Logic
  let currentIndex = 0;
  const prevBtn = document.querySelector(".carousel-nav-btn.prev-btn");
  const nextBtn = document.querySelector(".carousel-nav-btn.next-btn");

  if (!prevBtn || !nextBtn) return;

  function getGap() {
    if (!track.firstElementChild) return 24;
    const style = window.getComputedStyle(track);
    return parseFloat(style.columnGap || style.gap) || 24;
  }

  function updateButtons() {
    if (track.children.length === 0) return;
    const cardWidth = track.firstElementChild.getBoundingClientRect().width;
    const gap = getGap();
    const containerWidth = track.parentElement.getBoundingClientRect().width;
    const maxScroll = track.scrollWidth - containerWidth;
    const currentScroll = currentIndex * (cardWidth + gap);

    prevBtn.disabled = currentIndex === 0;
    nextBtn.disabled = currentScroll >= maxScroll - 5;
  }

  function slideTo(index) {
    if (track.children.length === 0) return;
    const cardWidth = track.firstElementChild.getBoundingClientRect().width;
    const gap = getGap();
    currentIndex = index;
    
    const containerWidth = track.parentElement.getBoundingClientRect().width;
    const maxScroll = track.scrollWidth - containerWidth;
    let offset = index * (cardWidth + gap);
    
    if (offset > maxScroll) {
      offset = maxScroll;
    }
    if (offset < 0) {
      offset = 0;
    }

    track.style.transform = `translateX(-${offset}px)`;
    updateButtons();
  }

  prevBtn.onclick = () => {
    if (currentIndex > 0) {
      slideTo(currentIndex - 1);
    }
  };

  nextBtn.onclick = () => {
    if (track.children.length === 0) return;
    const cardWidth = track.firstElementChild.getBoundingClientRect().width;
    const gap = getGap();
    const containerWidth = track.parentElement.getBoundingClientRect().width;
    const maxScroll = track.scrollWidth - containerWidth;
    const nextScroll = (currentIndex + 1) * (cardWidth + gap);

    if (nextScroll <= maxScroll + (cardWidth + gap) - 5) {
      slideTo(currentIndex + 1);
    }
  };

  // Touch swipe support for mobile devices
  let startX = 0;
  let isDragging = false;

  track.addEventListener("touchstart", (e) => {
    startX = e.touches[0].clientX;
    isDragging = true;
    track.style.transition = "none";
  }, { passive: true });

  track.addEventListener("touchmove", (e) => {
    if (!isDragging) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX;
    
    const cardWidth = track.firstElementChild ? track.firstElementChild.getBoundingClientRect().width : 0;
    const gap = getGap();
    const baseOffset = currentIndex * (cardWidth + gap);
    const translate = -baseOffset + diff;
    
    track.style.transform = `translateX(${translate}px)`;
  }, { passive: true });

  track.addEventListener("touchend", (e) => {
    if (!isDragging) return;
    isDragging = false;
    track.style.transition = "transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
    
    const endX = e.changedTouches[0].clientX;
    const diff = endX - startX;
    
    const cardWidth = track.firstElementChild ? track.firstElementChild.getBoundingClientRect().width : 0;
    const gap = getGap();
    
    if (diff < -50) {
      // Swipe left -> Next
      const containerWidth = track.parentElement.getBoundingClientRect().width;
      const maxScroll = track.scrollWidth - containerWidth;
      const nextScroll = (currentIndex + 1) * (cardWidth + gap);
      if (nextScroll <= maxScroll + (cardWidth + gap) - 5) {
        slideTo(currentIndex + 1);
      } else {
        slideTo(currentIndex);
      }
    } else if (diff > 50) {
      // Swipe right -> Prev
      if (currentIndex > 0) {
        slideTo(currentIndex - 1);
      } else {
        slideTo(0);
      }
    } else {
      slideTo(currentIndex);
    }
  });

  window.addEventListener("resize", () => {
    slideTo(currentIndex);
  });

  // Initial setting
  setTimeout(() => {
    slideTo(0);
  }, 150);
}
