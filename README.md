# Sexuality Spectrum Assessment

Interactive 3D sexuality spectrum quiz with real-time visualization and archetype matching.

## Features

- **3 Quiz Versions**: Demo (8q), Standard (36q), Comprehensive (60q)
- **3D Visualization**: Interactive Three.js graph with drag/zoom controls
- **27 Archetypes**: Unique personality profiles across three axes
- **Compatibility Analysis**: Algorithmic matching based on complementarity (40%) and similarity (60%)
- **Results Export**: Download graphic with 3D graph and interpretation
- **Progress Saving**: Auto-save quiz progress to localStorage
- **Archetype Map**: Landing page visualization of all 27 archetypes

## Axes

- **X-Axis**: Masculine ↔ Feminine expression
- **Y-Axis**: Dominant ↔ Submissive dynamics
- **Z-Axis**: Romantic ↔ Physical connection

## Tech Stack

- Vanilla JavaScript (ES6+)
- Three.js r128 for 3D rendering
- CSS3 with custom properties
- Canvas API for image export
- LocalStorage for persistence

## File Structure

```
├── index.html              # Main page
├── landing-showcase.html   # Design alternatives showcase
├── generate-favicon.html   # Favicon generator tool
├── favicon.svg            # Site icon
├── js/
│   ├── app.js             # Main application logic
│   ├── questions.js       # Quiz question data
│   ├── scoring.js         # Score calculation & normalization
│   ├── visualization.js   # 3D scene & rendering
│   └── archetype-map.js   # Landing page archetype map
└── styles/
    └── main.css           # All styling
```

## Setup

1. Clone or download files
2. Open `index.html` in browser
3. No build process or dependencies required

## Usage

1. Select quiz version on landing page
2. Answer questions (1-5 scale)
3. View 3D position and archetype results
4. Click archetypes to highlight in graph
5. Export results as PNG
6. Toggle compatibility visualization

## Data Normalization

All quiz versions normalize scores to standard -24 to +24 range for consistent archetype positioning and comparison.

## Compatibility Algorithm

- **Y-Axis**: 40% weight (complementarity - opposite values preferred)
- **X/Z-Axes**: 30% weight each (similarity - close values preferred)

## Browser Support

Modern browsers with WebGL support (Chrome, Firefox, Edge, Safari).
