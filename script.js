function calculateCarbon() {

    let transport =
        Number(document.getElementById("transport").value);

    let distance =
        Number(document.getElementById("distance").value);

    let electricity =
        Number(document.getElementById("electricity").value);

    let food =
        Number(document.getElementById("food").value);

    let emission =
        (transport * distance) +
        electricity +
        food;

    let score =
        Math.max(100 - Math.floor(emission / 5), 0);

    let recommendation = "";

    if(score > 80){
        recommendation =
        "Excellent! Keep following sustainable habits.";
    }
    else if(score > 60){
        recommendation =
        "Good. Try reducing electricity consumption.";
    }
    else{
        recommendation =
        "Use public transport and save energy.";
    }

    document.getElementById("score").innerHTML =
        "Carbon Score: " + score + "/100";

    document.getElementById("emission").innerHTML =
        "Monthly Emission: " + emission + " kg CO₂";

    document.getElementById("recommendation").innerHTML =
        recommendation;

    let level = "";

    if(score >= 80){
        level = "Eco Hero 🌱";
    }
    else if(score >= 60){
        level = "Moderate 🟡";
    }
    else{
        level = "High Emission 🔴";
    }

    document.getElementById("topScore").innerText =
        score + "/100";

    document.getElementById("todayEmission").innerText =
        Math.floor(emission / 30) + " kg";

    document.getElementById("monthEmission").innerText =
        emission + " kg";

    document.getElementById("ecoLevel").innerText =
        level;

    carbonChart.data.datasets[0].data = [
        Math.floor(emission * 0.6),
        Math.floor(emission * 0.8),
        Math.floor(emission * 0.5),
        Math.floor(emission * 0.9),
        emission
    ];

    carbonChart.update();
}

const ctx =
document.getElementById('carbonChart');

const carbonChart =
new Chart(ctx, {
    type: 'bar',
    data: {
        labels: ['Mon','Tue','Wed','Thu','Fri'],
        datasets: [{
            label: 'CO₂ Emissions',
            data: [10,15,8,20,12]
        }]
    },
    options: {
        responsive:true,
        maintainAspectRatio:false
    }
});

function getSuggestion(){

    let prompt =
        document.getElementById("userPrompt")
        .value.toLowerCase();

    let response = "";

    if(prompt.includes("car") || prompt.includes("vehicle")){
        response =
        "🚗 Try using public transport or carpooling 2-3 times per week.";
    }

    else if(prompt.includes("ac")){
        response =
        "❄ Reduce AC usage by 1 hour daily.";
    }

    else if(prompt.includes("electricity")){
        response =
        "💡 Switch to LED bulbs and unplug unused devices.";
    }

    else if(prompt.includes("plastic")){
        response =
        "♻ Use reusable bottles and cloth bags.";
    }

    else{
        response =
        "🌱 Continue adopting sustainable habits and monitor your carbon footprint regularly.";
    }

    document.getElementById("aiResponse").innerText =
        response;
}