export interface StoreItem {
  id: number;
  url: string;
  category: string;
  feedTitle: string;
  contentGroup: {
    content: string;
    imageSource: string | null;
    link: string;
    title: string;
    description: string;
  }[];
}

export interface Store {
  items: StoreItem[];
}
