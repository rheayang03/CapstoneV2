# API Usage Guide

This guide explains how to add new API requests to the frontend application following the established patterns.

## Architecture Overview

The API layer is organized into three main parts:

1. **Client** (`src/api/client.js`) - Central HTTP client with authentication
2. **Services** (`src/api/services/`) - Business logic and API calls
3. **Hooks** (`src/hooks/`) - React hooks for UI integration

## Adding New API Requests

### 1. Create a Service (if needed)

If you're adding requests for a new feature area, create a new service file:

```javascript
// src/api/services/newFeatureService.js
import apiClient from '../client';

const mockDelay = (ms = 800) => new Promise(resolve => setTimeout(resolve, ms));

class NewFeatureService {
  async getItems(params = {}) {
    await mockDelay();
    
    // TODO: Replace with actual API call
    // const queryParams = new URLSearchParams(params).toString();
    // return apiClient.get(`/new-feature/items?${queryParams}`);
    
    // Mock implementation
    return {
      success: true,
      data: mockItems,
      pagination: { page: 1, limit: 20, total: mockItems.length }
    };
  }

  async createItem(itemData) {
    await mockDelay(1000);
    
    // TODO: Replace with actual API call
    // return apiClient.post('/new-feature/items', itemData);
    
    // Mock implementation
    return {
      success: true,
      data: { id: Date.now().toString(), ...itemData }
    };
  }
}

export const newFeatureService = new NewFeatureService();
export default newFeatureService;
```

### 2. Add Mock Data

Add mock data to `src/api/mockData.js`:

```javascript
export const mockNewFeatureItems = [
  {
    id: '1',
    name: 'Sample Item',
    // ... other properties
  }
];
```

### 3. Create a Hook

Create a corresponding hook for React components:

```javascript
// src/hooks/useNewFeature.js
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import newFeatureService from '@/api/services/newFeatureService';

export const useNewFeature = (params = {}) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { toast } = useToast();

  const fetchItems = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await newFeatureService.getItems(params);
      
      if (response.success) {
        setItems(response.data);
      } else {
        throw new Error('Failed to fetch items');
      }
    } catch (error) {
      setError(error.message);
      toast({
        title: 'Error Loading Items',
        description: 'Failed to load items. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [JSON.stringify(params)]);

  const createItem = async (itemData) => {
    try {
      const response = await newFeatureService.createItem(itemData);
      
      if (response.success) {
        setItems(prev => [...prev, response.data]);
        toast({
          title: 'Item Created',
          description: 'Item has been created successfully.',
        });
        return response.data;
      }
    } catch (error) {
      toast({
        title: 'Error Creating Item',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const refetch = () => {
    fetchItems();
  };

  return {
    items,
    loading,
    error,
    createItem,
    refetch,
  };
};

export default useNewFeature;
```

### 4. Use in Components

```javascript
// src/components/NewFeatureComponent.jsx
import React from 'react';
import { useNewFeature } from '@/hooks/useNewFeature';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

const NewFeatureComponent = () => {
  const { items, loading, error, createItem, refetch } = useNewFeature();

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive mb-4">Error: {error}</p>
        <Button onClick={refetch}>Try Again</Button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground mb-4">No items found</p>
        <Button onClick={() => createItem({ name: 'New Item' })}>
          Add First Item
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map(item => (
        <div key={item.id} className="p-4 border rounded">
          {item.name}
        </div>
      ))}
    </div>
  );
};

export default NewFeatureComponent;
```

## Existing Services and Hooks

### Available Services
- `authService` - Authentication (login, register, logout)
- `dashboardService` - Dashboard statistics and data
- `userService` - User management
- `menuService` - Menu item management
- `inventoryService` - Inventory management
- `orderService` - Order processing and management

### Available Hooks
- `useAuth` - Authentication state and actions
- `useDashboard` - Dashboard statistics
- `useUserManagement` - User CRUD operations
- `useMenuManagement` - Menu item CRUD operations
- `useInventoryManagement` - Inventory CRUD operations
- `useOrderManagement` - Order processing

## Patterns and Best Practices

### 1. Service Layer Patterns

**Always include:**
- Mock delay for realistic simulation
- TODO comments for actual API implementation
- Consistent response structure: `{ success: boolean, data: any, message?: string }`
- Error handling with meaningful messages

**Standard methods:**
- `getItems(params)` - List with pagination
- `getItemById(id)` - Single item
- `createItem(data)` - Create new
- `updateItem(id, updates)` - Update existing
- `deleteItem(id)` - Delete item

### 2. Hook Patterns

**Always include:**
- Loading, error, and data states
- Toast notifications for user feedback
- `refetch` function for manual refresh
- Proper dependency arrays in `useEffect`

**State updates:**
- Update local state immediately after successful API calls
- Use functional updates with previous state
- Handle errors gracefully with toast notifications

### 3. Component Integration

**Loading states:**
- Use `Skeleton` components for loading placeholders
- Show appropriate loading indicators

**Error states:**
- Display error messages clearly
- Provide retry buttons
- Use destructive variant for error toasts

**Empty states:**
- Show helpful empty state messages
- Provide actions to add first items
- Use muted text for secondary information

### 4. Mock Data Guidelines

**Structure mock data to match expected API responses:**
- Include all necessary fields
- Use realistic data types and formats
- Include pagination metadata when applicable
- Add timestamps in ISO format

**Keep mock data updated:**
- When adding new fields to components, update mock data
- Ensure mock data covers various scenarios (empty, error, success)

## Authentication Integration

The API client automatically handles authentication tokens:

```javascript
// Set token after login
apiClient.setAuthToken(token);

// Token is automatically included in subsequent requests
// Clear token on logout
apiClient.setAuthToken(null);
```

## Environment Configuration

Configure API base URL through environment variables:

```env
VITE_API_BASE_URL=http://localhost:3001/api
```

Default fallback is `/api` for development.

## Migration to Real APIs

When backend APIs are ready:

1. **Replace service methods:**
   - Remove mock delays and mock data
   - Uncomment TODO sections
   - Update endpoint URLs

2. **Update response handling:**
   - Adjust response structure if needed
   - Handle different error formats
   - Update pagination structure

3. **Test thoroughly:**
   - Verify all CRUD operations
   - Test error scenarios
   - Validate loading states

## Common Pitfalls

1. **Don't call APIs directly in components** - Always use hooks
2. **Don't forget error handling** - Every API call should handle errors
3. **Don't skip loading states** - Users need feedback during requests
4. **Don't hardcode API URLs** - Use the centralized client
5. **Don't forget to update mock data** - Keep it in sync with real data structure

## Example File Structure

```
src/
├── api/
│   ├── client.js                 # Central HTTP client
│   ├── mockData.js              # Mock data for all services
│   └── services/
│       ├── authService.js
│       ├── dashboardService.js
│       ├── userService.js
│       ├── menuService.js
│       ├── inventoryService.js
│       └── orderService.js
├── hooks/
│   ├── useAuth.js
│   ├── useDashboard.js
│   ├── useUserManagement.js
│   ├── useMenuManagement.js
│   ├── useInventoryManagement.js
│   └── useOrderManagement.js
└── components/
    └── [feature components using hooks]
```

This structure ensures:
- Separation of concerns
- Consistent patterns
- Easy testing and mocking
- Simple migration to real APIs
- Maintainable codebase
