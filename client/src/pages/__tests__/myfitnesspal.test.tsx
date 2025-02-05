import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MyFitnessPalPage from '../myfitnesspal';
import { mockToast } from '@/test/setup';

// Create a wrapper component with QueryClientProvider
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false
      }
    }
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('MyFitnessPal Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });

  it('should render the connect form when not connected', async () => {
    // Mock the API response for connection status
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ connected: false })
    });

    render(<MyFitnessPalPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Connect Your Account')).toBeInTheDocument();
    });

    expect(screen.getByPlaceholderText(/Enter your MyFitnessPal username/i)).toBeInTheDocument();
  });

  it('should handle successful form submission', async () => {
    // Mock API responses
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ connected: false })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: 'Successfully connected' })
      });

    render(<MyFitnessPalPage />, { wrapper: createWrapper() });

    const user = userEvent.setup();

    // Fill and submit the form
    const usernameInput = await screen.findByPlaceholderText(/Enter your MyFitnessPal username/i);
    await user.type(usernameInput, 'testuser');

    const submitButton = screen.getByRole('button', { name: /Connect Account/i });
    await user.click(submitButton);

    // Verify API call
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/myfitnesspal/connect',
        expect.any(Object)
      );
    });

    // Verify success toast
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        description: 'Connected to MyFitnessPal successfully'
      });
    });
  });

  it('should handle API errors during form submission', async () => {
    // Mock API responses
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ connected: false })
      })
      .mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ message: 'Invalid MyFitnessPal username' })
      });

    render(<MyFitnessPalPage />, { wrapper: createWrapper() });

    const user = userEvent.setup();

    // Fill in the form
    const usernameInput = await screen.findByPlaceholderText(/Enter your MyFitnessPal username/i);
    await user.type(usernameInput, 'invaliduser');

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /Connect Account/i });
    await user.click(submitButton);

    // Verify error toast
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        description: 'Invalid MyFitnessPal username',
        variant: 'destructive'
      });
    });
  });

  it('displays nutrition data when connected', async () => {
    // Mock API responses for connected state
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ connected: true, username: 'testuser' })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          total_calories: 1500,
          goals: { calories: 2000 },
          total_macros: {
            protein: 75,
            carbohydrates: 150,
            fat: 50
          }
        })
      });

    render(<MyFitnessPalPage />, { wrapper: createWrapper() });

    // Verify connected state display
    await waitFor(() => {
      expect(screen.getByText(/You're connected as testuser/i)).toBeInTheDocument();
    });

    // Verify nutrition data display
    await waitFor(() => {
      expect(screen.getByText(/Calories: 1500 \/ 2000/i)).toBeInTheDocument();
      expect(screen.getByText(/Protein: 75g/i)).toBeInTheDocument();
      expect(screen.getByText(/Carbs: 150g/i)).toBeInTheDocument();
      expect(screen.getByText(/Fat: 50g/i)).toBeInTheDocument();
    });
  });
});