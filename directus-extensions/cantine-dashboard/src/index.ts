import { defineModule } from '@directus/extensions-sdk'
import HomeView from './views/HomeView.vue'
import EventsView from './views/EventsView.vue'
import EventDetail from './views/EventDetail.vue'
import MealDetail from './views/MealDetail.vue'
import ShoppingList from './views/ShoppingList.vue'
import RecipesView from './views/RecipesView.vue'
import RecipeDetail from './views/RecipeDetail.vue'

export default defineModule({
    id: 'cantine-dashboard',
    name: 'Cantine',
    icon: 'restaurant',
    routes: [
        { path: '', component: HomeView },
        { path: 'events', component: EventsView },
        { path: 'events/:eventId', component: EventDetail },
        { path: 'events/:eventId/meals/:mealId', component: MealDetail },
        { path: 'events/:eventId/shopping-list', component: ShoppingList },
        { path: 'recipes', component: RecipesView },
        { path: 'recipes/:recipeId', component: RecipeDetail },
    ],
})
