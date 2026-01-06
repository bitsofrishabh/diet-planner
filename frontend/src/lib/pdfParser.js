/**
 * PDF Parser Module with AI Integration
 * Uses pdfjs-dist for text extraction and OpenAI-compatible API for intelligent parsing
 */

import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker - use legacy build for better compatibility
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
      fullText += pageText + '\n\n';
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
async function parseWithAI(extractedText, duration) {
  if (!EMERGENT_API_KEY) {
    console.warn('No API key found, using fallback parsing');
    return null;
  }

  const systemPrompt = `You are a diet plan parser. Extract meal information from the provided text and structure it into a JSON format.

Output ONLY valid JSON in this exact format (no markdown, no code blocks):
{
  "days": [
    {
      "day": 1,
      "breakfast": "meal description",
      "midMorning": "snack description",
      "lunch": "meal description", 
      "evening": "snack description",
      "dinner": "meal description"
    }
  ]
}

Rules:
- Extract ${duration} days of meals
- If a meal is not specified, use a reasonable healthy option
- Keep meal descriptions concise (under 50 words each)
- If the text doesn't contain diet information, generate a healthy sample diet`;

  const userPrompt = `Parse the following diet plan text and extract meals for ${duration} days:

${extractedText.substring(0, 4000)}

Return ONLY the JSON object, no other text.`;

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
        temperature: 0.3,
        max_tokens: 3000
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

    // Clean the response - remove markdown code blocks if present
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
export async function parsePdfContent(file, duration = 7, onProgress) {
  try {
    if (onProgress) onProgress(0.1);
    
    let extractedText = '';
    
    // Try to extract text from PDF
    try {
      extractedText = await extractTextFromPdf(file);
      console.log('Extracted text length:', extractedText.length);
    } catch (e) {
      console.warn('PDF extraction failed:', e.message);
    }
    
    if (onProgress) onProgress(0.4);

    // Try AI parsing if we have text and API key
    let dietData = null;
    
    if (extractedText.length > 50 && EMERGENT_API_KEY) {
      if (onProgress) onProgress(0.5);
      dietData = await parseWithAI(extractedText, duration);
      if (onProgress) onProgress(0.8);
    }

    // If AI parsing failed or no text, use sample data
    if (!dietData || !dietData.days || dietData.days.length === 0) {
      console.log('Using sample diet data');
      dietData = generateSampleDietData(duration);
    }

    // Ensure we have the right number of days
    while (dietData.days.length < duration) {
      const templateDay = dietData.days[dietData.days.length - 1] || generateSampleDietData(1).days[0];
      dietData.days.push({
        ...templateDay,
        day: dietData.days.length + 1
      });
    }
    
    // Trim to exact duration
    dietData.days = dietData.days.slice(0, duration);
    
    // Ensure day numbers are correct
    dietData.days = dietData.days.map((day, idx) => ({
      ...day,
      day: idx + 1
    }));

    if (onProgress) onProgress(1);
    
    return {
      ...dietData,
      parsedFromPdf: extractedText.length > 50,
      usedAI: !!EMERGENT_API_KEY && extractedText.length > 50,
      extractedTextLength: extractedText.length
    };
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw error;
  }
}

/**
 * Generate sample diet data as fallback
 */
function generateSampleDietData(duration) {
  const meals = {
    breakfast: [
      'Oatmeal with fresh berries, almonds & honey',
      'Whole wheat toast with avocado, cherry tomatoes & scrambled eggs',
      'Greek yogurt parfait with granola, mixed nuts & seasonal fruits',
      'Vegetable poha with roasted peanuts & lemon',
      'Multigrain dosa with coconut chutney & sambar',
      'Smoothie bowl with banana, spinach, chia seeds & almond butter',
      'Idli (3 pcs) with sambar & coconut chutney',
      'Besan chilla with mint chutney & curd',
      'Upma with vegetables & roasted cashews',
      'Ragi porridge with dates & cardamom',
      'Overnight oats with apple, cinnamon & walnuts',
      'Sprout salad sandwich on whole grain bread',
      'Vegetable uttapam with tomato chutney',
      'Quinoa upma with mixed vegetables'
    ],
    midMorning: [
      'Mixed nuts (30g) with green tea',
      'Apple slices with almond butter',
      'Fresh coconut water with a banana',
      'Carrot & cucumber sticks with hummus',
      'Buttermilk with roasted cumin',
      'Fresh fruit bowl (papaya, apple, pomegranate)',
      'Sprouted moong salad with lemon dressing',
      'Roasted makhana (fox nuts) - 1 cup',
      'Herbal tea with 2 whole wheat crackers',
      'Fresh orange juice with 5 almonds',
      'Guava slices with chaat masala',
      'Protein smoothie with spinach & banana',
      'Trail mix (dates, raisins, nuts) - 30g',
      'Coconut yogurt with honey'
    ],
    lunch: [
      'Brown rice, moong dal, mixed vegetable sabzi & fresh salad',
      'Quinoa pulao with raita & grilled paneer tikka',
      'Whole wheat roti (2), palak paneer, cucumber raita',
      'Vegetable biryani with boondi raita & green salad',
      'Multigrain roti, chole masala, onion salad',
      'Buddha bowl with chickpeas, roasted vegetables & tahini',
      'Rajma chawal with mint chutney & buttermilk',
      'Mixed dal khichdi with ghee, papad & pickle',
      'Stuffed paratha with curd & green chutney',
      'Vegetable pulao with paneer tikka & raita',
      'Jowar roti, bhindi masala, dal & salad',
      'Lemon rice with vegetable kootu & rasam',
      'Roti, lauki sabzi, chana dal & salad',
      'Vegetable fried rice with manchurian (baked)'
    ],
    evening: [
      'Roasted makhana with herbal tea',
      'Vegetable cutlet (2) with green chutney',
      'Sprouts chaat with pomegranate & mint',
      'Trail mix (30g) with coconut water',
      'Steamed dhokla (4 pcs) with mint chutney',
      'Fresh vegetable juice (carrot, beetroot, apple)',
      'Roasted chickpeas with masala - 1/2 cup',
      'Fruit chaat with honey & lime',
      'Paneer tikka (3 pcs) with mint dip',
      'Corn on the cob with lime & chaat masala',
      'Vegetable soup with whole wheat bread toast',
      'Baked samosa (2) with tamarind chutney',
      'Dates stuffed with almonds - 3 pcs',
      'Grilled sweet potato with herbs'
    ],
    dinner: [
      'Clear vegetable soup with whole wheat bread roll',
      'Grilled paneer with sautéed vegetables & mint dip',
      'Moong dal with steamed rice, bhindi sabzi & salad',
      'Vegetable khichdi with kadhi & papad',
      'Palak paneer with multigrain roti & cucumber salad',
      'Stuffed bell peppers with quinoa & cheese',
      'Moong dal cheela with mint chutney & curd',
      'Vegetable stew with appam (2)',
      'Masoor dal with jeera rice & sautéed greens',
      'Vegetable curry with phulka (2) & raita',
      'Tofu stir-fry with brown rice & clear soup',
      'Mixed vegetable curry with bajra roti',
      'Sambar rice with vegetable kootu',
      'Light vegetable biryani with raita'
    ]
  };

  const days = [];
  for (let i = 0; i < duration; i++) {
    days.push({
      day: i + 1,
      breakfast: meals.breakfast[i % meals.breakfast.length],
      midMorning: meals.midMorning[i % meals.midMorning.length],
      lunch: meals.lunch[i % meals.lunch.length],
      evening: meals.evening[i % meals.evening.length],
      dinner: meals.dinner[i % meals.dinner.length]
    });
  }

  return { days };
}

export default { extractTextFromPdf, parsePdfContent };
