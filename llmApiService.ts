import { FileData } from '../components/CodePane/CodePane';

// Define the API request and response types
export interface LlmApiRequest {
  instruction: string;
  files?: FileData[];
}

export interface LlmApiResponse {
  files: FileData[];
  error?: string;
}

// Configuration for the LLM API
interface ApiConfig {
  endpoint: string;
  apiKey?: string;
}

// Default configuration - will be updated when the actual endpoint is provided
const defaultConfig: ApiConfig = {
  endpoint: '/api/generate', // This will be configured later
  apiKey: undefined,
};

let apiConfig = { ...defaultConfig };

/**
 * Configure the LLM API service
 */
export const configureLlmApi = (config: Partial<ApiConfig>): void => {
  apiConfig = { ...apiConfig, ...config };
};

/**
 * Generate code using the LLM API
 */
export const generateCode = async (instruction: string): Promise<LlmApiResponse> => {
  try {
    // Validate the API configuration
    if (!apiConfig.endpoint) {
      throw new Error('LLM API endpoint not configured');
    }

    // Prepare the request payload
    const payload: LlmApiRequest = {
      instruction,
    };

    // Set up request headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Add API key if available
    if (apiConfig.apiKey) {
      headers['Authorization'] = `Bearer ${apiConfig.apiKey}`;
    }

    // Make the API request
    const response = await fetch(apiConfig.endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    // Handle non-200 responses
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error (${response.status}): ${errorText}`);
    }

    // Parse the response
    const data = await response.json();

    // Validate the response format
    if (!data.files || !Array.isArray(data.files)) {
      throw new Error('Invalid API response format: missing or invalid files array');
    }

    return data;
  } catch (error) {
    // Return a structured error response
    return {
      files: [],
      error: error instanceof Error ? error.message : String(error),
    };
  }
};
