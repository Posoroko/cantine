// ============================================================
// Économat Planning — Apps Script
// ============================================================
// Feuilles de données :
//   _Config             : type (categorie/unite), valeur
//   Ingredients         : id, nom, categorie, unite, prix_unitaire
//   Recettes            : id, nom, nb_portions_base, notes
//   Recette_Ingredients : id, recette_id, ingredient_id, quantite
//   Evenements          : id, nom, date_debut, date_fin
//   Jours               : id, evenement_id, date, label
//   Services            : id, jour_id, slot, nb_couverts
//   Service_Recettes    : id, service_id, recette_id
// ============================================================


// ------------------------------------------------------------
// Menu
// ------------------------------------------------------------

function onOpen() {
    SpreadsheetApp.getUi()
        .createMenu('Économat')
        .addItem('Ouvrir le panneau', 'showSidebar')
        .addToUi()
}


// ------------------------------------------------------------
// Sidebar
// ------------------------------------------------------------

function showSidebar() {
    var html = HtmlService.createHtmlOutputFromFile('Sidebar')
        .setTitle('Économat Planning')
        .setWidth(360)
    SpreadsheetApp.getUi().showSidebar(html)
}


// ============================================================
// CONFIG
// ============================================================

var DEFAULT_CATEGORIES = ['Sec', 'Frais', 'Liquide', 'Légumes', 'Viande', 'Épices', 'Pain', 'Divers']
var DEFAULT_UNITS = ['kg', 'g', 'L', 'cl', 'pièce', 'botte', 'boîte', 'sachet']

function getOrCreateConfigSheet() {
    var ss = SpreadsheetApp.getActiveSpreadsheet()
    var sheet = ss.getSheetByName('_Config')

    if (!sheet) {
        sheet = ss.insertSheet('_Config')
        sheet.hideSheet()
        sheet.getRange('A1:B1').setValues([['type', 'valeur']])
        sheet.getRange('A1:B1').setFontWeight('bold')

        var rows = []
        DEFAULT_CATEGORIES.forEach(function (c) { rows.push(['categorie', c]) })
        DEFAULT_UNITS.forEach(function (u) { rows.push(['unite', u]) })
        sheet.getRange(2, 1, rows.length, 2).setValues(rows)
    }

    return sheet
}

function getConfig() {
    return {
        categories: getCategories(),
        units: getUnits()
    }
}

function getCategories() {
    var sheet = getOrCreateConfigSheet()
    var data = sheet.getDataRange().getValues()
    return data
        .filter(function (r) { return r[0] === 'categorie' && r[1] })
        .map(function (r) { return String(r[1]) })
        .sort()
}

function getUnits() {
    var sheet = getOrCreateConfigSheet()
    var data = sheet.getDataRange().getValues()
    return data
        .filter(function (r) { return r[0] === 'unite' && r[1] })
        .map(function (r) { return String(r[1]) })
}

function addCategory(name) {
    name = name.trim()
    var existing = getCategories()
    if (existing.indexOf(name) !== -1) {
        return { error: 'La catégorie "' + name + '" existe déjà.' }
    }
    var sheet = getOrCreateConfigSheet()
    sheet.appendRow(['categorie', name])
    return { categories: getCategories() }
}

function addUnit(name) {
    name = name.trim()
    var existing = getUnits()
    if (existing.indexOf(name) !== -1) {
        return { error: 'L\'unité "' + name + '" existe déjà.' }
    }
    var sheet = getOrCreateConfigSheet()
    sheet.appendRow(['unite', name])
    return { units: getUnits() }
}


// ============================================================
// HELPERS GÉNÉRIQUES
// ============================================================

function getOrCreateSheet(name, headers) {
    var ss = SpreadsheetApp.getActiveSpreadsheet()
    var sheet = ss.getSheetByName(name)
    if (!sheet) {
        sheet = ss.insertSheet(name)
        sheet.getRange(1, 1, 1, headers.length).setValues([headers])
        sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold')
        sheet.setFrozenRows(1)
    }
    return sheet
}

function generateId(sheet) {
    var lastRow = sheet.getLastRow()
    if (lastRow <= 1) return 1
    var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues()
        .map(function (r) { return r[0] })
        .filter(function (v) { return typeof v === 'number' && v > 0 })
    if (ids.length === 0) return 1
    return Math.max.apply(null, ids) + 1
}

function getAllRows(sheetName) {
    var ss = SpreadsheetApp.getActiveSpreadsheet()
    var sheet = ss.getSheetByName(sheetName)
    if (!sheet || sheet.getLastRow() <= 1) return []
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
    var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues()
    return data
        .map(function (row) {
            var obj = {}
            headers.forEach(function (h, i) { obj[h] = row[i] })
            return obj
        })
        .filter(function (r) { return r['id'] !== '' && r['id'] !== 0 })
}


// ============================================================
// INGREDIENTS
// ============================================================

var ING_HEADERS = ['id', 'nom', 'categorie', 'unite', 'prix_unitaire']

function getIngredientSheet() {
    return getOrCreateSheet('Ingredients', ING_HEADERS)
}

// Retourne tous les ingrédients (pour la sidebar)
function getIngredients() {
    return getAllRows('Ingredients')
}

// Ajoute un ingrédient — retourne { ingredient } ou { error }
function addIngredient(nom, categorie, unite, prix) {
    nom = nom.trim()
    categorie = categorie.trim()

    if (!nom) return { error: 'Le nom est obligatoire.' }
    if (!categorie) return { error: 'La catégorie est obligatoire.' }

    var sheet = getIngredientSheet()
    var existing = getAllRows('Ingredients')
    var duplicate = existing.filter(function (r) {
        return r['nom'].toString().toLowerCase() === nom.toLowerCase()
    })
    if (duplicate.length > 0) {
        return { error: 'Un ingrédient "' + nom + '" existe déjà.' }
    }

    var id = generateId(sheet)
    var prixNum = parseFloat(String(prix).replace(',', '.'))
    if (isNaN(prixNum)) prixNum = ''

    sheet.appendRow([id, nom, categorie, unite || '', prixNum])

    return { ingredient: { id: id, nom: nom, categorie: categorie, unite: unite, prix_unitaire: prixNum } }
}

// Met à jour un ingrédient existant
function updateIngredient(id, nom, categorie, unite, prix) {
    var sheet = getIngredientSheet()
    var lastRow = sheet.getLastRow()
    if (lastRow <= 1) return { error: 'Aucun ingrédient trouvé.' }

    var data = sheet.getRange(2, 1, lastRow - 1, ING_HEADERS.length).getValues()
    for (var i = 0; i < data.length; i++) {
        if (data[i][0] === id) {
            var row = i + 2
            var prixNum = parseFloat(String(prix).replace(',', '.'))
            if (isNaN(prixNum)) prixNum = ''
            sheet.getRange(row, 2, 1, 4).setValues([[nom.trim(), categorie.trim(), unite || '', prixNum]])
            return { success: true }
        }
    }
    return { error: 'Ingrédient id=' + id + ' introuvable.' }
}

// Supprime un ingrédient (vérifie qu'il n'est pas utilisé dans une recette)
function deleteIngredient(id) {
    var usages = getAllRows('Recette_Ingredients').filter(function (r) {
        return r['ingredient_id'] === id
    })
    if (usages.length > 0) {
        return { error: 'Cet ingrédient est utilisé dans ' + usages.length + ' recette(s). Supprimez-le des recettes d\'abord.' }
    }

    var sheet = getIngredientSheet()
    var lastRow = sheet.getLastRow()
    var data = sheet.getRange(2, 1, lastRow - 1, 1).getValues()
    for (var i = 0; i < data.length; i++) {
        if (data[i][0] === id) {
            sheet.deleteRow(i + 2)
            return { success: true }
        }
    }
    return { error: 'Ingrédient introuvable.' }
}


// ============================================================
// RECETTES
// ============================================================

var REC_HEADERS = ['id', 'nom', 'nb_portions_base', 'notes']
var RI_HEADERS  = ['id', 'recette_id', 'ingredient_id', 'quantite']

function getRecetteSheet() {
    return getOrCreateSheet('Recettes', REC_HEADERS)
}

function getRecetteIngredientSheet() {
    return getOrCreateSheet('Recette_Ingredients', RI_HEADERS)
}

// Retourne toutes les recettes avec leurs ingrédients dénormalisés
function getRecettes() {
    var recettes = getAllRows('Recettes')
    var ris = getAllRows('Recette_Ingredients')
    var ingredients = getAllRows('Ingredients')

    var ingMap = {}
    ingredients.forEach(function (ing) { ingMap[ing['id']] = ing })

    return recettes.map(function (rec) {
        rec.ingredients = ris
            .filter(function (ri) { return ri['recette_id'] === rec['id'] })
            .map(function (ri) {
                var ing = ingMap[ri['ingredient_id']] || {}
                return {
                    id: ri['id'],
                    ingredient_id: ri['ingredient_id'],
                    nom: ing['nom'] || '',
                    unite: ing['unite'] || '',
                    quantite: ri['quantite']
                }
            })
        return rec
    })
}

// Crée une recette vide — retourne { recette } ou { error }
function addRecette(nom, nb_portions_base, notes) {
    nom = nom.trim()
    if (!nom) return { error: 'Le nom est obligatoire.' }

    var sheet = getRecetteSheet()
    var id = generateId(sheet)
    var portions = parseInt(nb_portions_base) || 1
    sheet.appendRow([id, nom, portions, notes || ''])

    return { recette: { id: id, nom: nom, nb_portions_base: portions, notes: notes || '', ingredients: [] } }
}

// Ajoute un ingrédient à une recette
function addIngredientToRecette(recette_id, ingredient_id, quantite) {
    var sheet = getRecetteIngredientSheet()
    var id = generateId(sheet)
    var qty = parseFloat(String(quantite).replace(',', '.'))
    if (isNaN(qty) || qty <= 0) return { error: 'La quantité doit être un nombre positif.' }

    sheet.appendRow([id, recette_id, ingredient_id, qty])
    return { success: true, id: id }
}

// Met à jour la quantité d'un ingrédient dans une recette
function updateRecetteIngredient(id, quantite) {
    var sheet = getRecetteIngredientSheet()
    var lastRow = sheet.getLastRow()
    if (lastRow <= 1) return { error: 'Aucune donnée.' }

    var data = sheet.getRange(2, 1, lastRow - 1, RI_HEADERS.length).getValues()
    for (var i = 0; i < data.length; i++) {
        if (data[i][0] === id) {
            var qty = parseFloat(String(quantite).replace(',', '.'))
            if (isNaN(qty) || qty <= 0) return { error: 'Quantité invalide.' }
            sheet.getRange(i + 2, 4).setValue(qty)
            return { success: true }
        }
    }
    return { error: 'Ligne introuvable.' }
}

// Supprime un ingrédient d'une recette
function removeIngredientFromRecette(id) {
    var sheet = getRecetteIngredientSheet()
    var lastRow = sheet.getLastRow()
    if (lastRow <= 1) return { error: 'Aucune donnée.' }

    var data = sheet.getRange(2, 1, lastRow - 1, 1).getValues()
    for (var i = 0; i < data.length; i++) {
        if (data[i][0] === id) {
            sheet.deleteRow(i + 2)
            return { success: true }
        }
    }
    return { error: 'Ligne introuvable.' }
}

// Supprime une recette et tous ses ingrédients
function deleteRecette(id) {
    var usages = getAllRows('Service_Recettes').filter(function (r) {
        return r['recette_id'] === id
    })
    if (usages.length > 0) {
        return { error: 'Cette recette est utilisée dans ' + usages.length + ' service(s).' }
    }

    // Supprimer les lignes Recette_Ingredients (de bas en haut)
    var riSheet = getRecetteIngredientSheet()
    var riData = riSheet.getLastRow() > 1
        ? riSheet.getRange(2, 1, riSheet.getLastRow() - 1, RI_HEADERS.length).getValues()
        : []
    for (var i = riData.length - 1; i >= 0; i--) {
        if (riData[i][1] === id) riSheet.deleteRow(i + 2)
    }

    // Supprimer la recette
    var sheet = getRecetteSheet()
    var data = sheet.getLastRow() > 1
        ? sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues()
        : []
    for (var j = 0; j < data.length; j++) {
        if (data[j][0] === id) {
            sheet.deleteRow(j + 2)
            return { success: true }
        }
    }
    return { error: 'Recette introuvable.' }
}


// ============================================================
// EVENEMENTS
// ============================================================

var EVT_HEADERS  = ['id', 'nom', 'date_debut', 'date_fin']
var JOUR_HEADERS = ['id', 'evenement_id', 'date', 'label']
var SRV_HEADERS  = ['id', 'jour_id', 'slot', 'nb_couverts']
var SR_HEADERS   = ['id', 'service_id', 'recette_id']

var SLOTS = ['Petit-déjeuner', 'Déjeuner', 'Dîner', 'Collation']

function getSlots() { return SLOTS }

function getEvenementSheet()     { return getOrCreateSheet('Evenements', EVT_HEADERS) }
function getJourSheet()          { return getOrCreateSheet('Jours', JOUR_HEADERS) }
function getServiceSheet()       { return getOrCreateSheet('Services', SRV_HEADERS) }
function getServiceRecetteSheet(){ return getOrCreateSheet('Service_Recettes', SR_HEADERS) }

// --- Événements ---

function getEvenements() {
    return getAllRows('Evenements')
}

function addEvenement(nom, date_debut, date_fin) {
    nom = nom.trim()
    if (!nom) return { error: 'Le nom est obligatoire.' }

    var sheet = getEvenementSheet()
    var id = generateId(sheet)
    sheet.appendRow([id, nom, date_debut || '', date_fin || ''])
    return { evenement: { id: id, nom: nom, date_debut: date_debut, date_fin: date_fin } }
}

function deleteEvenement(id) {
    // Supprimer en cascade : services_recettes > services > jours > evenement
    var jours = getAllRows('Jours').filter(function (j) { return j['evenement_id'] === id })
    jours.forEach(function (j) { _deleteJourCascade(j['id']) })

    var sheet = getEvenementSheet()
    var data = sheet.getLastRow() > 1 ? sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues() : []
    for (var i = 0; i < data.length; i++) {
        if (data[i][0] === id) { sheet.deleteRow(i + 2); return { success: true } }
    }
    return { error: 'Événement introuvable.' }
}

// --- Jours ---

function getJours(evenement_id) {
    return getAllRows('Jours').filter(function (j) { return j['evenement_id'] === evenement_id })
}

function addJour(evenement_id, date, label) {
    var sheet = getJourSheet()
    var id = generateId(sheet)
    sheet.appendRow([id, evenement_id, date || '', (label || '').trim()])
    return { jour: { id: id, evenement_id: evenement_id, date: date, label: label } }
}

function deleteJour(id) {
    _deleteJourCascade(id)
    var sheet = getJourSheet()
    var data = sheet.getLastRow() > 1 ? sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues() : []
    for (var i = 0; i < data.length; i++) {
        if (data[i][0] === id) { sheet.deleteRow(i + 2); return { success: true } }
    }
    return { error: 'Jour introuvable.' }
}

function _deleteJourCascade(jour_id) {
    var services = getAllRows('Services').filter(function (s) { return s['jour_id'] === jour_id })
    services.forEach(function (s) { _deleteServiceCascade(s['id']) })

    var sheet = getServiceSheet()
    var data = sheet.getLastRow() > 1 ? sheet.getRange(2, 1, sheet.getLastRow() - 1, SRV_HEADERS.length).getValues() : []
    for (var i = data.length - 1; i >= 0; i--) {
        if (data[i][1] === jour_id) sheet.deleteRow(i + 2)
    }
}

// --- Services ---

function getServices(jour_id) {
    var services = getAllRows('Services').filter(function (s) { return s['jour_id'] === jour_id })
    var srs = getAllRows('Service_Recettes')
    var recettes = getAllRows('Recettes')

    var recMap = {}
    recettes.forEach(function (r) { recMap[r['id']] = r })

    return services.map(function (srv) {
        srv.recettes = srs
            .filter(function (sr) { return sr['service_id'] === srv['id'] })
            .map(function (sr) {
                var rec = recMap[sr['recette_id']] || {}
                return { sr_id: sr['id'], recette_id: sr['recette_id'], nom: rec['nom'] || '' }
            })
        return srv
    })
}

function addService(jour_id, slot, nb_couverts) {
    if (!slot) return { error: 'Le slot est obligatoire.' }
    var sheet = getServiceSheet()
    var id = generateId(sheet)
    var nb = parseInt(nb_couverts) || 0
    sheet.appendRow([id, jour_id, slot, nb])
    return { service: { id: id, jour_id: jour_id, slot: slot, nb_couverts: nb, recettes: [] } }
}

function updateServiceCouverts(id, nb_couverts) {
    var sheet = getServiceSheet()
    var data = sheet.getLastRow() > 1 ? sheet.getRange(2, 1, sheet.getLastRow() - 1, SRV_HEADERS.length).getValues() : []
    for (var i = 0; i < data.length; i++) {
        if (data[i][0] === id) {
            sheet.getRange(i + 2, 4).setValue(parseInt(nb_couverts) || 0)
            return { success: true }
        }
    }
    return { error: 'Service introuvable.' }
}

function deleteService(id) {
    _deleteServiceCascade(id)
    var sheet = getServiceSheet()
    var data = sheet.getLastRow() > 1 ? sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues() : []
    for (var i = 0; i < data.length; i++) {
        if (data[i][0] === id) { sheet.deleteRow(i + 2); return { success: true } }
    }
    return { error: 'Service introuvable.' }
}

function _deleteServiceCascade(service_id) {
    var sheet = getServiceRecetteSheet()
    var data = sheet.getLastRow() > 1 ? sheet.getRange(2, 1, sheet.getLastRow() - 1, SR_HEADERS.length).getValues() : []
    for (var i = data.length - 1; i >= 0; i--) {
        if (data[i][1] === service_id) sheet.deleteRow(i + 2)
    }
}

// --- Service_Recettes ---

function addRecetteToService(service_id, recette_id) {
    // Vérifier doublon
    var existing = getAllRows('Service_Recettes').filter(function (sr) {
        return sr['service_id'] === service_id && sr['recette_id'] === recette_id
    })
    if (existing.length > 0) return { error: 'Cette recette est déjà assignée à ce service.' }

    var sheet = getServiceRecetteSheet()
    var id = generateId(sheet)
    sheet.appendRow([id, service_id, recette_id])
    return { success: true, id: id }
}

function removeRecetteFromService(id) {
    var sheet = getServiceRecetteSheet()
    var data = sheet.getLastRow() > 1 ? sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues() : []
    for (var i = 0; i < data.length; i++) {
        if (data[i][0] === id) { sheet.deleteRow(i + 2); return { success: true } }
    }
    return { error: 'Ligne introuvable.' }
}

// Charge toutes les données d'un événement en un seul appel (pour la sidebar)
function getEvenementComplet(evenement_id) {
    var evt = getAllRows('Evenements').filter(function (e) { return e['id'] === evenement_id })[0]
    if (!evt) return { error: 'Événement introuvable.' }

    var jours = getJours(evenement_id)
    jours.forEach(function (j) {
        j.services = getServices(j['id'])
    })
    evt.jours = jours
    return evt
}


// ============================================================
// GENERATION COURSES & BUDGET
// ============================================================

// Point d'entrée appelé depuis la sidebar
function genererCoursesEtBudget(evenement_id) {
    var evt = getAllRows('Evenements').filter(function (e) { return e['id'] === evenement_id })[0]
    if (!evt) return { error: 'Événement introuvable.' }

    // Charger les données de référence
    var ingredients  = getAllRows('Ingredients')
    var recettes     = getAllRows('Recettes')
    var ris          = getAllRows('Recette_Ingredients')
    var jours        = getAllRows('Jours').filter(function (j) { return j['evenement_id'] === evenement_id })
    var services     = getAllRows('Services')
    var srs          = getAllRows('Service_Recettes')

    var ingMap = {}
    ingredients.forEach(function (i) { ingMap[i['id']] = i })

    var recMap = {}
    recettes.forEach(function (r) { recMap[r['id']] = r })

    // Agréger les quantités par ingrédient
    // { ingredient_id: { nom, categorie, unite, prix, quantite_totale } }
    var totaux = {}
    var total_couverts = 0

    jours.forEach(function (jour) {
        var joursServices = services.filter(function (s) { return s['jour_id'] === jour['id'] })

        joursServices.forEach(function (srv) {
            var nb = Number(srv['nb_couverts']) || 0
            total_couverts += nb

            var recettesDuService = srs.filter(function (sr) { return sr['service_id'] === srv['id'] })

            recettesDuService.forEach(function (sr) {
                var rec = recMap[sr['recette_id']]
                if (!rec) return

                var portions_base = Number(rec['nb_portions_base']) || 1
                var facteur = nb / portions_base

                var lignes = ris.filter(function (ri) { return ri['recette_id'] === rec['id'] })
                lignes.forEach(function (ri) {
                    var ing = ingMap[ri['ingredient_id']]
                    if (!ing) return

                    var qte = Number(ri['quantite']) * facteur
                    var iid = ri['ingredient_id']

                    if (!totaux[iid]) {
                        totaux[iid] = {
                            nom: ing['nom'],
                            categorie: ing['categorie'],
                            unite: ing['unite'],
                            prix_unitaire: Number(ing['prix_unitaire']) || 0,
                            quantite: 0
                        }
                    }
                    totaux[iid].quantite += qte
                })
            })
        })
    })

    // Écrire la feuille Courses
    _ecrireFeuilleCourses(evt['nom'], totaux)

    // Écrire la feuille Budget
    var nb_jours = jours.length
    _ecrireFeuilleBudget(evt['nom'], totaux, total_couverts, nb_jours)

    return { success: true, message: 'Feuilles "Courses" et "Budget" générées pour ' + evt['nom'] + '.' }
}

function _ecrireFeuilleCourses(nom_evt, totaux) {
    var ss = SpreadsheetApp.getActiveSpreadsheet()
    var sheetName = 'Courses_' + nom_evt.replace(/[^a-zA-Z0-9]/g, '_')

    // Supprimer l'ancienne feuille si elle existe
    var old = ss.getSheetByName(sheetName)
    if (old) ss.deleteSheet(old)

    var sheet = ss.insertSheet(sheetName)

    // En-têtes
    sheet.getRange('A1:E1').setValues([['Catégorie', 'Ingrédient', 'Quantité', 'Unité', 'Prix total']])
    sheet.getRange('A1:E1').setFontWeight('bold')
    sheet.setFrozenRows(1)

    // Trier par catégorie puis nom
    var lignes = Object.keys(totaux).map(function (k) { return totaux[k] })
    lignes.sort(function (a, b) {
        if (a.categorie < b.categorie) return -1
        if (a.categorie > b.categorie) return 1
        if (a.nom < b.nom) return -1
        if (a.nom > b.nom) return 1
        return 0
    })

    if (lignes.length === 0) return

    var rows = lignes.map(function (l) {
        var qte = Math.round(l.quantite * 100) / 100
        var prix = Math.round(qte * l.prix_unitaire * 100) / 100
        return [l.categorie, l.nom, qte, l.unite, prix]
    })

    sheet.getRange(2, 1, rows.length, 5).setValues(rows)

    // Mise en forme
    sheet.setColumnWidth(1, 120)
    sheet.setColumnWidth(2, 180)
    sheet.setColumnWidth(3, 80)
    sheet.setColumnWidth(4, 80)
    sheet.setColumnWidth(5, 90)

    // Total
    var totalRow = rows.length + 2
    sheet.getRange(totalRow, 4).setValue('TOTAL')
    sheet.getRange(totalRow, 4).setFontWeight('bold')
    sheet.getRange(totalRow, 5).setFormula('=SUM(E2:E' + (rows.length + 1) + ')')
    sheet.getRange(totalRow, 5).setFontWeight('bold')
}

function _ecrireFeuilleBudget(nom_evt, totaux, total_couverts, nb_jours) {
    var ss = SpreadsheetApp.getActiveSpreadsheet()
    var sheetName = 'Budget_' + nom_evt.replace(/[^a-zA-Z0-9]/g, '_')

    var old = ss.getSheetByName(sheetName)
    if (old) ss.deleteSheet(old)

    var sheet = ss.insertSheet(sheetName)

    // Calculer le coût total
    var cout_total = 0
    Object.keys(totaux).forEach(function (k) {
        var l = totaux[k]
        cout_total += l.quantite * l.prix_unitaire
    })
    cout_total = Math.round(cout_total * 100) / 100

    var cout_par_couvert = total_couverts > 0 ? Math.round(cout_total / total_couverts * 100) / 100 : 0
    var cout_par_jour    = nb_jours > 0 ? Math.round(cout_total / nb_jours * 100) / 100 : 0

    var data = [
        ['Événement', nom_evt],
        ['Nombre de jours', nb_jours],
        ['Total couverts (tous services)', total_couverts],
        ['', ''],
        ['Coût total ingrédients (€)', cout_total],
        ['Coût par couvert (€)', cout_par_couvert],
        ['Coût par jour (€)', cout_par_jour]
    ]

    sheet.getRange(1, 1, data.length, 2).setValues(data)
    sheet.getRange(1, 1, data.length, 1).setFontWeight('bold')
    sheet.setColumnWidth(1, 220)
    sheet.setColumnWidth(2, 120)
}
