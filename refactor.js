const fs = require('fs');
const path = require('path');

const jsDir = path.join(__dirname, 'js');
const files = fs.readdirSync(jsDir).filter(f => f.endsWith('.js'));

for (const file of files) {
    const filePath = path.join(jsDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Substitute alerts and confirms
    content = content.replace(/\balert\(/g, 'await app.showAlert(');
    content = content.replace(/\bconfirm\(/g, 'await app.showConfirm(');

    // Manual fixes for specific known non-async callbacks
    // 1. app.js .catch(err => {
    if (file === 'app.js') {
        content = content.replace(/\.catch\(err => \{/g, '.catch(async err => {');
    }

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Refactored ${file}`);
}
