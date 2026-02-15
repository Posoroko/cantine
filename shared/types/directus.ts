/**
 * Directus-specific types
 * Shared between client and any future server code
 */

export type {
    DirectusTokens,
    AccessToken
}

type DirectusTokens = {
    access_token: string
    refresh_token: string
    expires: number
}

type AccessToken = {
    value: string
    expires: number
}
