from typing import Annotated, List, Optional
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
import httpx

router = APIRouter(prefix="/geocode", tags=["geocoding"])

NOMINATIM_SEARCH_URL = "https://nominatim.openstreetmap.org/search"

class CityResult(BaseModel):
    display_name: str
    city: Optional[str]
    country: Optional[str]
    latitude: float
    longitude: float

@router.get("/search", response_model=List[CityResult])
async def search_cities(
    q: str = Query(..., min_length=2, description="Search query")
):
    """Search for cities/places using Nominatim API."""
    results = []
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                NOMINATIM_SEARCH_URL,
                params={
                    "q": q,
                    "format": "json",
                    "addressdetails": 1,
                    "limit": 5,
                    "accept-language": "en",
                },
                headers={"User-Agent": "Odyssey/1.0"},
                timeout=5.0
            )
            
            if response.status_code == 200:
                data = response.json()
                for item in data:
                    address = item.get("address", {})
                    city = (
                        address.get("city") or 
                        address.get("town") or 
                        address.get("village") or 
                        address.get("municipality") or
                        address.get("county")
                    )
                    results.append(CityResult(
                        display_name=item.get("display_name", ""),
                        city=city,
                        country=address.get("country"),
                        latitude=float(item["lat"]),
                        longitude=float(item["lon"])
                    ))
    except Exception as e:
        print(f"Geocoding search error: {e}")
    
    return results
