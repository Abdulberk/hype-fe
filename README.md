# Place & Trade Area Data Visualization

A comprehensive Next.js application for visualizing place data, trade areas, and customer analytics using Mapbox and Deck.gl.

## 🚀 Features

### 📊 Data Visualization
- **Interactive Map**: Mapbox-powered map with Deck.gl layers for high-performance rendering
- **Place Markers**: Distinct visualization for "My Place" vs competitors
- **Trade Area Polygons**: Multiple trade area percentages (30%, 50%, 70%) with opacity-based visualization
- **Home Zipcodes**: Percentile-based color coding for customer origin data

### 🎛️ Interactive Controls

#### Left Sidebar - Filters & Controls
**Place Analysis Accordion:**
- Radius filtering (numeric input in miles)
- Multi-select industry filtering
- Show/hide toggle for place visibility

**Customer Analysis Accordion:**
- Data type selection (Trade Area vs Home Zipcodes)
- Trade area percentage checkboxes (30%, 50%, 70%)
- Show/hide toggle for customer data

#### Right Sidebar - Dynamic Legend
- **Places Legend**: Shows "My Place" and competitor markers
- **Trade Areas Legend**: Displays selected trade area percentages with opacity indicators
- **Home Zipcodes Legend**: Shows percentile ranges with actual value ranges
- **Smart Updates**: Legend automatically updates based on selected data type and visible layers

### 🗺��� Map Interactions
- **Hover Tooltips**: Detailed information on place hover including:
  - Place name, address, and category/industry
  - Distance from "My Place" (for competitors)
  - Data availability indicators (Trade Area, Home Locations)
- **Multiple Trade Area Display**: Show multiple trade areas simultaneously
- **Single Home Zipcode Display**: Only one place's home zipcodes shown at a time
- **Responsive Map Controls**: Pan, zoom, and navigate seamlessly

## 🏗️ Technical Architecture

### Frontend Stack
- **Next.js 15**: Latest React framework with App Router
- **TypeScript**: Full type safety throughout the application
- **Material UI**: Professional UI components with custom theming
- **Mapbox GL JS**: High-performance map rendering
- **Deck.gl**: WebGL-powered data visualization layers
- **Zustand**: Lightweight state management

### Project Structure
```
case-study/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout with theme provider
│   ├── page.tsx                 # Main dashboard page
│   └── providers/               # React providers
├── components/
│   ├── layout/                  # Layout components
│   │   └── Dashboard.tsx        # Three-panel layout
│   ├── sidebar/                 # Sidebar components
│   │   ├── LeftSidebar.tsx     # Filters container
│   │   ├── RightSidebar.tsx    # Legend container
│   │   ├── PlaceAnalysis.tsx   # Place filtering accordion
│   │   ├── CustomerAnalysis.tsx # Customer data accordion
│   │   └── Legend.tsx          # Dynamic legend component
│   └── map/                     # Map components
│       ├── MapContainer.tsx     # Main map with Deck.gl layers
│       └── PlaceTooltip.tsx     # Interactive tooltips
├── lib/
│   ├── types/                   # TypeScript definitions
│   ├── constants/               # App constants and color schemes
│   ├── utils/                   # Data processing utilities
│   ├── stores/                  # Zustand state management
│   └── theme/                   # Material UI theme
└── public/                      # Static assets
```

### State Management
- **Data Store**: Manages loading and storing of JSON data
- **UI Store**: Handles filters, layer visibility, and map interactions
- **Efficient Updates**: Optimized re-renders with proper state separation

### Data Processing
- **JSON Loading**: Client-side data loading with error handling
- **Filtering Logic**: Radius and industry-based competitor filtering
- **Percentile Calculations**: Dynamic percentile ranges for home zipcodes
- **Polygon Processing**: Trade area and zipcode polygon data handling

## 🎨 UI/UX Design

### Design Principles
- **Clean Layout**: Three-panel design with clear separation of concerns
- **Consistent Theming**: Material UI theme with business-appropriate colors
- **Responsive Components**: Proper spacing and typography throughout
- **Accessibility**: ARIA labels and keyboard navigation support

### Color Scheme
- **My Place**: Green (#4CAF50) - Primary location
- **Competitors**: Blue (#2196F3) - Business locations
- **Trade Areas**: Amber/Orange gradient with varying opacity
- **Home Zipcodes**: Blue gradient based on percentile ranges

### Interactive Elements
- **Accordions**: Collapsible filter sections
- **Multi-Select**: Industry filtering with chip display
- **Toggles**: Show/hide controls with clear labels
- **Tooltips**: Rich information display on hover

## 📊 Data Models

### Supported Data Types
- **My Place**: Primary business location with full details
- **Competitors**: Nearby businesses with distance calculations
- **Trade Areas**: Polygon data for 30%, 50%, and 70% trade areas
- **Home Zipcodes**: Customer origin data with percentage values
- **Zipcodes**: Geographic boundaries for zipcode visualization

### Key Features
- **Large Dataset Support**: Optimized for handling hundreds of places and complex polygons
- **Real-time Filtering**: Instant updates based on user selections
- **Memory Efficient**: Proper data loading and cleanup strategies
- **Error Handling**: Comprehensive error boundaries and loading states

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- Mapbox account and API key

### Installation
1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   # Create .env.local and add your Mapbox token
   NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_token_here
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Data Setup
Place your JSON data files in the `lib/` directory:
- `my_place.json` - Your primary location data
- `competitors.json` - Competitor locations
- `trade_areas.json` - Trade area polygon data
- `home_zipcodes.json` - Customer origin data
- `zipcodes.json` - Zipcode boundary data

## 🔧 Configuration

### Environment Variables
- `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` - Mapbox public token for map rendering

### Customization
- **Colors**: Modify `lib/constants/index.ts` for color scheme changes
- **Map Style**: Update `MAPBOX_STYLE` constant for different map appearances
- **Default Filters**: Adjust `DEFAULT_FILTERS` for initial state
- **Layer Ordering**: Modify `LAYER_Z_INDEX` for layer stacking

## 📈 Performance Optimizations

### Map Rendering
- **WebGL Layers**: Deck.gl provides hardware-accelerated rendering
- **Layer Caching**: Efficient layer updates and memory management
- **Viewport Culling**: Only render visible map features

### Data Processing
- **Memoized Calculations**: React.useMemo for expensive operations
- **Efficient Filtering**: Optimized data filtering algorithms
- **State Updates**: Minimal re-renders with proper state structure

### Bundle Optimization
- **Code Splitting**: Automatic code splitting with Next.js
- **Tree Shaking**: Unused code elimination
- **Asset Optimization**: Optimized imports and dependencies

## 🧪 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Code Quality
- **TypeScript**: Full type safety with strict mode
- **ESLint**: Code quality and consistency rules
- **Prettier**: Automatic code formatting
- **Git Hooks**: Pre-commit quality checks

## 🤝 Case Study Compliance

This application fully implements the requirements specified in the case study:

✅ **UI Layout**: Three-panel design with left sidebar, map, and right sidebar  
✅ **Place Analysis**: Radius and industry filtering with visibility toggles  
✅ **Customer Analysis**: Trade area and home zipcodes with data type selection  
✅ **Trade Area Visualization**: Multiple percentage display with opacity variation  
✅ **Home Zipcodes Visualization**: Single selection with percentile coloring  
✅ **Interactive Map**: Mapbox + Deck.gl with place markers and polygon layers  
✅ **Dynamic Legend**: Context-aware legend that updates based on data type  
✅ **Tooltip Interactions**: Rich place information with data availability indicators  
✅ **Performance**: Optimized for large datasets with efficient rendering  

## 📄 License

This project is created as a case study implementation.
#   h y p e - f e  
 