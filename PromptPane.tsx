import { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';

interface PromptPaneProps {
  onGenerate: (prompt: string) => void;
  isLoading?: boolean;
}

export function PromptPane({ onGenerate, isLoading = false }: PromptPaneProps) {
  const [prompt, setPrompt] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onGenerate(prompt);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-white dark:bg-gray-900 rounded-lg shadow">
      <h2 className="text-xl font-bold">Prompt</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Textarea
          placeholder="Enter your code instructions (e.g., 'Create a button that alerts Hello')"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="min-h-[120px] resize-y"
          disabled={isLoading}
        />
        <Button 
          type="submit" 
          className="self-end"
          disabled={isLoading || !prompt.trim()}
        >
          {isLoading ? 'Generating...' : 'Generate Code'}
        </Button>
      </form>
    </div>
  );
}
