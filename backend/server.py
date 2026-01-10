from fastapi import FastAPI, APIRouter, UploadFile, File
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import httpx
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'test_database')]

# API Keys
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')
OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

class ParseDietRequest(BaseModel):
    text: str
    meal_columns: List[Dict[str, str]]

class ParseDietResponse(BaseModel):
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

# Routes
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    return status_checks

@api_router.post("/parse-diet", response_model=ParseDietResponse)
async def parse_diet_text(request: ParseDietRequest):
    """Parse diet plan text using AI"""
    
    if not EMERGENT_LLM_KEY:
        return ParseDietResponse(success=False, error="API key not configured")
    
    try:
        column_ids = [c.get('id', '') for c in request.meal_columns]
        column_labels = [c.get('label', '') for c in request.meal_columns]
        
        system_prompt = f"""You are an expert diet plan parser. Parse the diet plan text and extract structured data.

IMPORTANT: The diet plans follow these common formats:
1. "MRNG DRINK" or "Morning Drink" - morning drink before breakfast
2. "NIGHT DRINK" or "Night drink" - drink before bed  
3. Days are marked as "DAY 1", "Day 1", etc.
4. Meals include: Breakfast, Mid-morning, Lunch, Evening/Snack, Dinner
5. Some plans have "11 am" snacks or "4:30" snacks

Extract the EXACT meal content from the text. Map meals to these columns: {', '.join(column_labels)}

For meal mapping:
- "Breakfast" → breakfast
- "Mid-morning", "11 am", "11am" → midMorning  
- "Lunch" → lunch
- "Evening", "Snack", "4:30", "4 pm" → evening
- "Dinner" → dinner

Output ONLY valid JSON (no markdown, no code blocks):
{{
  "days": [
    {{
      "day": 1,
      {', '.join([f'"{id}": "exact meal from text"' for id in column_ids])}
    }}
  ],
  "drinks": {{
    "morning": "morning drink from text or empty string",
    "night": "night drink from text or empty string"
  }},
  "instructions": "any additional instructions found",
  "totalDays": number
}}

Rules:
- Extract VERBATIM meal text
- Count total days accurately
- Include ALL days found
- Keep meal descriptions concise but complete"""

        user_prompt = f"Parse this diet plan:\n\n{request.text[:8000]}\n\nReturn complete JSON with all days."

        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                OPENAI_API_URL,
                headers={
                    'Content-Type': 'application/json',
                    'Authorization': f'Bearer {EMERGENT_LLM_KEY}'
                },
                json={
                    'model': 'gpt-4o-mini',
                    'messages': [
                        {'role': 'system', 'content': system_prompt},
                        {'role': 'user', 'content': user_prompt}
                    ],
                    'temperature': 0.1,
                    'max_tokens': 4000
                }
            )
            
            if response.status_code != 200:
                return ParseDietResponse(
                    success=False, 
                    error=f"API error: {response.status_code}"
                )
            
            data = response.json()
            content = data.get('choices', [{}])[0].get('message', {}).get('content', '')
            
            if not content:
                return ParseDietResponse(success=False, error="No content in response")
            
            # Clean response
            cleaned = content.strip()
            if cleaned.startswith('```json'):
                cleaned = cleaned[7:]
            elif cleaned.startswith('```'):
                cleaned = cleaned[3:]
            if cleaned.endswith('```'):
                cleaned = cleaned[:-3]
            
            parsed = json.loads(cleaned.strip())
            
            return ParseDietResponse(success=True, data=parsed)
            
    except json.JSONDecodeError as e:
        logging.error(f"JSON parse error: {e}")
        return ParseDietResponse(success=False, error=f"JSON parse error: {str(e)}")
    except Exception as e:
        logging.error(f"Parse error: {e}")
        return ParseDietResponse(success=False, error=str(e))

# Include the router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
