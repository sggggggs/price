window.onload = () => {

let itemForm = document.getElementById("item-form");
let itemRowTemplate = document.getElementById("item-row-template");
let recipeContainer = document.getElementById("recipe-container");
let totalSpan = document.getElementById("total");

let itemIcon = document.querySelector(".item-icon");
let itemName = document.querySelector(".item-name");
let itemAmount = document.querySelector(".item-amount");
let itemPrice = document.querySelector(".item-price");
let itemPriceNQ = document.querySelector(".item-price-nq");
let itemPriceHQ = document.querySelector(".item-price-hq");

async function getItemInfo(name, amount) {
    let response = await (await fetch(`https://xivapi.com/search?indexes=Item&string=${name}`, { mode: 'cors' })).json();
    let info = response.Results[0];
    info.Amount = amount;
    info.Price = await getItemPrice(info.ID, 1) * amount;
    info.PriceNQ = await getItemPrice(info.ID, 1, "NQ") * amount;
    info.PriceHQ = await getItemPrice(info.ID, 1, "HQ") * amount;
    info.Yield = await getYield(info.ID);
    return info;
}

async function getItemRecipe(ID, amount) {
    let item = await (await fetch(`https://xivapi.com/item/${ID}`)).json();
    let recipe = await (await fetch(`https://xivapi.com/recipe/${item.Recipes[0].ID}`)).json();
    let ingredients = [];
    for (let i = 0; i <= 9; i++) {
        if (recipe[`AmountIngredient${i}`] > 0) {
            let ingredient = recipe[`ItemIngredient${i}`];
            ingredients.push({
                "ID": ingredient.ID,
                "Icon": ingredient.Icon,
                "Name": ingredient.Name,
                "Amount": recipe[`AmountIngredient${i}`] * amount,
                "Price": await getItemPrice(ingredient.ID, recipe[`AmountIngredient${i}`] * amount),
                "PriceNQ": await getItemPrice(ingredient.ID, recipe[`AmountIngredient${i}`] * amount, "NQ"),
                "PriceHQ": await getItemPrice(ingredient.ID, recipe[`AmountIngredient${i}`] * amount, "HQ")
            });
        }
    }

    return ingredients;
}

async function getItemPrice(ID, amount, quality) {
    let response = await (await fetch(`https://universalis.app/api/Crystal/${ID}`)).json();
    let listings = response.listings;
    let price = 0;
    let lastPrice = 0;
    while (amount > 0) {
        if (listings.length > 0) {
            if (listings[0].quantity <= 0) {
                listings.shift();
            }

            if (listings.length > 0) {

                listings[0].quantity -= 1;
                if (quality === "NQ" && listings[0].hq) continue;
                if (quality === "HQ" && !listings[0].hq) continue;

                price += listings[0].pricePerUnit;
                lastPrice = listings[0].pricePerUnit;
                amount -= 1;
            } else {
                price += lastPrice;
                amount -= 1;
            }
        } else {
            price += lastPrice;
            amount -= 1;
        }

    }
    
    return price;
}

async function getYield(ID) {
    let item = await (await fetch(`https://xivapi.com/item/${ID}`)).json();
    let recipe = await (await fetch(`https://xivapi.com/recipe/${item.Recipes[0].ID}`)).json();
    return recipe.AmountResult;
}

function makeItemRow(item) {
    let row = itemRowTemplate.content.cloneNode(true);
    row.querySelector(".item-icon").src = `https://xivapi.com${item.Icon}`;
    row.querySelector(".item-name").textContent = item.Name;
    row.querySelector(".item-amount").textContent = item.Amount.toLocaleString();
    row.querySelector(".item-price").textContent = item.Price.toLocaleString();
    row.querySelector(".item-price-nq").textContent = item.PriceNQ.toLocaleString();
    row.querySelector(".item-price-hq").textContent = item.PriceHQ.toLocaleString();
    return row;
}

function displayItemInfo(info, amount) {
    itemIcon.src = `https://xivapi.com${info.Icon}`;
    itemName.textContent = info.Name;
    itemAmount.textContent = (info.Amount * info.Yield).toLocaleString();
    itemPrice.textContent = (info.Price * info.Yield).toLocaleString();
    itemPriceNQ.textContent = (info.PriceNQ * info.Yield).toLocaleString();
    itemPriceHQ.textContent = (info.PriceHQ * info.Yield).toLocaleString();
}

function displayItemRecipe(recipe) {
    while (recipeContainer.firstChild) {
        recipeContainer.removeChild(recipeContainer.firstChild);
    }

    recipe.forEach(ingredient => {
        recipeContainer.append(makeItemRow(ingredient));
    });
}

async function onSubmit(event) {
    totalSpan.textContent = "";

    event.preventDefault();
    let elements = event.target.elements;
    let name = elements["item-name"].value;
    let craftAmount = Number(elements["item-amount"].value);

    let info = await getItemInfo(name, craftAmount);
    displayItemInfo(info);

    let recipe = await getItemRecipe(info.ID, craftAmount);
    displayItemRecipe(recipe);

    let total = 0;
    recipe.forEach(ingredient => total += ingredient.Price);
    totalSpan.textContent = total.toLocaleString();
}

itemForm.addEventListener("submit", onSubmit, false);

}