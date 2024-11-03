export interface StoreItem {
  id: number;
  url: string;
  category: string;
  feedTitle: string;
  contentGroup: ContentGroup[];
}
export interface ContentGroup {
  id: string;
  author: string;
  content: string;
  publishedAt: string;
  favorite: number | boolean;
  imageSource: string | null;
  link: string;
  title: string;
  description: string;
}
export interface Store {
  items: StoreItem[];
}
