# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a vehicle tracking visualization webapp that consists of two main components:
1. **Google Apps Script backend** (`SpreadSheets_GAS.gs`) - Handles data storage in Google Sheets and provides REST API endpoints
2. **React frontend** (`vehicle-tracker/`) - Real-time web application that visualizes vehicle telemetry data on Google Maps

The system receives sensor telemetry data via POST requests, stores it in Google Sheets organized by vehicle ID, and provides real-time visualization with automatic data polling.

## Common Commands

### Frontend Development (vehicle-tracker/)
```bash
cd vehicle-tracker
npm install          # Install dependencies
npm run dev          # Start development server (uses webpack-dev-server)
npm run build        # Build for production (uses webpack)
npm run lint         # Run ESLint
npm run preview      # Preview production build (uses serve)
```

### Linting and Type Checking
- **Lint**: `npm run lint` (in vehicle-tracker directory)
- **Type check**: TypeScript compilation happens during build (webpack handles TypeScript)

## Architecture

### Data Flow
1. **Data Ingestion**: External systems POST telemetry data to GAS endpoint
2. **Storage**: GAS stores data in Google Sheets (one sheet per vehicle: `Vehicle_{vehicleId}`)
3. **API Layer**: GAS provides GET endpoints for data retrieval
4. **Frontend**: React app polls GAS API and displays real-time data on Google Maps

### Key Components

**Backend (GAS)**:
- `doGet()`: Handles API requests (`getAllVehicles`, `getVehicle`, `getVehicleList`)
- `doPost()`: Processes incoming telemetry data
- Auto-creates vehicle sheets with standardized headers

**Frontend Architecture**:
- **State Management**: Zustand store (`src/store/index.ts`) for global app state
- **Data Fetching**: SWR with custom hooks (`src/hooks/useVehicleData.ts`) for polling
- **Map Integration**: Google Maps via `@react-google-maps/api`
- **Component Structure**: Modular components for map, panels, and controls

### Environment Configuration
Frontend requires these environment variables:
```
VITE_GMAPS_API_KEY=your_google_maps_api_key
VITE_GAS_ENDPOINT=your_google_apps_script_web_app_url
```

### Data Schema
Telemetry data structure:
```typescript
interface TelemetryDataPoint {
  timestamp: string;
  vehicleId: string;
  latitude: number;
  longitude: number;
  altitude: number;
  satellites: number;
  waterTemperature: number;
  airPressure: number;
  airTemperature: number;
}
```

### Key Technical Decisions
- **Monochrome Map Styling**: Custom dark theme defined in `src/constants/map.ts`
- **Real-time Updates**: Configurable polling intervals (5s, 10s, 30s, 60s)
- **Export Functionality**: CSV/JSON export via PapaParse
- **Error Handling**: Custom `GASApiError` class with retry logic
- **Keyboard Navigation**: Comprehensive shortcuts for power users

## Development Notes

### Working with Maps
The app uses a custom monochrome map style. Modify `MONOCHROME_MAP_STYLE` in `src/constants/map.ts` to change appearance.

### Adding New Vehicle Data Fields
1. Update `TelemetryDataPoint` interface in `src/types/index.ts`
2. Modify GAS sheet headers in `createNewSheet()` function
3. Update data parsing in `getVehicleDataFromSheet()`
4. Add UI elements in relevant components

### Testing GAS Functions
Use `testFunction()` and `testWebAppAPI()` functions in the GAS editor for manual testing.

## Build System

The project uses **Webpack** (not Vite) for the build system:
- **Development**: `webpack-dev-server` for hot reloading
- **Production**: Standard webpack build with minification
- **Configuration**: `webpack.config.js` handles TypeScript, PostCSS, and asset processing

## Environment Setup

The frontend requires two environment variables in `vehicle-tracker/.env`:
```
VITE_GMAPS_API_KEY=your_google_maps_api_key
VITE_GAS_ENDPOINT=your_google_apps_script_web_app_url
```

Note: Despite using webpack, environment variables still use the `VITE_` prefix for consistency.

## Data Format Differences

**Important**: There's a schema mismatch between POST and GET data:
- **POST to GAS**: Uses nested structure (`gps.latitude`, `sensors.water_temperature`)
- **GET from GAS**: Returns flattened structure (`latitude`, `waterTemperature`)
- The GAS backend handles the transformation between these formats

When modifying data fields, update both:
1. `TelemetryRow` interface (POST format) in `src/types/index.ts`
2. `TelemetryDataPoint` interface (GET format) in `src/types/index.ts`