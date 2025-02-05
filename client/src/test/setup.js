const { jest } = require('@jest/globals');
require('@testing-library/jest-dom');

// Mock the fetch function
global.fetch = jest.fn();

// Mock MUI components that might cause issues in tests
jest.mock('@mui/material', () => ({
  CircularProgress: () => null,
  Button: (props) => {
    const { children } = props;
    return `<button>${children}</button>`;
  },
  Box: ({ children }) => children,
  Container: ({ children }) => children,
  Typography: ({ children }) => children,
  Paper: ({ children }) => children,
  Grid: ({ children }) => children,
  Card: ({ children }) => children,
  CardHeader: ({ children }) => children,
  CardContent: ({ children }) => children,
  CardTitle: ({ children }) => children,
  CardDescription: ({ children }) => children
}));

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});