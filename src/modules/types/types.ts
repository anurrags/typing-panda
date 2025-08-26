export type BannerType = "error" | "warning" | "info" | "success";

export interface TableProps<T> {
  headers: string[];
  data: T[];
  renderRow: (item: T, index: number) => React.ReactNode;
}
