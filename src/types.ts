export type BlockType = 
  | 'text' 
  | 'h1' 
  | 'h2' 
  | 'h3' 
  | 'h4'
  | 'h5'
  | 'h6'
  | 'bulleted_list' 
  | 'numbered_list' 
  | 'todo' 
  | 'quote'
  | 'image'
  | 'page' 
  | 'table' 
  | 'divider';

export interface Block {
  id: string;
  type: BlockType;
  content: string;
  properties?: {
    checked?: boolean;
    rows?: string[][];
    targetPageId?: string;
    url?: string;
    caption?: string;
  };
}

export interface Page {
  id: string;
  title: string;
  icon: string;
  parentId: string | null;
  blocks: Block[];
  createdAt: number;
  updatedAt: number;
}

export interface AppData {
  pages: Record<string, Page>;
  rootPageIds: string[];
}
