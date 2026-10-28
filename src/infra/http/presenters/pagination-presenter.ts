import { DEFAULT_PER_PAGE } from '@/core/repositories/pagination-params'

// The list routes take no page size, so every page has the default one
export class PaginationPresenter {
  static toHTTP(page: number, totalCount: number) {
    return {
      page,
      perPage: DEFAULT_PER_PAGE,
      totalCount,
    }
  }
}
