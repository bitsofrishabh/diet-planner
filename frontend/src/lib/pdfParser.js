/**
 * PDF Parser Module
 * Parses uploaded PDF files and extracts diet plan data
 * Note: This is a MOCK implementation for the frontend prototype
 * In production, this would use a proper PDF parsing library or backend API
 */

import * as pdfjsLib from 'pdfjs-dist';

// Set worker source - using CDN for simplicity
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

/**
 * Extract text content from PDF file
 */
export async function extractTextFromPdf(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + '\n';
    }

    return fullText;
  } catch (error) {
    console.error('Error extracting PDF text:', error);
    throw error;
  }
}

/**
 * Parse PDF content and extract diet data
 * This mock version generates structured diet data
 * In production, this would use NLP/AI to parse actual PDF content
 */
export async function parsePdfContent(file, duration = 7, onProgress) {
  try {
    // Extract text from PDF
    if (onProgress) onProgress(0.2);
    
    let extractedText = '';
    try {
      extractedText = await extractTextFromPdf(file);
    } catch (e) {
      console.warn('PDF extraction failed, using mock data');
    }
    
    if (onProgress) onProgress(0.5);

    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (onProgress) onProgress(0.8);

    // Parse the extracted text (mock implementation)
    const dietData = parseTextToDietData(extractedText, duration);
    
    if (onProgress) onProgress(1);
    
    return dietData;
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw error;
  }
}

/**
 * Convert extracted text to structured diet data
 * Mock implementation that generates realistic diet plans
 */
function parseTextToDietData(text, duration) {
  // Check if we have any meaningful text to parse
  const hasContent = text && text.trim().length > 100;
  
  // Sample meals database for generating diet plans
  const mealDatabase = {
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

  // If we detected content from PDF, try to extract keywords
  // and match with our database (simplified mock logic)
  let usePdfContent = false;
  let detectedMeals = [];
  
  if (hasContent) {
    // Simple keyword detection (mock AI parsing)
    const lowerText = text.toLowerCase();
    const keywords = ['breakfast', 'lunch', 'dinner', 'snack', 'morning', 'evening'];
    const foundKeywords = keywords.filter(k => lowerText.includes(k));
    
    if (foundKeywords.length >= 2) {
      usePdfContent = true;
      // In real implementation, we'd use NLP here
    }
  }

  // Generate diet data
  const days = [];
  for (let i = 0; i < duration; i++) {
    // Use different meals for variety, cycling through the database
    const mealIndex = i % mealDatabase.breakfast.length;
    const altIndex = (i + 3) % mealDatabase.breakfast.length;
    
    days.push({
      day: i + 1,
      breakfast: mealDatabase.breakfast[i % mealDatabase.breakfast.length],
      midMorning: mealDatabase.midMorning[(i + 2) % mealDatabase.midMorning.length],
      lunch: mealDatabase.lunch[i % mealDatabase.lunch.length],
      evening: mealDatabase.evening[(i + 1) % mealDatabase.evening.length],
      dinner: mealDatabase.dinner[(i + 3) % mealDatabase.dinner.length]
    });
  }

  return {
    days,
    parsedFromPdf: usePdfContent,
    extractedTextLength: text?.length || 0
  };
}

export default { extractTextFromPdf, parsePdfContent };
