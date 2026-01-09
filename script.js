document.addEventListener('DOMContentLoaded', () => {
    // --- Data & Config ---
    const CONFIG = {
        storageKey: 'sprout_data_v3',
        themeKey: 'sprout_theme',
        messages: [
            { text: "Piglets in factory farms often undergo painful procedures like tail docking without any anesthesia or pain relief.", src: "https://pubmed.ncbi.nlm.nih.gov/32244333/" },
            { text: "In the dairy industry, calves are typically separated from their mothers within hours of birth, causing significant distress.", src: "https://www.sciencedirect.com/science/article/pii/S002203021930103X" },
            { text: "Cows form close friendships and show signs of stress when separated from preferred companions.", src: "https://pubmed.ncbi.nlm.nih.gov/21652434/" },
            { text: "Chickens can recognize over 100 individual faces and demonstrate complex emotional responses.", src: "https://pubmed.ncbi.nlm.nih.gov/28054366/" },
            { text: "Pigs are capable of complex problem-solving and outperform dogs in some cognitive tasks.", src: "https://pubmed.ncbi.nlm.nih.gov/27233261/" },
            { text: "Fish experience pain and exhibit neurological responses similar to mammals when harmed.", src: "https://pubmed.ncbi.nlm.nih.gov/24581454/" },
            { text: "Chickens bred for meat grow so fast that their legs often break under their own weight before they reach 6 weeks of age.", src: "https://pubmed.ncbi.nlm.nih.gov/31156453/" },
            { text: "Octopuses use tools, solve puzzles, and have both short- and long-term memory.", src: "https://pubmed.ncbi.nlm.nih.gov/23471018/" },
            { text: "In many countries, male chicks in the egg industry are culled immediately after hatching as they cannot lay eggs.", src: "https://www.europarl.europa.eu/news/en/headlines/society/20210603STO05412/animal-welfare-and-protection-eu-laws-explained" },
            { text: "A vegan diet can reduce an individual's food-related carbon footprint by up to 73%.", src: "https://www.science.org/doi/10.1126/science.aaq0216" },
            { text: "Animal agriculture is responsible for around 14.5% of global greenhouse gas emissions.", src: "https://www.fao.org/news/story/en/item/197623/icode/" },
            { text: "Producing 1kg of beef requires approx. 15,415 liters of water, while 1kg of vegetables requires only about 322 liters.", src: "https://waterfootprint.org/en/resources/water-footprint-statistics/" },
            { text: "If everyone shifted to a plant-based diet, global farmland use could be reduced by over 75%.", src: "https://www.science.org/doi/10.1126/science.aaq0216" },
            { text: "The livestock sector is a primary driver of deforestation, particularly in the Amazon.", src: "https://www.fao.org/3/a0701e/a0701e00.htm" },
            { text: "Industrial fishing nets make up nearly 50% of the plastic in the 'Great Pacific Garbage Patch'.", src: "https://www.nature.com/articles/s41598-018-22939-w" },
            { text: "Most global soy production (around 77%) is used to feed livestock, not humans.", src: "https://ourworldindata.org/soy" },
            { text: "The WHO classifies processed meats like bacon and ham as Group 1 carcinogens, the same category as tobacco.", src: "https://www.iarc.who.int/news-events/iarc-monographs-evaluate-consumption-of-red-meat-and-processed-meat/" },
            { text: "A whole-food plant-based diet is the only eating pattern proven to reverse advanced heart disease.", src: "https://pubmed.ncbi.nlm.nih.gov/25198208/" },
            { text: "Over 70% of all antibiotics globally are used on farm animals, contributing to antibiotic-resistant superbugs.", src: "https://www.who.int/news/item/07-11-2017-stop-using-antibiotics-in-healthy-animals-to-prevent-the-spread-of-antibiotic-resistance" },
            { text: "Well-planned vegan diets are nutritionally adequate for all stages of life, according to major dietetic associations.", src: "https://pubmed.ncbi.nlm.nih.gov/27886704/" },
            { text: "We already grow enough food to feed 10 billion people, but much is diverted to livestock feed.", src: "https://news.cornell.edu/stories/1997/08/us-could-feed-800-million-people-grain-livestock-eat" },
            { text: "Plant-based diets are associated with a significantly lower risk of developing Type 2 diabetes.", src: "https://pubmed.ncbi.nlm.nih.gov/31329220/" },
            { text: "Feeding crops to animals wastes the majority of their calories and protein during conversion.", src: "https://iopscience.iop.org/article/10.1088/1748-9326/8/3/034015" }
        ]
    };

    // Conservative minimum estimates per day (Vegan vs. Standard Diet)
    // Based on lower-bound data to ensure credible, non-exaggerated results.
    // Sources: Water Footprint Network, Cowspiracy, Poore & Nemecek (Oxford)
    const IMPACT_FACTORS = {
        animals: 0.1,   // Min: 1 animal life saved per 10 days (excluding bycatch/insects)
        water: 2700,    // Min: Liters saved (lower end of grain-fed beef vs plant protein)
        co2: 2.5,       // Min: kg of CO2 equivalent (direct production emissions only)
        forest: 1.5     // Min: m² of forest/land spared from feed-crop conversion
    };

    function calculateImpact() {
        const totalVeganDays = Object.values(state.history).filter(s => s === 'vegan').length;
        els.totalDaysCount.innerText = totalVeganDays;

        els.statVals.forEach(el => {
            const metric = el.dataset.metric;
            const factor = IMPACT_FACTORS[metric];
            const finalValue = Math.floor(totalVeganDays * factor);

            animateValue(el, 0, finalValue, 1500);
        });
    }

    // --- State Management ---
    let state = { history: {} };
    let viewDate = new Date();
    let selectedDateKey = null;

    // --- DOM Elements ---
    const els = {
        grid: document.getElementById('calendar-grid'),
        monthTitle: document.getElementById('calendar-title'),
        streakLabel: document.getElementById('streak-label'),
        quote: document.getElementById('quote'),
        sourceLink: document.getElementById('source-link'),
        sourceTag: document.getElementById('source-tag'),
        timer: document.getElementById('timer'),
        metaTheme: document.getElementById('meta-theme-color'),
        themeIcon: document.querySelector('#btn-theme span'),

        // Modals
        editor: document.getElementById('editor-overlay'),
        info: document.getElementById('info-overlay'),
        stats: document.getElementById('stats-overlay'),
        editorDateTitle: document.getElementById('editor-date'),

        // Stats
        totalDaysCount: document.getElementById('total-days-count'),
        statVals: document.querySelectorAll('.impact-val')
    };

    // --- Initialization ---
    function init() {
        loadData();
        loadTheme();
        updateDailyInsight();
        renderCalendar();
        startTimer();
        setupEventListeners();
    }

    // --- Core Functions ---
    function loadData() {
        const raw = localStorage.getItem(CONFIG.storageKey);
        if (raw) {
            try { state = JSON.parse(raw); } catch (e) { console.error("Data corruption", e); }
        }
    }

    function saveData() {
        localStorage.setItem(CONFIG.storageKey, JSON.stringify(state));
        renderCalendar();
    }

    function getDateKey(date) {
        const d = new Date(date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    function renderCalendar() {
        els.grid.innerHTML = '';
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();

        const monthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(viewDate);
        els.monthTitle.innerText = `${monthName} ${year}`;

        const firstDayOfMonth = new Date(year, month, 1);
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        let startDay = firstDayOfMonth.getDay();
        startDay = startDay === 0 ? 6 : startDay - 1;

        const todayKey = getDateKey(new Date());

        for (let i = 0; i < startDay; i++) {
            els.grid.appendChild(document.createElement('div'));
        }

        for (let d = 1; d <= daysInMonth; d++) {
            const dateObj = new Date(year, month, d);
            const key = getDateKey(dateObj);
            const status = state.history[key];

            const cell = document.createElement('div');
            cell.className = `day ${status || ''}`;
            cell.innerText = d;

            if (key === todayKey) cell.classList.add('today');
            cell.style.animationDelay = `${d * 0.01}s`;
            cell.addEventListener('click', () => openEditor(key));
            els.grid.appendChild(cell);
        }
        calculateStreak();
    }

    function updateDailyInsight() {
        const now = new Date();
        const dateSeed = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
        let hash = 0;
        for (let i = 0; i < dateSeed.length; i++) {
            hash = ((hash << 5) - hash) + dateSeed.charCodeAt(i);
            hash |= 0;
        }
        const index = Math.abs(hash) % CONFIG.messages.length;
        const msg = CONFIG.messages[index];
        els.quote.innerText = msg.text;
        els.sourceLink.href = msg.src;
    }

    function calculateStreak() {
        let streak = 0;
        let d = new Date();
        const todayKey = getDateKey(d);
        if (!state.history[todayKey]) d.setDate(d.getDate() - 1);

        while (true) {
            const key = getDateKey(d);
            if (state.history[key] === 'vegan') {
                streak++;
                d.setDate(d.getDate() - 1);
            } else { break; }
        }
        els.streakLabel.innerText = `${streak} Day Vegan Streak`;
    }

    function calculateImpact() {
        // Count total vegan days in history
        const totalVeganDays = Object.values(state.history).filter(s => s === 'vegan').length;

        els.totalDaysCount.innerText = totalVeganDays;

        els.statVals.forEach(el => {
            const metric = el.dataset.metric;
            const factor = IMPACT_FACTORS[metric];
            const finalValue = Math.floor(totalVeganDays * factor);

            // Animation for counting up
            animateValue(el, 0, finalValue, 1500);
        });
    }

    function animateValue(obj, start, end, duration) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const easeOut = 1 - Math.pow(1 - progress, 3); // Cubic ease out

            // Format large numbers with commas
            obj.innerText = Math.floor(progress * (end - start) + start).toLocaleString();

            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }

    function startTimer() {
        let lastDay = new Date().getDate();
        function tick() {
            const now = new Date();
            const tomorrow = new Date(now);
            tomorrow.setHours(24, 0, 0, 0);
            if (now.getDate() !== lastDay) {
                lastDay = now.getDate();
                updateDailyInsight();
            }
            const diff = tomorrow - now;
            const h = String(Math.floor(diff / (1000 * 60 * 60))).padStart(2, '0');
            const m = String(Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, '0');

            els.timer.innerText = `${h}h ${m}m left`;
        }
        tick();
        setInterval(tick, 60000);
    }

    // --- Interaction ---
    function openEditor(key) {
        selectedDateKey = key;
        const dateObj = new Date(key);
        els.editorDateTitle.innerText = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' });
        openModal(els.editor);
    }

    function openStats() {
        calculateImpact();
        openModal(els.stats);
    }

    function openModal(modal) {
        modal.classList.remove('hidden');
        modal.setAttribute('aria-hidden', 'false');
    }

    function setStatus(status) {
        if (!selectedDateKey) return;
        if (status === 'reset') delete state.history[selectedDateKey];
        else state.history[selectedDateKey] = status;
        saveData();
        closeModals();
        if (status === 'vegan') triggerConfetti();
    }

    function triggerConfetti() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const colors = isDark ? ['#9BC595', '#E3E8E3'] : ['#4A6741', '#D6E6D2'];
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.8 }, colors: colors, disableForReducedMotion: true });
    }

    function closeModals() {
        document.querySelectorAll('.modal-overlay').forEach(el => {
            el.classList.add('hidden');
            el.setAttribute('aria-hidden', 'true');
        });
        selectedDateKey = null;
    }

    // --- Theming & Data ---
    function loadTheme() {
        const saved = localStorage.getItem(CONFIG.themeKey) || 'light';
        document.documentElement.setAttribute('data-theme', saved);
        updateThemeVisuals(saved);
    }

    function toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem(CONFIG.themeKey, next);
        updateThemeVisuals(next);
    }

    function updateThemeVisuals(theme) {
        if (els.themeIcon) els.themeIcon.innerText = theme === 'light' ? 'dark_mode' : 'light_mode';
        els.metaTheme.setAttribute('content', theme === 'dark' ? '#111411' : '#F1F0E8');
    }

    function exportData() {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
        const anchor = document.createElement('a');
        anchor.setAttribute("href", dataStr);
        anchor.setAttribute("download", `sprout_backup_${getDateKey(new Date())}.json`);
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
    }

    function importData(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const parsed = JSON.parse(event.target.result);
                if (parsed.history) {
                    state = parsed;
                    saveData();
                    alert("Import successful!");
                    closeModals();
                }
            } catch (err) { alert("Invalid file"); }
        };
        reader.readAsText(file);
    }

    function wipeData() {
        if(confirm("Are you sure? This will delete all your progress.")) {
            state = { history: {} };
            saveData();
            closeModals();
        }
    }

    // --- Event Listeners ---
    function setupEventListeners() {
        document.getElementById('btn-prev').onclick = () => { viewDate.setMonth(viewDate.getMonth() - 1); renderCalendar(); };
        document.getElementById('btn-next').onclick = () => { viewDate.setMonth(viewDate.getMonth() + 1); renderCalendar(); };
        document.getElementById('btn-info').onclick = () => openModal(els.info);
        document.getElementById('btn-stats').onclick = openStats;
        document.getElementById('btn-streak-trigger').onclick = openStats; // Clicking streak also opens stats
        document.getElementById('btn-theme').onclick = toggleTheme;

        // Modal Closers
        document.getElementById('close-editor').onclick = closeModals;
        document.getElementById('close-info').onclick = closeModals;
        document.getElementById('close-stats').onclick = closeModals;

        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if(e.target === overlay) closeModals();
            });
        });

        document.querySelectorAll('.status-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                setStatus(e.currentTarget.dataset.status);
            });
        });

        document.getElementById('btn-export').onclick = exportData;
        document.getElementById('btn-wipe').onclick = wipeData;
        document.getElementById('import-file').onchange = importData;
    }

    init();
});

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('Sprout Service Worker active!'))
            .catch(err => console.log('Service Worker failed: ', err));
    });
}