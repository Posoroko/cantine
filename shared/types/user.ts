/**
 * User-related types
 */

import type { AccessToken } from './directus'

export type {
    UserState
}

type UserState = {
    isLoggedIn: boolean
    username: string
    email: string
    id: string
    accessToken: AccessToken
}
