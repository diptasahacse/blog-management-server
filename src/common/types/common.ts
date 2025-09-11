export type IQueryOptions = {
  page?: number; // Current page number
  limit?: number; // Limit per page
  orderBy?: 'asc' | 'desc'; // Order by direction
  orderField?: string; // Field to order by
} & Record<string, string>;

export interface IPagination {
  totalItems: number; // Total number of items in the database
  itemCount: number; // Number of items returned in this page
  itemsPerPage: number; // Limit per page
  totalPages: number; // Total number of pages
  currentPage: number; // Current page number
}
export interface IErrorItem {
  path: string | number;
  message: string;
}
export interface IErrorResponse {
  message: string;
  errors: IErrorItem[];
  stack?: string;
}

export interface ICommonResponse<T> {
  data: T;
  message?: string;
  pagination?: IPagination;
}
