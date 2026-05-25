import { dbGet } from '@/composables/fetch'

export interface EventRecord {
    id: number
    name: string
    description: string
    image: string
    days: Array<{ id: number; date: string }>
    contacts: Array<{ id: number; name: string; telephone: string; email: string; notes: string }>
}

const eventFields = [
    'id',
    'name',
    'description',
    'image',
    'days.*',
    'days.date',
    'contacts.id',
    'contacts.name',
    'contacts.telephone',
    'contacts.email',
    'contacts.notes',
    'cooks.*'
]

export function useEvents() {

    async function getEvents(): Promise<EventRecord[]> {
        return await dbGet({
            endpoint: '/items/events',
            query: {
                fields: eventFields.join(),
                sort: '-date_created'
            }
        })
    }

    async function getEventById(eventId: number): Promise<EventRecord> {
        return await dbGet({
            endpoint: `/items/events/${eventId}`,
            query: {
                fields: eventFields.join()
            }
        })
    }

    

    return {
        getEvents,
        getEventById
    }
}
