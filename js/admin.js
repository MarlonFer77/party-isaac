function getLocalDateKey(isoTimestamp) {
    const date = new Date(isoTimestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

document.addEventListener('DOMContentLoaded', () => {
    const AdminApp = {
        elements: {
            loginSection: document.getElementById('login-section'), dashboardSection: document.getElementById('dashboard-section'),
            loginForm: document.getElementById('login-form'), loginError: document.getElementById('login-error'),
            logoutBtn: document.getElementById('logout-btn'), cardConfirmed: document.getElementById('card-confirmed'),
            cardGuests: document.getElementById('card-guests'), cardTotal: document.getElementById('card-total'),
            tableBody: document.getElementById('rsvps-table-body'), searchInput: document.getElementById('search-input'),
            paginationControls: document.getElementById('pagination-controls'), barChartCanvas: document.getElementById('bar-chart'),
            pieChartCanvas: document.getElementById('pie-chart'), pieChartLegend: document.getElementById('pie-chart-legend'),
            exportCsvBtn: document.getElementById('export-csv-btn'), exportJsonBtn: document.getElementById('export-json-btn'),
            clearAllBtn: document.getElementById('clear-all-btn'),
        },
        state: {
            allRsvps: [], filteredRsvps: [], currentPage: 1, rowsPerPage: 5,
            hoveredBarIndex: null, barRects: [], hoveredPieIndex: null, pieSlices: []
        },
        init() { this.checkAuth(); this.addEventListeners(); },
        checkAuth() { if (sessionStorage.getItem('isLoggedIn') === 'true') { this.showDashboard(); } else { this.showLogin(); } },
        handleLogin(e) { e.preventDefault(); const t = this.elements.loginForm.querySelector("#username").value, s = this.elements.loginForm.querySelector("#password").value; t === window.AppConfig.admin.user && s === window.AppConfig.admin.pass ? (sessionStorage.setItem("isLoggedIn", "true"), this.showDashboard()) : this.elements.loginError.textContent = "Usuário ou senha inválidos." },
        handleLogout() { sessionStorage.removeItem('isLoggedIn'); this.showLogin(); },
        showLogin() { this.elements.loginSection.hidden = false; this.elements.dashboardSection.hidden = true; },
        async showDashboard() { this.elements.loginSection.hidden = true; this.elements.dashboardSection.hidden = false; await this.loadAndRenderData(); },
        async loadAndRenderData() { const e = await listRsvps(); this.state.allRsvps = e.sort(((t, s) => new Date(s.timestamp) - new Date(t.timestamp))); this.filterData(); this.renderAllComponents(); },
        filterData() { const e = this.elements.searchInput.value.toLowerCase(); this.state.filteredRsvps = e ? this.state.allRsvps.filter((t => t.nome.toLowerCase().includes(e))) : this.state.allRsvps; this.state.currentPage = 1 },
        renderAllComponents() { this.renderCards(); this.renderTable(); this.renderCharts(); },
        renderCards() { const e = this.state.allRsvps.length, t = this.state.allRsvps.reduce(((s, a) => s + parseInt(a.acompanhantes || 0)), 0); this.elements.cardConfirmed.textContent = e; this.elements.cardGuests.textContent = t; this.elements.cardTotal.textContent = e + t },
        renderTable() { this.elements.tableBody.innerHTML = ""; const e = (this.state.currentPage - 1) * this.state.rowsPerPage, t = e + this.state.rowsPerPage, s = this.state.filteredRsvps.slice(e, t); 0 === s.length ? this.elements.tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Nenhuma confirmação encontrada.</td></tr>' : s.forEach((a => { const e = document.createElement("tr"); e.innerHTML = `<td>${a.nome}</td><td>${a.acompanhantes}</td><td>${a.mensagem||"---"}</td><td>${(new Date(a.timestamp)).toLocaleDateString("pt-BR")}</td><td><button class="btn btn-danger delete-btn" data-id="${a.id}">Remover</button></td>`, this.elements.tableBody.appendChild(e) })), this.renderPagination() },
        renderPagination() { this.elements.paginationControls.innerHTML = ""; const e = Math.ceil(this.state.filteredRsvps.length / this.state.rowsPerPage); if (e <= 1) return; for (let t = 1; t <= e; t++) { const s = document.createElement("button"); s.className = "btn btn-secondary", s.textContent = t, t === this.state.currentPage && (s.disabled = !0), s.addEventListener("click", (() => { this.state.currentPage = t, this.renderTable() })), this.elements.paginationControls.appendChild(s) } },
        renderCharts() { this.animateChart(this.drawBarChart.bind(this)); this.animateChart(this.drawPieChart.bind(this)); },
        animateChart(e) { let t = null; const s = 1e3; const a = n => { t || (t = n); const i = Math.min((n - t) / s, 1); e(i), i < 1 && window.requestAnimationFrame(a) }; window.requestAnimationFrame(a) },
        drawBarChart(e = 1) {
            const t = this.elements.barChartCanvas.getContext("2d"), s = this.state.allRsvps.reduce(((a, n) => { const i = getLocalDateKey(n.timestamp); return a[i] = (a[i] || 0) + 1, a }), {}), a = Object.keys(s).sort(), n = a.map((i => s[i]));
            if (t.clearRect(0, 0, t.canvas.width, t.canvas.height), 0 !== a.length) {
                const i = Math.max(...n), o = t.canvas.width / (2 * a.length); this.state.barRects = [], n.forEach(((r, c) => {
                    const l = r / i * .8 * t.canvas.height * e, h = 2 * c * o + o / 2, d = t.canvas.height - l - 20;
                    this.state.barRects[c] = { x: h, y: d, width: o, height: l, label: a[c], value: r }, t.fillStyle = this.state.hoveredBarIndex === c ? "#F8D800" : "rgba(69, 182, 254, 0.8)", t.fillRect(h, d, o, l), t.fillStyle = "white", t.textAlign = "center", t.fillText(a[c].substring(5).replace("-", "/"), h + o / 2, t.canvas.height - 5)
                })), null !== this.state.hoveredBarIndex && (()=>{ const e = this.state.barRects[this.state.hoveredBarIndex], s = new Date(`${e.label}T00:00:00`), a = `${e.value} em ${s.toLocaleDateString("pt-BR")}`; t.font = "12px Montserrat", t.textAlign = "left"; const n = t.measureText(a).width + 10; t.fillStyle = "rgba(0, 0, 0, 0.7)", t.fillRect(e.x, e.y - 25, n, 20), t.fillStyle = "white", t.fillText(a, e.x + 5, e.y - 12) })()
            }
        },
        drawPieChart(e = 1) { const t = this.elements.pieChartCanvas.getContext("2d"), s = this.elements.pieChartLegend; s.innerHTML = ""; const a = this.state.allRsvps.reduce(((n, i) => { const o = `${i.acompanhantes} acomp.`; return n[o] = (n[o] || 0) + 1, n }), {}), n = this.state.allRsvps.length; if (0 !== n) { const i = ["#45B6FE", "#F8D800", "#FF6B6B", "#32CD32", "#9370DB", "#FFA500"]; let o = -.5 * Math.PI; this.state.pieSlices = []; for (const r in a) { const c = a[r] / n * 2 * Math.PI; this.state.pieSlices.push({ startAngle: o, endAngle: o + c, label: r, value: a[r], color: i[this.state.pieSlices.length % i.length] }), o += c } t.clearRect(0, 0, t.canvas.width, t.canvas.height), this.state.pieSlices.forEach(((n, i) => { const o = this.state.hoveredPieIndex === i; t.fillStyle = n.color, t.beginPath(), t.moveTo(t.canvas.width / 2, t.canvas.height / 2); const r = o ? 1.05 : 1; t.arc(t.canvas.width / 2, t.canvas.height / 2, t.canvas.height / 2 * r, n.startAngle, n.startAngle + (n.endAngle - n.startAngle) * e), t.closePath(), t.fill(); const c = document.createElement("div"); c.className = "legend-item", c.innerHTML = `<div class="legend-color" style="background-color: ${n.color}"></div> ${n.label}: ${n.value}`, s.appendChild(c) })), null !== this.state.hoveredPieIndex && (()=>{ const e = this.state.pieSlices[this.state.hoveredPieIndex], s = Math.round(e.value / n * 100); t.font = "14px Poppins", t.textAlign = "center", t.fillStyle = "white", t.fillText(`${e.value} (${s}%)`, t.canvas.width / 2, t.canvas.height / 2) })() } },
        addEventListeners() {
            this.elements.loginForm.addEventListener("submit", this.handleLogin.bind(this));
            this.elements.logoutBtn.addEventListener("click", this.handleLogout.bind(this));
            this.elements.searchInput.addEventListener("input", (() => { this.filterData(); this.renderTable() }));
            this.elements.tableBody.addEventListener("click", (async e => { if (e.target.classList.contains("delete-btn")) { const t = e.target.dataset.id; if(confirm("Tem certeza que deseja remover esta confirmação?")) { await deleteRsvp(t); await this.loadAndRenderData(); } } }));
            this.elements.exportCsvBtn.addEventListener("click", exportCSV);
            this.elements.exportJsonBtn.addEventListener("click", exportJSON);
            this.elements.clearAllBtn.addEventListener("click", (() => { alert("Para limpar todos os dados, por favor, apague as linhas diretamente na sua planilha do Google Sheets.") }));
            this.elements.barChartCanvas.addEventListener("mousemove", (e => { const t = this.elements.barChartCanvas.getBoundingClientRect(), s = e.clientX - t.left, a = e.clientY - t.top; let n = null; this.state.barRects && this.state.barRects.forEach(((i, o) => { s >= i.x && s <= i.x + i.width && a >= i.y && a <= i.y + i.height && (n = o) })), this.state.hoveredBarIndex !== n && (this.state.hoveredBarIndex = n, this.drawBarChart()) }));
            this.elements.pieChartCanvas.addEventListener("mousemove", (e => { const t = this.elements.pieChartCanvas.getBoundingClientRect(), s = e.clientX - t.left - t.width / 2, a = e.clientY - t.top - t.height / 2; let n = null; if (Math.sqrt(s * s + a * a) <= t.height / 2) { let i = Math.atan2(a, s); i < -.5 * Math.PI && (i += 2 * Math.PI), this.state.pieSlices.forEach(((o, r) => { i >= o.startAngle && i < o.endAngle && (n = r) })) } this.state.hoveredPieIndex !== n && (this.state.hoveredPieIndex = n, this.drawPieChart()) }));
        }
    };
    AdminApp.init();
});