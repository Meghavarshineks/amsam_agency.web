// ================= CONFIGURATION =================
// REPLACE THIS LINK with your own Google Sheet "Published to Web" CSV link
const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRFzkJ2WsHAkOHZNxM_HVZ8I5H2hUVn5D6vlLt0PjIG49-H9ZqdALvKZqxUhoUm6pRZemP3qpH2pMoi/pub?output=csv";

// Static Brand Data (Images & Descriptions don't change often)
const brandsStaticData = {
    "Chettinad": {
        logo: "Images/Chettinad_logo.jpg",
        desc: "Chettinad Cement is a major wholesale partner known for high-quality concrete solutions."
    },
    "ACC": {
        logo: "Images/ACC_logo.png",
        desc: "ACC Limited is one of India's leading manufacturers of cement and ready-mix concrete."
    },
    "UltraTech": {
        logo: "Images/Ultratech_logo.jpg",
        desc: "UltraTech Cement is the largest manufacturer of grey cement and ready mix concrete in India."
    },
    "Ramco": {
        logo: "Images/Ramco_logo.png", // Check if png/jpg matches your folder
        desc: "Ramco Cements is known for its strong dealer network and high-durability products."
    },
    "Dalmia": {
        logo: "Images/Dalmia_logo.webp",
        desc: "Dalmia Bharat delivers innovative and sustainable building materials."
    },
    "Maha": {
        logo: "Images/maha_logo.png",
        desc: "Maha Cement offers ordinary portland cement and other special blends."
    },
    "India Cements": {
        logo: "Images/Sankar_logo.png",
        desc: "India Cements Ltd is a veteran in the industry, offering the popular Sankar brand."
    }
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
    { Brand: "India Cements", Type: "Sankar Super Power", Price: "390" }
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
        if (csvText.trim().toLowerCase().startsWith("<!doctype html") ||
            csvText.trim().toLowerCase().startsWith("<html")) {
            throw new Error("Fetched data appears to be HTML, not CSV");
        }

        const priceData = parseCSV(csvText);

        // Validate that we actually got some data with a "Brand" field
        if (priceData.length === 0 || !priceData[0].hasOwnProperty("Brand")) {
            throw new Error("CSV missing 'Brand' column or empty");
        }

        renderGrid(priceData);

    } catch (error) {
        console.warn("Using fallback data. Reason:", error);
        // If fetch fails (or CORS issue, or bad data), use fallback
        renderGrid(fallbackPrices);
    }
}

function parseCSV(csvText) {
    const lines = csvText.split("\n");
    const result = [];
    if (lines.length < 1) return [];

    // Parse headers and trim quotes if present
    const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ''));

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
            obj[headers[j]] = val.replace(/^"|"$/g, '');
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

    priceList.forEach(item => {
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
    Object.keys(brandsStaticData).forEach(brandName => {
        const staticInfo = brandsStaticData[brandName];

        const card = document.createElement("a");
        card.className = "counter-box"; // Reverted to original class
        if (brandName === "Chettinad") card.classList.add("featured-product");

        card.href = "javascript:void(0)";

        // Setup click event to open modal
        // Reverted to onclick for stability
        card.onclick = () => openModal(brandName, staticInfo, brandGroups[brandName] || []);

        card.innerHTML = `
            <img src="${staticInfo.logo}" alt="${brandName} logo" class="brand-logo">
            <h2>${brandName}</h2>
            <p style="margin-top:5px; color:#666; font-size:0.9rem;">Click for prices</p>
        `;

        grid.appendChild(card);
    });
}


// ================= MODAL LOGIC =================
const modal = document.getElementById("productModal");
const closeModalBtn = document.querySelector(".close-modal");

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
        products.forEach(prod => {
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
    document.getElementById("modalEnquireBtn").onclick = () => orderSpecific(brandName, "General Enquiry", "N/A");

    modal.classList.add("active");
    document.body.style.overflow = "hidden"; // Prevent background scrolling
}

// Close Modal
if (closeModalBtn) {
    closeModalBtn.onclick = () => {
        modal.classList.remove("active");
        document.body.style.overflow = "auto";
    };
}

// Close on click outside
window.onclick = (event) => {
    if (event.target == modal) {
        modal.classList.remove("active");
        document.body.style.overflow = "auto";
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

    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(text)}`, "_blank");
}


// ================= EXISTING LOGIC (Scroll, Nav, Enquire Forms) =================

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener("click", function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute("href"));
        if (target) {
            const nav = document.getElementById("nav");
            const hamburger = document.getElementById("hamburger");
            if (nav && hamburger) {
                nav.classList.remove("active");
                hamburger.classList.remove("active");
            }
            window.scrollTo({
                top: target.offsetTop - 70,
                behavior: "smooth"
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
        }
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

        const message = `Hello Amsam Agency,\n\nName: ${name}\nAddress: ${address}\nDelivery Date: ${date}\nBrand: ${brand}\nCement Type: ${type}\nQuantity: ${quantity} bags`;
        const phoneNumber = "918248644610";
        window.open("https://wa.me/" + phoneNumber + "?text=" + encodeURIComponent(message), "_blank");
    });
}

// Callback Form
const callbackForm = document.getElementById("callbackForm");
if (callbackForm) {
    callbackForm.addEventListener("submit", function (e) {
        e.preventDefault();
        const name = document.getElementById("cb-name").value;
        const phone = document.getElementById("cb-phone").value;
        const message = `Call Back Request\n\nName: ${name}\nPhone: ${phone}`;
        const phoneNumber = "918248644610";
        window.open("https://wa.me/" + phoneNumber + "?text=" + encodeURIComponent(message), "_blank");
    });
}


// ================= ANIMATIONS =================
// Trigger animations when elements scroll into view
const observerOptions = {
    threshold: 0.1, // Trigger when 10% of element is visible
    rootMargin: "0px 0px -50px 0px" // Trigger slightly before bottom
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target); // Only animate once
        }
    });
}, observerOptions);

document.querySelectorAll('.animate-on-scroll').forEach(el => {
    observer.observe(el);
});
