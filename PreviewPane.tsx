import { useEffect, useRef, useState } from 'react';
import { FileData } from '../CodePane/CodePane';

interface PreviewPaneProps {
  files: FileData[];
}

export function PreviewPane({ files }: PreviewPaneProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [runtimeErrors, setRuntimeErrors] = useState<string[]>([]);

  // Update preview when files change
  useEffect(() => {
    if (files.length === 0) return;
    
    try {
      updatePreview();
      setRuntimeErrors([]);
    } catch (err) {
      setError(`Preview error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [files]);

  // Set up message listener for runtime errors from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Only accept messages from our iframe
      if (event.source !== iframeRef.current?.contentWindow) return;
      
      if (event.data && event.data.type === 'runtime-error') {
        setRuntimeErrors(prev => [...prev, event.data.error]);
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Create a blob URL from the files and update the iframe
  const updatePreview = () => {
    if (!iframeRef.current) return;
    
    setError(null);
    
    // Find HTML file (default to index.html)
    const htmlFile = files.find(file => file.path.endsWith('.html')) || 
                    files.find(file => file.path === 'index.html');
    
    if (!htmlFile) {
      setError('No HTML file found in the generated code.');
      return;
    }
    
    // Create a map of all files for easy lookup
    const fileMap = files.reduce((map, file) => {
      map[file.path] = file.content;
      return map;
    }, {} as Record<string, string>);
    
    // Process HTML to handle relative imports
    let processedHtml = htmlFile.content;
    
    // Add error handling script to capture runtime errors
    const errorHandlingScript = `
      <script>
        window.onerror = function(message, source, lineno, colno, error) {
          window.parent.postMessage({
            type: 'runtime-error',
            error: \`Error: \${message} (line \${lineno}, col \${colno})\`
          }, '*');
          return true; // Prevent default error handling
        };
        
        window.addEventListener('unhandledrejection', function(event) {
          window.parent.postMessage({
            type: 'runtime-error',
            error: \`Unhandled Promise Rejection: \${event.reason}\`
          }, '*');
        });
      </script>
    `;
    
    // Insert error handling script after opening head tag
    processedHtml = processedHtml.replace(/<head>/i, `<head>${errorHandlingScript}`);
    
    // Replace script src and link href with blob URLs
    processedHtml = processedHtml.replace(
      /(src|href)=["'](.+?)["']/g,
      (match, attribute, path) => {
        // Skip absolute URLs or data URLs
        if (path.startsWith('http') || path.startsWith('data:') || path.startsWith('#')) {
          return match;
        }
        
        // Find the referenced file
        const referencedFile = files.find(f => f.path === path);
        if (!referencedFile) {
          return match; // Keep original if file not found
        }
        
        // Create blob URL based on file type
        const mimeType = getMimeType(path);
        const blob = new Blob([referencedFile.content], { type: mimeType });
        const blobUrl = URL.createObjectURL(blob);
        
        return `${attribute}="${blobUrl}"`;
      }
    );
    
    // Create blob for the HTML file
    const htmlBlob = new Blob([processedHtml], { type: 'text/html' });
    const htmlUrl = URL.createObjectURL(htmlBlob);
    
    // Update iframe src
    iframeRef.current.src = htmlUrl;
  };

  // Get MIME type based on file extension
  const getMimeType = (path: string): string => {
    const extension = path.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'js':
        return 'application/javascript';
      case 'css':
        return 'text/css';
      case 'html':
        return 'text/html';
      case 'json':
        return 'application/json';
      case 'svg':
        return 'image/svg+xml';
      default:
        return 'text/plain';
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 rounded-lg shadow">
      <h2 className="text-xl font-bold p-4 border-b flex justify-between items-center">
        <span>Preview</span>
        {runtimeErrors.length > 0 && (
          <span className="text-sm text-red-500 font-normal">
            {runtimeErrors.length} runtime error{runtimeErrors.length > 1 ? 's' : ''}
          </span>
        )}
      </h2>
      
      {error ? (
        <div className="p-4 text-red-500 overflow-auto">
          {error}
        </div>
      ) : files.length > 0 ? (
        <div className="flex-grow relative">
          <iframe
            ref={iframeRef}
            className="absolute inset-0 w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin"
            title="Code Preview"
          />
          
          {runtimeErrors.length > 0 && (
            <div className="absolute bottom-0 left-0 right-0 bg-red-100 border-t border-red-400 p-2 max-h-32 overflow-y-auto">
              <h3 className="font-bold text-red-700">Runtime Errors:</h3>
              <ul className="text-sm text-red-700">
                {runtimeErrors.map((err, index) => (
                  <li key={index}>{err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center h-full p-4 text-gray-500">
          No preview available. Generate code first.
        </div>
      )}
    </div>
  );
}
