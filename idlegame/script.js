//Functions for manipulating resources
function createResource(name, max, showMax, gain, costs, show)
{
    const resource = new Object();
    resource.name = name;
    resource.amount = 0;
    resource.max = max;
    resource.total = 0;
    resource.gain = gain;
    resource.showMax = showMax;
    resource.costs = costs;
    resource.show = show;
    return resource;
}
function getResource(name)
{
    for(let i = 0; i < resources.length; i++)
    {
        if(resources[i].name == name)
            return resources[i];
    }
    return null;
}
function addResource(resourceName, amount) {
    let resource = getResource(resourceName);
    if(amount == undefined)
        amount = resource.gain;
    if(resource != null)
    {
        //check for cost
        let canAfford = true;
        if(amount > 0 && resource.costs != undefined && resource.costs.length > 0)
        {
            for(var i = 0; i < resource.costs.length; i++)
            {
                const cost = getResource(resource.costs[i].name);
                if(cost.amount - resource.costs[i].amount < 0)
                    canAfford = false;
            }
        }
        if(canAfford)
        {
            if(resource.amount + amount <= resource.max)
            {
                resource.amount += amount;
                if(amount > 0)
                    resource.total += amount;
                if(resource.amount > resource.max)
                    resource.amount = resource.max;
                if(resource.amount < 0)
                    resource.amount = 0;
    
                //subtract costs
                if(amount > 0 && resource.costs != undefined && resource.costs.length > 0)
                {
                    for(var i = 0; i < resource.costs.length; i++)
                    {
                        const cost = getResource(resource.costs[i].name);
                        addResource(cost.name, -resource.costs[i].amount);
                    }
                }
            }
            updateProgression();
            updateItem(resource);
            updateStockpile(resource);
        }
        else
        {
            console.log("Can't make " + resource.name);
        }
    }  
    saveData();
}
function addResourceMax(resourceName, amount){
    let resource = getResource(resourceName);
    if(resource != null)
    {
        resource.max += amount;
        if(resource.max < 0)
            resource.max = 0;
        updateProgression();
        updateItem(resource);
        updateStockpile(resource);
    }  
}
function addResourceGain(resourceName, amount){
    let resource = getResource(resourceName);
    if(resource != null)
    {
        resource.gain += amount;
        if(resource.gain < 0)
            resource.gain = 0;
        updateProgression();
        updateItem(resource);
        updateStockpile(resource);
    }  
}

//Technologies
function createTech(name, costs, max, effect)
{
    const tech = new Object();
    tech.name = name;
    tech.costs = costs;
    tech.amount = 0;
    tech.max = max;
    tech.effect = effect;
    tech.show = false;
    return tech;
}
function getTech(name)
{
    for(let i = 0; i < techs.length; i++)
    {
        if(techs[i].name == name)
            return techs[i];
    }
    return null;
}
function buyTech(techName)
{
    let tech = getTech(techName);
    if(tech != null)
    {
        let canBuy = true;
        for(var i = 0; i < tech.costs.length; i++)
        {
            const resource = getResource(tech.costs[i].name);
            if(resource.amount - tech.costs[i].amount < 0)
                canBuy = false;
        }
        if(canBuy)
        {
            for(var i = 0; i < tech.costs.length; i++)
            {
                addResource(tech.costs[i].name, -tech.costs[i].amount);
                //Increase tech costs by 30%?
                tech.costs[i].amount += Math.floor(tech.costs[i].amount * 0.3);
            }
            tech.effect.run(tech.effect.name, tech.effect.amount);
            tech.amount++;
            
            updateProgression();
            updateTech(tech.name);
        }
        else
        {
            console.log("Can't buy " + tech.name);
        }
    }
    saveData();
}
//Functions for manipulating resources
function createTask(name, rate){
    const task = new Object();
    task.name = name;
    task.rate = rate;
    task.intervals = [];
    task.show = false;
    return task;
}
function getTask(name)
{
    for(let i = 0; i < tasks.length; i++)
    {
        if(tasks[i].name == name)
            return tasks[i];
    }
    return null;
}
async function addTask(name, amount){
    let task = getTask(name);
    if(popTasks.length + amount <= getResource("population").amount)
    {
        if(amount > 0)
        {
            for(var i = 0; i < amount; i++)
            {
                popTasks.push(name);
                task.intervals.push(setInterval(() => {
                    addResource(task.name, getResource(task.name).gain);
                    const $task = $("#" + task.name + "-task");
                    $task.addClass("active");
                    setTimeout(function () {
                        $task.removeClass("active");
                    }, 50);
                }, 1000 * task.rate));
            }
        }
        else if (amount < 0)
        {
            for(var i = 0; i < -amount; i++)
            {
                if(popTasks.length > 0 && popTasks.includes(name))
                    popTasks.splice(popTasks.lastIndexOf(name), 1);
                if(task.intervals.length > 0)
                    clearInterval(task.intervals.pop());
            }
        }
        updateTask(task);
    }
    saveData();
}

//Create all resources
let resources = [];
resources.push(createResource("population", 0, true, 1, [], true));
resources.push(createResource("food", 15, true, 1, [{name: "tools", amount: 1}], true));
resources.push(createResource("wood", 100, true, 1, [], true));
resources.push(createResource("stone", 50, true, 1, [], false));
resources.push(createResource("tools", 10, true, 1, [{name: "wood", amount: 5}, {name: "stone", amount: 5}], false));

//Create all techs
let techs = [];
techs.push(createTech("build-firepit", [{name: "wood", amount: 15}], 1, {name: "build-house", amount: 1, run: unlockItem, runName: "unlockItem"}));
techs.push(createTech("research-tools", [{name: "wood", amount: 15}, {name: "stone", amount: 25}], 1, {name: "tools", amount: 1, run: unlockItem, runName: "unlockItem"}));
techs.push(createTech("research-agriculture", [{name: "wood", amount: 30}, {name: "tools", amount: 5}], 1, {name: "food", amount: 1, run: unlockItem, runName: "unlockItem"}));
techs.push(createTech("build-house", [{name: "wood", amount: 25}, {name: "stone", amount: 15}], -1, {name: "population", amount: 1, run: addResourceMax, runName: "addResourceMax"}));
techs.push(createTech("build-farm", [{name: "wood", amount: 75}, {name: "tools", amount: 8}], -1, {name: "food", amount: 1, run: addResourceGain, runName: "addResourceGain"}));
techs.push(createTech("build-wood-stockpile", [{name: "wood", amount: 100}], -1, {name: "wood", amount: 100, run: addResourceMax, runName: "addResourceMax"}));
techs.push(createTech("build-stone-stockpile", [{name: "stone", amount: 50}], -1, {name: "stone", amount: 50, run: addResourceMax, runName: "addResourceMax"}));
techs.push(createTech("build-tools-stockpile", [{name: "wood", amount: 60}], -1, {name: "tools", amount: 1, run: addResourceMax, runName: "addResourceMax"}));
techs.push(createTech("build-food-stockpile", [{name: "wood", amount: 50}, {name: "stone", amount: 25}], -1, {name: "food", amount: 5, run: addResourceMax, runName: "addResourceMax"}));

//Create all tasks
let tasks = [];
tasks.push(createTask("wood", 1));
tasks.push(createTask("stone", 2));
tasks.push(createTask("tools", 5));
tasks.push(createTask("food", 5));

let popTasks = [];
let shownItems = [];

function updateProgression(){
    if(getResource("food").amount == 0 && getResource("population").amount > 0)
        setAlert("Your Population is starving!", true);
    else
        setAlert("", false);

    if(getResource("wood").total >= 5 && getTech("build-firepit").amount <= 0)
        unlockItem("build-firepit");
    if(getResource("stone").total >= 5 && getTech("research-tools").amount <= 0)
        unlockItem("research-tools");
    if(getResource("tools").total >= 1 && getTech("research-agriculture").amount <= 0)
        unlockItem("research-agriculture");

    if(getResource("wood").total >= 30)
        unlockItem("stone");
    if(getResource("wood").total >= 150)
        unlockItem("build-wood-stockpile");
    if(getResource("stone").total >= 150)
        unlockItem("build-stone-stockpile");
    if(getResource("tools").total >= 25)
        unlockItem("build-tools-stockpile");
    if(getResource("food").total >= 25)
        unlockItem("build-food-stockpile");
    if(getResource("population").total >= 3)
        unlockItem("build-farm");

    //Unlock task buttons when population is greater than 0
    if(getResource("population").amount > 0)
        for(var i = 0; i < tasks.length; i++)
        {
            unlockItem(tasks[i].name + "-tasks");
        }
            

    for(var i = 0; i < shownItems.length; i++)
    {
        unlockItem(shownItems[i]);
        if(shownItems[i].includes("-stockpile"))
            {
                let resource = getResource(shownItems[i].replace("-stockpile", ""));
                if(resource != null && resource != undefined)
                {
                    resource.show = true;
                    updateStockpile(resource);
                }
            }
    }

    for(var i = 0; i < resources.length; i++)
        if(resources[i].show)
            updateStockpile(resources[i]);
    for(var i = 0; i < techs.length; i++)
        if(techs[i].show)
            updateTech(techs[i].name);
        
        
    for(var i = 0; i < tasks.length; i++)
        if(tasks[i].show)
            updateTask(tasks[i]);
}

//Intervals
const addPopulation = setInterval(() => {
    if(Math.floor(Math.random() * 10) == 0 && resources[0].amount < resources[0].max && resources[1].amount > 0)
    {
        addResource("population", 1);
    }
        
}, 1000);
const consumeFood = setInterval(() => {
    
    if(resources[1].amount > 0)
    {
        addResource("food", -resources[0].amount);
        if(resources[1].amount < 0)
            resources[1].amount = 0;
    }
    else
    {
        //Starvation
        if(getResource("population").amount > 0)
        {
            addResource("population", -Math.ceil(resources[0].amount / 3));
            if(resources[0].amount < 0)
                resources[0].amount = 0;
            if(popTasks.length > 0)
                addTask(popTasks[popTasks.length - 1], -1);
        }
        
    }
}, 10000);

//Update page elements
function updateItem(resource){
    let item = document.getElementById(resource.name);
    if(item != null && item != undefined)
    {
        let divs = item.querySelectorAll("div");
        let addResource = divs[0].querySelectorAll("h5");
        let costResource = divs[1].querySelectorAll("h5");
        for(var i = 0; i < addResource.length; i++)
        {
            addResource[i].innerHTML = "+" + resource.gain + " " + capitalize(resource.name);
        }
        for(var i = 0; i < costResource.length; i++)
        {
            costResource[i].innerHTML = "-" + resource.costs[i].amount + " " + capitalize(resource.costs[i].name);
        }
    }
}
function updateStockpile(resource){
    unlockItem(resource.name + "-stockpile")
    if(resource.showMax)
        document.getElementById(resource.name + "-stockpile").innerHTML = capitalize(resource.name) + ": (" + resource.amount + " / " + resource.max + ")";
    else
        document.getElementById(resource.name + "-stockpile").innerHTML = capitalize(resource.name) + ": " + resource.amount;
    updateProgressBar(resource.name + "-stockpile", resource.amount, resource.max);
}
function updateProgressBar(bar, amount, max) {
    var percent = (amount / max) * 100;
    let color = "--green";
    if(percent >= 100)
        color = "--red";
    document.getElementById(bar).style.background = `linear-gradient(to right, var(${color}) ${percent}%, transparent ${percent}%)`;
}
function updateTech(techName){
    const costs = document.getElementById(techName).querySelectorAll("h5");
    const tech = getTech(techName);
    if(tech.max != -1 && tech.max <= tech.amount)
    {
        tech.show = false;
        if(shownItems.length > 0 && shownItems.includes(tech.name))
            shownItems.splice(shownItems.lastIndexOf(tech.name), 1);
        document.getElementById(techName).classList.add("hidden");
    }
    else
    {
        tech.show = true;
        unlockItem(techName);
        for(var i = 0; i < costs.length; i++)
        {
            costs[i].innerHTML = "-" + tech.costs[i].amount + " " + capitalize(tech.costs[i].name);
        }
    }
}
function updateTask(task){
    unlockItem(task.name + "-task");
    task.show = true;
    let taskItem = document.getElementById(task.name + "-task");
    taskItem.innerHTML = capitalize(task.name) + ": +" + task.intervals.length + " / " + task.rate + " sec";
}
function unlockItem(itemName)
{
    if(!shownItems.includes(itemName))
        shownItems.push(itemName);
    document.getElementById(itemName).classList.remove("hidden");
}
function setAlert(message, negative)
{
    const alert = document.getElementById("alerts")
    alert.innerHTML = message;
    if(negative)
        alert.style.backgroundColor = "var(--red)";
    else
        alert.style.backgroundColor = "var(--dark)";
}

function capitalize(text){
    return text.charAt(0).toUpperCase() + text.slice(1);
}

function saveData(){
    const data = {resources: [], techs: [], tasks: [], popTasks: [], shownItems: [] };
    for(var i = 0; i < resources.length; i++)
        data.resources.push(resources[i]);
    for(var i = 0; i < techs.length; i++)
        data.techs.push(techs[i]);
    for(var i = 0; i < tasks.length; i++)
        data.tasks.push(tasks[i]);
    for(var i = 0; i < popTasks.length; i++)
        data.popTasks.push(popTasks[i]);
    for(var i = 0; i < shownItems.length; i++)
        data.shownItems.push(shownItems[i]);
    localStorage.setItem("saveData", JSON.stringify(data));
}

function loadData(){
    const rawdata = localStorage.getItem("saveData");
    if (rawdata != null && rawdata != undefined)
    {
        const data = JSON.parse(rawdata);
        
        resources = [];
        for (let resource of data.resources) {
            const newResource = createResource(resource.name, resource.max, resource.showMax, resource.gain, resource.costs);
            newResource.amount = resource.amount;
            newResource.total = resource.total;
            resources.push(newResource);
        }
        techs = [];
        for (let tech of data.techs) {
            //Manually get functions
            let effectFunction = null;
            switch (tech.effect.runName) {
                case "unlockItem":
                    effectFunction = unlockItem;
                    break;
                case "addResourceMax":
                    effectFunction = addResourceMax;
                    break;
                case "addResourceGain":
                    effectFunction = addResourceGain;
                    break;
            }
            const newTech = createTech(tech.name, tech.costs, tech.max, {name: tech.effect.name, amount: tech.effect.amount, run: effectFunction, runName: tech.effect.runName});
            newTech.amount = tech.amount;
            newTech.show = tech.show;
            techs.push(newTech);
        }
        tasks = [];
        for (let task of data.tasks) {
            const newTask = createTask(task.name, task.rate);
            newTask.show = task.show;
            tasks.push(newTask);

            let pt = data.popTasks;
            for(var i = 0; i < pt.length; i++)
                if(pt[i] == newTask.name)
                    addTask(newTask.name, 1);
        }

        

        shownItems = data.shownItems;

        updateProgression();

        console.log("Loaded saved data");
    }
    else
        console.log("Did not load any data");
}

setInterval(saveData, 1000);
window.onload = function () {
    loadData();
    updateProgression();
};