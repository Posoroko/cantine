import { dbGet } from '@/composables/fetch'

export interface CookRecord {
    id: number
    name: string
    telephone: string
    email: string
    avatar?: string
}

export function useCooks() {
  
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
        getCooks,
        getHiredCooks
    }
}
