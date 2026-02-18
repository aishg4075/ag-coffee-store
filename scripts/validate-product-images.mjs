import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { products } from '../js/data.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const categoryKeywords = {
  coffee: ['coffee', 'espresso', 'brew', 'bean', 'filter', 'drip', 'cold'],
  matcha: ['matcha', 'tea', 'latte', 'whisk', 'ceremonial'],
  gear: ['gear', 'dripper', 'press', 'kit', 'pour', 'server', 'station', 'coffee'],
  'add-on': ['tote', 'cup', 'sock', 'accessories', 'espresso'],
};

const failures = [];

function fail(type, product, detail) {
  failures.push({ type, id: product.id, name: product.name, detail });
}

if (products.length < 100 || products.length > 120) {
  failures.push({
    type: 'count',
    id: 'catalog',
    name: 'products',
    detail: `Expected 100-120 products, found ${products.length}`,
  });
}

const seenIds = new Set();

for (const product of products) {
  if (seenIds.has(product.id)) {
    fail('duplicate-id', product, product.id);
  }
  seenIds.add(product.id);

  if (typeof product.imageUrl !== 'string' || product.imageUrl.startsWith('http')) {
    fail('non-local-image', product, product.imageUrl);
    continue;
  }

  const imagePath = path.resolve(root, product.imageUrl);
  if (!fs.existsSync(imagePath)) {
    fail('missing-image', product, product.imageUrl);
    continue;
  }

  const stat = fs.statSync(imagePath);
  if (stat.size <= 0) {
    fail('empty-image', product, product.imageUrl);
  }

  let mime = '';
  try {
    mime = execFileSync('file', ['-b', '--mime-type', imagePath], {
      encoding: 'utf8',
    }).trim();
  } catch (error) {
    fail('mime-check-failed', product, String(error));
    continue;
  }

  if (!mime.startsWith('image/')) {
    fail('invalid-mime', product, `${product.imageUrl} => ${mime}`);
  }

  const keywordSet = categoryKeywords[product.category] || [];
  const haystack = `${product.name} ${product.alt}`.toLowerCase();
  if (!keywordSet.some((word) => haystack.includes(word))) {
    fail('category-keyword-mismatch', product, `${product.category} :: ${product.alt}`);
  }

  if (!Array.isArray(product.variants) || product.variants.length === 0) {
    fail('missing-variants', product, 'variants missing');
  }
}

const categoryCounts = products.reduce((acc, product) => {
  acc[product.category] = (acc[product.category] || 0) + 1;
  return acc;
}, {});

console.log(`products: ${products.length}`);
console.log(`categories: ${JSON.stringify(categoryCounts)}`);

if (failures.length) {
  console.log(`status: FAIL (${failures.length} issues)`);
  for (const entry of failures) {
    console.log(`- ${entry.type} :: ${entry.id} :: ${entry.name} :: ${entry.detail}`);
  }
  process.exitCode = 1;
} else {
  console.log('status: PASS');
}
