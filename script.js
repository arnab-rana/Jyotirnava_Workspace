document.addEventListener("DOMContentLoaded", () => {

    /* =========================================================
       WINDOW MANAGEMENT SYSTEM
       ========================================================= */
    let highestZ = 1000;
    
    document.querySelectorAll('.app-icon, .dock-icon').forEach(icon => {
        if(!icon.classList.contains('dummy-app')) {
            icon.addEventListener('click', () => {
                const appId = icon.getAttribute('data-app');
                if(appId === 'dnd') return;
                const win = document.getElementById(`window-${appId}`);
                if(win) {
                    win.classList.add('active');
                    win.style.zIndex = ++highestZ;
                    if(appId === 'maps' && window.yotirnaMap) setTimeout(() => window.yotirnaMap.invalidateSize(), 150);
                }
            });
        } else {
            icon.addEventListener('click', () => {
                showToast(`Yotira ${icon.getAttribute('data-name')} is coming in the next update!`);
            });
        }
    });

    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const appId = btn.getAttribute('data-close');
            document.getElementById(`window-${appId}`).classList.remove('active');
        });
    });

    document.querySelectorAll('.os-window').forEach(win => {
        win.addEventListener('mousedown', () => { win.style.zIndex = ++highestZ; });
    });

    function showToast(msg) {
        const toast = document.getElementById('toast');
        toast.textContent = msg; toast.style.opacity = '1';
        setTimeout(() => toast.style.opacity = '0', 2500);
    }

    /* =========================================================
       PREVIOUSLY IMPLEMENTED APPS (Untouched logic)
       ========================================================= */
    class ClockApp {
        constructor() { this.initTabs(); this.initWorldClock(); this.initStopwatch(); this.initAlarm(); }
        initTabs() {
            const tabs = document.querySelectorAll('#window-clock .tab-btn');
            const contents = document.querySelectorAll('#window-clock .tab-content');
            tabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    tabs.forEach(t => t.classList.remove('active')); contents.forEach(c => c.classList.remove('active'));
                    tab.classList.add('active'); document.getElementById(`tab-${tab.getAttribute('data-tab')}`).classList.add('active');
                });
            });
        }
        initWorldClock() {
            const container = document.getElementById('world-clocks-list');
            const zones = [ { name: 'India (IST)', tz: 'Asia/Kolkata' }, { name: 'New York', tz: 'America/New_York' }, { name: 'London', tz: 'Europe/London' }, { name: 'Tokyo', tz: 'Asia/Tokyo' } ];
            const updateClocks = () => {
                let html = '';
                zones.forEach(zone => {
                    const time = new Date().toLocaleTimeString('en-US', { timeZone: zone.tz, hour: '2-digit', minute: '2-digit', second: '2-digit' });
                    const date = new Date().toLocaleDateString('en-US', { timeZone: zone.tz, weekday: 'short', month: 'short', day: 'numeric' });
                    html += `<div class="clock-row"><div><h3>${zone.name}</h3><small>${date}</small></div><div class="time">${time}</div></div>`;
                });
                container.innerHTML = html;
            };
            updateClocks(); setInterval(updateClocks, 1000);
        }
        initStopwatch() {
            this.swTime = 0; this.swInterval = null; this.display = document.getElementById('stopwatch-display'); this.lapList = document.getElementById('lap-list');
            document.getElementById('sw-start').addEventListener('click', (e) => {
                if(this.swInterval) { clearInterval(this.swInterval); this.swInterval = null; e.target.textContent = 'Start'; }
                else { this.swInterval = setInterval(() => { this.swTime += 10; this.updateSwDisplay(); }, 10); e.target.textContent = 'Pause'; }
            });
            document.getElementById('sw-lap').addEventListener('click', () => {
                if(!this.swInterval) return;
                const li = document.createElement('li'); li.textContent = `Lap: ${this.formatTime(this.swTime)}`; this.lapList.prepend(li);
            });
            document.getElementById('sw-reset').addEventListener('click', () => {
                clearInterval(this.swInterval); this.swInterval = null; this.swTime = 0; this.updateSwDisplay();
                document.getElementById('sw-start').textContent = 'Start'; this.lapList.innerHTML = '';
            });
        }
        updateSwDisplay() { this.display.textContent = this.formatTime(this.swTime); }
        formatTime(ms) {
            let d = new Date(ms); let m = d.getUTCMinutes().toString().padStart(2, '0'); let s = d.getUTCSeconds().toString().padStart(2, '0');
            let msFormat = Math.floor(d.getUTCMilliseconds() / 10).toString().padStart(2, '0'); return `00:${m}:${s}.${msFormat}`;
        }
        initAlarm() {
            this.alarms = [];
            const addBtn = document.getElementById('add-alarm'); const timeInput = document.getElementById('alarm-time'); const list = document.getElementById('alarm-list');
            addBtn.addEventListener('click', () => {
                if(timeInput.value) { this.alarms.push({ time: timeInput.value, active: true }); this.renderAlarms(list); }
            });
            setInterval(() => {
                const now = new Date(); const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
                this.alarms.forEach(alarm => {
                    if(alarm.active && alarm.time === currentTime) {
                        alert(`ALARM RINGING: It is ${currentTime}`); alarm.active = false; this.renderAlarms(list);
                    }
                });
            }, 60000);
        }
        renderAlarms(list) { list.innerHTML = this.alarms.map((a, i) => `<li>Alarm for ${a.time} - ${a.active ? 'Active' : 'Triggered'}</li>`).join(''); }
    }

    class NotesApp {
        constructor() { this.grid = document.getElementById('notes-grid'); this.notes = JSON.parse(localStorage.getItem('yotiraNotes')) || []; this.initEvents(); this.render(); }
        initEvents() {
            document.getElementById('save-note').addEventListener('click', () => {
                const title = document.getElementById('note-title').value.trim(); const body = document.getElementById('note-body').value.trim(); const color = document.getElementById('note-color').value;
                if(title || body) {
                    this.notes.unshift({ id: Date.now(), title, body, color }); this.saveData();
                    document.getElementById('note-title').value = ''; document.getElementById('note-body').value = ''; this.render();
                }
            });
            this.grid.addEventListener('click', (e) => {
                if(e.target.closest('.delete-btn')) {
                    const id = parseInt(e.target.closest('.delete-btn').getAttribute('data-id'));
                    this.notes = this.notes.filter(n => n.id !== id); this.saveData(); this.render();
                }
            });
        }
        saveData() { localStorage.setItem('yotiraNotes', JSON.stringify(this.notes)); }
        render() {
            this.grid.innerHTML = this.notes.map(note => `
                <div class="note-card" style="background-color: ${note.color}22; border-top: 4px solid ${note.color};">
                    <button class="delete-btn" data-id="${note.id}"><span class="material-icons-round">delete</span></button>
                    ${note.title ? `<h4>${note.title}</h4>` : ''}<p style="white-space: pre-wrap; margin-top: 8px;">${note.body}</p>
                </div>`).join('');
        }
    }

    class NewsApp {
        constructor() {
            this.feeds = { world: 'https://feeds.bbci.co.uk/news/world/rss.xml', business: 'https://feeds.bbci.co.uk/news/business/rss.xml', india: 'https://timesofindia.indiatimes.com/rssfeeds/-2128936835.cms' };
            this.container = document.getElementById('news-feed-container'); this.initTabs(); this.fetchNews('world');
        }
        initTabs() {
            const tabs = document.querySelectorAll('.news-tab-btn');
            tabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    tabs.forEach(t => t.classList.remove('active')); tab.classList.add('active'); this.fetchNews(tab.getAttribute('data-feed'));
                });
            });
        }
        async fetchNews(category) {
            this.container.innerHTML = '<p style="padding:20px;">Fetching global feeds...</p>';
            try {
                const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(this.feeds[category])}`);
                const data = await response.json();
                if(data.status === 'ok') {
                    this.container.innerHTML = data.items.slice(0, 15).map(item => `
                        <a href="${item.link}" target="_blank" class="news-item"><h3>${item.title}</h3><p>${item.pubDate.split(' ')[0]}</p></a>
                    `).join('');
                }
            } catch(error) { this.container.innerHTML = `<p style="color:red; padding:20px;">Error loading news.</p>`; }
        }
    }

    class WeatherApp {
        constructor() {
            this.temp = document.getElementById('weather-temp'); this.loc = document.getElementById('weather-location');
            this.desc = document.getElementById('weather-desc'); this.wind = document.getElementById('weather-wind'); this.getWeather();
        }
        getWeather() {
            if ("geolocation" in navigator) {
                navigator.geolocation.getCurrentPosition(
                    (position) => { this.fetchData(position.coords.latitude, position.coords.longitude, "Current Location"); },
                    (error) => { this.fetchData(30.3165, 78.0322, "Dehradun (Default)"); }
                );
            } else { this.fetchData(30.3165, 78.0322, "Dehradun (Default)"); }
        }
        async fetchData(lat, lon, locationName) {
            try {
                const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
                const data = await res.json(); const weather = data.current_weather;
                this.loc.textContent = locationName; this.temp.textContent = `${weather.temperature}°C`;
                this.wind.textContent = `Wind: ${weather.windspeed} km/h`; this.desc.textContent = this.getWeatherCondition(weather.weathercode);
            } catch (err) { this.loc.textContent = "Weather Unavailable"; }
        }
        getWeatherCondition(code) {
            if(code === 0) return "Clear Sky"; if(code >= 1 && code <= 3) return "Partly Cloudy";
            if(code >= 45 && code <= 48) return "Foggy"; if(code >= 51 && code <= 67) return "Rainy";
            if(code >= 71 && code <= 77) return "Snow"; if(code >= 95) return "Thunderstorm"; return "Unknown";
        }
    }

    class MapsApp {
        constructor() {
            this.map = null; this.routeLayer = null; this.markers = [];
            setTimeout(() => this.initMap(), 500); this.bindEvents();
        }
        initMap() {
            this.map = L.map('map-container').setView([30.3165, 78.0322], 12); window.yotirnaMap = this.map;
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OSM' }).addTo(this.map);
        }
        bindEvents() { document.getElementById('map-route-btn').addEventListener('click', () => this.calculateRoute()); }
        async geocode(query) {
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
                const data = await res.json(); if (data && data.length > 0) return [parseFloat(data[0].lon), parseFloat(data[0].lat)]; return null;
            } catch(e) { return null; }
        }
        async calculateRoute() {
            const startStr = document.getElementById('map-start').value.trim(); const destStr = document.getElementById('map-dest').value.trim();
            const infoTxt = document.getElementById('map-route-info');
            if (!startStr || !destStr) return alert("Please enter both Start and Destination.");
            infoTxt.textContent = "Calculating route...";
            const startCoords = await this.geocode(startStr); const destCoords = await this.geocode(destStr);
            if (!startCoords || !destCoords) { infoTxt.textContent = "Could not find locations."; return; }
            if (this.routeLayer) this.map.removeLayer(this.routeLayer);
            this.markers.forEach(m => this.map.removeLayer(m)); this.markers = [];
            this.markers.push(L.marker([startCoords[1], startCoords[0]]).addTo(this.map));
            this.markers.push(L.marker([destCoords[1], destCoords[0]]).addTo(this.map));
            try {
                const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${startCoords[0]},${startCoords[1]};${destCoords[0]},${destCoords[1]}?overview=full&geometries=geojson`);
                const data = await res.json();
                if (data.routes && data.routes.length > 0) {
                    const route = data.routes[0];
                    this.routeLayer = L.geoJSON(route.geometry, { style: { color: '#007aff', weight: 5, opacity: 0.7 } }).addTo(this.map);
                    this.map.fitBounds(this.routeLayer.getBounds(), { padding: [40, 40] });
                    const distanceKm = (route.distance / 1000).toFixed(1); const timeMin = Math.round(route.duration / 60);
                    const hours = Math.floor(timeMin / 60); const mins = timeMin % 60;
                    infoTxt.textContent = `Distance: ${distanceKm} km | Est. Time: ${hours > 0 ? hours + 'h ' + mins + 'm' : mins + ' min'}`;
                } else { infoTxt.textContent = "No valid driving route found."; }
            } catch (err) { infoTxt.textContent = "Error connecting to routing server."; }
        }
    }

    class DNDApp {
        constructor() {
            this.btn = document.getElementById('dnd-toggle-btn');
            this.isActive = JSON.parse(localStorage.getItem('yotiraDND')) || false;
            this.applyState(); this.bindEvents();
        }
        bindEvents() {
            if(this.btn) {
                this.btn.addEventListener('click', () => {
                    this.isActive = !this.isActive; localStorage.setItem('yotiraDND', JSON.stringify(this.isActive));
                    this.applyState(); showToast(this.isActive ? "Do Not Disturb is ON. Alerts silenced." : "Do Not Disturb is OFF.");
                });
            }
        }
        applyState() {
            if(this.isActive) {
                if(this.btn) this.btn.classList.add('dnd-active-icon'); document.body.classList.add('dnd-mode-on');
            } else {
                if(this.btn) this.btn.classList.remove('dnd-active-icon'); document.body.classList.remove('dnd-mode-on');
            }
        }
        static isSilent() { return JSON.parse(localStorage.getItem('yotiraDND')) || false; }
    }

    const originalAlert = window.alert;
    window.alert = function(message) {
        if (DNDApp.isSilent()) { showToast("Notification suppressed by DND"); } else { originalAlert(message); }
    };

    class TasksApp {
        constructor() {
            this.input = document.getElementById('task-input'); this.addBtn = document.getElementById('task-add-btn'); this.list = document.getElementById('task-list');
            this.tasks = JSON.parse(localStorage.getItem('yotiraTasks')) || []; this.bindEvents(); this.render();
        }
        bindEvents() {
            this.addBtn.addEventListener('click', () => this.addTask());
            this.input.addEventListener('keypress', (e) => { if (e.key === 'Enter') this.addTask(); });
            this.list.addEventListener('click', (e) => {
                if (e.target.classList.contains('task-checkbox')) { this.toggleTask(parseInt(e.target.getAttribute('data-id'))); } 
                else if (e.target.closest('.task-delete')) { this.deleteTask(parseInt(e.target.closest('.task-delete').getAttribute('data-id'))); }
            });
        }
        addTask() {
            const text = this.input.value.trim(); if (!text) return;
            this.tasks.unshift({ id: Date.now(), text: text, completed: false });
            this.saveData(); this.input.value = ''; this.render();
        }
        toggleTask(id) { const task = this.tasks.find(t => t.id === id); if (task) { task.completed = !task.completed; this.saveData(); this.render(); } }
        deleteTask(id) { this.tasks = this.tasks.filter(t => t.id !== id); this.saveData(); this.render(); }
        saveData() { localStorage.setItem('yotiraTasks', JSON.stringify(this.tasks)); }
        render() {
            if (this.tasks.length === 0) { this.list.innerHTML = '<p style="text-align:center; color:#888; margin-top:20px;">No tasks yet.</p>'; return; }
            this.list.innerHTML = this.tasks.map(task => `
                <li class="task-item ${task.completed ? 'completed' : ''}">
                    <input type="checkbox" class="task-checkbox" data-id="${task.id}" ${task.completed ? 'checked' : ''}>
                    <span class="task-text">${task.text}</span>
                    <button class="task-delete" data-id="${task.id}"><span class="material-icons-round">delete</span></button>
                </li>`).join('');
        }
    }

    class AiApiManager {
        constructor() {
            this.gemP1 = 'GEMINI_PART_1'; this.gemP2 = 'GEMINI_PART_2'; this.gemP3 = 'GEMINI_PART_3';
            this.geminiKey = this.gemP1 + this.gemP2 + this.gemP3;
            this.groqP1 = 'GROQ_PART_1'; this.groqP2 = 'GROQ_PART_2'; this.groqP3 = 'GROQ_PART_3';
            this.groqKey = this.groqP1 + this.groqP2 + this.groqP3;
            this.orP1 = 'OR_PART_1'; this.orP2 = 'OR_PART_2'; this.orP3 = 'OR_PART_3';
            this.openRouterKey = this.orP1 + this.orP2 + this.orP3;
        }
        async generate(prompt) {
            try { return await this.fetchGemini(prompt); } catch (e1) {
                console.warn("Gemini Failed. Falling back to Groq...", e1);
                try { return await this.fetchGroq(prompt); } catch (e2) {
                    console.warn("Groq Failed. Falling back to OpenRouter...", e2);
                    return await this.fetchOpenRouter(prompt);
                }
            }
        }
        async fetchGemini(prompt) {
            if (this.geminiKey.includes('PART')) throw new Error("Key not set");
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.geminiKey}`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });
            if(!res.ok) throw new Error("API Error"); const data = await res.json(); return data.candidates[0].content.parts[0].text;
        }
        async fetchGroq(prompt) {
            if (this.groqKey.includes('PART')) throw new Error("Key not set");
            const res = await fetch(`https://api.groq.com/openai/v1/chat/completions`, {
                method: 'POST', headers: { 'Authorization': `Bearer ${this.groqKey}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ model: "llama3-8b-8192", messages: [{role: "user", content: prompt}] })
            });
            if(!res.ok) throw new Error("API Error"); const data = await res.json(); return data.choices[0].message.content;
        }
        async fetchOpenRouter(prompt) {
            if (this.openRouterKey.includes('PART')) throw new Error("Key not set");
            const res = await fetch(`https://openrouter.ai/api/v1/chat/completions`, {
                method: 'POST', headers: { 'Authorization': `Bearer ${this.openRouterKey}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ model: "google/gemini-flash-1.5", messages: [{role: "user", content: prompt}] })
            });
            if(!res.ok) throw new Error("API Error"); const data = await res.json(); return data.choices[0].message.content;
        }
    }
    const aiCore = new AiApiManager();

    class AIApp {
        constructor() {
            this.input = document.getElementById('ai-input'); this.sendBtn = document.getElementById('ai-send-btn');
            this.chatBox = document.getElementById('ai-chat-box'); this.bindEvents();
        }
        bindEvents() {
            this.sendBtn.addEventListener('click', () => this.sendMessage());
            this.input.addEventListener('keypress', (e) => { if (e.key === 'Enter') this.sendMessage(); });
        }
        async sendMessage() {
            const text = this.input.value.trim(); if (!text) return;
            this.appendMessage(text, 'user'); this.input.value = '';
            const loadingId = 'loading-' + Date.now();
            this.appendMessage('Routing query through fallback architecture...', 'loading', loadingId);
            try {
                const response = await aiCore.generate(text);
                this.removeMessage(loadingId); this.appendMessage(response, 'system');
            } catch (error) {
                this.removeMessage(loadingId); this.appendMessage("Error: Could not connect to any AI provider.", 'system');
            }
        }
        appendMessage(text, type, id = null) {
            const msgDiv = document.createElement('div'); msgDiv.className = `ai-msg ai-${type}`;
            if (id) msgDiv.id = id; msgDiv.textContent = text;
            this.chatBox.appendChild(msgDiv); this.chatBox.scrollTop = this.chatBox.scrollHeight;
        }
        removeMessage(id) { const msgDiv = document.getElementById(id); if (msgDiv) msgDiv.remove(); }
    }

    class ATSApp {
        constructor() {
            this.fileInput = document.getElementById('resume-upload'); this.analyzeBtn = document.getElementById('analyze-resume-btn');
            this.loadingDiv = document.getElementById('ats-loading'); this.resultsDiv = document.getElementById('ats-results');
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
            this.bindEvents();
        }
        bindEvents() { this.analyzeBtn.addEventListener('click', () => this.processResume()); }
        async processResume() {
            if(this.fileInput.files.length === 0) return alert("Please select a PDF file first.");
            this.resultsDiv.innerHTML = ''; this.loadingDiv.style.display = 'block';
            try {
                const file = this.fileInput.files[0]; const arrayBuffer = await file.arrayBuffer();
                const pdf = await pdfjsLib.getDocument({data: arrayBuffer}).promise;
                let fullText = "";
                for(let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i); const content = await page.getTextContent();
                    fullText += content.items.map(item => item.str).join(" ") + " ";
                }
                if(fullText.trim().length < 50) throw new Error("Could not extract enough text from the PDF.");
                const prompt = `You are an expert ATS System. Analyze the following resume text. Return ONLY a valid JSON object with exactly two keys: "review" (a 3-sentence summary of candidate strengths) and "job_titles" (an array of exactly 3 strings representing the most suitable job titles for this candidate). Do not include markdown formatting. Resume Text: ${fullText.substring(0, 4000)}`;
                let rawResponse = await aiCore.generate(prompt);
                rawResponse = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();
                const resultData = JSON.parse(rawResponse);
                this.renderResults(resultData);
            } catch (err) {
                this.resultsDiv.innerHTML = `<p style="color:red; text-align:center;">Failed to analyze resume.</p>`;
            } finally { this.loadingDiv.style.display = 'none'; }
        }
        renderResults(data) {
            const linksHTML = data.job_titles.map(title => `<a href="https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(title)}" target="_blank" class="job-link-btn"><span class="material-icons-round" style="font-size:14px; vertical-align:middle; margin-right:4px;">work</span> ${title}</a>`).join('');
            this.resultsDiv.innerHTML = `<div class="ats-review-card"><h3>Candidate Evaluation</h3><p style="color:#444; line-height:1.6; margin-bottom: 20px;">${data.review}</p><h4 style="margin-bottom:10px; color:#333;">Recommended Job Searches</h4><div style="display:flex; flex-wrap:wrap;">${linksHTML}</div></div>`;
        }
    }

    class FlowApp {
        constructor() {
            this.tasks = JSON.parse(localStorage.getItem('yotiraFlow')) || []; this.input = document.getElementById('flow-input'); this.addBtn = document.getElementById('flow-add-btn'); this.columns = document.querySelectorAll('.kanban-dropzone');
            this.draggedCard = null; this.bindEvents(); this.render();
        }
        bindEvents() {
            this.addBtn.addEventListener('click', () => this.addTask());
            this.input.addEventListener('keypress', (e) => { if (e.key === 'Enter') this.addTask(); });
            this.columns.forEach(col => {
                col.addEventListener('dragover', e => { e.preventDefault(); col.parentElement.classList.add('drag-over'); });
                col.addEventListener('dragleave', e => { col.parentElement.classList.remove('drag-over'); });
                col.addEventListener('drop', e => {
                    e.preventDefault(); col.parentElement.classList.remove('drag-over');
                    if (this.draggedCard) {
                        const newColId = col.parentElement.getAttribute('data-col'); const taskId = parseInt(this.draggedCard.getAttribute('data-id'));
                        const task = this.tasks.find(t => t.id === taskId);
                        if (task) { task.column = newColId; this.saveData(); this.render(); }
                    }
                });
            });
        }
        addTask() {
            const text = this.input.value.trim(); if (!text) return;
            this.tasks.push({ id: Date.now(), text: text, column: 'backlog' }); this.input.value = ''; this.saveData(); this.render();
        }
        deleteTask(id) { this.tasks = this.tasks.filter(t => t.id !== id); this.saveData(); this.render(); }
        saveData() { localStorage.setItem('yotiraFlow', JSON.stringify(this.tasks)); }
        render() {
            this.columns.forEach(col => col.innerHTML = '');
            this.tasks.forEach(task => {
                const card = document.createElement('div'); card.className = 'kanban-card'; card.setAttribute('draggable', 'true'); card.setAttribute('data-id', task.id);
                card.innerHTML = `${task.text} <button class="del-card" data-id="${task.id}"><span class="material-icons-round">close</span></button>`;
                card.addEventListener('dragstart', () => { this.draggedCard = card; setTimeout(() => card.style.opacity = '0.5', 0); });
                card.addEventListener('dragend', () => { this.draggedCard = null; card.style.opacity = '1'; });
                card.querySelector('.del-card').addEventListener('click', () => this.deleteTask(task.id));
                const targetCol = document.querySelector(`.kanban-col[data-col="${task.column}"] .kanban-dropzone`);
                if(targetCol) targetCol.appendChild(card);
            });
        }
    }

    class CalendarApp {
        constructor() {
            this.date = new Date(); this.events = JSON.parse(localStorage.getItem('yotiraCalendarEvents')) || {}; this.monthYearEl = document.getElementById('cal-month-year'); this.gridEl = document.getElementById('cal-grid');
            document.getElementById('cal-prev').addEventListener('click', () => { this.date.setMonth(this.date.getMonth() - 1); this.render(); });
            document.getElementById('cal-next').addEventListener('click', () => { this.date.setMonth(this.date.getMonth() + 1); this.render(); });
            this.render();
        }
        render() {
            this.gridEl.innerHTML = ''; const year = this.date.getFullYear(); const month = this.date.getMonth(); const today = new Date();
            const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            this.monthYearEl.textContent = `${monthNames[month]} ${year}`;
            const firstDay = new Date(year, month, 1).getDay(); const daysInMonth = new Date(year, month + 1, 0).getDate();
            for (let i = 0; i < firstDay; i++) { const emptyDiv = document.createElement('div'); emptyDiv.className = 'cal-day empty'; this.gridEl.appendChild(emptyDiv); }
            for (let i = 1; i <= daysInMonth; i++) {
                const dayDiv = document.createElement('div'); dayDiv.className = 'cal-day';
                if (year === today.getFullYear() && month === today.getMonth() && i === today.getDate()) dayDiv.classList.add('today');
                const dateKey = `${year}-${month}-${i}`; dayDiv.innerHTML = `<div class="cal-date-num">${i}</div>`;
                if (this.events[dateKey]) { dayDiv.innerHTML += `<div class="cal-event-dot"></div><div class="cal-event-text">${this.events[dateKey]}</div>`; }
                dayDiv.addEventListener('click', () => this.handleDayClick(dateKey)); this.gridEl.appendChild(dayDiv);
            }
        }
        handleDayClick(dateKey) {
            const currentEvent = this.events[dateKey] || ''; const newEvent = prompt("Enter event for this date (leave blank to delete):", currentEvent);
            if (newEvent !== null) {
                if (newEvent.trim() === '') { delete this.events[dateKey]; } else { this.events[dateKey] = newEvent.trim(); }
                localStorage.setItem('yotiraCalendarEvents', JSON.stringify(this.events)); this.render();
            }
        }
    }

    class StickyNotesApp {
        constructor() {
            this.workspace = document.getElementById('sticky-workspace'); this.notes = JSON.parse(localStorage.getItem('yotiraSticky')) || []; this.colors = ['#f6d365', '#ff9a9e', '#a1c4fd', '#d4fc79'];
            document.getElementById('add-sticky-btn').addEventListener('click', () => this.addNote()); this.render();
        }
        addNote() {
            this.notes.push({ id: Date.now(), text: '', color: this.colors[0], x: 50 + (this.notes.length * 20), y: 50 + (this.notes.length * 20) });
            this.saveData(); this.render();
        }
        deleteNote(id) { this.notes = this.notes.filter(n => n.id !== id); this.saveData(); this.render(); }
        changeColor(note) { const curIdx = this.colors.indexOf(note.color); note.color = this.colors[(curIdx + 1) % this.colors.length]; this.saveData(); this.render(); }
        saveData() { localStorage.setItem('yotiraSticky', JSON.stringify(this.notes)); }
        render() {
            this.workspace.querySelectorAll('.sticky-note').forEach(n => n.remove());
            this.notes.forEach(note => {
                const el = document.createElement('div'); el.className = 'sticky-note'; el.style.left = note.x + 'px'; el.style.top = note.y + 'px'; el.style.backgroundColor = note.color;
                el.innerHTML = `<div class="sticky-header"><div class="sticky-color-btn" style="background:${note.color}"></div><button class="sticky-del-btn">✕</button></div><textarea placeholder="Type something...">${note.text}</textarea>`;
                el.querySelector('textarea').addEventListener('input', (e) => { note.text = e.target.value; this.saveData(); });
                el.querySelector('.sticky-del-btn').addEventListener('click', () => this.deleteNote(note.id));
                el.querySelector('.sticky-color-btn').addEventListener('click', () => this.changeColor(note));
                this.setupDrag(el, note); this.workspace.appendChild(el);
            });
        }
        setupDrag(el, noteData) {
            const header = el.querySelector('.sticky-header'); let isDragging = false; let startX, startY, initialX, initialY;
            header.addEventListener('mousedown', (e) => { isDragging = true; startX = e.clientX; startY = e.clientY; initialX = el.offsetLeft; initialY = el.offsetTop; el.style.zIndex = 10; });
            document.addEventListener('mousemove', (e) => { if(!isDragging) return; el.style.left = (initialX + (e.clientX - startX)) + 'px'; el.style.top = (initialY + (e.clientY - startY)) + 'px'; });
            document.addEventListener('mouseup', () => { if(isDragging) { isDragging = false; el.style.zIndex = 1; noteData.x = el.offsetLeft; noteData.y = el.offsetTop; this.saveData(); } });
        }
    }

    class VaultApp {
        constructor() {
            this.db = null; this.dropzone = document.getElementById('vault-dropzone'); this.fileInput = document.getElementById('vault-file-input'); this.listEl = document.getElementById('vault-file-list');
            this.initDB().then(() => { this.bindEvents(); this.loadFiles(); }).catch(e => console.error(e));
        }
        initDB() {
            return new Promise((resolve, reject) => {
                const req = indexedDB.open('YotiraVaultDB', 1);
                req.onupgradeneeded = (e) => { if (!e.target.result.objectStoreNames.contains('files')) e.target.result.createObjectStore('files', { keyPath: 'id' }); };
                req.onsuccess = (e) => { this.db = e.target.result; resolve(); }; req.onerror = (e) => reject(e.target.error);
            });
        }
        bindEvents() {
            this.dropzone.addEventListener('click', () => this.fileInput.click());
            this.dropzone.addEventListener('dragover', (e) => { e.preventDefault(); this.dropzone.classList.add('drag-over'); });
            this.dropzone.addEventListener('dragleave', () => this.dropzone.classList.remove('drag-over'));
            this.dropzone.addEventListener('drop', (e) => { e.preventDefault(); this.dropzone.classList.remove('drag-over'); if(e.dataTransfer.files.length > 0) this.processFile(e.dataTransfer.files[0]); });
            this.fileInput.addEventListener('change', (e) => { if(e.target.files.length > 0) this.processFile(e.target.files[0]); });
        }
        processFile(file) {
            const reader = new FileReader();
            reader.onload = (e) => { this.saveToDB({ id: Date.now(), name: file.name, size: this.formatBytes(file.size), type: file.type, data: e.target.result, date: new Date().toLocaleDateString() }); };
            reader.readAsDataURL(file);
        }
        saveToDB(fileData) {
            const tx = this.db.transaction('files', 'readwrite'); tx.objectStore('files').put(fileData);
            tx.oncomplete = () => { showToast('File securely saved.'); this.loadFiles(); }; tx.onerror = () => alert("Storage error.");
        }
        loadFiles() {
            const req = this.db.transaction('files', 'readonly').objectStore('files').getAll();
            req.onsuccess = () => this.renderList(req.result);
        }
        deleteFile(id) {
            const tx = this.db.transaction('files', 'readwrite'); tx.objectStore('files').delete(id);
            tx.oncomplete = () => this.loadFiles();
        }
        renderList(files) {
            this.listEl.innerHTML = '';
            if(files.length === 0) { this.listEl.innerHTML = '<p style="text-align:center; color:#888; padding:20px;">Vault is empty.</p>'; return; }
            files.sort((a,b) => b.id - a.id).forEach(f => {
                const li = document.createElement('li'); li.className = 'vault-item';
                li.innerHTML = `<div class="vault-item-info"><span class="vault-item-name">${f.name}</span><span class="vault-item-meta">${f.size} • Uploaded ${f.date}</span></div><div class="vault-actions"><a href="${f.data}" download="${f.name}" class="vault-btn btn-view"><span class="material-icons-round" style="font-size:14px;">download</span> Download</a><button class="vault-btn btn-del" data-id="${f.id}"><span class="material-icons-round" style="font-size:14px;">delete</span></button></div>`;
                li.querySelector('.btn-del').addEventListener('click', () => this.deleteFile(f.id)); this.listEl.appendChild(li);
            });
        }
        formatBytes(bytes) {
            if (bytes === 0) return '0 Bytes'; const k = 1024, dm = 2, sizes = ['Bytes', 'KB', 'MB', 'GB'], i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
        }
    }

    class WhiteboardApp {
        constructor() {
            this.canvas = document.getElementById('wb-canvas'); this.ctx = this.canvas.getContext('2d');
            this.colorPicker = document.getElementById('wb-color'); this.sizeSlider = document.getElementById('wb-size');
            this.eraserBtn = document.getElementById('wb-eraser'); this.clearBtn = document.getElementById('wb-clear'); this.downloadBtn = document.getElementById('wb-download');
            this.isDrawing = false; this.isErasing = false; this.initCanvas(); this.bindEvents();
        }
        initCanvas() { this.ctx.fillStyle = '#ffffff'; this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height); this.ctx.lineCap = 'round'; this.ctx.lineJoin = 'round'; }
        bindEvents() {
            this.canvas.addEventListener('mousedown', (e) => { this.isDrawing = true; this.draw(e); });
            this.canvas.addEventListener('mouseup', () => { this.isDrawing = false; this.ctx.beginPath(); });
            this.canvas.addEventListener('mousemove', (e) => this.draw(e));
            this.canvas.addEventListener('mouseout', () => { this.isDrawing = false; this.ctx.beginPath(); });
            this.eraserBtn.addEventListener('click', () => { this.isErasing = !this.isErasing; this.eraserBtn.style.background = this.isErasing ? '#888' : '#007aff'; });
            this.clearBtn.addEventListener('click', () => this.initCanvas());
            this.downloadBtn.addEventListener('click', () => { const link = document.createElement('a'); link.download = 'Whiteboard.png'; link.href = this.canvas.toDataURL('image/png'); link.click(); });
        }
        draw(e) {
            if (!this.isDrawing) return;
            this.ctx.lineWidth = this.sizeSlider.value; this.ctx.strokeStyle = this.isErasing ? '#ffffff' : this.colorPicker.value;
            this.ctx.lineTo(e.offsetX, e.offsetY); this.ctx.stroke(); this.ctx.beginPath(); this.ctx.moveTo(e.offsetX, e.offsetY);
        }
    }

    class AnnouncementApp {
        constructor() {
            this.input = document.getElementById('ann-input'); this.postBtn = document.getElementById('ann-post-btn'); this.listContainer = document.getElementById('ann-list');
            this.announcements = JSON.parse(localStorage.getItem('yotiraAnnouncements')) || []; this.bindEvents(); this.render();
        }
        bindEvents() { this.postBtn.addEventListener('click', () => this.postAnnouncement()); }
        postAnnouncement() {
            const text = this.input.value.trim(); if (!text) return;
            this.announcements.unshift({ id: Date.now(), text: text, timestamp: new Date().toLocaleString() });
            localStorage.setItem('yotiraAnnouncements', JSON.stringify(this.announcements));
            this.input.value = ''; this.render(); showToast('Announcement posted!');
        }
        render() {
            this.listContainer.innerHTML = '';
            if(this.announcements.length === 0) { this.listContainer.innerHTML = '<p style="color:#888; text-align:center; padding:20px;">No announcements yet.</p>'; return; }
            this.announcements.forEach(ann => {
                const card = document.createElement('div'); card.className = 'ann-card';
                card.innerHTML = `<small>${ann.timestamp}</small><p>${ann.text}</p>`;
                this.listContainer.appendChild(card);
            });
        }
    }

    class ConferenceApp {
        constructor() {
            this.joinBtn = document.getElementById('conf-join-btn');
            if (this.joinBtn) { this.joinBtn.addEventListener('click', () => { window.open('https://meet.google.com/new', '_blank'); }); }
        }
    }

    class PollApp {
        constructor() {
            this.polls = JSON.parse(localStorage.getItem('yotiraPolls')) || []; this.initTabs(); this.bindCreateEvents(); this.renderPolls();
        }
        initTabs() {
            const tabs = document.querySelectorAll('.poll-tab-btn');
            tabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    tabs.forEach(t => t.classList.remove('active')); document.querySelectorAll('#window-poll .tab-content').forEach(c => c.classList.remove('active'));
                    tab.classList.add('active'); document.getElementById(`poll-tab-${tab.getAttribute('data-tab')}`).classList.add('active');
                });
            });
        }
        bindCreateEvents() {
            document.getElementById('poll-create-btn').addEventListener('click', () => {
                const q = document.getElementById('poll-q').value.trim(); const optInputs = document.querySelectorAll('.poll-opt'); const options = [];
                optInputs.forEach(input => { if(input.value.trim()) options.push({ text: input.value.trim(), votes: 0 }); });
                if(!q || options.length < 2) { alert("Please provide a question and at least 2 options."); return; }
                this.polls.unshift({ id: Date.now(), question: q, options: options });
                localStorage.setItem('yotiraPolls', JSON.stringify(this.polls));
                document.getElementById('poll-q').value = ''; optInputs.forEach(input => input.value = '');
                showToast("Poll Created!"); this.renderPolls(); document.querySelector('.poll-tab-btn[data-tab="active"]').click();
            });
        }
        vote(pollId, optionIndex) {
            const poll = this.polls.find(p => p.id === pollId);
            if(poll) { poll.options[optionIndex].votes += 1; localStorage.setItem('yotiraPolls', JSON.stringify(this.polls)); this.renderPolls(); }
        }
        renderPolls() {
            const container = document.getElementById('poll-list-container'); container.innerHTML = '';
            if(this.polls.length === 0) { container.innerHTML = '<p style="color:#888; text-align:center;">No active polls.</p>'; return; }
            this.polls.forEach(poll => {
                let totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes, 0);
                let optionsHTML = poll.options.map((opt, idx) => {
                    let percent = totalVotes === 0 ? 0 : Math.round((opt.votes / totalVotes) * 100);
                    return `<div class="poll-option-btn" data-poll-id="${poll.id}" data-opt-idx="${idx}"><div class="poll-bar" style="width: ${percent}%"></div><div class="poll-opt-text"><span>${opt.text}</span><span>${percent}% (${opt.votes})</span></div></div>`;
                }).join('');
                const card = document.createElement('div'); card.className = 'poll-card'; card.innerHTML = `<h3>${poll.question}</h3>${optionsHTML}`;
                card.querySelectorAll('.poll-option-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => { this.vote(parseInt(e.currentTarget.getAttribute('data-poll-id')), parseInt(e.currentTarget.getAttribute('data-opt-idx'))); });
                });
                container.appendChild(card);
            });
        }
    }

    class SmartCabinApp {
        constructor() {
            this.dot = document.getElementById('cabin-dot'); this.text = document.getElementById('cabin-text'); this.subtext = document.getElementById('cabin-subtext');
            this.knockBtn = document.getElementById('cabin-knock-btn'); this.modal = document.getElementById('cabin-modal');
            this.currentStatus = localStorage.getItem('yotiraCabinStatus') || 'free';
            this.bindEvents(); this.updateDashboard();
        }
        bindEvents() {
            this.knockBtn.addEventListener('click', () => { this.modal.style.display = 'flex'; document.getElementById('window-cabin').style.zIndex = ++highestZ; });
            document.querySelectorAll('.cabin-res-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    this.currentStatus = e.target.getAttribute('data-status'); localStorage.setItem('yotiraCabinStatus', this.currentStatus);
                    this.modal.style.display = 'none'; this.updateDashboard();
                });
            });
        }
        updateDashboard() {
            if(this.currentStatus === 'free') { this.dot.style.color = '#28a745'; this.text.textContent = "FREE"; this.subtext.textContent = "Please Come In"; } 
            else if (this.currentStatus === 'meeting') { this.dot.style.color = '#f39c12'; this.text.textContent = "IN MEETING"; this.subtext.textContent = "Please wait outside (10 mins)"; } 
            else if (this.currentStatus === 'dnd') { this.dot.style.color = '#e74c3c'; this.text.textContent = "DO NOT DISTURB"; this.subtext.textContent = "Busy for the rest of the day"; }
        }
    }


    /* =========================================================
       NEW APPENDED APPS (Financial / ERP)
       ========================================================= */

    // 1. Yotira Invoice Generator
    class InvoiceApp {
        constructor() {
            this.items = [];
            this.clientInput = document.getElementById('inv-client');
            this.dateInput = document.getElementById('inv-date');
            this.descInput = document.getElementById('inv-item-desc');
            this.qtyInput = document.getElementById('inv-item-qty');
            this.priceInput = document.getElementById('inv-item-price');
            this.tbody = document.getElementById('inv-table-body');
            
            this.dispClient = document.getElementById('disp-client');
            this.dispDate = document.getElementById('disp-date');
            this.subtotalEl = document.getElementById('inv-subtotal');
            this.taxEl = document.getElementById('inv-tax');
            this.grandEl = document.getElementById('inv-grand');

            this.bindEvents();
        }

        bindEvents() {
            document.getElementById('add-inv-item-btn').addEventListener('click', () => this.addItem());
            document.getElementById('download-inv-btn').addEventListener('click', () => this.downloadPDF());
            
            this.clientInput.addEventListener('input', (e) => { this.dispClient.textContent = e.target.value || 'Client Name'; });
            this.dateInput.addEventListener('change', (e) => { this.dispDate.textContent = e.target.value || 'MM/DD/YYYY'; });
        }

        addItem() {
            const desc = this.descInput.value.trim();
            const qty = parseInt(this.qtyInput.value) || 0;
            const price = parseFloat(this.priceInput.value) || 0;

            if(!desc || qty <= 0 || price < 0) return alert("Please enter valid item details.");

            this.items.push({ desc, qty, price, total: qty * price });
            this.descInput.value = ''; this.qtyInput.value = '1'; this.priceInput.value = '';
            
            this.render();
        }

        render() {
            this.tbody.innerHTML = '';
            let subtotal = 0;

            this.items.forEach(item => {
                subtotal += item.total;
                const tr = document.createElement('tr');
                tr.innerHTML = `<td>${item.desc}</td><td>${item.qty}</td><td>$${item.price.toFixed(2)}</td><td>$${item.total.toFixed(2)}</td>`;
                this.tbody.appendChild(tr);
            });

            const tax = subtotal * 0.18;
            const grand = subtotal + tax;

            this.subtotalEl.textContent = subtotal.toFixed(2);
            this.taxEl.textContent = tax.toFixed(2);
            this.grandEl.textContent = grand.toFixed(2);
        }

        downloadPDF() {
            const element = document.getElementById('invoice-print-area');
            const opt = {
                margin:       10,
                filename:     `Invoice_${this.clientInput.value || 'Draft'}.pdf`,
                image:        { type: 'jpeg', quality: 0.98 },
                html2canvas:  { scale: 2 },
                jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };
            html2pdf().set(opt).from(element).save();
        }
    }

    // 2. Yotira Data Entry (Ledger)
    class LedgerApp {
        constructor() {
            this.entries = JSON.parse(localStorage.getItem('yotiraLedger')) || [];
            this.dateInput = document.getElementById('ledg-date');
            this.descInput = document.getElementById('ledg-desc');
            this.amtInput = document.getElementById('ledg-amt');
            this.catInput = document.getElementById('ledg-cat');
            this.tbody = document.getElementById('ledger-tbody');
            
            this.bindEvents();
            this.render();
        }

        bindEvents() {
            document.getElementById('ledg-add-btn').addEventListener('click', () => this.addEntry());
            document.getElementById('ledg-export-btn').addEventListener('click', () => this.exportCSV());
        }

        addEntry() {
            const date = this.dateInput.value;
            const desc = this.descInput.value.trim();
            const amt = parseFloat(this.amtInput.value);
            const cat = this.catInput.value;

            if(!date || !desc || isNaN(amt)) return alert("Please fill all fields correctly.");

            this.entries.unshift({ id: Date.now(), date, desc, amt, cat });
            localStorage.setItem('yotiraLedger', JSON.stringify(this.entries));
            
            this.descInput.value = ''; this.amtInput.value = '';
            this.render();
        }

        render() {
            this.tbody.innerHTML = '';
            this.entries.forEach(e => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${e.date}</td>
                    <td>${e.desc}</td>
                    <td class="cat-${e.cat}">${e.cat}</td>
                    <td>$${e.amt.toFixed(2)}</td>
                `;
                this.tbody.appendChild(tr);
            });
        }

        exportCSV() {
            if(this.entries.length === 0) return alert("No data to export.");
            
            let csvContent = "Date,Description,Category,Amount\n";
            this.entries.forEach(e => {
                csvContent += `${e.date},"${e.desc}",${e.cat},${e.amt}\n`;
            });

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", "Yotira_Ledger.csv");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    // 3. Yotira Financial Analysis Dashboard
    class FinanceApp {
        constructor() {
            this.uploadInput = document.getElementById('fin-csv-upload');
            this.metricsDiv = document.getElementById('fin-metrics');
            this.chartsDiv = document.getElementById('fin-charts');
            
            this.pieChart = null;
            this.barChart = null;

            this.bindEvents();
        }

        bindEvents() {
            this.uploadInput.addEventListener('change', (e) => {
                if(e.target.files.length > 0) this.parseCSV(e.target.files[0]);
            });
        }

        parseCSV(file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const lines = e.target.result.split('\n');
                if(lines.length < 2) return alert("CSV file seems empty or invalid.");

                // Dynamically find columns
                const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
                const revIdx = headers.findIndex(h => h.includes('revenue'));
                const expIdx = headers.findIndex(h => h.includes('expense'));

                if(revIdx === -1 || expIdx === -1) {
                    return alert("Invalid CSV Format. Please ensure columns are named 'Revenue' and 'Expenses'.");
                }

                let totalRev = 0;
                let totalExp = 0;

                for(let i = 1; i < lines.length; i++) {
                    if(!lines[i].trim()) continue;
                    const cols = lines[i].split(',');
                    totalRev += parseFloat(cols[revIdx]) || 0;
                    totalExp += parseFloat(cols[expIdx]) || 0;
                }

                this.updateDashboard(totalRev, totalExp);
            };
            reader.readAsText(file);
        }

        updateDashboard(rev, exp) {
            const net = rev - exp;
            
            document.getElementById('metric-rev').textContent = `$${rev.toFixed(2)}`;
            document.getElementById('metric-exp').textContent = `$${exp.toFixed(2)}`;
            const netEl = document.getElementById('metric-net');
            netEl.textContent = `$${net.toFixed(2)}`;
            netEl.style.color = net >= 0 ? '#28a745' : '#dc3545';

            this.metricsDiv.style.display = 'flex';
            this.chartsDiv.style.display = 'flex';

            this.renderCharts(rev, exp);
        }

        renderCharts(rev, exp) {
            // Destroy existing charts to prevent canvas overlap issues
            if(this.pieChart) this.pieChart.destroy();
            if(this.barChart) this.barChart.destroy();

            const pieCtx = document.getElementById('fin-pie-chart').getContext('2d');
            const barCtx = document.getElementById('fin-bar-chart').getContext('2d');

            this.pieChart = new Chart(pieCtx, {
                type: 'pie',
                data: {
                    labels: ['Revenue', 'Expenses'],
                    datasets: [{
                        data: [rev, exp],
                        backgroundColor: ['#28a745', '#dc3545']
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { title: { display: true, text: 'Revenue vs Expenses Ratio' } } }
            });

            this.barChart = new Chart(barCtx, {
                type: 'bar',
                data: {
                    labels: ['Financial Overview'],
                    datasets: [
                        { label: 'Revenue', data: [rev], backgroundColor: '#28a745' },
                        { label: 'Expenses', data: [exp], backgroundColor: '#dc3545' },
                        { label: 'Net Profit', data: [rev - exp], backgroundColor: '#007aff' }
                    ]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { title: { display: true, text: 'Absolute Performance' } } }
            });
        }
    }


    // Initialize All Preserved Apps
    new ClockApp();
    new NotesApp();
    new NewsApp();
    new WeatherApp();
    new MapsApp();
    new DNDApp();
    new TasksApp();
    new AIApp();
    new ATSApp();
    // ChessApp Removed
    new FlowApp();
    new CalendarApp();
    new StickyNotesApp();
    new VaultApp();
    new WhiteboardApp();
    new AnnouncementApp();
    new ConferenceApp();
    new PollApp();
    new SmartCabinApp();

    // Initialize New Financial Apps
    new InvoiceApp();
    new LedgerApp();
    new FinanceApp();

});