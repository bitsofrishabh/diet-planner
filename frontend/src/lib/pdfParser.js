/**
 * PDF Parser Module with AI Integration
 * Optimized for diet plan PDFs from The Balance Diet
 */

import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/legacy/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

const EMERGENT_API_KEY = process.env.REACT_APP_EMERGENT_LLM_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

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
      
      // Get text items with their positions for better structure preservation
      const items = textContent.items;
      let lastY = null;
      let lineText = '';
      
      items.forEach((item, idx) => {
        if (lastY !== null && Math.abs(item.transform[5] - lastY) > 5) {
          // New line
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
 * Use AI to parse extracted text into structured diet data
 */
async function parseWithAI(extractedText, mealColumns) {
  if (!EMERGENT_API_KEY) {
    console.warn('No API key found');
    return null;
  }

  const columnIds = mealColumns.map(c => c.id);
  const columnLabels = mealColumns.map(c => c.label);

  const systemPrompt = `You are an expert diet plan parser. Parse the diet plan text and extract structured data.

IMPORTANT: The diet plans follow these common formats:
1. "MRNG DRINK" or "Morning Drink" - morning drink before breakfast
2. "NIGHT DRINK" or "Night drink" - drink before bed
3. Days are marked as "DAY 1", "Day 1", etc. or weekday names
4. Meals include: Breakfast, Mid-morning, Lunch, Evening/Snack, Dinner
5. Some plans have "11 am" snacks or "4:30" snacks

Extract the EXACT meal content from the PDF. Map meals to these columns: ${columnLabels.join(', ')}

For meal mapping:
- "Breakfast" → breakfast
- "Mid-morning", "11 am", "11am" → midMorning  
- "Lunch" → lunch
- "Evening", "Snack", "4:30", "4 pm" → evening
- "Dinner" → dinner

Output ONLY valid JSON (no markdown):
{
  "days": [
    {
      "day": 1,
      ${columnIds.map(id => `"${id}": "exact meal from PDF"`).join(',\n      ')}
    }
  ],
  "drinks": {
    "morning": "morning drink from PDF or empty string",
    "night": "night drink from PDF or empty string"
  },
  "instructions": "any additional instructions found",
  "totalDays": number
}

Rules:
- Extract VERBATIM meal text from the PDF
- Count total days accurately (7, 10, 14, etc.)
- Include ALL days found in the PDF
- If mid-morning says "papaya" just write "Papaya"
- Keep meal descriptions concise but complete`;

  const userPrompt = `Parse this diet plan and extract all meals:

${extractedText}

Return the complete JSON with all days found.`;

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${EMERGENT_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1,
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      console.error('AI API error:', response.status);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) return null;

    // Clean response
    let cleanedContent = content.trim();
    if (cleanedContent.startsWith('```json')) {
      cleanedContent = cleanedContent.slice(7);
    } else if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent.slice(3);
    }
    if (cleanedContent.endsWith('```')) {
      cleanedContent = cleanedContent.slice(0, -3);
    }

    const parsed = JSON.parse(cleanedContent.trim());
    console.log('AI Parsed result:', parsed);
    return parsed;
  } catch (error) {
    console.error('AI parsing error:', error);
    return null;
  }
}

/**
 * Fallback: Parse text without AI using patterns
 */
function parseTextManually(text, mealColumns) {
  const result = {
    days: [],
    drinks: { morning: '', night: '' },
    instructions: ''
  };

  // Extract morning drink
  const morningDrinkMatch = text.match(/(?:MRNG|Morning|Mrng)\s*(?:DRINK|drink)[:\s-]*([^\n]+)/i);
  if (morningDrinkMatch) {
    result.drinks.morning = morningDrinkMatch[1].trim();
  }

  // Extract night drink
  const nightDrinkMatch = text.match(/(?:NIGHT|Night|Bed\s*time)\s*(?:DRINK|drink)?[:\s-]*([^\n]+)/i);
  if (nightDrinkMatch) {
    result.drinks.night = nightDrinkMatch[1].trim();
  }

  // Find all day sections
  const dayPattern = /(?:DAY|Day)\s*(\d+)/gi;
  const dayMatches = [...text.matchAll(dayPattern)];
  
  if (dayMatches.length === 0) {
    return null;
  }

  // For each day, try to extract meals
  for (let i = 0; i < dayMatches.length; i++) {
    const dayNum = parseInt(dayMatches[i][1]);
    const startIdx = dayMatches[i].index;
    const endIdx = i < dayMatches.length - 1 ? dayMatches[i + 1].index : text.length;
    const dayText = text.substring(startIdx, endIdx);
    
    const dayData = { day: dayNum };
    
    // Extract breakfast
    const breakfastMatch = dayText.match(/(?:Breakfast|BREAKFAST)[:\s]*([^\n]+)/i);
    dayData.breakfast = breakfastMatch ? breakfastMatch[1].trim() : '';
    
    // Extract mid-morning
    const midMorningMatch = dayText.match(/(?:Mid-morning|Mid\s*morning|11\s*am)[:\s]*([^\n]+)/i);
    dayData.midMorning = midMorningMatch ? midMorningMatch[1].trim() : '';
    
    // Extract lunch
    const lunchMatch = dayText.match(/(?:Lunch|LUNCH)[:\s]*([^\n]+)/i);
    dayData.lunch = lunchMatch ? lunchMatch[1].trim() : '';
    
    // Extract evening/snack
    const eveningMatch = dayText.match(/(?:Evening|Snack|4:30|4\s*pm)[:\s]*([^\n]+)/i);
    dayData.evening = eveningMatch ? eveningMatch[1].trim() : '';
    
    // Extract dinner
    const dinnerMatch = dayText.match(/(?:Dinner|DINNER)[:\s]*([^\n]+)/i);
    dayData.dinner = dinnerMatch ? dinnerMatch[1].trim() : '';
    
    result.days.push(dayData);
  }

  return result.days.length > 0 ? result : null;
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
      console.log('Extracted text:', extractedText.substring(0, 1000));
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
    
    // Try AI parsing first
    if (extractedText.length > 50 && EMERGENT_API_KEY) {
      if (onProgress) onProgress(0.4);
      dietData = await parseWithAI(extractedText, columns);
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
      usedAI: !!EMERGENT_API_KEY,
      extractedTextLength: extractedText.length,
      totalDays: dietData.days.length
    };
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw error;
  }
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
      'Sprouts chaat bowl'
    ],
    midMorning: [
      'Papaya',
      '1 Guava',
      '1 Orange',
      'Kiwi',
      '1 Apple',
      'Pomegranate',
      '1 Pear'
    ],
    lunch: [
      '1 Roti + Dal + Steam Salad',
      'Rice + Sambar + Salad',
      '1 Roti + Chole + Sabzi',
      '1 Jowar roti + Lauki sabzi',
      '1 Bajra roti + Vegetable curry',
      'Rice + Rajma + Steam salad',
      '1 Multigrain roti + Palak dal'
    ],
    evening: [
      'Green tea + Makhana',
      'Roasted chana + Green tea',
      'Fruit chaat + Green tea',
      'Yerba Mate + Makhana',
      'Roasted peanuts + Green tea',
      'Fruit bowl + Green tea',
      'Green tea'
    ],
    dinner: [
      'Vegetable Soup',
      '1 Roti + Tori sabzi',
      'Moong dal khichdi',
      'Rasam rice',
      'Stir-fried veggies',
      'Lauki soup',
      'Tomato soup'
    ]
  };

  const days = [];
  for (let i = 0; i < duration; i++) {
    const dayData = { day: i + 1 };
    
    columns.forEach(col => {
      if (sampleMeals[col.id]) {
        dayData[col.id] = sampleMeals[col.id][i % 7];
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

export default { extractTextFromPdf, parsePdfContent };
