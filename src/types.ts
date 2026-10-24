export interface GeneratedImage {
  id: string;
  prompt: string;
  enhancedPrompt?: string;
  style: string;
  aspectRatio: string;
  imageUrl: string;
  createdAt: string;
  isFavorite?: boolean;
  sourceMode: 'text' | 'image' | 'sketch';
  model?: string;
  isFallback?: boolean;
  notice?: string;
}

export interface StyleOption {
  id: string;
  name: string;
  description: string;
  gradient: string;
  tag: string;
  iconName: string;
}

export interface AspectRatioOption {
  id: string;
  label: string;
  ratio: string;
  widthRatio: number;
  heightRatio: number;
  description: string;
}

export interface PromptInspiration {
  title: string;
  prompt: string;
  style: string;
  aspectRatio: string;
  category: string;
}
