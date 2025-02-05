import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import React from 'react';

// Extend Vitest's expect with Testing Library's matchers
expect.extend(matchers as any);

// Clean up after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Helper to create component mocks that ignore props
const createMockComponent = (displayName: string) => {
  const component = ({ children, ...props }: React.PropsWithChildren<unknown>) => 
    React.createElement('div', { 'data-testid': displayName, ...props }, children);
  component.displayName = displayName;
  return component;
};

// Mock MUI components
vi.mock('@mui/material', () => ({
  CircularProgress: () => null,
  Button: ({ children, ...props }: React.PropsWithChildren<unknown>) => 
    React.createElement('button', { type: "button", ...props }, children),
  Box: createMockComponent('Box'),
  Container: createMockComponent('Container'),
  Typography: createMockComponent('Typography'),
  Paper: createMockComponent('Paper'),
  Grid: createMockComponent('Grid'),
  Card: createMockComponent('Card'),
  CardHeader: createMockComponent('CardHeader'),
  CardContent: createMockComponent('CardContent'),
  CardTitle: createMockComponent('CardTitle'),
  CardDescription: createMockComponent('CardDescription'),
  Menu: createMockComponent('Menu'),
  MenuItem: createMockComponent('MenuItem'),
  IconButton: ({ children, ...props }: React.PropsWithChildren<unknown>) => 
    React.createElement('button', { type: "button", ...props }, children)
}));

// Set up global fetch mock
vi.stubGlobal('fetch', vi.fn());

// Mock the toast hook with a proper mock implementation
const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast
  })
}));

// Export the mock toast function for test assertions
export { mockToast };