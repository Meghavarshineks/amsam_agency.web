// ================= Smooth scroll fix for fixed header =================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener("click", function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute("href"));
        if (target) {
            window.scrollTo({
                top: target.offsetTop - 70,
                behavior: "smooth"
            });
        }
    });
});

// ================= WhatsApp Enquiry Form =================
const whatsappForm = document.getElementById("whatsappForm");

if (whatsappForm) {
    whatsappForm.addEventListener("submit", function(e) {
        e.preventDefault();

        const name = document.getElementById("name").value.trim();
        const address = document.getElementById("address").value.trim();
        const date = document.getElementById("date").value;
        const brand = document.getElementById("brand").value;
        const type = document.getElementById("type").value.trim();
        const quantity = document.getElementById("quantity").value.trim();

        const message =
            `Hello Amsam Agency,\n\n` +
            `Name: ${name}\n` +
            `Address: ${address}\n` +
            `Delivery Date: ${date}\n` +
            `Brand: ${brand}\n` +
            `Cement Type: ${type}\n` +
            `Quantity: ${quantity} bags`;

        const phoneNumber = "91number"; // <-- CHANGE TO YOUR NUMBER

        const whatsappURL =
            "https://wa.me/" + phoneNumber + "?text=" + encodeURIComponent(message);


        window.open(whatsappURL, "_blank");
    });
}

const callbackForm = document.getElementById("callbackForm");

if (callbackForm) {
    callbackForm.addEventListener("submit", function (e) {
        e.preventDefault();

        const name = document.getElementById("cb-name").value;
        const phone = document.getElementById("cb-phone").value;

        const message =
            `Call Back Request\n\n` +
            `Name: ${name}\n` +
            `Phone: ${phone}`;

        const phoneNumber = "918248644610"; // SAME OWNER NUMBER
        const url = "https://wa.me/" + phoneNumber + "?text=" + encodeURIComponent(message);

        window.open(url, "_blank");
    });
}

