export interface StoreItem {
  id: number;
  url: string;
  category: string;
}

export interface Store {
  items: StoreItem[];
}
