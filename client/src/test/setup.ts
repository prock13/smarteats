import '@testing-library/jest-dom';
import { jest } from '@jest/globals';
import React from 'react';

// Create a minimal Response-like object that satisfies the interface
const createMockResponse = (body = {}) => ({
  ok: true,
  json: () => Promise.resolve(body),
  text: () => Promise.resolve(JSON.stringify(body)),
  headers: new Headers(),
  status: 200,
  statusText: 'OK',
  type: 'default' as ResponseType,
  url: 'http://localhost',
  redirected: false,
  body: null,
  bodyUsed: false,
  clone: () => createMockResponse(body),
  arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
  blob: () => Promise.resolve(new Blob()),
  formData: () => Promise.resolve(new FormData()),
});

// Mock fetch globally
const mockFetch = jest.fn().mockImplementation(() => Promise.resolve(createMockResponse()));
global.fetch = mockFetch as unknown as typeof global.fetch;

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Mock MUI components that might cause issues in tests
jest.mock('@mui/material', () => {
  const actual = jest.requireActual('@mui/material') as Record<string, unknown>;
  return {
    ...actual,
    CircularProgress: () => null,
    Button: ({ children, ...props }: React.PropsWithChildren<unknown>) => 
      React.createElement('button', props, children),
  };
});