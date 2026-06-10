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

async function getSuggestion() {

    const prompt =
        document.getElementById("userPrompt").value;

    const output =
        document.getElementById("aiResponse");

    if(prompt.trim() === ""){
        output.innerText =
        "Please enter your lifestyle details.";
        return;
    }

    output.innerText = "🤖 Generating AI recommendations...";

    
    const fullPrompt = `
    You are an eco sustainability expert.

    Analyze the following lifestyle and provide:
    1. Carbon footprint concerns
    2. Eco-friendly suggestions
    3. A sustainability score out of 10

    Lifestyle:
    ${prompt}
    `;

    try{

        const response =
        await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            {
                                text: fullPrompt
                            }
                        ]
                    }
                ]
            })
        });

        const data = await response.json();

        output.innerText =
        data.candidates[0].content.parts[0].text;

    }
    catch(error){

        output.innerText =
        "Error connecting to Gemini AI.";
    }
}