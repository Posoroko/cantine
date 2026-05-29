<script setup>
import Icon from '@/components/Icon/Main.vue'

const props = defineProps({
    event: {
        type: Object,
        required: true
    }
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
    </div>
</template>

<style scoped>

</style>
