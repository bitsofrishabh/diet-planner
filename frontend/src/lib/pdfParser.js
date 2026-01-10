/**
 * PDF Parser Module - Client-side parsing only
 */

import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/legacy/build/pdf.worker.min.mjs',
  import.meta.url
).toString();


/**
 * Extract text content from PDF file
 */
export async function extractTextFromPdf(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ 
      data: arrayBuffer,
      useSystemFonts: true
    }).promise;
    
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageLines = buildPageLines(textContent);
      fullText += pageLines.join('\n') + '\n\n';
    }

    return fullText.trim();
  } catch (error) {
    console.error('Error extracting PDF text:', error);
    throw error;
  }
}

/**
 * Fallback: Parse text manually using patterns
 */
function parseTextManually(text, mealColumns) {
  return parseStructuredDietText(text, mealColumns);
}

/**
 * Generate sample diet data
 */
function generateSampleDietData(duration, columns) {
  const sampleMeals = {
    breakfast: [
      'Vegetable Upma + 5 soaked almonds',
      'Vegetable Oats + 5 soaked almonds',
      'Moong dal cheela with chutney',
      'Poha with vegetables',
      '2 Besan chilla + green chutney',
      'Ragi dosa + coconut chutney',
      'Sprouts chaat bowl',
      'Vegetable idli + sambar',
      'Suji vegetable cheela',
      'Poha with peanuts'
    ],
    midMorning: [
      'Papaya', '1 Guava', '1 Orange', 'Kiwi', '1 Apple',
      'Pomegranate', '1 Pear', '1 bowl pomegranate', 'Kiwi', 'Kiwi'
    ],
    lunch: [
      '1 Roti + Dal + Steam Salad',
      'Rice + Sambar + Salad',
      '1 Roti + Chole + Sabzi',
      '1 Jowar roti + Lauki sabzi',
      '1 Bajra roti + Vegetable curry',
      'Rice + Rajma + Steam salad',
      '1 Multigrain roti + Palak dal',
      '1 jowar roti + cabbage sabzi',
      '1 multigrain roti + lauki raita',
      '1 bajra roti + bhindi sabzi'
    ],
    evening: [
      'Green tea + Makhana',
      'Roasted chana + Green tea',
      'Fruit chaat + Green tea',
      'Yerba Mate + Makhana',
      'Roasted peanuts + Green tea',
      'Fruit bowl + Green tea',
      'Green tea',
      'ACV + Green tea',
      'Makhana + Green tea',
      'Roasted chana'
    ],
    dinner: [
      'Vegetable Soup',
      '1 Roti + Tori sabzi',
      'Moong dal khichdi',
      'Rasam rice',
      'Stir-fried veggies',
      'Lauki soup',
      'Tomato soup',
      '1 bowl khichdi + salad',
      'Vegetable daliya',
      'Paneer vegetable soup'
    ]
  };

  const days = [];
  for (let i = 0; i < duration; i++) {
    const dayData = { day: i + 1 };
    columns.forEach(col => {
      if (sampleMeals[col.id]) {
        dayData[col.id] = sampleMeals[col.id][i % 10];
      } else {
        dayData[col.id] = '';
      }
    });
    days.push(dayData);
  }

  return {
    days,
    drinks: {
      morning: 'Methi seeds water (soaked overnight)',
      night: 'Ajwain cinnamon jeera water'
    },
    instructions: '• Drink 8-10 glasses of water daily\n• Avoid eating after 8 PM\n• Chew food properly\n• Take meals at regular intervals'
  };
}

/**
 * Main function to parse PDF content
 */
export async function parsePdfContent(file, duration = 7, onProgress, mealColumns) {
  try {
    if (onProgress) onProgress(0.1);
    
    let extractedText = '';
    
    // Extract text from PDF
    try {
      extractedText = await extractTextFromPdf(file);
      console.log('Extracted text length:', extractedText.length);
      console.log('Extracted text preview:', extractedText.substring(0, 500));
    } catch (e) {
      console.warn('PDF extraction failed:', e.message);
    }
    
    if (onProgress) onProgress(0.3);

    // Default columns
    const columns = mealColumns || [
      { id: 'breakfast', label: 'Breakfast' },
      { id: 'midMorning', label: 'Mid Morning' },
      { id: 'lunch', label: 'Lunch' },
      { id: 'evening', label: 'Evening' },
      { id: 'dinner', label: 'Dinner' }
    ];

    let dietData = null;

    if (extractedText.length > 50) {
      if (onProgress) onProgress(0.5);
      dietData = parseTextManually(extractedText, columns);
    }

    // If both failed, use sample data
    if (!dietData || !dietData.days || dietData.days.length === 0) {
      console.log('Using sample data as fallback');
      dietData = generateSampleDietData(duration, columns);
      
      if (onProgress) onProgress(1);
      return {
        ...dietData,
        parsedFromPdf: false,
        extractedTextLength: extractedText.length
      };
    }

    // Ensure day numbers are correct
    dietData.days = dietData.days.map((day, idx) => ({
      ...day,
      day: idx + 1
    }));

    if (onProgress) onProgress(1);
    
    return {
      ...dietData,
      parsedFromPdf: true,
      extractedTextLength: extractedText.length,
      totalDays: dietData.days.length
    };
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw error;
  }
}

function buildPageLines(textContent) {
  const items = (textContent.items || [])
    .filter(item => item.str && item.str.trim())
    .map(item => ({
      str: item.str,
      x: item.transform?.[4] ?? 0,
      y: item.transform?.[5] ?? 0,
      width: item.width ?? 0
    }));

  if (items.length === 0) {
    return [];
  }

  const lines = [];
  const yThreshold = 2;

  for (const item of items) {
    let line = lines.find(existing => Math.abs(existing.y - item.y) <= yThreshold);
    if (!line) {
      line = { y: item.y, items: [] };
      lines.push(line);
    }
    line.items.push(item);
  }

  lines.sort((a, b) => b.y - a.y);

  return lines.map(line => {
    const sortedItems = line.items.sort((a, b) => a.x - b.x);
    let lineText = '';
    let prev = null;

    for (const item of sortedItems) {
      if (prev) {
        const avgCharWidth = prev.str.length ? prev.width / prev.str.length : 3;
        const gap = item.x - (prev.x + prev.width);
        if (gap > avgCharWidth * 0.8) {
          const spaces = Math.min(10, Math.max(1, Math.round(gap / avgCharWidth)));
          lineText += ' '.repeat(spaces);
        } else {
          lineText += ' ';
        }
      }
      lineText += item.str;
      prev = item;
    }

    return lineText.trim();
  }).filter(Boolean);
}

function parseStructuredDietText(rawText, mealColumns) {
  const flatText = rawText.replace(/\r/g, ' ').replace(/\n/g, ' ');
  const headerSection = flatText.split(/\bDAY\s*1\b/i)[0] || '';
  const drinks = extractDrinksFromHeader(headerSection);

  const daySegments = splitIntoDaySegments(flatText);
  if (daySegments.length === 0) {
    return null;
  }

  const columnTypeMap = buildColumnTypeMap(mealColumns);
  const headerOrder = detectHeaderOrder(headerSection);

  const days = [];

  for (const segment of daySegments) {
    const dayData = createEmptyDay(segment.day, mealColumns);
    const labeledMeals = parseLabeledMeals(segment.text, columnTypeMap);
    if (labeledMeals) {
      applyMeals(dayData, labeledMeals);
    } else {
      const spacedMeals = parseSpacingMeals(segment.text, headerOrder, columnTypeMap, mealColumns);
      if (!spacedMeals) {
        return null;
      }
      applyMeals(dayData, spacedMeals);
    }
    days.push(dayData);
  }

  if (days.length === 0) {
    return null;
  }

  return {
    days,
    drinks,
    instructions: ''
  };
}

function extractDrinksFromHeader(headerSection) {
  const cleaned = normalizeText(headerSection);
  const morning = extractSection(cleaned, /\b(?:MRNG|MORNING)\b[^:]*[:\-]?\s*/i, /\bNIGHT\b|\bDAY\s*1\b/i);
  const night = extractSection(cleaned, /\bNIGHT\b[^:]*[:\-]?\s*/i, /\bDAY\s*1\b/i);

  return {
    morning: morning ? sanitizeValue(morning) : '',
    night: night ? sanitizeValue(night) : ''
  };
}

function extractSection(text, startRegex, endRegex) {
  const startMatch = text.match(startRegex);
  if (!startMatch || startMatch.index == null) return '';

  const startIndex = startMatch.index + startMatch[0].length;
  const remainder = text.slice(startIndex);
  const endMatch = remainder.match(endRegex);
  const endIndex = endMatch && endMatch.index != null ? startIndex + endMatch.index : text.length;
  return text.slice(startIndex, endIndex).trim();
}

function splitIntoDaySegments(text) {
  const dayRegex = /\bDAY\s*(\d+)\b/gi;
  const matches = [...text.matchAll(dayRegex)];
  if (matches.length === 0) return [];

  return matches.map((match, index) => {
    const startIndex = match.index + match[0].length;
    const endIndex = index + 1 < matches.length ? matches[index + 1].index : text.length;
    return {
      day: Number(match[1]) || index + 1,
      text: text.slice(startIndex, endIndex).trim()
    };
  });
}

function parseLabeledMeals(segmentText, columnTypeMap) {
  const cleaned = normalizeText(segmentText);
  const labelRegex = /\b(Breakfast|Mid[-\s]?morning|Lunch|Evening|Dinner|Snack)\b\s*[:\-]/gi;
  const matches = [...cleaned.matchAll(labelRegex)];
  if (matches.length === 0) return null;

  const meals = {};
  for (let i = 0; i < matches.length; i++) {
    const label = matches[i][1].toLowerCase();
    const startIndex = matches[i].index + matches[i][0].length;
    const endIndex = i + 1 < matches.length ? matches[i + 1].index : cleaned.length;
    const value = sanitizeValue(cleaned.slice(startIndex, endIndex));
    const type = label.includes('mid') ? 'midMorning' : label.includes('snack') || label.includes('evening') ? 'evening' : label;
    const targetId = columnTypeMap[type];
    if (targetId && value) {
      meals[targetId] = value;
    }
  }

  const timeSnackMatches = [...cleaned.matchAll(/\b\d{1,2}[:;.\u00A0]\d{2}\s*[-–]\s*.*?(?=\b(?:Breakfast|Mid[-\s]?morning|Lunch|Evening|Dinner)\b|$)/gi)];
  if (timeSnackMatches.length > 0) {
    const snackText = sanitizeValue(timeSnackMatches.map(match => match[0]).join('; '));
    const targetId = columnTypeMap.evening;
    if (targetId) {
      meals[targetId] = meals[targetId] ? `${meals[targetId]}; ${snackText}` : snackText;
    }
  }

  return Object.keys(meals).length > 0 ? meals : null;
}

function parseSpacingMeals(segmentText, headerOrder, columnTypeMap, mealColumns) {
  const parts = segmentText
    .trim()
    .split(/\s{2,}/)
    .map(part => part.trim())
    .filter(Boolean);

  if (parts.length < 2) {
    return null;
  }

  const orderedTypes = headerOrder.length ? headerOrder : [];
  let targetIds = orderedTypes.map(type => columnTypeMap[type]).filter(Boolean);

  if (targetIds.length === 0) {
    targetIds = mealColumns.map(column => column.id);
  }

  let normalizedParts = parts;
  if (normalizedParts.length > targetIds.length) {
    const head = normalizedParts.slice(0, targetIds.length - 1);
    head.push(normalizedParts.slice(targetIds.length - 1).join(' '));
    normalizedParts = head;
  }

  const meals = {};
  targetIds.forEach((id, index) => {
    meals[id] = sanitizeValue(normalizedParts[index] || '');
  });

  return meals;
}

function detectHeaderOrder(headerSection) {
  const lowerHeader = headerSection.toLowerCase();
  const candidates = [
    { type: 'breakfast', regex: /breakfast/i },
    { type: 'midMorning', regex: /mid[-\s]?morning/i },
    { type: 'lunch', regex: /lunch/i },
    { type: 'evening', regex: /(snack|evening)/i },
    { type: 'dinner', regex: /dinner/i }
  ];

  const found = candidates
    .map(candidate => {
      const match = lowerHeader.match(candidate.regex);
      return match ? { type: candidate.type, index: match.index } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.index - b.index);

  return found.map(entry => entry.type);
}

function buildColumnTypeMap(mealColumns) {
  const map = {};
  mealColumns.forEach(column => {
    const label = column.label.toLowerCase();
    if (label.includes('breakfast')) map.breakfast = column.id;
    if (label.includes('mid')) map.midMorning = column.id;
    if (label.includes('lunch')) map.lunch = column.id;
    if (label.includes('snack') || label.includes('evening')) map.evening = column.id;
    if (label.includes('dinner')) map.dinner = column.id;
  });

  ['breakfast', 'midMorning', 'lunch', 'evening', 'dinner'].forEach(type => {
    if (!map[type] && mealColumns.some(column => column.id === type)) {
      map[type] = type;
    }
  });

  return map;
}

function createEmptyDay(dayNumber, mealColumns) {
  const dayData = { day: dayNumber };
  mealColumns.forEach(column => {
    dayData[column.id] = '';
  });
  return dayData;
}

function applyMeals(dayData, meals) {
  Object.entries(meals).forEach(([id, value]) => {
    if (id in dayData) {
      dayData[id] = value;
    }
  });
}

function normalizeText(text) {
  return text
    .replace(/[•●▪◆◼]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function sanitizeValue(value) {
  return value
    .replace(/[•●▪◆◼]/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export default { extractTextFromPdf, parsePdfContent };
