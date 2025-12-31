from sqlmodel import Session, select
from backend.models import User, Point

# Fibonacci sequence for milestones
FIBONACCI = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89]

# Max possible continents (7: Africa, Antarctica, Asia, Europe, North America, Oceania, South America)
MAX_CONTINENTS = 7

ACHIEVEMENT_TYPES = {
    "cities": "Explorer",
    "regions": "Ranger",
    "countries": "Voyager", 
    "continents": "Pioneer"
}

RANK_NAMES = {
    1: "Traveler",
    2: "Wanderer",
    3: "Pathfinder",
    5: "Voyager",
    8: "Explorer",
    13: "Adventurer",
    21: "Pioneer",
    34: "Legend",
    55: "Master",
    89: "Mythic",
}

def get_rank_name(level: int) -> str:
    """Get the rank name for a Fibonacci level."""
    return RANK_NAMES.get(level, f"Level {level}")

def get_next_fibonacci(current: int, max_limit: int | None = None) -> int | None:
    """Get the next Fibonacci milestone. Returns None if max reached."""
    for fib in FIBONACCI:
        if fib > current:
            if max_limit and fib > max_limit:
                return None  # No more milestones possible
            return fib
    return None  # Already at max

def get_badges_for_count(count: int, max_limit: int | None = None) -> list:
    """Calculate badges dynamically based on current count."""
    badges = []
    for fib in FIBONACCI:
        if max_limit and fib > max_limit:
            break
        if count >= fib:
            badges.append({
                "level": fib,
                "rank": get_rank_name(fib)
            })
    return badges

def get_user_stats(session: Session, user_id: int) -> dict:
    """Get user's geographic statistics with dynamically calculated badges."""
    points = session.exec(select(Point).where(Point.user_id == user_id, Point.hidden_at == None)).all()
    
    unique_cities = set()
    unique_regions = set()
    unique_countries = set()
    unique_continents = set()
    
    for point in points:
        if point.city:
            unique_cities.add(point.city)
        if point.region:
            unique_regions.add(point.region)
        if point.country:
            unique_countries.add(point.country)
        if point.continent:
            unique_continents.add(point.continent)
    
    # Calculate badges dynamically based on current counts
    badges_by_category = {
        "cities": get_badges_for_count(len(unique_cities)),
        "regions": get_badges_for_count(len(unique_regions)),
        "countries": get_badges_for_count(len(unique_countries)),
        "continents": get_badges_for_count(len(unique_continents), MAX_CONTINENTS)  # Limit for continents
    }
    
    # Calculate total badges as sum of all category badges
    total_badges = sum(len(badges) for badges in badges_by_category.values())
    
    # Calculate next milestones
    next_milestones = {
        "cities": get_next_fibonacci(len(unique_cities)),
        "regions": get_next_fibonacci(len(unique_regions)),
        "countries": get_next_fibonacci(len(unique_countries)),
        "continents": get_next_fibonacci(len(unique_continents), MAX_CONTINENTS),
    }
    
    return {
        "total_points": len(points),
        "unique_cities": len(unique_cities),
        "unique_regions": len(unique_regions),
        "unique_countries": len(unique_countries),
        "unique_continents": len(unique_continents),
        "cities_list": sorted(list(unique_cities)),
        "regions_list": sorted(list(unique_regions)),
        "countries_list": sorted(list(unique_countries)),
        "continents_list": sorted(list(unique_continents)),
        "badges_by_category": badges_by_category,
        "next_milestones": next_milestones,
        "total_badges": total_badges
    }
