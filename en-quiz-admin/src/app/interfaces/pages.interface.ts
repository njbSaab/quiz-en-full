export interface PageContent {
    [key: string]: any; // полностью гибкий контент
  }
  
  export interface Page {
    id: number;
    slug: string;
    title: string;
    content: PageContent;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  }
  