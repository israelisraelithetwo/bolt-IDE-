import { useState } from 'react';
import Editor from '@monaco-editor/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { ScrollArea } from '../../components/ui/scroll-area';

export interface FileData {
  path: string;
  content: string;
}

interface CodePaneProps {
  files: FileData[];
  onFileChange: (path: string, content: string) => void;
}

export function CodePane({ files, onFileChange }: CodePaneProps) {
  const [activeFile, setActiveFile] = useState<string>(files.length > 0 ? files[0].path : '');

  // Get file name from path
  const getFileName = (path: string) => {
    return path.split('/').pop() || path;
  };

  // Get language from file extension
  const getLanguage = (path: string) => {
    const extension = path.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'js':
        return 'javascript';
      case 'jsx':
        return 'javascript';
      case 'ts':
        return 'typescript';
      case 'tsx':
        return 'typescript';
      case 'html':
        return 'html';
      case 'css':
        return 'css';
      case 'json':
        return 'json';
      default:
        return 'plaintext';
    }
  };

  // Find the active file content
  const activeFileContent = files.find(file => file.path === activeFile)?.content || '';
  
  // Handle editor content change
  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined && activeFile) {
      onFileChange(activeFile, value);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 rounded-lg shadow">
      <h2 className="text-xl font-bold p-4 border-b">Code Editor</h2>
      
      {files.length > 0 ? (
        <>
          <Tabs 
            value={activeFile} 
            onValueChange={setActiveFile}
            className="flex flex-col h-full"
          >
            <ScrollArea className="w-full">
              <TabsList className="flex w-full overflow-x-auto">
                {files.map((file) => (
                  <TabsTrigger 
                    key={file.path} 
                    value={file.path}
                    className="min-w-fit"
                  >
                    {getFileName(file.path)}
                  </TabsTrigger>
                ))}
              </TabsList>
            </ScrollArea>
            
            {files.map((file) => (
              <TabsContent 
                key={file.path} 
                value={file.path}
                className="flex-grow mt-0 h-full"
              >
                <Editor
                  height="100%"
                  language={getLanguage(file.path)}
                  value={file.content}
                  onChange={handleEditorChange}
                  options={{
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                  }}
                />
              </TabsContent>
            ))}
          </Tabs>
        </>
      ) : (
        <div className="flex items-center justify-center h-full p-4 text-gray-500">
          No code generated yet. Enter a prompt and click "Generate Code".
        </div>
      )}
    </div>
  );
}
