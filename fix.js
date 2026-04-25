const fs = require('fs');
const file = 'c:/Users/MH/OneDrive/Documents/VS Code/Amsam agency/index.html';
let content = fs.readFileSync(file, 'utf8');

const replacement = `  <section id="about" class="about">
    <div class="about-block animate-on-scroll">
      <h3>About Us</h3>
      <p>
        <strong>Amsam Agency</strong> is a trusted Tamil Nadu–based wholesale supplier of premium cement and high-performance tile adhesives.
      </p>
      <p style="margin-top: 15px;">
        We serve residential, commercial, and infrastructure projects across the state, providing the essential materials needed for durable and aesthetic construction. With strong industry experience and deep regional market knowledge, we deliver quality, authenticity, and dependable service—ensuring every structure is built on a foundation of excellence.
      </p>
    </div>

    <div class="divider"></div>

    <div class="why-block animate-on-scroll delay-1">
      <h3>Why Choose Our Combined Solutions?</h3>
      <ul style="list-style-type: none; padding: 0;">
        <li style="margin-bottom: 12px; line-height: 1.5;">
          <strong>🏢 Premium Cement Selection:</strong> Sourcing top-tier brands for superior structural integrity and load-bearing strength.
        </li>
        <li style="margin-bottom: 12px; line-height: 1.5;">
          <strong>🛡️ Advanced Tile Adhesives:</strong> Offering specialized formulations for various tile types, ensuring excellent bonding, water resistance, and crack prevention.
        </li>
        <li style="margin-bottom: 12px; line-height: 1.5;">
          <strong>🔄 Comprehensive Supply:</strong> A streamlined sourcing process for both masonry and finishing materials, reducing logistical overhead.
        </li>
        <li style="margin-bottom: 12px; line-height: 1.5;">
          <strong>🤝 Expert Support:</strong> Technical guidance on selecting the right grade of cement and the appropriate adhesive class for your specific project needs.
        </li>
      </ul>
    </div>
  </section>`;

const regex = /<!-- ABOUT -->[\s\S]*?<!-- SUPPLY NETWORK -->/;
const newContent = content.replace(regex, `<!-- ABOUT -->\n${replacement}\n\n  <!-- SUPPLY NETWORK -->`);

if (newContent !== content) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log("Successfully updated index.html");
} else {
    console.log("Regex didn't match.");
}
