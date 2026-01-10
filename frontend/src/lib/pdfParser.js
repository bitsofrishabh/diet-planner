/**
 * PDF Parser Module - Uses Backend API for AI parsing
 */

import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/legacy/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

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
      
      // Get text items with positions for better structure
      const items = textContent.items;
      let lastY = null;
      let lineText = '';
      
      items.forEach((item) => {
        if (lastY !== null && Math.abs(item.transform[5] - lastY) > 5) {
          fullText += lineText.trim() + '\n';
          lineText = '';
        }
        lineText += item.str + ' ';
        lastY = item.transform[5];
      });
      
      fullText += lineText.trim() + '\n\n';
    }

    return fullText.trim();
  } catch (error) {
    console.error('Error extracting PDF text:', error);
    throw error;
  }
}

/**
 * Parse text using backend AI API
 */
async function parseWithBackendAI(text, mealColumns) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/parse-diet`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text,
        meal_columns: mealColumns.map(c => ({ id: c.id, label: c.label }))
      })
    });

    if (!response.ok) {
      console.error('Backend API error:', response.status);
      return null;
    }

    const result = await response.json();
    
    if (result.success && result.data) {
      console.log('AI parsed result:', result.data);
      return result.data;
    }
    
    console.error('Parse failed:', result.error);
    return null;
  } catch (error) {
    console.error('Backend API call failed:', error);
    return null;
  }
}

/**
 * Fallback: Parse text manually using patterns
 */
function parseTextManually(text, mealColumns) {
  const result = {
    days: [],
    drinks: { morning: '', night: '' },
    instructions: ''
  };

  // Extract morning drink
  const morningMatch = text.match(/(?:MRNG|Morning|Mrng)\s*(?:DRINK|drink)[:\s-]*([^\n]+)/i);
  if (morningMatch) {
    result.drinks.morning = morningMatch[1].trim();
  }

  // Extract night drink
  const nightMatch = text.match(/(?:NIGHT|Night|Bed\s*time)\s*(?:DRINK|drink)?[:\s-]*([^\n]+)/i);
  if (nightMatch) {
    result.drinks.night = nightMatch[1].trim();
  }

  // Find day sections
  const dayPattern = /(?:DAY|Day)\s*(\d+)/gi;
  const dayMatches = [...text.matchAll(dayPattern)];
  
  if (dayMatches.length === 0) {
    return null;
  }

  // Extract meals for each day
  for (let i = 0; i < dayMatches.length; i++) {
    const dayNum = parseInt(dayMatches[i][1]);
    const startIdx = dayMatches[i].index;
    const endIdx = i < dayMatches.length - 1 ? dayMatches[i + 1].index : text.length;
    const dayText = text.substring(startIdx, endIdx);
    
    const dayData = { day: dayNum };
    
    // Extract each meal type
    const breakfastMatch = dayText.match(/(?:Breakfast|BREAKFAST)[:\s]*([^\n]+)/i);
    dayData.breakfast = breakfastMatch ? breakfastMatch[1].trim() : '';
    
    const midMorningMatch = dayText.match(/(?:Mid-morning|Mid\s*morning|11\s*am)[:\s]*([^\n]+)/i);
    dayData.midMorning = midMorningMatch ? midMorningMatch[1].trim() : '';
    
    const lunchMatch = dayText.match(/(?:Lunch|LUNCH)[:\s]*([^\n]+)/i);
    dayData.lunch = lunchMatch ? lunchMatch[1].trim() : '';
    
    const eveningMatch = dayText.match(/(?:Evening|Snack|4:30|4\s*pm)[:\s]*([^\n]+)/i);
    dayData.evening = eveningMatch ? eveningMatch[1].trim() : '';
    
    const dinnerMatch = dayText.match(/(?:Dinner|DINNER)[:\s]*([^\n]+)/i);
    dayData.dinner = dinnerMatch ? dinnerMatch[1].trim() : '';
    
    result.days.push(dayData);
  }

  return result.days.length > 0 ? result : null;
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
    
    // Try backend AI parsing first
    if (extractedText.length > 50) {
      if (onProgress) onProgress(0.4);
      console.log('Calling backend AI parser...');
      dietData = await parseWithBackendAI(extractedText, columns);
      if (onProgress) onProgress(0.7);
    }

    // If AI failed, try manual parsing
    if (!dietData || !dietData.days || dietData.days.length === 0) {
      console.log('AI parsing failed, trying manual parsing...');
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
        usedAI: false,
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
      usedAI: true,
      extractedTextLength: extractedText.length,
      totalDays: dietData.days.length
    };
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw error;
  }
}

export default { extractTextFromPdf, parsePdfContent };
