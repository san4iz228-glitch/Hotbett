let currentUser = null;

// Список матчів УПЛ
const matches = [
    {id:1, home:"Динамо Київ", away:"Шахтар Донецьк"},
    {id:2, home:"Зоря Луганськ", away:"Ворскла Полтава"},
    {id:3, home:"Дніпро-1", away:"Чорноморець"},
    {id:4, home:"Олександрія", away:"Маріуполь"},
    {id:5, home:"Колос Ковалівка", away:"Інгулець"},
    {id:6, home:"Рух Львів", away:"Металіст 1925"},
    {id:7, home:"Львів", away:"Волинь"}
];

let events = [];

// ======== Функції авторизації ========
function register() {
    const username = document.getElementById("username").value.trim();
    if(!username) return alert("Введіть ім'я користувача!");
    // Перевіряємо localStorage, якщо недоступний — використовуємо sessionStorage
    try {
        if(localStorage.getItem(username)) return alert("Користувач вже існує!");
        localStorage.setItem(username, JSON.stringify({balance:200}));
        alert("Користувач зареєстрований! Баланс $200");
    } catch (e) {
        alert("LocalStorage не доступний. Використовується тимчасове сховище.");
        sessionStorage.setItem(username, JSON.stringify({balance:200}));
    }
}

function login() {
    const username = document.getElementById("username").value.trim();
    if(!username) return alert("Введіть ім'я користувача!");
    let userData;
    try {
        userData = localStorage.getItem(username);
    } catch(e) {
        userData = sessionStorage.getItem(username);
    }
    if(!userData) return alert("Користувача не знайдено!");
    currentUser = username;
    document.getElementById("user-name").textContent = currentUser;
    document.getElementById("balance").textContent = JSON.parse(userData).balance;
    document.getElementById("auth").style.display = "none";
    document.getElementById("dashboard").style.display = "block";

    // Ініціалізація матчів
    events = matches.map(m=>{
        return {
            ...m,
            odds:(Math.random()+1.2).toFixed(2),
            startTime: new Date(Date.now() + 2*60*1000), // 2 хв до початку ставок
            duration: 90*60, // 90 хв
            homeGoals:0,
            awayGoals:0,
            bets:[],
            settled:false
        }
    });

    renderEvents();
    startMatches();
}

function logout() {
    currentUser = null;
    document.getElementById("dashboard").style.display="none";
    document.getElementById("auth").style.display="block";
}

// ======== Функції для матчів і ставок ========
function renderEvents() {
    const container = document.getElementById("events");
    container.innerHTML = "";
    const now = new Date();
    events.forEach(event=>{
        const canBet = now < event.startTime;
        const diff = event.startTime - now;
        let minutes = Math.floor(diff/60000);
        let seconds = Math.floor((diff%60000)/1000);
        if(minutes<0) minutes=0; if(seconds<0) seconds=0;
        const div = document.createElement("div");
        div.className = "event";
        div.innerHTML = `<span>${event.home} ${event.homeGoals} - ${event.awayGoals} ${event.away}</span>
                         <span>${canBet ? "Старт через: "+minutes+"м "+seconds+"с" : "Матч йде/завершено"}</span>
                         <input type="number" id="bet-${event.id}" placeholder="Ставка" ${!canBet?"disabled":""}>
                         <button class="btn" onclick="placeBet(${event.id})" ${!canBet?"disabled":""}>Ставити</button>`;
        container.appendChild(div);
    });
}

function placeBet(eventId) {
    const event = events.find(e=>e.id===eventId);
    const amount = parseFloat(document.getElementById(`bet-${event.id}`).value);
    if(!amount || amount <= 0) return alert("Введіть ставку!");
    let userData;
    try { userData = JSON.parse(localStorage.getItem(currentUser)); } catch(e){ userData = JSON.parse(sessionStorage.getItem(currentUser)); }
    if(amount > userData.balance) return alert("Недостатньо балансу!");
    event.bets.push({user: currentUser, amount});
    alert("Ставка прийнята!");
}

function startMatches() {
    setInterval(()=>{
        const now = new Date();
        events.forEach(event=>{
            if(!event.settled && now >= event.startTime) {
                const elapsed = (now - event.startTime)/1000;
                if(elapsed <= event.duration) {
                    if(Math.random()<0.02) event.homeGoals++;
                    if(Math.random()<0.02) event.awayGoals++;
                } else {
                    event.settled = true;
                    event.bets.forEach(bet=>{
                        let userData;
                        try { userData = JSON.parse(localStorage.getItem(bet.user)); } catch(e){ userData = JSON.parse(sessionStorage.getItem(bet.user)); }
                        if(event.homeGoals>event.awayGoals) userData.balance += bet.amount*(event.odds-1);
                        else if(event.homeGoals<event.awayGoals) userData.balance += bet.amount*(event.odds-1);
                        // нічия: баланс не змінюється
                        try { localStorage.setItem(bet.user, JSON.stringify(userData)); } catch(e){ sessionStorage.setItem(bet.user, JSON.stringify(userData)); }
                    });
                }
            }
        });
        renderEvents();
        if(currentUser){
            try { document.getElementById("balance").textContent = JSON.parse(localStorage.getItem(currentUser)).balance; }
            catch(e){ document.getElementById("balance").textContent = JSON.parse(sessionStorage.getItem(currentUser)).balance; }
        }
    }, 1000);
}