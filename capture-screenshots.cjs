const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const projects = [
  { name: 'carspex', url: 'https://carspex.vercel.app', path: '/Users/shaka/carspex' },
  { name: 'ai-voice-platform', url: 'https://ai-voice-platform-seven.vercel.app', path: '/Users/shaka/ai-voice-platform' },
  { name: 'shaka-portfolio', url: 'https://shaka-portfolio-iota.vercel.app', path: '/Users/shaka/projects/shaka-portfolio' },
];

async function captureScreenshots() {
  const browser = await puppeteer.launch({ headless: true });

  for (const project of projects) {
    console.log(`Capturing ${project.name}...`);

    // Create screenshots directory
    const screenshotsDir = path.join(project.path, '.claude', 'screenshots');
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }

    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 800 });
      await page.goto(project.url, { waitUntil: 'networkidle2', timeout: 30000 });

      // Wait a bit for any animations
      await new Promise(r => setTimeout(r, 2000));

      const filename = `homepage_${new Date().toISOString().split('T')[0]}.png`;
      const filepath = path.join(screenshotsDir, filename);

      await page.screenshot({ path: filepath, fullPage: false });
      console.log(`  Saved: ${filepath}`);

      // Create description file
      fs.writeFileSync(
        filepath.replace('.png', '.txt'),
        `Homepage screenshot captured on ${new Date().toISOString()}`
      );

      await page.close();
    } catch (err) {
      console.error(`  Error capturing ${project.name}:`, err.message);
    }
  }

  await browser.close();
  console.log('Done!');
}

captureScreenshots();
