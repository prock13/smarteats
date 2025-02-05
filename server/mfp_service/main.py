from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import myfitnesspal
import uvicorn
from typing import Dict, Optional

app = FastAPI()

class DiaryResponse(BaseModel):
    total_calories: float
    goals: Dict[str, float]
    total_macros: Dict[str, float]

@app.get("/diary/{username}/{date}")
async def get_diary(username: str, date: str) -> DiaryResponse:
    try:
        client = myfitnesspal.Client(username)
        day = client.get_date(date)
        
        return {
            "total_calories": day.totals.get("calories", 0),
            "goals": {
                "calories": day.goals.get("calories", 2000)
            },
            "total_macros": {
                "protein": day.totals.get("protein", 0),
                "carbohydrates": day.totals.get("carbs", 0),
                "fat": day.totals.get("fat", 0)
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/verify/{username}")
async def verify_user(username: str) -> Dict[str, bool]:
    try:
        client = myfitnesspal.Client(username)
        # Try to get today's data to verify the account works
        client.get_date("today")
        return {"valid": True}
    except:
        return {"valid": False}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5001)
