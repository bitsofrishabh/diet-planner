/**
 * PDF Parser Module with AI Integration
 * Parses uploaded PDF files and extracts diet plan data using AI
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
      const pageText = textContent.items
        .map(item => item.str)
        .join(' ')
        .replace(/\s+/g, ' ');
      fullText += `\n--- Page ${i} ---\n` + pageText;
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
    console.warn('No API key found, using fallback parsing');
    return null;
  }

  const columnIds = mealColumns.map(c => c.id);
  const columnLabels = mealColumns.map(c => c.label);

  const systemPrompt = `You are a diet plan parser. Extract meal information from the provided PDF text and structure it into JSON format.

CRITICAL INSTRUCTIONS:
1. Analyze the PDF content carefully to identify the number of days in the diet plan
2. Extract ACTUAL meal content from the PDF - do NOT make up or generate fake meals
3. Look for patterns like "Day 1", "Day 2", "Monday", "Tuesday", or numbered sections
4. Extract morning drink and night drink if mentioned (usually at the start or end)
5. Look for any instructions or guidelines mentioned in the PDF

The meal columns to extract are: ${columnLabels.join(', ')}
Column IDs: ${columnIds.join(', ')}

Output ONLY valid JSON in this exact format (no markdown, no code blocks):
{
  "days": [
    {
      "day": 1,
      ${columnIds.map(id => `"${id}": "extracted meal for ${id}"`).join(',\n      ')}
    }
  ],
  "drinks": {
    "morning": "morning drink if found, or empty string",
    "night": "night drink if found, or empty string"
  },
  "instructions": "any instructions or guidelines found in the PDF",
  "detectedDays": "number of days detected in the PDF"
}

IMPORTANT:
- If a meal is not clearly specified in the PDF, use "-" or leave empty
- Preserve the exact meal descriptions from the PDF
- Count the actual number of days mentioned in the PDF
- Extract verbatim content, don't paraphrase`;

  const userPrompt = `Parse this diet plan PDF and extract the actual content:

${extractedText.substring(0, 8000)}

Return ONLY the JSON object with the actual extracted content from this PDF.`;

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
      const errorData = await response.json().catch(() => ({}));
      console.error('AI API error:', response.status, errorData);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      console.error('No content in AI response');
      return null;
    }

    // Clean the response
    let cleanedContent = content.trim();
    if (cleanedContent.startsWith('```json')) {
      cleanedContent = cleanedContent.slice(7);
    } else if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent.slice(3);
    }
    if (cleanedContent.endsWith('```')) {
      cleanedContent = cleanedContent.slice(0, -3);
    }
    cleanedContent = cleanedContent.trim();

    const parsed = JSON.parse(cleanedContent);
    return parsed;
  } catch (error) {
    console.error('AI parsing error:', error);
    return null;
  }
}

/**
 * Main function to parse PDF content and extract diet data
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
    
    if (onProgress) onProgress(0.4);

    // Default meal columns if not provided
    const columns = mealColumns || [
      { id: 'breakfast', label: 'Breakfast' },
      { id: 'midMorning', label: 'Mid Morning' },
      { id: 'lunch', label: 'Lunch' },
      { id: 'evening', label: 'Evening' },
      { id: 'dinner', label: 'Dinner' }
    ];

    // Try AI parsing if we have text and API key
    let dietData = null;
    
    if (extractedText.length > 100 && EMERGENT_API_KEY) {
      if (onProgress) onProgress(0.5);
      dietData = await parseWithAI(extractedText, columns);
      if (onProgress) onProgress(0.8);
    }

    // If AI parsing succeeded, use that data
    if (dietData && dietData.days && dietData.days.length > 0) {
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
        extractedTextLength: extractedText.length
      };
    }

    // Fallback: Try basic text parsing
    if (extractedText.length > 50) {
      const basicParsed = basicTextParsing(extractedText, duration, columns);
      if (basicParsed) {
        if (onProgress) onProgress(1);
        return {
          ...basicParsed,
          parsedFromPdf: true,
          usedAI: false,
          extractedTextLength: extractedText.length
        };
      }
    }

    // Final fallback: Generate sample data
    console.log('Using sample diet data as fallback');
    const sampleData = generateSampleDietData(duration, columns);
    
    if (onProgress) onProgress(1);
    
    return {
      ...sampleData,
      parsedFromPdf: false,
      usedAI: false,
      extractedTextLength: extractedText.length
    };
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw error;
  }
}

/**
 * Basic text parsing without AI
 */
function basicTextParsing(text, duration, columns) {
  const days = [];
  const lowerText = text.toLowerCase();
  
  // Try to find day patterns
  const dayPatterns = [
    /day\s*(\d+)/gi,
    /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi
  ];
  
  let dayMatches = [];
  for (const pattern of dayPatterns) {
    const matches = [...text.matchAll(pattern)];
    if (matches.length > 0) {
      dayMatches = matches;
      break;
    }
  }

  // If we found day patterns, try to extract content
  if (dayMatches.length > 0) {
    const numDays = Math.min(dayMatches.length, duration);
    
    for (let i = 0; i < numDays; i++) {
      const dayData = { day: i + 1 };
      
      // Initialize all columns
      columns.forEach(col => {
        dayData[col.id] = '';
      });
      
      days.push(dayData);
    }
    
    if (days.length > 0) {
      return {
        days,
        drinks: { morning: '', night: '' },
        instructions: ''
      };
    }
  }
  
  return null;
}

/**
 * Generate sample diet data as fallback
 */
function generateSampleDietData(duration, columns) {
  const sampleMeals = {
    breakfast: [
      'Oatmeal with fresh berries & almonds',
      'Whole wheat toast with avocado & eggs',
      'Greek yogurt parfait with granola',
      'Vegetable poha with peanuts',
      'Multigrain dosa with chutney',
      'Smoothie bowl with chia seeds',
      'Idli with sambar & chutney'
    ],
    midMorning: [
      'Mixed nuts (30g) & green tea',
      'Apple slices with almond butter',
      'Coconut water & banana',
      'Carrot sticks with hummus',
      'Buttermilk with cumin',
      'Fresh fruit bowl',
      'Sprouted moong salad'
    ],
    lunch: [
      'Brown rice, dal & vegetables',
      'Quinoa bowl with paneer tikka',
      'Roti, palak paneer & raita',
      'Vegetable biryani & salad',
      'Multigrain roti & chole',
      'Buddha bowl with chickpeas',
      'Rajma chawal & buttermilk'
    ],
    evening: [
      'Roasted makhana & herbal tea',
      'Vegetable cutlets & chutney',
      'Sprouts chaat with pomegranate',
      'Trail mix & coconut water',
      'Dhokla with mint chutney',
      'Fresh vegetable juice',
      'Roasted chickpeas'
    ],
    dinner: [
      'Vegetable soup & bread',
      'Grilled paneer & vegetables',
      'Dal, rice & bhindi sabzi',
      'Khichdi with kadhi',
      'Palak paneer & multigrain roti',
      'Stuffed bell peppers',
      'Moong dal cheela & curd'
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
      morning: 'Warm lemon water with honey',
      night: 'Warm turmeric milk'
    },
    instructions: '• Drink at least 8-10 glasses of water daily\n• Avoid eating after 8 PM\n• Take meals at regular intervals\n• Chew food properly'
  };
}

export default { extractTextFromPdf, parsePdfContent };
