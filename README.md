# Odyssey

> __"Sing to me, Muse, of the many ways..." — Map your personal journey with the wisdom of Athena.__

![Python](https://img.shields.io/badge/python-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54)
![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)
![React](https://img.shields.io/badge/react-%2320232d.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![TypeScript](https://img.shields.io/badge/typescript-%23007acc.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![SQLite](https://img.shields.io/badge/sqlite-%2307405e.svg?style=for-the-badge&logo=sqlite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)

## Table of Contents

- [Odyssey](#odyssey)
  - [Table of Contents](#table-of-contents)
  - [Product Vision](#product-vision)
  - [Recommended Tech Stack](#recommended-tech-stack)
  - [Database Architecture](#database-architecture)
  - [Core Features](#core-features)
    - [Geographical Scaling](#geographical-scaling)
    - [Fibonacci Gamification](#fibonacci-gamification)
    - [Shared Odysseys](#shared-odysseys)
  - [Development Roadmap](#development-roadmap)

## Product Vision

__Odyssey__ is a digital "atlas of experiences" designed to transform your travels and memories into a structured journey. Inspired by Athena’s guidance, this app allows users to create thematic maps (e.g., "Kiss Maps", "Food Quests") that automatically scale from __local detail (cities)__ to __global perspective (continents)__.

## Recommended Tech Stack

- __Frontend:__ React 19 + TypeScript + Vite.
- __Styling:__ Tailwind CSS.
- __Maps:__ Leaflet.js with OpenStreetMap (React-Leaflet).
- __Backend:__ Python 3.11+ with __FastAPI__ (optimized for speed and async tasks).
- __Database:__ __SQLite3__ (lightweight and portable for initial development).
- __ORM:__ SQLModel (bridge between Pydantic and SQLAlchemy).

## Database Architecture

| Table               | Description                                                                          |
| :------------------ | :----------------------------------------------------------------------------------- |
| __Users__           | ID, Username, Email, Password Hash, Total Badges.                                    |
| __Maps__            | ID, Name (e.g., "Kiss Map"), Type (Collaborative/Competitive), CreatorID.            |
| __Points__          | ID, MapID, UserID, Latitude, Longitude, City, Region, Country, Continent, Timestamp. |
| __MapParticipants__ | MapID, UserID, Role (Owner/Collaborator), AssignedColor.                             |
| __Achievements__    | ID, UserID, Type (Cities/Countries/Continents), Level (Fibonacci).                   |

## Core Features

### Geographical Scaling

Every point marked on the map is analyzed through a __Reverse Geocoding API__. The system automatically categorizes each entry into a hierarchical structure:

1. City
1. Region / Province
1. Country
1. Continent

This allows for dynamic statistics such as __"You have explored 5% of Europe"__.

### Fibonacci Gamification

Achievements follow the __Fibonacci Sequence__: __1, 2, 3, 5, 8, 13, 21...__

- __Logic:__ Reach 5 different countries to unlock the "Pathfinder" rank. Reach 8 to become a "Voyager".
- __Badges:__ For every __n__ achievements (e.g., every 3), the user is awarded a unique digital Badge to showcase on their profile.

### Shared Odysseys

- __Collaborative Mode:__ Designed for couples or teams. Multiple users contribute to the same map, sharing goals and statistics.
- __Competitive Mode:__ Friends share a map view, but each participant has a unique color. The interface displays a leaderboard based on geographical coverage.

## Development Roadmap

1. __Phase 1 (MVP):__ Setup FastAPI + SQLite. User authentication and basic map creation with manual point plotting.
1. __Phase 2 (Geocoding):__ Implementation of automated location analysis (City/Country detection from coordinates).
1. __Phase 3 (Social):__ Invitation system for shared maps and color-coding for competitive modes.
1. __Phase 4 (The Wisdom of Athena):__ Integration of the Fibonacci logic for achievement triggers and badge generation.
