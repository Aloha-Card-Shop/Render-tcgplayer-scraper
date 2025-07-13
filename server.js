
import express from 'express';
import cors from 'cors';
import { chromium } from 'playwright';

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

let browser;
(async () => {
  browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
})();

app.post('/scrape-price', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'Missing URL' });
  }

  let context;

  try {
    context = await browser.newContext({
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 15_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.2 Mobile/15E148 Safari/604.1"
    });

    const page = await context.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });

    const priceElement = await page.waitForSelector('.price-points__upper__price', { timeout: 10000 });
    const priceText = await priceElement.textContent();
    const price = priceText?.trim();

    if (!price) {
      throw new Error('Price not found on page');
    }

    res.json({ price });
  } catch (err) {
    console.error('Scrape error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to scrape price' });
  } finally {
    if (context) await context.close();
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

process.on('exit', async () => {
  if (browser) await browser.close();
});
