/**
 * Form validation utilities
 * Pure functions - no browser or Vue APIs
 */

export const validate = {
    passwordLength: (password: string): boolean => {
        return password.length >= 8
    },

    emailFormat: (email: string): boolean => {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
        return emailRegex.test(email)
    },

    areEqual: (one: any, two: any): boolean => {
        return one === two
    },

    isNotEmpty: (value: string): boolean => {
        return value.trim().length > 0
    },

    minLength: (value: string, min: number): boolean => {
        return value.length >= min
    },

    maxLength: (value: string, max: number): boolean => {
        return value.length <= max
    }
}
