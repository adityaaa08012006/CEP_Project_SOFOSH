import pdfParse from 'pdf-parse';
import { DONATION_CATEGORIES, UNITS } from '@cep/shared';

/**
 * Parse a PDF buffer and extract donation items using rule-based heuristics.
 * No AI/LLM required — works offline with unlimited usage.
 */
export async function parsePdfToItems(buffer) {
  const pdfData = await pdfParse(buffer);
  const text = pdfData.text;

  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const items = [];
  const seen = new Set();

  for (const line of lines) {
    const parsed = parseLine(line);
    if (parsed && !seen.has(parsed.name.toLowerCase())) {
      seen.add(parsed.name.toLowerCase());
      items.push(parsed);
    }
  }

  // If line-by-line didn't find much, try table-style parsing
  if (items.length < 2) {
    const tableItems = parseTableFormat(lines);
    for (const item of tableItems) {
      if (!seen.has(item.name.toLowerCase())) {
        seen.add(item.name.toLowerCase());
        items.push(item);
      }
    }
  }

  return items;
}

/**
 * Try to parse a single line into {name, quantity, unit, category, confidence}
 * Handles formats like:
 *   "Rice - 50 kg"
 *   "50 kg Rice"
 *   "Rice: 50 kg"
 *   "Rice 50kg"
 *   "1. Rice 50 kg"
 *   "• Milk - 20 liters"
 */
function parseLine(line) {
  // Remove bullet points, numbering, dashes at start
  let cleaned = line
    .replace(/^[\d]+[.)]\s*/, '')    // "1. " or "1) "
    .replace(/^[-•●▪◦*]\s*/, '')     // bullets
    .replace(/^\s*[-–—]\s*/, '')     // leading dashes
    .trim();

  if (cleaned.length < 3) return null;

  // Skip headers / non-item lines
  if (/^(s\.?\s*no|serial|item\s*name|description|quantity|unit|total|date|sr)/i.test(cleaned)) {
    return null;
  }
  if (/^(required|needed|list|items|donation|page|orphanage)/i.test(cleaned)) {
    return null;
  }

  // Pattern 1: "Name - Qty Unit" or "Name : Qty Unit" or "Name — Qty Unit"
  let match = cleaned.match(/^(.+?)\s*[-:–—]\s*(\d+[\d,.]*)\s*([a-zA-Z]+.*)$/);
  if (match) {
    return buildItem(match[1], match[2], match[3]);
  }

  // Pattern 2: "Qty Unit Name" (e.g., "50 kg Rice")
  match = cleaned.match(/^(\d+[\d,.]*)\s*([a-zA-Z]{1,10})\s+(.+)$/);
  if (match) {
    const unitCandidate = match[2].toLowerCase();
    if (isUnit(unitCandidate)) {
      return buildItem(match[3], match[1], match[2]);
    }
  }

  // Pattern 3: "Name Qty Unit" (e.g., "Rice 50 kg")
  match = cleaned.match(/^(.+?)\s+(\d+[\d,.]*)\s*([a-zA-Z]{1,10})$/);
  if (match) {
    const unitCandidate = match[3].toLowerCase();
    if (isUnit(unitCandidate)) {
      return buildItem(match[1], match[2], match[3]);
    }
  }

  // Pattern 4: "Name QtyUnit" (e.g., "Rice 50kg")
  match = cleaned.match(/^(.+?)\s+(\d+[\d,.]*)([a-zA-Z]{1,10})$/);
  if (match) {
    const unitCandidate = match[3].toLowerCase();
    if (isUnit(unitCandidate)) {
      return buildItem(match[1], match[2], match[3]);
    }
  }

  // Pattern 5: Table-like with tabs/multiple spaces: "Rice    50    kg"
  const parts = cleaned.split(/\s{2,}|\t/).filter(Boolean);
  if (parts.length >= 3) {
    const qtyIdx = parts.findIndex((p) => /^\d+[\d,.]*$/.test(p));
    if (qtyIdx >= 0 && qtyIdx + 1 < parts.length && isUnit(parts[qtyIdx + 1].toLowerCase())) {
      const name = parts.slice(0, qtyIdx).join(' ');
      if (name) return buildItem(name, parts[qtyIdx], parts[qtyIdx + 1]);
    }
  }

  // Pattern 6: Just a name with a quantity but no unit? Low confidence
  match = cleaned.match(/^(.+?)\s+(\d+[\d,.]*)$/);
  if (match && match[1].length > 2) {
    return buildItem(match[1], match[2], 'pieces', 'low');
  }

  return null;
}

/**
 * Try to parse lines as a table with a header row
 */
function parseTableFormat(lines) {
  const items = [];

  // Look for a header line
  let headerIdx = -1;
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    if (/item|name|description/i.test(lines[i]) && /qty|quantity|amount|number/i.test(lines[i])) {
      headerIdx = i;
      break;
    }
  }

  if (headerIdx < 0) return items;

  // Parse rows after header
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const parsed = parseLine(lines[i]);
    if (parsed) items.push(parsed);
  }

  return items;
}

function buildItem(rawName, rawQty, rawUnit, confidence = 'high') {
  const name = rawName
    .replace(/[,;:]+$/, '')
    .replace(/^\s*[-•●]\s*/, '')
    .trim();

  if (!name || name.length < 2) return null;

  const quantity = parseFloat(rawQty.replace(/,/g, '')) || 0;
  if (quantity <= 0) return null;

  const unit = normalizeUnit(rawUnit.trim());
  const category = guessCategory(name);

  return { name, quantity, unit, suggested_category: category, confidence };
}

function isUnit(str) {
  const unitVariants = [
    'kg', 'kgs', 'kilogram', 'kilograms',
    'g', 'gm', 'gms', 'gram', 'grams',
    'l', 'lt', 'ltr', 'ltrs', 'liter', 'liters', 'litre', 'litres',
    'ml', 'milliliter', 'milliliters',
    'pkt', 'pkts', 'packet', 'packets',
    'pc', 'pcs', 'piece', 'pieces',
    'box', 'boxes',
    'bottle', 'bottles', 'btl', 'btls',
    'dozen', 'dzn',
    'pair', 'pairs',
    'set', 'sets',
    'unit', 'units',
    'bag', 'bags',
    'can', 'cans',
    'jar', 'jars',
    'tube', 'tubes',
    'roll', 'rolls',
    'bundle', 'bundles',
    'nos', 'no',
  ];
  return unitVariants.includes(str.toLowerCase().replace(/[.,]/g, ''));
}

function normalizeUnit(raw) {
  const lower = raw.toLowerCase().replace(/[.,]/g, '');
  const map = {
    kg: 'kg', kgs: 'kg', kilogram: 'kg', kilograms: 'kg',
    g: 'grams', gm: 'grams', gms: 'grams', gram: 'grams', grams: 'grams',
    l: 'liters', lt: 'liters', ltr: 'liters', ltrs: 'liters',
    liter: 'liters', liters: 'liters', litre: 'liters', litres: 'liters',
    ml: 'ml', milliliter: 'ml', milliliters: 'ml',
    pkt: 'packets', pkts: 'packets', packet: 'packets', packets: 'packets',
    pc: 'pieces', pcs: 'pieces', piece: 'pieces', pieces: 'pieces',
    nos: 'pieces', no: 'pieces',
    box: 'boxes', boxes: 'boxes',
    bottle: 'bottles', bottles: 'bottles', btl: 'bottles', btls: 'bottles',
    dozen: 'dozen', dzn: 'dozen',
    pair: 'pairs', pairs: 'pairs',
    set: 'sets', sets: 'sets',
    bag: 'bags', bags: 'bags',
    can: 'cans', cans: 'cans',
    jar: 'jars', jars: 'jars',
    tube: 'tubes', tubes: 'tubes',
    roll: 'rolls', rolls: 'rolls',
    bundle: 'bundles', bundles: 'bundles',
    unit: 'pieces', units: 'pieces',
  };
  return map[lower] || raw;
}

function guessCategory(name) {
  const lower = name.toLowerCase();

  const categoryKeywords = {
    'Grains & Cereals': ['rice', 'wheat', 'flour', 'atta', 'dal', 'lentil', 'pulse', 'oat', 'cereal', 'corn', 'maize', 'barley', 'millet', 'ragi', 'jowar', 'bajra', 'semolina', 'sooji', 'rava', 'poha', 'noodle', 'pasta', 'bread', 'roti', 'chapati', 'maida'],
    'Dairy Products': ['milk', 'butter', 'ghee', 'cheese', 'curd', 'yogurt', 'paneer', 'cream', 'buttermilk'],
    'Fruits & Vegetables': ['fruit', 'vegetable', 'apple', 'banana', 'orange', 'mango', 'grape', 'potato', 'onion', 'tomato', 'carrot', 'spinach', 'cabbage', 'pea', 'bean', 'broccoli', 'cucumber', 'capsicum', 'garlic', 'ginger'],
    'Beverages': ['tea', 'coffee', 'juice', 'water', 'drink', 'beverage', 'squash', 'syrup', 'horlicks', 'bournvita', 'complan'],
    'Snacks & Sweets': ['biscuit', 'cookie', 'chocolate', 'candy', 'sweet', 'chip', 'namkeen', 'snack', 'cake', 'jam', 'jelly', 'honey', 'sugar', 'jaggery', 'gur'],
    'Hygiene & Toiletries': ['soap', 'shampoo', 'toothpaste', 'toothbrush', 'sanitizer', 'detergent', 'tissue', 'napkin', 'diaper', 'sanitary', 'handwash', 'disinfectant', 'comb', 'oil', 'lotion', 'cream', 'powder'],
    'Clothing': ['cloth', 'shirt', 'pant', 'dress', 'shoe', 'sock', 'uniform', 'blanket', 'bedsheet', 'towel', 'sweater', 'jacket', 'cap', 'slipper', 'sandal'],
    'Stationery & Books': ['pen', 'pencil', 'notebook', 'eraser', 'sharpener', 'ruler', 'book', 'paper', 'crayon', 'color', 'sketch', 'bag', 'school', 'geometry'],
    'Medicine & Health': ['medicine', 'tablet', 'syrup', 'bandage', 'vitamin', 'supplement', 'first aid', 'ointment', 'drops', 'thermometer', 'mask', 'glove'],
  };

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        return category;
      }
    }
  }

  return 'Other';
}
