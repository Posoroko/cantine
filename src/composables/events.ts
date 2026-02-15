import { dbPost, dbUploadFile, dbGet } from '@/composables/fetch'

interface CreateEventPayload {
    title: string
    location: string
    dateFrom: string
    dateTo: string
    dates: string[]
    image?: File
}

interface EventCreated {
    event: { id: number }
    days: Array<{ id: number; date: string }>
    plannings: Array<{ id: number; dayId: number }>
    menus: Array<{ id: number; dayId: number }>
}

export interface EventRecord {
    id: number
    name: string
    description: string
    image: string
    days: Array<{ id: number; date: string }>
    contacts: Array<{ id: number; name: string; telephone: string; email: string; notes: string }>
}

export function useEvents() {
    async function createEvent(payload: CreateEventPayload): Promise<EventCreated> {
        const { title, location, dates, image } = payload

        try {
            // 1. Upload image file if provided
            let imageId = null
            if (image) {
                const uploadRes = await dbUploadFile(image)
                imageId = uploadRes?.id
                
                if (!imageId) {
                    throw new Error('File upload succeeded but no ID returned')
                }
            }

            // 2. Create event with nested days (services and plannings are empty, UI will manage them)
            const eventBody: any = {
                name: title,
                description: location,
                status: 'draft',
                days: dates.map(dateStr => ({
                    date: dateStr,
                    status: 'draft',
                    servingFood: false,
                    showDay: false,
                    services: [],
                    plannings: []
                }))
            }
            
            if (imageId) {
                eventBody.image = imageId
            }

            const eventRes = await dbPost({
                endpoint: '/items/events',
                body: eventBody
            })
            
            const eventId = (eventRes as any)?.id

            if (!eventId) {
                console.error('Create event response:', eventRes)
                throw new Error('Failed to create event - no ID returned')
            }

            // Extract created days from response
            const createdDays = ((eventRes as any)?.days || []).map((day: any) => ({
                id: day.id,
                date: day.date
            }))

            return {
                event: { id: eventId },
                days: createdDays,
                plannings: [],
                menus: []
            }
        } catch (error) {
            console.error('Error creating event:', error)
            throw error
        }
    }

    async function getEvents(): Promise<EventRecord[]> {
        return await dbGet({
            endpoint: '/items/events',
            query: {
                fields: 'id,name,description,image,days.id,days.date,contacts.id,contacts.name,contacts.telephone,contacts.email,contacts.notes',
                sort: '-date_created'
            }
        })
    }

    async function getEventById(eventId: number): Promise<EventRecord> {
        return await dbGet({
            endpoint: `/items/events/${eventId}`,
            query: {
                fields: 'id,name,description,image,days.id,days.date,days.servingFood,days.showDay,days.services,days.plannings,contacts.id,contacts.name,contacts.telephone,contacts.email,contacts.notes'
            }
        })
    }

    async function createContact(payload: {
        eventId: number
        name: string
        telephone: string
        email: string
        notes: string
    }) {
        try {
            const result = await dbPost({
                endpoint: '/items/contacts',
                body: {
                    event: payload.eventId,
                    name: payload.name,
                    telephone: payload.telephone,
                    email: payload.email,
                    notes: payload.notes,
                    status: 'draft'
                }
            })

            return result
        } catch (error) {
            console.error('Error creating contact:', error)
            throw error
        }
    }

    return {
        createEvent,
        getEvents,
        getEventById,
        createContact
    }
}
