import httpx
from typing import Optional, Dict, Tuple

NOMINATIM_REVERSE_URL = "https://nominatim.openstreetmap.org/reverse"
NOMINATIM_SEARCH_URL = "https://nominatim.openstreetmap.org/search"

# Mapping of countries to continents
CONTINENT_MAP = {
    # Europe
    "Italy": "Europe", "Germany": "Europe", "France": "Europe", "Spain": "Europe",
    "United Kingdom": "Europe", "Poland": "Europe", "Netherlands": "Europe",
    "Belgium": "Europe", "Greece": "Europe", "Portugal": "Europe", "Sweden": "Europe",
    "Austria": "Europe", "Switzerland": "Europe", "Ireland": "Europe", "Norway": "Europe",
    "Denmark": "Europe", "Finland": "Europe", "Czech Republic": "Europe", "Czechia": "Europe",
    "Hungary": "Europe", "Romania": "Europe", "Croatia": "Europe", "Slovenia": "Europe",
    "Slovakia": "Europe", "Bulgaria": "Europe", "Serbia": "Europe", "Ukraine": "Europe",
    "Russia": "Europe", "Turkey": "Europe", "Iceland": "Europe", "Luxembourg": "Europe",
    # Americas
    "United States": "North America", "Canada": "North America", "Mexico": "North America",
    "Brazil": "South America", "Argentina": "South America", "Chile": "South America",
    "Colombia": "South America", "Peru": "South America", "Venezuela": "South America",
    "Ecuador": "South America", "Bolivia": "South America", "Uruguay": "South America",
    "Costa Rica": "North America", "Panama": "North America", "Cuba": "North America",
    # Asia
    "China": "Asia", "Japan": "Asia", "South Korea": "Asia", "India": "Asia",
    "Thailand": "Asia", "Vietnam": "Asia", "Indonesia": "Asia", "Philippines": "Asia",
    "Singapore": "Asia", "Malaysia": "Asia", "Taiwan": "Asia", "Hong Kong": "Asia",
    "United Arab Emirates": "Asia", "Saudi Arabia": "Asia", "Israel": "Asia",
    "Nepal": "Asia", "Sri Lanka": "Asia", "Cambodia": "Asia", "Myanmar": "Asia",
    # Africa
    "Egypt": "Africa", "South Africa": "Africa", "Morocco": "Africa", "Kenya": "Africa",
    "Nigeria": "Africa", "Tunisia": "Africa", "Ethiopia": "Africa", "Tanzania": "Africa",
    "Ghana": "Africa", "Senegal": "Africa", "Uganda": "Africa", "Zimbabwe": "Africa",
    # Oceania
    "Australia": "Oceania", "New Zealand": "Oceania", "Fiji": "Oceania",
}

def get_continent(country: str) -> str:
    return CONTINENT_MAP.get(country, "Unknown")

async def reverse_geocode(lat: float, lng: float) -> Dict[str, Optional[str]]:
    """
    Call Nominatim API to get location details from coordinates.
    Returns dict with city, region, country, continent.
    """
    result = {"city": None, "region": None, "country": None, "continent": None}
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                NOMINATIM_REVERSE_URL,
                params={
                    "lat": lat,
                    "lon": lng,
                    "format": "json",
                    "addressdetails": 1,
                    "accept-language": "en",
                },
                headers={"User-Agent": "Odyssey/1.0"},
                timeout=5.0
            )
            
            if response.status_code == 200:
                data = response.json()
                address = data.get("address", {})
                
                result["city"] = (
                    address.get("city") or 
                    address.get("town") or 
                    address.get("village") or 
                    address.get("municipality") or
                    address.get("county")
                )
                
                result["region"] = address.get("state") or address.get("region")
                result["country"] = address.get("country")
                
                if result["country"]:
                    result["continent"] = get_continent(result["country"])
                    
    except Exception as e:
        print(f"Geocoding error: {e}")
    
    return result

async def forward_geocode(city_name: str) -> Optional[Tuple[float, float, Dict[str, Optional[str]]]]:
    """
    Convert a city name to coordinates and location details.
    Returns tuple of (latitude, longitude, location_dict) or None if not found.
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                NOMINATIM_SEARCH_URL,
                params={
                    "q": city_name,
                    "format": "json",
                    "addressdetails": 1,
                    "limit": 1,
                    "accept-language": "en",
                },
                headers={"User-Agent": "Odyssey/1.0"},
                timeout=5.0
            )
            
            if response.status_code == 200:
                results = response.json()
                if results:
                    first = results[0]
                    lat = float(first["lat"])
                    lon = float(first["lon"])
                    address = first.get("address", {})
                    
                    city = (
                        address.get("city") or 
                        address.get("town") or 
                        address.get("village") or 
                        address.get("municipality") or
                        city_name
                    )
                    
                    region = address.get("state") or address.get("region")
                    country = address.get("country")
                    continent = get_continent(country) if country else "Unknown"
                    
                    return (lat, lon, {
                        "city": city,
                        "region": region,
                        "country": country,
                        "continent": continent
                    })
    except Exception as e:
        print(f"Forward geocoding error: {e}")
    
    return None
