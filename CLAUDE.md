# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a machine tracking visualization webapp (リアルタイム機体追跡 Web アプリケーション) that consists of two main components:

1. **Google Apps Script backend** (`SpreadSheets_GAS.gs`) - Handles data storage in Google Sheets and provides REST API endpoints
2. **React frontend** (`vehicle-tracker/`) - Real-time web application that visualizes machine telemetry data on Google Maps

The system receives sensor telemetry data via POST requests, stores it in Google Sheets organized by machine ID, and provides real-time visualization with automatic data polling.

## Common Commands

### Frontend Development (vehicle-tracker/)

```bash
cd vehicle-tracker
cp .env.example .env  # Create environment file (first time only)
npm install          # Install dependencies
npm run dev          # Start development server on http://localhost:4000
npm run build        # Build for production (uses webpack)
npm run lint         # Run ESLint
npm run preview      # Preview production build (uses serve)
```

### Linting and Type Checking

- **Lint**: `npm run lint` (in vehicle-tracker directory)
- **Type check**: TypeScript compilation happens during build (webpack handles TypeScript)

### Google Apps Script Backend

- Deploy by copying `SpreadSheets_GAS.gs` content to Google Sheets' Apps Script editor
- Use `testFunction()` and `testWebAppAPI()` in GAS editor for testing
- Python test scripts available in `GAS/` directory for API testing

## Architecture

### Data Flow

1. **Data Ingestion**: External systems POST telemetry data to GAS endpoint
2. **Storage**: GAS stores data in Google Sheets (one sheet per machine: `Machine_{machineId}`)
3. **API Layer**: GAS provides GET endpoints for data retrieval
4. **Frontend**: React app polls GAS API and displays real-time data on Google Maps

### Key Components

**Backend (GAS)**:
- `doGet()`: Handles API requests (`getAllMachines`, `getMachine`, `getMachineList`)
- `doPost()`: Processes incoming telemetry data
- Auto-creates machine sheets with standardized headers
- Deploy by pasting `SpreadSheets_GAS.gs` into Google Sheets' Apps Script editor

**Frontend Architecture**:
- **State Management**: Zustand store (`src/store/index.ts`) for global app state
- **Data Fetching**: SWR with custom hooks (`src/hooks/useMachineData.ts`) for polling
- **Map Integration**: Google Maps via `@react-google-maps/api`
- **Component Structure**: Modular components for map, panels, and controls
- **Animations**: Framer Motion for smooth UI transitions
- **Gradient Visualization**: `DirectGradientPolyline` component for parameter-based track coloring
- **Authentication**: Password-based session management with local storage

### Environment Configuration

Frontend requires these environment variables:
```
VITE_GMAPS_API_KEY=your_google_maps_api_key
VITE_GAS_ENDPOINT=your_google_apps_script_web_app_url
VITE_APP_PASSWORD=your_secure_password
```

Copy `.env.example` to `.env` and configure these values before running the application.

### Data Schema

Telemetry data structure:
```typescript
interface TelemetryDataPoint {
  timestamp: string;
  machineTime?: string;
  machineId: string;
  dataType?: string;
  latitude: number;
  longitude: number;
  altitude: number;
  satellites: number;
  battery?: number;
  comment?: string;
}
```

**Note**: The current implementation stores only core GPS and system data. Water temperature, air pressure, and air temperature sensors are planned but not yet implemented in the frontend data structure.

### Key Technical Decisions

- **Monochrome Map Styling**: Custom dark theme defined in `src/constants/map.ts`
- **Real-time Updates**: Configurable polling intervals (5s, 10s, 30s, 60s)
- **Export Functionality**: CSV/JSON export via PapaParse
- **Error Handling**: Custom `GASApiError` class with retry logic
- **Keyboard Navigation**: Comprehensive shortcuts (1-9: select machine, [/]: switch, P: pause, E: export, ESC: close)
- **Dark Theme**: GitHub-style colors (#0d1117 background, #161b22 surface, #58a6ff accent)
- **Authentication**: Session-based login with configurable password protection

### Performance Optimizations

- **Marker Limits**: Maximum 10 waypoint markers per machine to reduce rendering load
- **Data Thinning**: Non-selected machines show every 10th data point only
- **Memory Management**: Proper cleanup of event handlers in useEffect hooks

### Responsive Design

- **Desktop**: 1280px and above
- **Tablet**: 1024px to 1279px
- **Mobile**: Below 1024px

## Development Notes

### Working with Maps

The app uses a custom monochrome map style. Modify `MONOCHROME_MAP_STYLE` in `src/constants/map.ts` to change appearance.

### Adding New Machine Data Fields

1. Update `TelemetryDataPoint` interface in `src/types/index.ts`
2. Modify GAS sheet headers in `createNewSheet()` function
3. Update data parsing in `getMachineDataFromSheet()`
4. Add UI elements in relevant components

### Authentication Setup

The application includes password-based authentication:
1. Set `VITE_APP_PASSWORD` in your `.env` file
2. Users must enter the correct password on first access
3. Sessions are stored in localStorage and expire after 24 hours
4. Authentication components are in `src/components/auth/`

### Testing GAS Functions

Use `testFunction()` and `testWebAppAPI()` functions in the GAS editor for manual testing. Python test scripts available in `GAS/` directory:
- `test_post.py` - Test POST endpoint
- `test_api.py` - Test GET endpoints

### Recent Architecture Changes

- **Vehicle-to-Machine Migration**: Complete refactoring from vehicle-centric to machine-centric naming convention
- All API endpoints updated: `getAllMachines`, `getMachine`, `getMachineList`
- Component names updated: `MachineMarker`, `MachineTabs`, `useMachineData`
- State management updated with machine-centric properties
- Gradient visualization system refactored from `GradientClearOverlay` to `DirectGradientPolyline` for better performance
- Improved polyline management to prevent overlap issues when switching parameters
- Detailed design documentation available in `docs/gradient-track-visualization-design.md`

## Build System

The project uses **Webpack** (not Vite) for the build system:
- **Development**: `webpack-dev-server` for hot reloading (port 4000)
- **Production**: Standard webpack build with minification
- **Configuration**: `webpack.config.js` handles TypeScript, PostCSS, and asset processing
- **TypeScript**: Transpiled via Babel with strict mode enabled

## Deployment

- **Frontend**: Supports Vercel, Netlify, or GitHub Pages deployment
- **Backend**: Deploy GAS by pasting code into Google Sheets' Apps Script editor
- **CI/CD**: GitHub Actions workflow (`workflows/deploy.yml`) for automated deployment

## Data Format Differences

**Important**: There's a schema mismatch between POST and GET data:
- **POST to GAS**: Uses nested structure (`GPS.LAT`, `sensors.water_temperature`)
- **GET from GAS**: Returns flattened structure (`latitude`, `waterTemperature`)
- The GAS backend handles the transformation between these formats

When modifying data fields, update both:
1. `TelemetryRow` interface (POST format) in `src/types/index.ts`
2. `TelemetryDataPoint` interface (GET format) in `src/types/index.ts`

## Project Documentation

- **Main README**: Japanese documentation with quick start and user guide
- **GAS README**: Backend API documentation with Python examples
- **Gradient Design Doc**: Technical specifications for track visualization feature

## Important Notes

- The project recently underwent a complete migration from "vehicle" to "machine" terminology
- All component names, API endpoints, and data structures have been updated accordingly
- The GAS backend is now at version 2.0.0 with new field additions (battery, comment, dataType, machineTime)
- Frontend fully supports the new GAS API structure and additional telemetry fields

## Key Dependencies and Versions

- **Node.js**: Version 18+ required
- **React**: 19.1.0 (latest version)
- **TypeScript**: 5.8.3 with strict mode
- **Webpack**: 5.97.1 (not Vite despite env variable naming)
- **Zustand**: 5.0.5 for state management
- **SWR**: 2.3.3 for data fetching
- **Google Maps**: @react-google-maps/api 2.20.6
- **Framer Motion**: 12.18.1 for animations
- **Tailwind CSS**: 3.4.17 for styling
- **React Router DOM**: 7.7.0 for routing

## Error Handling Patterns

- **API Errors**: Custom `GASApiError` class with automatic retry logic
- **Map Loading**: Fallback UI while Google Maps loads
- **Data Fetching**: SWR error boundaries with user-friendly messages
- **Authentication**: Session expiry handling with automatic redirect to login

## Common Development Tasks

### Running a Single Component Test
Currently no test framework is configured. The project focuses on integration testing through the GAS backend test scripts in the `GAS/` directory.

### Debugging API Calls
1. Open browser DevTools Network tab
2. Filter by XHR/Fetch requests
3. Look for requests to your GAS endpoint
4. Check response format matches `TelemetryDataPoint` interface

### Modifying Map Styles
Edit `MONOCHROME_MAP_STYLE` in `src/constants/map.ts`. Use [Google Maps Styling Wizard](https://mapstyle.withgoogle.com/) for visual editing.

### Adding New Keyboard Shortcuts
1. Update `useKeyboardShortcuts` hook in `src/hooks/useKeyboardShortcuts.ts`
2. Add shortcut documentation to `HelpPanel` component
3. Test for conflicts with existing shortcuts

## Performance Profiling

### Key Metrics to Monitor
- Initial page load time (target: < 3s)
- Map marker rendering with 100+ points
- Memory usage during extended sessions
- Network requests during polling

### Optimization Strategies
- Use React DevTools Profiler for component rendering
- Monitor bundle size with `npm run build` output
- Check for memory leaks in long-running sessions
- Profile with Chrome DevTools Performance tab

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.