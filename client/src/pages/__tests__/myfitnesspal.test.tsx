import { describe, it, expect, beforeEach } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MyFitnessPalPage from '../myfitnesspal';
import { useToast } from "@/hooks/use-toast";

// Mock the useToast hook
jest.mock('@/hooks/use-toast', () => ({
  useToast: jest.fn(() => ({
    toast: jest.fn()
  }))
}));

// Mock fetch for API calls
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('MyFitnessPalPage', () => {
  let queryClient: QueryClient;
  let mockToast: jest.Mock;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    mockFetch.mockClear();
    mockToast = jest.fn();
    (useToast as jest.Mock).mockImplementation(() => ({
      toast: mockToast
    }));
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MyFitnessPalPage />
      </QueryClientProvider>
    );
  };

  it('renders the connect form when not connected', async () => {
    // Mock the initial connection check
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ connected: false }),
      })
    );

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/Connect Your Account/i)).toBeInTheDocument();
    });
    expect(screen.getByPlaceholderText(/Enter your MyFitnessPal username/i)).toBeInTheDocument();
  });

  it('handles successful form submission', async () => {
    // Mock API responses
    mockFetch
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ connected: false }),
        })
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ message: 'Successfully connected' }),
        })
      );

    const user = userEvent.setup();
    renderComponent();

    // Fill in the form
    const usernameInput = await screen.findByPlaceholderText(/Enter your MyFitnessPal username/i);
    await user.type(usernameInput, 'testuser');

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /Connect Account/i });
    await user.click(submitButton);

    // Verify API call
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/myfitnesspal/connect', expect.any(Object));
    });

    // Verify success toast was called
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        description: 'Connected to MyFitnessPal successfully'
      });
    });
  });

  it('handles API errors during form submission', async () => {
    // Mock API responses
    mockFetch
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ connected: false }),
        })
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ message: 'Invalid MyFitnessPal username' }),
        })
      );

    const user = userEvent.setup();
    renderComponent();

    // Fill in the form
    const usernameInput = await screen.findByPlaceholderText(/Enter your MyFitnessPal username/i);
    await user.type(usernameInput, 'invaliduser');

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /Connect Account/i });
    await user.click(submitButton);

    // Verify error toast was called
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        description: 'Invalid MyFitnessPal username',
        variant: 'destructive'
      });
    });
  });

  it('displays nutrition data when connected', async () => {
    // Mock API responses for connected state
    mockFetch
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ connected: true, username: 'testuser' }),
        })
      )
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            total_calories: 1500,
            goals: { calories: 2000 },
            total_macros: {
              protein: 75,
              carbohydrates: 150,
              fat: 50,
            },
          }),
        })
      );

    renderComponent();

    // Verify connected state display
    await waitFor(() => {
      expect(screen.getByText(/You're connected as testuser/i)).toBeInTheDocument();
    });

    // Verify nutrition data display
    expect(screen.getByText(/Calories: 1500 \/ 2000/i)).toBeInTheDocument();
    expect(screen.getByText(/Protein: 75g/i)).toBeInTheDocument();
    expect(screen.getByText(/Carbs: 150g/i)).toBeInTheDocument();
    expect(screen.getByText(/Fat: 50g/i)).toBeInTheDocument();
  });
});