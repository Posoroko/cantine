/**
 * Fetch composable for Directus API calls
 * Provides helper functions for CRUD operations
 * Auth is handled via cookies set by Directus (mode: 'cookie')
 */

import appConfig from '@/composables/appConfig'

export {
    dbGet,
    dbPost,
    dbPatch,
    dbDelete,
    dbUploadFile
}

async function dbFetch<T>(p: {
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE'
    endpoint: string
    body?: any
    query?: Record<string, any>
}): Promise<{ data: T }> {

    // Build URL with query params if provided
    let url = `${appConfig.dbUrl}${p.endpoint}`

    if (p.query) {

        const params = new URLSearchParams()
        Object.entries(p.query).forEach(([key, value]) => {
            if (typeof value === 'string') params.append(key, value)
            else if (typeof value === 'object') params.append(key, JSON.stringify(value))
            else params.append(key, String(value))
        })
        url += `?${params.toString()}`
    }

    const options: RequestInit = {
        method: p.method,
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        }
    }

    if (p.body) {
        options.body = JSON.stringify(p.body)
    }

    const response = await fetch(url, options)

    if (!response.ok) {
        const errorBody = await response.text().catch(() => 'no body')
        console.error(`[dbFetch] ${p.method} ${p.endpoint} → ${response.status}`, errorBody)
        throw new Error(`${p.method} ${p.endpoint} failed: ${response.status}`)
    }

    // Handle empty responses (e.g., DELETE requests returning 204 No Content)
    const text = await response.text()
    if (!text) {
        return { data: null as unknown as T }
    }

    const res = JSON.parse(text)
    return res
}

// Helpers

async function dbGet<T>(p: {
    endpoint: string
    query?: Record<string, any>
}): Promise<T> {
    const res = await dbFetch<T>({
        method: 'GET',
        endpoint: p.endpoint,
        query: p.query
    })

    return res.data
}

async function dbPost<T>(p: {
    endpoint: string
    body: any
    query?: Record<string, any>
}): Promise<T> {
    const res = await dbFetch<T>({
        method: 'POST',
        endpoint: p.endpoint,
        body: p.body,
        query: p.query
    })

    if (res?.data) {
        return res.data
    }
    return res as T
}

async function dbPatch<T>(p: {
    endpoint: string
    body: any
    query?: Record<string, any>
}): Promise<T> {
    const res = await dbFetch<T>({
        method: 'PATCH',
        endpoint: p.endpoint,
        body: p.body,
        query: p.query
    })

    return res.data
}

async function dbDelete<T>(endpoint: string): Promise<void> {
    await dbFetch<T>({
        method: 'DELETE',
        endpoint: endpoint
    })
}

async function dbUploadFile(file: File): Promise<{ id: string }> {
    const formData = new FormData()
    formData.append('file', file)

    const url = `${appConfig.dbUrl}/files`

    const response = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        body: formData
    })

    if (!response.ok) {
        const errorBody = await response.text().catch(() => 'no body')
        console.error(`[dbUploadFile] POST /files → ${response.status}`, errorBody)
        throw new Error(`File upload failed: ${response.status}`)
    }

    const res = await response.json()
    console.log('[dbUploadFile] Raw response:', res)
    console.log('[dbUploadFile] Response type:', typeof res)
    console.log('[dbUploadFile] Is res.data:', !!res?.data)
    console.log('[dbUploadFile] res.data value:', res?.data)
    
    // Handle different response structures
    const fileData = res.data ? res.data : res
    console.log('[dbUploadFile] fileData:', fileData)
    console.log('[dbUploadFile] fileData type:', typeof fileData)
    
    if (!fileData || fileData.id === undefined) {
        console.error('Unexpected file upload response - fileData:', fileData)
        console.error('Response object:', res)
        throw new Error('File upload response missing id field')
    }
    
    // Extract ID - could be string or number
    const id = String(fileData.id)
    console.log('[dbUploadFile] Extracted ID:', id)
    
    return { id }
}
