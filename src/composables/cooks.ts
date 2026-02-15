import { dbPost, dbPatch, dbDelete, dbUploadFile, dbGet } from '@/composables/fetch'

interface CreateCookPayload {
    name: string
    telephone: string
    email: string
    avatarFile?: File
}

interface UpdateCookPayload {
    name?: string
    telephone?: string
    email?: string
    avatarFile?: File
}

export interface CookRecord {
    id: number
    name: string
    telephone: string
    email: string
    avatar?: string
}

export function useCooks() {
    /**
     * Create a new cook
     */
    async function createCook(payload: CreateCookPayload): Promise<CookRecord> {
        try {
            // 1. Upload avatar if provided
            let avatarId = null
            if (payload.avatarFile) {
                const uploadRes = await dbUploadFile(payload.avatarFile)
                avatarId = uploadRes?.id

                if (!avatarId) {
                    throw new Error('Avatar upload succeeded but no ID returned')
                }
            }

            // 2. Create the cook
            const cookBody: any = {
                name: payload.name,
                telephone: payload.telephone,
                email: payload.email
            }

            if (avatarId) {
                cookBody.avatar = avatarId
            }

            const result = await dbPost({
                endpoint: '/items/cooks',
                body: cookBody
            })

            return result as CookRecord
        } catch (error) {
            console.error('Error creating cook:', error)
            throw error
        }
    }

    /**
     * Update an existing cook
     */
    async function updateCook(cookId: number, payload: UpdateCookPayload): Promise<CookRecord> {
        try {
            const cookBody: any = {}

            // Upload new avatar if provided
            if (payload.avatarFile) {
                const uploadRes = await dbUploadFile(payload.avatarFile)
                const avatarId = uploadRes?.id

                if (!avatarId) {
                    throw new Error('Avatar upload succeeded but no ID returned')
                }

                cookBody.avatar = avatarId
            }

            // Add other fields if provided
            if (payload.name !== undefined) cookBody.name = payload.name
            if (payload.telephone !== undefined) cookBody.telephone = payload.telephone
            if (payload.email !== undefined) cookBody.email = payload.email

            const result = await dbPatch({
                endpoint: `/items/cooks/${cookId}`,
                body: cookBody
            })

            return result as CookRecord
        } catch (error) {
            console.error('Error updating cook:', error)
            throw error
        }
    }

    /**
     * Hire a cook for an event (create junction table entry)
     */
    async function hire(cookId: number, eventId: number): Promise<any> {
        try {
            const result = await dbPost({
                endpoint: '/items/event_cooks',
                body: {
                    cook: cookId,
                    event: eventId
                }
            })

            return result
        } catch (error) {
            console.error('Error hiring cook:', error)
            throw error
        }
    }

    /**
     * Fire a cook from an event (delete junction table entry)
     * Needs to find the event_cooks record first by cook and event IDs
     */
    async function fire(cookId: number, eventId: number): Promise<void> {
        try {
            // Find the event_cooks record
            const records = await dbGet({
                endpoint: '/items/event_cooks',
                query: {
                    filter: JSON.stringify({
                        _and: [
                            { cook: { _eq: cookId } },
                            { event: { _eq: eventId } }
                        ]
                    })
                }
            }) as Array<{ id: number }>

            if (!records || records.length === 0) {
                throw new Error('Cook not hired for this event')
            }

            const recordId = records[0].id

            // Delete the record
            await dbDelete(`/items/event_cooks/${recordId}`)
        } catch (error) {
            console.error('Error firing cook:', error)
            throw error
        }
    }


    /**
     * Get all cooks
     */
    async function getCooks(): Promise<Array<CookRecord>> {
        try {
            const result = await dbGet({
                endpoint: '/items/cooks'
            })

            console.log('getCooks result from dbGet:', result)

            // Handle different response structures
            if (Array.isArray(result)) {
                console.log('Result is already an array')
                return result as Array<CookRecord>
            }

            const resultObj = result as any
            if (resultObj && typeof resultObj === 'object' && 'data' in resultObj) {
                console.log('Result has data property:', resultObj.data)
                return resultObj.data
            }

            console.log('Returning result as-is:', result)
            return (Array.isArray(result) ? result : []) as Array<CookRecord>
        } catch (error) {
            console.error('Error getting cooks:', error)
            throw error
        }
    }

    /**
     * Get all cooks hired for a specific event
     */
    async function getHiredCooks(eventId: number): Promise<Array<CookRecord>> {
        try {
            const result = await dbGet({
                endpoint: '/items/event_cooks',
                query: {
                    filter: JSON.stringify({
                        event: { _eq: eventId }
                    }),
                    fields: 'cook.*'
                }
            }) as any

            // The response structure might be { data: [...] } or just [...]
            const records = (result as any).data || result
            
            if (!Array.isArray(records)) {
                return []
            }

            // Extract cook objects from the records
            return records.map((record: any) => record.cook).filter(Boolean)
        } catch (error) {
            console.error('Error getting hired cooks:', error)
            throw error
        }
    }

    return {
        createCook,
        updateCook,
        getCooks,
        getHiredCooks,
        hire,
        fire
    }
}
