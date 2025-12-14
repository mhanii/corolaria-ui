# API Configuration Guide

This document explains how to configure the API connection for the Athen UI application.

## Environment Variables

The application uses environment variables to configure the API connection. This makes it easy to switch between development and production environments.

### Required Environment Variable

Create a `.env.local` file in the root directory of the project with the following:

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Configuration Values

**Development:**
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Production:**
```bash
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

> **Note:** All environment variables that start with `NEXT_PUBLIC_` are exposed to the browser and can be used in client-side code.

## API Structure

The API connectivity layer is organized as follows:

```
src/lib/api/
├── config.ts          # API configuration and URL management
├── types.ts           # TypeScript interfaces matching backend schemas
├── client.ts          # HTTP client with axios
├── services/
│   └── searchService.ts  # Search-specific API methods
└── index.ts           # Central export point
```

## Using the API

### In Components

```tsx
import { useSearch } from '@/hooks/useSearch';

function MyComponent() {
  const { performSearch, results, loading, error } = useSearch();
  
  const handleSearch = async () => {
    await performSearch('my query', { top_k: 20 });
  };
  
  // Use results, loading, error in your component
}
```

### Direct Service Usage

```tsx
import { semanticSearch } from '@/lib/api';

const results = await semanticSearch({
  query: 'libertad de expresión',
  top_k: 10
});
```

## Changing the API URL

1. Update `.env.local` with the new API URL
2. Restart the development server: `npm run dev`
3. The application will now use the new API endpoint

## Troubleshooting

### API Connection Errors

If you see connection errors:
1. Verify the backend server is running
2. Check the API URL in `.env.local` is correct
3. Ensure there are no firewall/CORS issues
4. Look at browser console for detailed error messages

### Environment Variables Not Working

If environment variable changes aren't reflected:
1. Stop the development server
2. Delete `.next` folder
3. Restart with `npm run dev`
