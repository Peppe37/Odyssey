# 👣 GeoCrawl

> **A digital atlas to track, scale, and gamify your personal experiences. Map your world, unlock Fibonacci-based achievements, and share the journey with collaborative or competitive maps.**

![Python](https://img.shields.io/badge/python-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54)
![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)
![React](https://img.shields.io/badge/react-%2320232d.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![TypeScript](https://img.shields.io/badge/typescript-%23007acc.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![SQLite](https://img.shields.io/badge/sqlite-%2307405e.svg?style=for-the-badge&logo=sqlite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)

## Table of Contents

- [Product Vision](#product-vision)
- [Recommended Tech Stack](#recommended-tech-stack)
- [Database Architecture](#database-architecture)
- [Core Features](#core-features)
- [Development Roadmap](#development-roadmap)

## Product Vision

The application is a __personal atlas of experiences__. It allows users to create thematic maps (e.g., kisses, travels, food) that track geographical events. The system automatically scales the visualization and statistics from a __local level (city)__ to a __global level (continents)__.

## Recommended Tech Stack

- __Frontend:__ React 19 + TypeScript + Vite.
- __Styling:__ Tailwind CSS.
- __Maps:__ Leaflet.js with OpenStreetMap (React-Leaflet).
- __Backend:__ Python 3.11+ with __FastAPI__ (chosen for speed and asynchronous management).
- __Database:__ __SQLite3__ (simple, file-based, perfect for initial development).
- __ORM:__ SQLModel (combines Pydantic and SQLAlchemy for Python).

## Database Architecture

| Table | Description |
| :--- | :--- |
| __Users__ | ID, Username, Email, Password Hash, Total Badges. |
| __Maps__ | ID, Name (e.g., "Kiss Map"), Type (Collaborative/Competitive), CreatorID. |
| __Points__ | ID, MapID, UserID, Latitude, Longitude, City, Region, Country, Continent, Timestamp. |
| __MapParticipants__ | MapID, UserID, Role (Owner/Collaborator), AssignedColor. |
| __Achievements__ | ID, UserID, Type (Cities/Countries/Continents), Level reached (Fibonacci). |

## Core Features

### Mapping and Automatic Scaling
The user places a point on the map. The system performs a __Reverse Geocoding API__ call to determine and save:
1. City
1. Region / Province
1. Country
1. Continent
This allows for scalable visualizations (e.g., "View all kisses in Europe").

### Gamification: Fibonacci System
Objectives (Achievements) are unlocked following the Fibonacci sequence: __1, 2, 3, 5, 8, 13, 21...__
- __Logic:__ If you have kissed in 5 different cities, you unlock the "Novice Traveler" achievement.
- __Badges:__ Every __n__ achieved goals (e.g., every 3), the user receives a graphic Badge on their profile.

### Shared Maps
- __Collaborative Mode (e.g., Couples):__ Two or more users write on the same map. Progress and statistics are shared and unified.
- __Competitive Mode (e.g., Friends):__ Users share the view, but each has a different color. The system generates a leaderboard based on who has "conquered" more cities or countries.

## Development Roadmap

1. __Phase 1 (MVP):__ Setup FastAPI + SQLite. User login and creation of the first map with manual point insertion (Lat/Lng).
1. __Phase 2 (Geocoding):__ Integration of external APIs to automatically map cities and countries starting from coordinates.
1. __Phase 3 (Social):__ Invitation system for collaborators and management of different colors in competitive mode.
1. __Phase 4 (Achievements):__ Implementation of the Fibonacci mathematical logic for unlocking badges.
