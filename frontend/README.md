# School Management System - Frontend Web Application

A modern, responsive React frontend for the multi-tenant School Management System.

## Features

- **Modern React**: Built with React 18+ and modern hooks
- **Fast Development**: Vite for lightning-fast development and building
- **Beautiful UI**: Tailwind CSS for utility-first styling
- **State Management**: React Context API and TanStack Query
- **Type Safety**: JSX with prop validation
- **Authentication**: JWT token management with protected routes
- **Multi-tenant**: Dynamic tenant switching and branding
- **Responsive Design**: Mobile-first responsive design
- **Campus Module**: Sample implementation with list and detail views

## Tech Stack

- **Framework**: React 18+
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **HTTP Client**: Axios with interceptors
- **Routing**: React Router v6
- **Forms**: React Hook Form
- **Data Fetching**: TanStack React Query
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── common/     # Shared components
│   │   ├── layout/     # Layout components
│   │   ├── forms/      # Form components
│   │   └── ui/         # UI components
│   ├── pages/          # Page components
│   ├── services/       # API service functions
│   ├── contexts/       # React Context providers
│   ├── hooks/          # Custom React hooks
│   ├── utils/          # Helper functions
│   └── assets/         # Static assets
├── public/             # Public assets
├── index.html          # HTML template
├── package.json
├── vite.config.js      # Vite configuration
├── tailwind.config.js  # Tailwind configuration
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (v18.0.0 or higher)
- npm or yarn
- Backend API running on port 5000

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env file with your configuration
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

The application will start on `http://localhost:3000`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Lint code
- `npm run lint:fix` - Fix linting issues
- `npm test` - Run tests

## Demo Credentials

For testing the application, use these demo credentials:

**Admin Account:**
- Email: `admin@demo.com`
- Password: `demo123`

**Teacher Account:**
- Email: `teacher@demo.com`
- Password: `demo123`

## Features Overview

### Authentication
- JWT-based authentication
- Persistent login sessions
- Role-based access control
- Protected routes

### Campus Management (Sample Module)
- **Campus List**: View all campuses with search and filtering
- **Campus Details**: Detailed view of individual campus
- **CRUD Operations**: Create, read, update, delete (admin only)
- **Export Functionality**: Export campus data
- **Responsive Design**: Works on all device sizes

### Multi-tenant Support
- Automatic tenant detection
- Tenant-specific branding
- Feature availability based on tenant
- Tenant switching capability

### UI Components
- Reusable component library
- Consistent design system
- Loading states and error handling
- Responsive navigation
- Toast notifications

## Environment Configuration

### Environment Variables

Key environment variables (see `.env.example`):

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:5000/api

# Default Tenant
VITE_DEFAULT_TENANT_ID=default-tenant

# Application Configuration
VITE_APP_NAME=School Management System
VITE_APP_VERSION=1.0.0

# Feature Flags
VITE_ENABLE_MOCK_AUTH=true
VITE_ENABLE_DEBUG_MODE=true
```

## Application Structure

### Contexts
- **AuthContext**: User authentication state
- **TenantContext**: Multi-tenant information

### Custom Hooks
- **useAuth**: Authentication utilities
- **useAuth**: Tenant information and utilities

### Services
- **apiClient**: Axios instance with interceptors
- **authService**: Authentication API calls
- **campusService**: Campus management API calls
- **tenantService**: Tenant information API calls

## Campus Module Implementation

The Campus module serves as a sample implementation demonstrating:

### getAllCampuses() Method
- **Location**: `/src/pages/Campus.jsx`
- **Features**:
  - Paginated campus list
  - Search functionality
  - Status filtering
  - Export capabilities
  - Responsive table design

### getCampusById() Method
- **Location**: `/src/pages/CampusDetail.jsx`
- **Features**:
  - Detailed campus information
  - Contact details and location
  - Capacity and occupancy tracking
  - Facilities listing
  - Quick action links

## API Integration

### Automatic Features
- **Request Interceptors**: Adds auth tokens and tenant headers
- **Response Interceptors**: Handles common errors and token refresh
- **Error Handling**: User-friendly error messages
- **Loading States**: Automatic loading indicators

### Sample API Calls

```javascript
// Get all campuses
const campuses = await campusService.getAllCampuses({
  page: 1,
  limit: 10,
  search: 'main',
  status: 'active'
})

// Get campus by ID
const campus = await campusService.getCampusById('campus-1')
```

## Theming and Customization

### Tailwind Configuration
- Custom color palette
- Extended spacing and sizing
- Custom animations
- Responsive breakpoints

### Component Styling
- Utility-first approach
- Consistent design tokens
- Dark mode ready (future)
- Accessibility considerations

## State Management

### React Query
- Caching and synchronization
- Background updates
- Optimistic updates
- Error retry logic

### Context API
- Global authentication state
- Tenant information
- User preferences

## Testing

Run tests with:
```bash
npm test
```

Test structure:
- Component tests
- Integration tests
- API service tests
- Custom hook tests

## Building for Production

### Development Build
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm run preview
```

### Build Optimization
- Code splitting
- Tree shaking
- Asset optimization
- Vendor chunk separation

## Deployment

### Environment Setup
1. Set production API URL
2. Configure tenant settings
3. Update security settings
4. Enable production optimizations

### Deployment Options
- Vercel
- Netlify
- AWS S3 + CloudFront
- Docker container

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance

- Code splitting by routes
- Lazy loading components
- Optimized bundle size
- Image optimization
- Service worker ready

## Contributing

1. Fork the repository
2. Create a feature branch
3. Follow coding standards
4. Write tests for new features
5. Create a Pull Request

## Troubleshooting

### Common Issues

**API Connection Issues:**
- Check backend server is running
- Verify CORS configuration
- Check network connectivity

**Authentication Issues:**
- Clear browser storage
- Check token expiration
- Verify user credentials

**Build Issues:**
- Clear node_modules and reinstall
- Check Node.js version
- Update dependencies

## License

This project is licensed under the MIT License.

## Support

For support, please contact the development team or create an issue in the repository.
