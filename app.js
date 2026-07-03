// State Management for Mockup
const state = {
    services: [
        { id: 1, client: "Sofía Martínez", address: "Av. Brasil 2548, Pocitos", lat: -34.9094, lng: -56.1528, deadline: getDeadlineOffset(12), status: "Pendiente", driver: "Sin Asignar", source: "IA Chatbot" },
        { id: 2, client: "Alejandro Silva", address: "Av. Italia 3820, Buceo", lat: -34.8942, lng: -56.1345, deadline: getDeadlineOffset(24), status: "Pendiente", driver: "Sin Asignar", source: "Oficina" },
        { id: 3, client: "Mariana Costa", address: "18 de Julio 1420, Centro", lat: -34.9056, lng: -56.1911, deadline: getDeadlineOffset(4), status: "Pendiente", driver: "Sin Asignar", source: "Oficina" },
        { id: 4, client: "Gabriel Pereira", address: "Rambla O'Higgins 5120, Malvín", lat: -34.8988, lng: -56.1033, deadline: getDeadlineOffset(36), status: "Pendiente", driver: "Sin Asignar", source: "IA Chatbot" },
        { id: 5, client: "Lucía Rossi", address: "Av. Gral Flores 2890, Aguada", lat: -34.8877, lng: -56.1795, deadline: getDeadlineOffset(8), status: "Pendiente", driver: "Sin Asignar", source: "Oficina" },
        { id: 6, client: "Ignacio Álvarez", address: "Bulevar Artigas 1202, Tres Cruces", lat: -34.8977, lng: -56.1644, deadline: getDeadlineOffset(48), status: "Pendiente", driver: "Sin Asignar", source: "Oficina" },
        { id: 7, client: "Valentina Díaz", address: "Av. Alfredo Arocena 1640, Carrasco", lat: -34.8885, lng: -56.0594, deadline: getDeadlineOffset(15), status: "Pendiente", driver: "Sin Asignar", source: "IA Chatbot" },
        { id: 8, client: "Felipe Méndez", address: "Av. Joaquín Suárez 3100, Prado", lat: -34.8698, lng: -56.1952, deadline: getDeadlineOffset(6), status: "Pendiente", driver: "Sin Asignar", source: "Oficina" }
    ],
    optimized: false,
    numberOfDrivers: 3,
    drivers: [
        { id: "driver-1", name: "Carlos López", routeName: "Ruta 1 - Sur/Este", color: "#3B82F6", stops: [] },
        { id: "driver-2", name: "Juan Rodríguez", routeName: "Ruta 2 - Centro/Prado", color: "#10B981", stops: [] },
        { id: "driver-3", name: "Martín Sosa", routeName: "Ruta 3 - Carrasco/Costanera", color: "#EF4444", stops: [] }
    ],
    chatStep: 0,
    chatAnswers: {
        zone: '',
        name: '',
        address: ''
    }
};

// Map configurations
let map;
let markerLayerGroup;
let routePolylines = [];
const depot = { lat: -34.8910, lng: -56.1680, name: "Depósito Principal (Punto de Partida)" };

// Helpers for dates
function getDeadlineOffset(hours) {
    const d = new Date();
    d.setHours(d.getHours() + hours);
    return d.toLocaleString('es-UY', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

// Initialise Application
document.addEventListener("DOMContentLoaded", () => {
    // Navigation / Tabs System
    initNavigation();
    
    // Auth flow
    initAuth();
    
    // Initialise Map
    initMap();
    
    // Load Data
    renderServicesTable();
    updateDashboardStats();
    
    // Forms
    initForms();
    
    // Optimization
    initOptimization();
    
    // Driver Simulator
    initDriverSimulator();
    
    // Chatbot Simulator
    initChatbot();
});

// Authentication Simulator
function initAuth() {
    const loginForm = document.getElementById("login-form");
    if(loginForm) {
        loginForm.addEventListener("submit", (e) => {
            e.preventDefault();
            document.getElementById("auth-page").style.display = "none";
            document.getElementById("app-page").style.display = "flex";
            
            // Trigger leaflet map redraw since it was hidden
            setTimeout(() => {
                map.invalidateSize();
                drawMarkers();
            }, 100);
        });
    }
}

// Navigation Tabs
function initNavigation() {
    const menuItems = document.querySelectorAll(".menu-item");
    const sections = document.querySelectorAll(".view-section");
    const logoutBtn = document.querySelector(".logout-btn");
    
    menuItems.forEach(item => {
        item.addEventListener("click", () => {
            const target = item.dataset.target;
            
            menuItems.forEach(m => m.classList.remove("active"));
            sections.forEach(s => s.classList.remove("active"));
            
            item.classList.add("active");
            document.getElementById(target).classList.add("active");
            
            if(target === "tab-dashboard" || target === "tab-lotes") {
                setTimeout(() => {
                    map.invalidateSize();
                }, 100);
            }
        });
    });

    if(logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            document.getElementById("app-page").style.display = "none";
            document.getElementById("auth-page").style.display = "flex";
        });
    }
}

// Map initialization
function initMap() {
    // Center of Montevideo
    map = L.map('leaflet-map').setView([depot.lat, depot.lng], 12);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
    
    markerLayerGroup = L.layerGroup().addTo(map);
    
    // Draw Depot
    const depotIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: #1E293B; width: 14px; height: 14px; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 10px rgba(0,0,0,0.5);"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7]
    });
    
    L.marker([depot.lat, depot.lng], { icon: depotIcon })
        .addTo(map)
        .bindPopup(`<b>${depot.name}</b><br/>Ubicación de Salida`);
}

// Draw markers on map
function drawMarkers() {
    markerLayerGroup.clearLayers();
    
    state.services.forEach(service => {
        let color = '#64748B'; // Default slate for unassigned
        
        if (state.optimized && service.driver !== "Sin Asignar") {
            const drv = state.drivers.find(d => d.name === service.driver);
            if (drv) color = drv.color;
        }
        
        const markerHtml = `<div style="background-color: ${color}; width: 14px; height: 14px; border: 2px solid white; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`;
        const customIcon = L.divIcon({
            className: 'custom-div-icon',
            html: markerHtml,
            iconSize: [14, 14],
            iconAnchor: [7, 7]
        });
        
        const marker = L.marker([service.lat, service.lng], { icon: customIcon })
            .bindPopup(`
                <div class="map-popup-title">${service.client}</div>
                <div class="map-popup-detail"><b>Dirección:</b> ${service.address}</div>
                <div class="map-popup-detail"><b>Deadline:</b> ${service.deadline}</div>
                <div class="map-popup-detail"><b>Chofer:</b> ${service.driver}</div>
                <div class="map-popup-detail"><b>Estado:</b> <span class="badge ${getStatusBadgeClass(service.status)}">${service.status}</span></div>
            `);
        markerLayerGroup.addLayer(marker);
    });
}

// Clean and draw route lines
function drawRoutes() {
    // Clear old lines
    routePolylines.forEach(line => map.removeLayer(line));
    routePolylines = [];
    
    if(!state.optimized) return;
    
    state.drivers.forEach(driver => {
        if(driver.stops.length === 0) return;
        
        // Path starts at Depot
        const coordinates = [[depot.lat, depot.lng]];
        driver.stops.forEach(stop => {
            coordinates.push([stop.lat, stop.lng]);
        });
        
        // Optional: Return to depot at the end (classic VRP)
        // coordinates.push([depot.lat, depot.lng]);
        
        const polyline = L.polyline(coordinates, {
            color: driver.color,
            weight: 4,
            opacity: 0.8,
            dashArray: '5, 10'
        }).addTo(map);
        
        routePolylines.push(polyline);
    });
}

// Render the main table
function renderServicesTable() {
    const tbody = document.querySelector("#services-table tbody");
    if(!tbody) return;
    
    tbody.innerHTML = "";
    
    state.services.forEach(service => {
        const tr = document.createElement("tr");
        
        // Source Badge
        const sourceHtml = service.source === "IA Chatbot" 
            ? `<span class="badge badge-ia">IA Chatbot</span>` 
            : `<span class="badge badge-pending">Oficina</span>`;
            
        tr.innerHTML = `
            <td>${service.id}</td>
            <td><b>${service.client}</b></td>
            <td>${service.address}</td>
            <td>${service.deadline}</td>
            <td>${sourceHtml}</td>
            <td><span class="badge ${getStatusBadgeClass(service.status)}">${service.status}</span></td>
            <td><b>${service.driver}</b></td>
        `;
        tbody.appendChild(tr);
    });
}

// Update counters
function updateDashboardStats() {
    const total = state.services.length;
    const completed = state.services.filter(s => s.status === "Recogido").length;
    const pending = state.services.filter(s => s.status === "Pendiente" || s.status === "Asignado" || s.status === "En camino").length;
    const inDanger = state.services.filter(s => s.status === "Retrasado").length;
    
    document.getElementById("stat-total").innerText = total;
    document.getElementById("stat-completed").innerText = completed;
    document.getElementById("stat-pending").innerText = pending;
    document.getElementById("stat-danger").innerText = inDanger;
}

// Form interactions
function initForms() {
    const addForm = document.getElementById("add-service-form");
    if(addForm) {
        addForm.addEventListener("submit", (e) => {
            e.preventDefault();
            
            const client = document.getElementById("input-client").value;
            const address = document.getElementById("input-address").value;
            const deadlineHours = parseInt(document.getElementById("input-deadline").value);
            
            // Random mock coordinates inside Montevideo area
            const lat = -34.90 + (Math.random() - 0.5) * 0.08;
            const lng = -56.16 + (Math.random() - 0.5) * 0.12;
            
            const newService = {
                id: state.services.length + 1,
                client,
                address,
                lat,
                lng,
                deadline: getDeadlineOffset(deadlineHours),
                status: "Pendiente",
                driver: "Sin Asignar",
                source: "Oficina"
            };
            
            state.services.push(newService);
            
            // Reset form
            addForm.reset();
            
            // Switch optimization off since list changed
            state.optimized = false;
            state.drivers.forEach(d => d.stops = []);
            
            // Redraw everything
            renderServicesTable();
            updateDashboardStats();
            drawMarkers();
            drawRoutes();
            
            alert("Servicio registrado con éxito. Se ha ubicado en el mapa.");
        });
    }
}

// Optimization Logic Simulation
function initOptimization() {
    const optBtn = document.getElementById("run-optimization-btn");
    const numDriversInput = document.getElementById("drivers-count-input");
    
    if(optBtn) {
        optBtn.addEventListener("click", () => {
            // Read driver count
            state.numberOfDrivers = parseInt(numDriversInput.value) || 3;
            
            // Show loader
            optBtn.innerHTML = `<span class="spinner"></span> Optimizando...`;
            optBtn.disabled = true;
            
            setTimeout(() => {
                // Execute mock K-Means and TSP clustering logic
                simulateRouteOptimization();
                
                // Reset button
                optBtn.innerHTML = `Optimizar Rutas por Lotes`;
                optBtn.disabled = false;
                
                // Draw routes
                drawMarkers();
                drawRoutes();
                
                // Update table
                renderServicesTable();
                
                // Render summary
                renderOptimizationSummary();
                
                // Update driver dashboard lists
                updateDriverSelector();
                renderDriverStops();
                
                alert("Optimización completada. Se generaron las rutas óptimas para los choferes.");
            }, 1200);
        });
    }
}

function simulateRouteOptimization() {
    state.optimized = true;
    
    // Clear current driver stops
    state.drivers.forEach(d => d.stops = []);
    
    // Filter active services (non-completed)
    const activeServices = state.services.filter(s => s.status !== "Recogido");
    
    if(activeServices.length === 0) return;
    
    // Sort services by proximity (simple mock sorting clustering for Montevideo)
    // We cluster simply by dividing longitude into N segments
    activeServices.sort((a, b) => a.lng - b.lng);
    
    const count = activeServices.length;
    const itemsPerDriver = Math.ceil(count / state.numberOfDrivers);
    
    for (let i = 0; i < state.numberOfDrivers; i++) {
        const driver = state.drivers[i % state.drivers.length];
        const startIndex = i * itemsPerDriver;
        const driverStops = activeServices.slice(startIndex, startIndex + itemsPerDriver);
        
        // Sort the stops for TSP simulation (e.g. from north to south / latitude)
        driverStops.sort((a, b) => b.lat - a.lat);
        
        driverStops.forEach(stop => {
            stop.driver = driver.name;
            stop.status = "Asignado";
            driver.stops.push(stop);
        });
    }
}

function renderOptimizationSummary() {
    const container = document.getElementById("optimization-summary-stats");
    if(!container) return;
    
    container.innerHTML = "";
    
    if(!state.optimized) {
        container.innerHTML = `<p style="font-size: 13px; color: var(--text-muted); text-align: center;">Sin rutas calculadas aún. Haz clic en 'Optimizar Rutas'.</p>`;
        return;
    }
    
    state.drivers.forEach(driver => {
        if(driver.stops.length === 0) return;
        
        // Mock travel distance and time based on stops count
        const totalDistance = (driver.stops.length * 3.4 + 2).toFixed(1);
        const totalTime = Math.ceil(driver.stops.length * 22 + 15);
        
        const div = document.createElement("div");
        div.className = "route-stat-item";
        div.innerHTML = `
            <span>
                <span class="route-color-indicator" style="background-color: ${driver.color};"></span>
                <b>${driver.routeName}</b> (${driver.name})
            </span>
            <span><b>${driver.stops.length} bolsones</b> | ${totalDistance} km | ~${totalTime} mins</span>
        `;
        container.appendChild(div);
    });
}

// Driver Simulator Logic
function initDriverSimulator() {
    const select = document.getElementById("driver-select");
    if(select) {
        select.addEventListener("change", () => {
            renderDriverStops();
        });
    }
}

function updateDriverSelector() {
    const select = document.getElementById("driver-select");
    if(!select) return;
    
    select.innerHTML = '<option value="">-- Seleccionar Chofer --</option>';
    state.drivers.forEach(drv => {
        select.innerHTML += `<option value="${drv.id}">${drv.name} (${drv.stops.length} paradas)</option>`;
    });
}

function renderDriverStops() {
    const screenBody = document.getElementById("mobile-stops-container");
    const driverId = document.getElementById("driver-select").value;
    
    if(!screenBody) return;
    
    screenBody.innerHTML = "";
    
    if(!driverId) {
        screenBody.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 13px; padding-top: 40px;">Por favor, selecciona un chofer arriba para iniciar la simulación de su teléfono celular.</div>`;
        return;
    }
    
    const driver = state.drivers.find(d => d.id === driverId);
    
    if(!state.optimized || !driver || driver.stops.length === 0) {
        screenBody.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 13px; padding-top: 40px;">Este chofer no tiene paradas asignadas. Optimiza las rutas primero en el Panel Administrativo.</div>`;
        return;
    }
    
    driver.stops.forEach((stop, index) => {
        const item = document.createElement("div");
        const isDone = stop.status === "Recogido";
        item.className = `phone-route-stop ${isDone ? 'done' : ''}`;
        
        item.innerHTML = `
            <div class="stop-sequence">${index + 1}</div>
            <div class="stop-title">${stop.address}</div>
            <div style="font-size: 11px; color: var(--text-muted);"><b>Cliente:</b> ${stop.client}</div>
            <div class="stop-deadline">Vence: ${stop.deadline}</div>
            <div style="font-size: 11px; margin-top: 5px;">
                <b>Estado:</b> <span class="badge ${getStatusBadgeClass(stop.status)}">${stop.status}</span>
            </div>
            
            <div class="stop-actions">
                <button class="btn-mobile btn-mobile-gps" onclick="simulateGPS('${stop.address}')">
                    Navegar GPS
                </button>
                ${!isDone ? `
                <button class="btn-mobile btn-mobile-status" onclick="changeStopStatus(${stop.id}, '${driverId}')">
                    Recogido
                </button>
                ` : ''}
            </div>
        `;
        screenBody.appendChild(item);
    });
}

window.simulateGPS = function(address) {
    alert(`Abriendo enlace de navegación a:\n"${address}"\n(Simulación de redirección a Google Maps / Waze)`);
};

window.changeStopStatus = function(serviceId, driverId) {
    const service = state.services.find(s => s.id === serviceId);
    if(service) {
        service.status = "Recogido";
        
        // Refresh UI
        renderServicesTable();
        updateDashboardStats();
        drawMarkers();
        drawRoutes();
        renderDriverStops();
        renderOptimizationSummary();
    }
};

// Chatbot Logic Simulator
function initChatbot() {
    const sendBtn = document.getElementById("chat-send-btn");
    const input = document.getElementById("chat-input");
    
    if(sendBtn && input) {
        sendBtn.addEventListener("click", () => {
            const text = input.value.trim();
            if(text) {
                addUserMessage(text);
                input.value = "";
                simulateBotResponse(text);
            }
        });
        
        input.addEventListener("keypress", (e) => {
            if(e.key === 'Enter') {
                sendBtn.click();
            }
        });
    }
}

window.triggerPrompt = function(promptText, stepIndex) {
    addUserMessage(promptText);
    state.chatStep = stepIndex;
    simulateBotResponse(promptText);
};

function addUserMessage(text) {
    const chatBody = document.getElementById("chat-body");
    if(!chatBody) return;
    
    const time = new Date().toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' });
    const div = document.createElement("div");
    div.className = "chat-bubble user";
    div.innerHTML = `${text}<div class="chat-time">${time}</div>`;
    chatBody.appendChild(div);
    chatBody.scrollTop = chatBody.scrollHeight;
}

function addBotMessage(text) {
    const chatBody = document.getElementById("chat-body");
    if(!chatBody) return;
    
    const time = new Date().toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' });
    const div = document.createElement("div");
    div.className = "chat-bubble bot";
    div.innerHTML = `${text}<div class="chat-time">${time}</div>`;
    chatBody.appendChild(div);
    chatBody.scrollTop = chatBody.scrollHeight;
}

function simulateBotResponse(userText) {
    // Show typing state
    const chatBody = document.getElementById("chat-body");
    const typingDiv = document.createElement("div");
    typingDiv.className = "chat-bubble bot typing";
    typingDiv.id = "bot-typing-indicator";
    typingDiv.innerHTML = `<i>La IA está escribiendo...</i>`;
    chatBody.appendChild(typingDiv);
    chatBody.scrollTop = chatBody.scrollHeight;
    
    setTimeout(() => {
        // Remove typing
        const indicator = document.getElementById("bot-typing-indicator");
        if(indicator) indicator.remove();
        
        // Handle step replies
        if (state.chatStep === 1) {
            // First prompt clicked: Quiero comprar un bolsón
            addBotMessage(
                "¡Hola! Con gusto te ayudo a comprar tu bolsón de escombros.<br/>" +
                "Por favor, indicame en qué zona de Montevideo te encontrás para recomendarte la barraca más cercana."
            );
            state.chatStep = 2; // Waiting for zone
        } 
        else if (state.chatStep === 2) {
            // Zone entered
            state.chatAnswers.zone = userText;
            addBotMessage(
                `Perfecto. Para la zona <b>"${userText}"</b> tenés las siguientes barracas autorizadas:<br/><br/>` +
                `1. <b>Barraca del Sur</b> (Av. Rivera 3220) - Cel: 099 123 456<br/>` +
                `2. <b>Ferretería Central</b> (Av. Italia 2810) - Cel: 098 765 432<br/><br/>` +
                `¿Ya adquiriste tu bolsón y querés agendar la recogida?`
            );
            state.chatStep = 3;
        }
        else if (state.chatStep === 3) {
            // User answers yes to pick up
            addBotMessage(
                "¡Excelente! Vamos a registrar tu recogida.<br/>" +
                "Por favor, facilítame tu <b>Nombre Completo</b> para la orden de retiro."
            );
            state.chatStep = 4;
        }
        else if (state.chatStep === 4) {
            state.chatAnswers.name = userText;
            addBotMessage(
                `Gracias, ${userText}. Ahora indicame la <b>Dirección Exacta</b> con calle y número de puerta para que el chofer lo retire.`
            );
            state.chatStep = 5;
        }
        else if (state.chatStep === 5) {
            state.chatAnswers.address = userText;
            
            // Random mock coordinates inside Montevideo area
            const lat = -34.90 + (Math.random() - 0.5) * 0.08;
            const lng = -56.16 + (Math.random() - 0.5) * 0.12;
            
            // Add new service to state
            const newServiceId = state.services.length + 1;
            const newService = {
                id: newServiceId,
                client: state.chatAnswers.name,
                address: state.chatAnswers.address,
                lat,
                lng,
                deadline: getDeadlineOffset(18), // 18 hrs offset
                status: "Pendiente",
                driver: "Sin Asignar",
                source: "IA Chatbot"
            };
            
            state.services.push(newService);
            
            // Switch optimization off since list changed
            state.optimized = false;
            state.drivers.forEach(d => d.stops = []);
            
            // Redraw dashboard views
            renderServicesTable();
            updateDashboardStats();
            drawMarkers();
            drawRoutes();
            updateDriverSelector();
            
            addBotMessage(
                `¡Listo! He registrado la orden de retiro para la dirección: <b>"${state.chatAnswers.address}"</b>.<br/>` +
                `La recogida se programará antes del <b>${newService.deadline}</b> para evitar multas municipales.<br/>` +
                `Número de orden: <b>#00${newServiceId}</b>. ¡Muchas gracias!`
            );
            
            state.chatStep = 0; // Reset
        }
        else {
            addBotMessage("Hola. Soy el asistente virtual de recolección de bolsones. ¿En qué puedo ayudarte hoy?");
        }
    }, 1000);
}

// Badge styling helper
function getStatusBadgeClass(status) {
    switch (status) {
        case "Pendiente": return "badge-pending";
        case "Asignado": return "badge-assigned";
        case "En camino": return "badge-delivery";
        case "Recogido": return "badge-success";
        case "Retrasado": return "badge-danger";
        default: return "badge-pending";
    }
}
