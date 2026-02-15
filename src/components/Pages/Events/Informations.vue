<script setup>
import Icon from '@/components/Icon/Main.vue'
import MenuButton from '@/components/Cards/MenuButton/Main.vue'
import NewContact from '@/components/Architecture/Overlay/Modal/NewContact.vue'
import { useModal } from '@/composables/modal'
import { useEvents } from '@/composables/events'
import { dbDelete } from '@/composables/fetch'

const props = defineProps({
    event: {
        type: Object,
        required: true
    }
})

const emit = defineEmits(['contact-created', 'contact-deleted'])

const { showModal, showConfirmationModal } = useModal()

async function openNewContactModal() {
    try {
        console.log('Opening contact modal with eventId:', props.event.id)
        const result = await showModal(NewContact, { eventId: props.event.id })
        console.log('Contact created:', result)
        console.log('Emitting contact-created event')
        emit('contact-created')
    } catch (error) {
        console.log('Modal cancelled')
    }
}

function handleContactDelete(data) {
    showConfirmationModal({
        title: 'Supprimer le contact?',
        message: 'Cette action ne peut pas être annulée.',
        confirmText: 'Supprimer',
        cancelText: 'Annuler'
    }).then(async () => {
        try {
            await dbDelete(`/items/${data.collection}/${data.id}`)
            console.log('Contact deleted successfully')
            emit('contact-deleted')
        } catch (error) {
            console.error('Failed to delete contact:', error)
        }
    }).catch(() => {
        console.log('Delete cancelled')
    })
}

function handleContactUpdate(data) {
    console.log('Update contact:', data)
    // TODO: Implement update contact functionality
}

</script>

<template>
    <div
        class="
            scrollBox
            grow
            flex column gap10 
        "
    >
        <div class="eventInfo flex column gap15">
            <div class="infoItem">
                <div class="infoLabel flex alignCenter gap5">
                    <Icon>location_on</Icon>

                    <p class="infoValue">{{ event.description }}</p>
                </div>
            </div>

            <div class="infoItem">
                <div class="infoLabel flex alignCenter gap5">
                    <Icon>calendar_today</Icon>
                    <p class="infoValue">
                        {{ event.days?.length || 0 }}
                        <span>jour</span><span v-if="event?.days?.length > 1">s</span>
                    </p>
                </div>
            </div>
        </div>
        <div class="eventInfo flex column gap15">
            <div class="infoItem">
                <div class="flex justifyBetween">
                    <div class="infoLabel flex alignCenter gap5">
                        <Icon>contacts</Icon>
                        <span>Contacts</span>
                    </div>

                    <Icon
                        @click="openNewContactModal"
                        size="lg"
                        class="pointer"
                    >
                        add
                    </Icon>
                </div>

                <div 
                    v-if="event?.contacts?.length > 0" 
                    class="contactsList"
                >
                    <div 
                        v-for="contact in event.contacts" :key="contact.id" 
                        class="contactItem"
                    >
                        <div 
                            class="contactName flex justifyBetween alignCenter"
                        >
                            <span>
                                {{ contact.name }}
                            </span>

                            <MenuButton
                                :collection="'contacts'"
                                :id="contact.id"
                                canDelete
                                @delete="handleContactDelete"
                                @update="handleContactUpdate"
                            />
                        </div>

                        <div
                            v-if="contact.telephone" 
                            class="contactDetail"
                        >
                            <span>Tél:</span> {{ contact.telephone }}
                        </div>
                        
                        <div
                            v-if="contact.email" 
                            class="contactDetail"
                        >
                            <span>Email:</span> {{ contact.email }}
                        </div>
                    </div>
                </div>
                <p v-else class="infoValue">Aucun contact</p>
            </div>
        </div>
    </div>
</template>

<style scoped>
.scrollBox {
    overflow: scroll;
}
.eventInfo {
    padding: 20px;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid var(--beige);
    border-radius: 8px;
}

.infoItem {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.infoLabel {
    color: var(--gold);
    font-weight: bold;
    font-size: 14px;
    text-transform: uppercase;
}

.infoValue {
    margin: 0;
    color: var(--beige);
    font-size: 16px;
}

.contactsList {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.contactItem {
    padding: 12px;
    background: rgba(169, 169, 132, 0.1);
    border-radius: 4px;
    border-left: 2px solid var(--gold);
}

.contactName {
    color: var(--beige);
    font-weight: bold;
    margin-bottom: 6px;
}

.contactDetail {
    color: rgba(169, 169, 132, 0.9);
    font-size: 14px;
}

.contactDetail span {
    color: var(--gold);
    font-weight: bold;
}
</style>
