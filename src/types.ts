export interface StoreItem {
  id: number;
  url: string;
  category: string;
  feedtitle: string;
  contentGroup: ContentGroup[];
}
export interface ContentGroup {
  id: string;
  author: string;
  content: string;
  publishedat: string;
  favorite: number | boolean;
  imagesource: string | null;
  link: string;
  title: string;
  description: string;
}
export interface Store {
  items: StoreItem[];
}
