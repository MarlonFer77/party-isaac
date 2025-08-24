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
            tableBody: document.getElementById('rsvps-table-body'), searchInput: document.getElementById('search-input'),
            paginationControls: document.getElementById('pagination-controls'), barChartCanvas: document.getElementById('bar-chart'),
            exportCsvBtn: document.getElementById('export-csv-btn'), exportJsonBtn: document.getElementById('export-json-btn'),
            clearAllBtn: document.getElementById('clear-all-btn'),
        },
        state: { allRsvps: [], filteredRsvps: [], currentPage: 1, rowsPerPage: 5, hoveredBarIndex: null, barRects: [] },
        init() { this.checkAuth(); this.addEventListeners(); },
        checkAuth() { if (sessionStorage.getItem('isLoggedIn') === 'true') { this.showDashboard(); } else { this.showLogin(); } },
        handleLogin(e) { e.preventDefault(); const t = this.elements.loginForm.querySelector("#username").value, s = this.elements.loginForm.querySelector("#password").value; t === window.AppConfig.admin.user && s === window.AppConfig.admin.pass ? (sessionStorage.setItem("isLoggedIn", "true"), this.showDashboard()) : this.elements.loginError.textContent = "Usuário ou senha inválidos." },
        handleLogout() { sessionStorage.removeItem('isLoggedIn'); this.showLogin(); },
        showLogin() { this.elements.loginSection.hidden = false; this.elements.dashboardSection.hidden = true; },
        async showDashboard() { this.elements.loginSection.hidden = true; this.elements.dashboardSection.hidden = false; await this.loadAndRenderData(); },
        async loadAndRenderData() {
            const rsvpsFromApi = await listRsvps();
            this.state.allRsvps = rsvpsFromApi.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            this.filterData();
            this.renderAllComponents();
        },
        filterData() {
            const searchTerm = this.elements.searchInput.value.toLowerCase();
            this.state.filteredRsvps = searchTerm ? this.state.allRsvps.filter(r => r.nome.toLowerCase().includes(searchTerm)) : this.state.allRsvps;
            this.state.currentPage = 1;
        },
        renderAllComponents() {
            this.renderCards();
            this.renderTable();
            this.renderCharts();
        },
        async renderCards() {
            const totals = await countTotals();
            this.elements.cardConfirmed.textContent = totals.confirmed;
        },
        renderTable() {
            this.elements.tableBody.innerHTML = '';
            const start = (this.state.currentPage - 1) * this.state.rowsPerPage;
            const end = start + this.state.rowsPerPage;
            const paginatedItems = this.state.filteredRsvps.slice(start, end);
            if (paginatedItems.length === 0) {
                this.elements.tableBody.innerHTML = '<tr<td colspan="4" style="text-align:center;">Nenhuma confirmação encontrada.</td></tr>';
            } else {
                paginatedItems.forEach(rsvp => {
                    const row = document.createElement('tr');
                    row.innerHTML = `<td>${rsvp.nome}</td><td>${rsvp.mensagem || '---'}</td><td>${new Date(rsvp.timestamp).toLocaleDateString('pt-BR')}</td><td><button class="btn btn-danger delete-btn" data-id="${rsvp.id}">Remover</button></td>`;
                    this.elements.tableBody.appendChild(row);
                });
            }
            this.renderPagination();
        },
        renderPagination() {
            this.elements.paginationControls.innerHTML = "";
            const pageCount = Math.ceil(this.state.filteredRsvps.length / this.state.rowsPerPage);
            if (pageCount <= 1) return;
            for (let i = 1; i <= pageCount; i++) {
                const btn = document.createElement("button");
                btn.className = "btn btn-secondary", btn.textContent = i, i === this.state.currentPage && (btn.disabled = !0), btn.addEventListener("click", (() => { this.state.currentPage = i, this.renderTable() })), this.elements.paginationControls.appendChild(btn)
            }
        },
        renderCharts() {
            this.animateChart(this.drawBarChart.bind(this));
        },
        animateChart(drawFunction) {
            let start = null;
            const duration = 1000;
            const step = timestamp => {
                if (!start) start = timestamp;
                const progress = Math.min((timestamp - start) / duration, 1);
                drawFunction(progress);
                if (progress < 1) {
                    window.requestAnimationFrame(step);
                }
            };
            window.requestAnimationFrame(step);
        },
        drawBarChart(progress = 1) {
            const ctx = this.elements.barChartCanvas.getContext("2d");
            const data = this.state.allRsvps.reduce(((acc, rsvp) => { const dateKey = getLocalDateKey(rsvp.timestamp); acc[dateKey] = (acc[dateKey] || 0) + 1; return acc }), {});
            const labels = Object.keys(data).sort();
            const values = labels.map((label => data[label]));
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            if (labels.length === 0) return;
            const maxValue = Math.max(...values);
            const barWidth = ctx.canvas.width / (2 * labels.length);
            this.state.barRects = [];
            values.forEach(((value, index) => {
                const barHeight = value / maxValue * .8 * ctx.canvas.height * progress;
                const x = 2 * index * barWidth + barWidth / 2;
                const y = ctx.canvas.height - barHeight - 20;
                this.state.barRects[index] = { x, y, width: barWidth, height: barHeight, label: labels[index], value };
                ctx.fillStyle = this.state.hoveredBarIndex === index ? "#F8D800" : "rgba(69, 182, 254, 0.8)";
                ctx.fillRect(x, y, barWidth, barHeight);
                ctx.fillStyle = "white";
                ctx.textAlign = "center";
                ctx.fillText(labels[index].substring(5).replace("-", "/"), x + barWidth / 2, ctx.canvas.height - 5);
            }));
            if (null !== this.state.hoveredBarIndex) {
                const bar = this.state.barRects[this.state.hoveredBarIndex];
                const localDateForTooltip = new Date(`${bar.label}T00:00:00`);
                const text = `${bar.value} em ${localDateForTooltip.toLocaleDateString("pt-BR")}`;
                ctx.font = "12px Montserrat";
                ctx.textAlign = "left";
                const textWidth = ctx.measureText(text).width + 10;
                ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
                ctx.fillRect(bar.x, bar.y - 25, textWidth, 20);
                ctx.fillStyle = "white";
                ctx.fillText(text, bar.x + 5, bar.y - 12);
            }
        },
        addEventListeners() {
            this.elements.loginForm.addEventListener("submit", this.handleLogin.bind(this));
            this.elements.logoutBtn.addEventListener("click", this.handleLogout.bind(this));
            this.elements.searchInput.addEventListener("input", (() => { this.filterData(); this.renderTable() }));
            this.elements.tableBody.addEventListener("click", (async e => { if (e.target.classList.contains("delete-btn")) { const t = e.target.dataset.id; if(confirm("Tem certeza que deseja remover esta confirmação?")) { await deleteRsvp(t); await this.loadAndRenderData(); } } }));
            this.elements.exportCsvBtn.addEventListener("click", exportCSV);
            this.elements.exportJsonBtn.addEventListener("click", exportJSON);
            this.elements.clearAllBtn.addEventListener("click", (() => { alert("Para limpar todos os dados, por favor, apague as linhas diretamente na sua planilha do Google Sheets.") }));
            this.elements.barChartCanvas.addEventListener("mousemove", (e => { const t = this.elements.barChartCanvas.getBoundingClientRect(), s = e.clientX - t.left, a = e.clientY - t.top; let n = null; this.state.barRects && this.state.barRects.forEach(((i, o) => { s >= i.x && s <= i.x + i.width && a >= i.y && a <= i.y + i.height && (n = o) })), this.state.hoveredBarIndex !== n && (this.state.hoveredBarIndex = n, this.drawBarChart()) }));
        }
    };
    AdminApp.init();
});