// Page size when the caller does not ask for one
export const DEFAULT_PER_PAGE = 20

export interface PaginationParams {
  page: number
  perPage?: number
}
