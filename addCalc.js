const fs = require('fs');
const path = require('path');

const dir = 'c:/Users/MH/OneDrive/Documents/VS Code/Amsam agency';
const files = ['index.html', 'cements.html', 'tile-adhesive.html'];

const floatAndModalHTML = `

    <!-- Floating Calculator -->
    <div id="floatCalc" class="float-calculator" title="Cement Calculator">
      🧮
    </div>

    <!-- Calculator Modal -->
    <div id="calcModal" class="calc-modal">
      <div class="calc-modal-content">
        <span class="calc-close">&times;</span>
        <h3>Cement Calculator</h3>
        <div class="calc-form-group">
          <label for="workType">Type of Work:</label>
          <select id="workType">
            <option value="0.4">Concrete Slab / Roof (M20)</option>
            <option value="0.12">Brickwork / Masonry (9" wall)</option>
            <option value="0.08">Plastering (12mm thickness)</option>
          </select>
        </div>
        <div class="calc-form-group">
          <label for="areaInput">Total Area (Sq.Ft):</label>
          <input type="number" id="areaInput" placeholder="e.g. 1000" min="0">
        </div>
        <div class="calc-result-box">
          <p>Estimated Required:</p>
          <div class="calc-result-number" id="calcResult">0 Bags</div>
        </div>
      </div>
    </div>

  </body>`;

files.forEach(file => {
    const filePath = path.join(dir, file);
    if (!fs.existsSync(filePath)) return;
    
    let content = fs.readFileSync(filePath, 'utf8');

    // Add Menu item
    // The menu is a ul list. Let's find "About Us" and put "Calculator" before it.
    // Example: <li><a href="#about">About Us</a></li> or <li><a href="index.html#about">About Us</a></li>
    content = content.replace(/(<li>\s*<a href="[^"]*#about">About Us<\/a>\s*<\/li>)/, '<li><a href="#" class="nav-calc-btn">Calculator</a></li>\n        $1');
    content = content.replace(/(<li>\s*<a href="[^"]*about.html">About Us<\/a>\s*<\/li>)/, '<li><a href="#" class="nav-calc-btn">Calculator</a></li>\n        $1');

    // Add Modal and button before </body>
    if (!content.includes('id="floatCalc"')) {
        content = content.replace(/\s*<\/body>/, floatAndModalHTML);
    }

    fs.writeFileSync(filePath, content, 'utf8');
});
console.log("Updated HTML files");
