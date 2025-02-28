
import { toast } from "@/components/ui/use-toast";

// Singleton for tracking global fetch error state
let isShowingNetworkError = false;
let reconnectionTimeout: NodeJS.Timeout | null = null;

class ApiClient {
  private baseUrl: string;
  private reconnectDelay = 2000; // Start with 2 seconds, will increase exponentially

  constructor(baseUrl = '') {
    this.baseUrl = baseUrl;
  }

  async fetch<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        credentials: 'include', // For cookies/sessions
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
      }

      // Reset reconnection delay on successful request
      this.reconnectDelay = 2000;
      
      // Clear any existing "network offline" messages if connection is restored
      if (isShowingNetworkError) {
        isShowingNetworkError = false;
        toast({
          title: "Connection restored",
          description: "Your network connection has been restored.",
        });
      }

      return await response.json();
    } catch (error) {
      // Only show network error once, not for every failed request
      if (error instanceof TypeError && error.message.includes('fetch')) {
        this.handleNetworkError();
      }
      throw error;
    }
  }

  private handleNetworkError() {
    // Only show network error message once
    if (!isShowingNetworkError) {
      isShowingNetworkError = true;
      toast({
        title: "Network error",
        description: "Unable to connect to the server. Will retry automatically.",
        variant: "destructive",
        duration: 10000,
      });
    }

    // Set up reconnection with exponential backoff
    if (reconnectionTimeout) {
      clearTimeout(reconnectionTimeout);
    }
    
    reconnectionTimeout = setTimeout(() => {
      // Try a simple health check request to see if connection is back
      fetch('/health')
        .then(response => {
          if (response.ok) {
            isShowingNetworkError = false;
            toast({
              title: "Connection restored",
              description: "Your network connection has been restored.",
            });
          } else {
            // If still failing, try again with longer delay
            this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, 30000); // Max 30 seconds
            this.handleNetworkError();
          }
        })
        .catch(() => {
          // If still failing, try again with longer delay
          this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, 30000); // Max 30 seconds
          this.handleNetworkError();
        });
    }, this.reconnectDelay);
  }

  // Convenience methods
  async get<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return this.fetch<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(endpoint: string, data: any, options: RequestInit = {}): Promise<T> {
    return this.fetch<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data: any, options: RequestInit = {}): Promise<T> {
    return this.fetch<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return this.fetch<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

// Create a singleton instance
export const apiClient = new ApiClient();
export default apiClient;
