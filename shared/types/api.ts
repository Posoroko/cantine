/**
 * API request/response types
 */

export type {
    ApiResponse,
    ApiError
}

type ApiResponse<T> = {
    data: T
    meta?: {
        total_count?: number
        filter_count?: number
    }
}

type ApiError = {
    message: string
    extensions?: {
        code: string
    }
}
