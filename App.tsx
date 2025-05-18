import { useState } from 'react';
import { PromptPane } from './components/PromptPane/PromptPane';
import { CodePane, FileData } from './components/CodePane/CodePane';
import { PreviewPane } from './components/PreviewPane/PreviewPane';
import { generateCode, configureLlmApi } from './services/llmApiService';
import './App.css';

function App() {
  const [files, setFiles] = useState<FileData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiConfigured, setApiConfigured] = useState(false);

  // Function to configure the LLM API endpoint
  const configureApi = () => {
    const apiEndpoint = prompt('Enter the LLM API endpoint URL:');
    if (apiEndpoint) {
      configureLlmApi({ endpoint: apiEndpoint });
      setApiConfigured(true);
    }
  };

  const handleGenerate = async (prompt: string) => {
    // Check if API is configured
    if (!apiConfigured) {
      configureApi();
      if (!apiConfigured) {
        setError('API endpoint must be configured before generating code.');
        return;
      }
    }

    setIsLoading(true);
    setError(null);
    
    try {
      // Call the LLM API service
      const response = await generateCode(prompt);
      
      // Check for API errors
      if (response.error) {
        setError(response.error);
        return;
      }
      
      // Update files with the generated code
      setFiles(response.files);
    } catch (err) {
      setError(`Failed to generate code: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (path: string, content: string) => {
    setFiles(prevFiles => 
      prevFiles.map(file => 
        file.path === path ? { ...file, content } : file
      )
    );
  };

  return (
    <div className="flex flex-col h-screen p-4 gap-4">
      <header className="pb-2 border-b flex justify-between items-center">
        <h1 className="text-2xl font-bold">Code Studio</h1>
        <button 
          onClick={configureApi}
          className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded"
        >
          {apiConfigured ? 'Reconfigure API' : 'Configure API'}
        </button>
      </header>
      
      <main className="flex flex-col lg:flex-row gap-4 flex-grow overflow-hidden">
        {/* Prompt Pane (Top on mobile, Left on desktop) */}
        <div className="lg:w-1/3">
          <PromptPane onGenerate={handleGenerate} isLoading={isLoading} />
          {error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              <h3 className="font-bold">Error</h3>
              <p>{error}</p>
            </div>
          )}
        </div>
        
        {/* Code and Preview Panes */}
        <div className="flex-grow flex flex-col gap-4">
          <div className="flex-grow">
            <CodePane files={files} onFileChange={handleFileChange} />
          </div>
          
          <div className="h-1/2">
            <PreviewPane files={files} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
