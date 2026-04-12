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
    logo: "Images/Ramco_logo.png", // Check if png/jpg matches your folder
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
  "Ramco Hard Worker Tile Fix": {
    logo: "Images/hardworker_logo.png",
    desc: "Ramco Hard Worker Tile Fix offers high-strength adhesion for various tiling needs.",
  },
};

// Fallback Data (Used if Google Sheet fails or during setup)
const fallbackPrices = [
  { Brand: "Chettinad", Type: "PPC", Price: "390" },
  { Brand: "Chettinad", Type: "OPC", Price: "410" },
  { Brand: "ACC", Type: "Suraksha Power", Price: "385" },
  { Brand: "ACC", Type: "Concrete +", Price: "405" },
  { Brand: "UltraTech", Type: "PPC", Price: "400" },
  { Brand: "Ramco", Type: "Supergrade", Price: "395" },
  { Brand: "Dalmia", Type: "DSP", Price: "415" },
  { Brand: "Maha", Type: "PPC", Price: "380" },
];

const tileAdhesiveFallbackPrices = [
  { Brand: "Ramco Hard Worker Tile Fix", Type: "Standard", Price: "450" },
];

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
  } catch (error) {
    console.warn("Using fallback data. Reason:", error);
    // If fetch fails (or CORS issue, or bad data), use fallback
    renderGrid(fallbackPrices);
    renderTileGrid(tileAdhesiveFallbackPrices);
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

function renderGrid(priceList) {
  const grid = document.getElementById("productsGrid");
  if (!grid) return;

  grid.innerHTML = ""; // Clear loading text

  // Group prices by Brand
  const brandGroups = {};

  priceList.forEach((item) => {
    // Case-insensitive brand matching if needed, but assuming exact match for now
    // Clean up brand name just in case
    const brandName = item.Brand ? item.Brand.trim() : "Unknown";

    if (!brandGroups[brandName]) {
      brandGroups[brandName] = [];
    }
    brandGroups[brandName].push(item);
  });

  // Create a Card for each Brand defined in Static Data
  // (This ensures we only show brands we have logos for)
  Object.keys(brandsStaticData).forEach((brandName) => {
    const staticInfo = brandsStaticData[brandName];

    const card = document.createElement("a");
    card.className = "counter-box globe-item";

    card.href = "javascript:void(0)";

    // Click the card itself to expand/collapse
    card.onclick = function(e) {
      // Don't collapse if clicking an order button inside
      if (e.target.closest('.type-order-btn')) return;
      toggleCard(this);
    };
    
    // Pre-generate the types carousel
    const products = brandGroups[brandName] || [];
    let typesHtml = `<div class="types-carousel">`;
    
    const listToRender = products.length > 0 ? products : [
        { Type: 'OPC 43 Grade', Price: 'Call' },
        { Type: 'OPC 53 Grade', Price: 'Call' },
        { Type: 'PPC Blended', Price: 'Call' }
    ];

    // Image mapping: use brand-specific type images if available, else fall back to brand logo
    // To add real images: put them in Images/ folder as BrandName_Type.jpg (e.g. Chettinad_PPC.jpg)
    listToRender.forEach(prod => {
        const typeSlug = (prod.Type || 'Standard').replace(/\s+/g, '_');
        const typeImg = `Images/${brandName}_${typeSlug}.jpg`;
        // Fallback to brand logo if specific type image doesn't exist
        const fallbackImg = staticInfo.logo;

        typesHtml += `
            <div class="type-card">
                <div class="type-card-name">${prod.Type || 'Standard'}</div>
                <div class="type-card-img-wrap">
                    <img src="${typeImg}" alt="${brandName} ${prod.Type}" 
                         class="type-card-img" 
                         onerror="this.src='${fallbackImg}'">
                </div>
                <div class="type-card-price">₹${prod.Price || 'Call'}</div>
                <button class="type-order-btn" onclick="orderSpecific('${brandName}', '${prod.Type || 'Standard'}', '${prod.Price || 'Call'}'); event.stopPropagation();">Order Now</button>
            </div>
        `;
    });
    typesHtml += `</div>`;

    card.innerHTML = `
        <div class="card-left-content">
            <img src="${staticInfo.logo}" alt="${brandName} logo" class="brand-logo">
            <h2>${brandName}</h2>
            <div class="expand-hint">
                <span class="expand-icon">＋</span>
                <span class="expand-text">View Types</span>
            </div>
        </div>
        ${typesHtml}
    `;

    grid.appendChild(card);
  });

  // Initialize Globe if it's the globe container
  if (grid.classList.contains("globe-container")) {
    initGlobe();
  }
}

// ================= GLOBE LOGIC =================
function initGlobe() {
  const globeItems = document.querySelectorAll(".globe-container .globe-item");
  if (!globeItems.length) return;

  function updateGlobe() {
    if (document.body.classList.contains("split-active")) return;
    const centerY = window.innerHeight / 2;

    globeItems.forEach((item) => {
      const rect = item.getBoundingClientRect();
      // Center of the item relative to viewport
      const itemCenterY = rect.top + rect.height / 2;
      // Distance from center of viewport
      const dist = itemCenterY - centerY;

      // Map distance to rotation and scale
      let ratio = dist / 350;
      if (ratio > 1) ratio = 1;
      if (ratio < -1) ratio = -1;

      const angle = ratio * -50; // Tilt background cards away (up to 50 deg)
      const scale = 1 - Math.abs(ratio) * 0.25; // Scale drops from 1 to 0.75
      const opacity = 1 - Math.abs(ratio) * 0.6; // Opacity drops from 1 to 0.4

      // Apply 3D transform
      item.style.transform = `rotateX(${angle}deg) scale(${scale})`;
      item.style.opacity = opacity;
    });
  }

  window.addEventListener("scroll", () => {
    requestAnimationFrame(updateGlobe);
  });

  // Initial call
  updateGlobe();
}

function renderTileGrid(priceList) {
  const grid = document.getElementById("tileAdhesiveGrid");
  if (!grid) return;

  grid.innerHTML = ""; // Clear loading text

  // Group prices by Brand
  const brandGroups = {};
  if (priceList) {
    priceList.forEach((item) => {
      const brandName = item.Brand ? item.Brand.trim() : "Unknown";
      if (!brandGroups[brandName]) {
        brandGroups[brandName] = [];
      }
      brandGroups[brandName].push(item);
    });
  }

  Object.keys(tileAdhesiveStaticData).forEach((brandName) => {
    const staticInfo = tileAdhesiveStaticData[brandName];

    const card = document.createElement("a");
    card.className = "counter-box";

    card.href = "javascript:void(0)";

    card.onclick = function(e) {
      if (e.target.closest('.type-order-btn')) return;
      toggleCard(this);
    };

    const products = brandGroups[brandName] || tileAdhesiveFallbackPrices.filter((p) => p.Brand === brandName);
    let typesHtml = `<div class="types-carousel">`;
    
    products.forEach(prod => {
        const typeSlug = (prod.Type || 'Standard').replace(/\s+/g, '_');
        const typeImg = `Images/${brandName}_${typeSlug}.jpg`;
        const fallbackImg = staticInfo.logo;

        typesHtml += `
            <div class="type-card">
                <div class="type-card-name">${prod.Type || 'Standard'}</div>
                <div class="type-card-img-wrap">
                    <img src="${typeImg}" alt="${brandName} ${prod.Type}" 
                         class="type-card-img" 
                         onerror="this.src='${fallbackImg}'">
                </div>
                <div class="type-card-price">₹${prod.Price || 'Call'}</div>
                <button class="type-order-btn" onclick="orderSpecific('${brandName}', '${prod.Type || 'Standard'}', '${prod.Price || 'Call'}'); event.stopPropagation();">Order Now</button>
            </div>
        `;
    });
    typesHtml += `</div>`;

    card.innerHTML = `
        <div class="card-left-content">
            <img src="${staticInfo.logo}" alt="${brandName} logo" class="brand-logo">
            <h2>${brandName}</h2>
            <div class="expand-hint">
                <span class="expand-icon">＋</span>
                <span class="expand-text">View Types</span>
            </div>
        </div>
        ${typesHtml}
    `;

    grid.appendChild(card);
  });
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
  document.getElementById("modalEnquireBtn").onclick = () =>
    orderSpecific(brandName, "General Enquiry", "N/A");

  modal.classList.add("active");
  document.body.style.overflow = "hidden"; // Prevent background scroll while modal open

  // Update URL Hash for back button support
  history.pushState({ modal: true }, "", "#modal-open");
}

// ================= CARD EXPAND/COLLAPSE =================
function toggleCard(card) {
    // Close any other expanded card first and reset their icons
    document.querySelectorAll('.counter-box.expanded, .globe-item.expanded').forEach(other => {
        if (other !== card) {
            other.classList.remove('expanded');
            const otherIcon = other.querySelector('.expand-icon');
            const otherText = other.querySelector('.expand-text');
            if (otherIcon) otherIcon.textContent = '＋';
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
        if (icon) icon.textContent = '＋';
        if (text) text.textContent = 'View Types';
    }

    // Recalculate globe positions
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
function orderSpecific(brand, type, price) {
  const phoneNumber = "918248644610";
  let text = "";

  if (price !== "N/A") {
    text = `Hello, I would like to order ${brand} Cement (${type}). \nSeen Price: ₹${price}. \nPlease confirm availability.`;
  } else {
    text = `Hello, I would like to enquire about ${brand} Cement.`;
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
    const name = document.getElementById("cb-name").value;
    const phone = document.getElementById("cb-phone").value;
    const location = document.getElementById("cb-location").value;
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
              // Format: 70000 -> 70k+ for better readability if desired,
              // or just commas. User asked for "70k+" in prompt, let's logic that.
              // Actually logic: Just show full number with commas?
              // Prompt said: "mention 70 K volume... make it like numbers getting added animation to 70k+"

              // Let's use standard number for animation and format at end
              counter.innerText = Math.ceil(current).toLocaleString();
              requestAnimationFrame(updateCounter);
            } else {
              // Final formatting
              if (target >= 1000) {
                // If it's the volume, maybe show 70,000+
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
