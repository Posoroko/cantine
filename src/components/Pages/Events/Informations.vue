<script setup>
import { computed } from 'vue'
import Icon from '@/components/Icon/Main.vue'
import { TIME_SLOT_CONFIG } from '@/composables/appAssets'

const props = defineProps({
    event: {
        type: Object,
        required: true
    }
})

// c5t: flatten all services across all days, sorted by day then timeSlot order
const allServices = computed(() => {
    const services = []
    for (const day of props.event?.days ?? []) {
        for (const service of day.services ?? []) {
            services.push({ ...service, date: day.date })
        }
    }
    return services.sort((a, b) => {
        if (a.date !== b.date) return a.date < b.date ? -1 : 1
        const orderA = TIME_SLOT_CONFIG[a.timeSlot ?? '']?.order ?? 99
        const orderB = TIME_SLOT_CONFIG[b.timeSlot ?? '']?.order ?? 99
        return orderA - orderB
    })
})

const totalGuests = computed(() =>
    allServices.value.reduce((sum, s) => sum + (s.guestCount ?? 0), 0)
)

const targetBudget = computed(() => {
    if (!props.event?.pricePerGuest || !totalGuests.value) return null
    return totalGuests.value * props.event.pricePerGuest
})

</script>

<template>
    <div
        class="
            scrollBox
            grow
            flex column gap20
        "
    >
        <div class="infoItem">
            <div class="infoLabel flex alignCenter gap5">
                <Icon>location_on</Icon>

                <h3 class="infoValue">{{ event.description }}</h3>
            </div>
        </div>

        <div class="infoItem">
            <div class="infoLabel flex alignCenter gap5">
                <Icon>table</Icon>

                <a 
                    class="infoValue"
                    href="https://assogetup.sharepoint.com/:x:/s/SHAREPOINTGETUP/IQBS4VqRE43sRasFO8v9bo1cAdhZVNqFB8YK3WrwpFpoOR4?rtime=L9vWf3_F3kg"
                >
                    Tableau des jauges
                </a>
            </div>
        </div>


        <div class="infoItem">
            <div class="infoLabel flex alignCenter gap5">
                <Icon>calendar_today</Icon>
                <h3 class="infoValue">
                    {{ event.days?.length || 0 }}
                    <span>jour</span><span v-if="event?.days?.length > 1">s</span>
                </h3>
            </div>
        </div>


        <div class="infoItem">
            <div class="flex">
                <div class="infoLabel flex alignCenter gap5">
                    <Icon>contacts</Icon>
                    <h3>Contacts</h3>
                </div>
            </div>

            <div 
                v-if="event?.contacts?.length > 0" 
                class="
                    contactsList marTop10
                    flex column gap10
                "
            >
                <div 
                    v-for="contact in event.contacts" :key="contact.id" 
                    class="
                        contactItem 
                        beigeCardGreenText 
                        flex column gap5
                        rounded10 overflowHidden
                        pad10
                    "
                >
                    <div 
                        class="
                            contactName 
                            flex alignCenter
                        "
                    >
                        <span
                            class="fontWeightBold"
                        >
                            {{ contact.name }}
                        </span>
                    </div>

                    <div
                        v-if="contact.telephone" 
                        class="contactDetail flex alignCenter gap10"
                    >
                            <Icon
                                color="green"
                            >
                                call
                            </Icon>
                        <span>
                            {{ contact.telephone }}
                        </span>
                    </div>
                    
                    <div
                        v-if="contact.email" 
                        class="contactDetail flex alignCenter gap10"
                    >
                        <Icon
                                color="green"
                        >
                            email
                        </Icon>

                        <span>
                            {{ contact.email }}
                        </span> 
                    </div>
                </div>
            </div>
            <p v-else class="infoValue">Aucun contact</p>
        </div>

        <div class="infoItem">
            <div class="flex">
                <div class="infoLabel flex alignCenter gap5">
                    <Icon>shopping_cart</Icon>
                    <h3>Fournisseurs</h3>
                </div>
            </div>
        </div>

        <div class="infoItem">
            <div class="infoLabel flex alignCenter gap5">
                <Icon>groups</Icon>
                <h3>Services</h3>
            </div>

            <div class="servicesList marTop10 flex column gap5">
                <div
                    v-for="service in allServices"
                    :key="service.id"
                    class="serviceRow flex alignCenter justifyBetween gap10"
                >
                    <div class="flex alignCenter gap5">
                        <Icon size="sm">{{ TIME_SLOT_CONFIG[service.timeSlot ?? '']?.icon || 'restaurant' }}</Icon>
                        <span class="serviceDate">{{ service.date ? new Date(service.date).toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' }) : '' }}</span>
                        <span class="serviceSlot">{{ TIME_SLOT_CONFIG[service.timeSlot ?? '']?.label || service.timeSlot }}</span>
                    </div>
                    <span class="serviceCount fontWeightBold">{{ service.guestCount ?? '—' }}</span>
                </div>

                <div class="serviceTotalRow flex justifyBetween gap10 marTop5">
                    <span class="fontWeightBold">Total</span>
                    <span class="fontWeightBold">{{ totalGuests }}</span>
                </div>

                <div
                    v-if="event.pricePerGuest"
                    class="serviceTotalRow flex justifyBetween gap10"
                >
                    <span>× {{ event.pricePerGuest }} € / pers.</span>
                    <span class="fontWeightBold">{{ targetBudget?.toFixed(2) }} €</span>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.serviceRow {
    padding: 4px 0;
    border-bottom: 1px solid color-mix(in srgb, var(--beige) 10%, transparent);
    color: var(--beige);
    font-size: 0.95em;
}

.serviceDate {
    opacity: 0.6;
    font-size: 0.85em;
}

.serviceSlot {
    opacity: 0.9;
}

.serviceCount {
    color: var(--beige);
}

.serviceTotalRow {
    padding-top: 6px;
    color: var(--beige);
}
</style>
