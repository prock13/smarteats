import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Setup fetch mock
global.fetch = vi.fn();

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
});

// Mock MUI components that might cause issues in tests
vi.mock('@mui/material', () => ({
  ...vi.importActual('@mui/material'),
  CircularProgress: () => 'CircularProgress',
}));