document.addEventListener('DOMContentLoaded', () => {
    const ui = {
        elements: {
            rsvpSection: document.getElementById('rsvp'),
            rsvpForm: document.getElementById('rsvp-form'),
            heroTitle: document.querySelector('.hero-title'),
            heroDate: document.querySelector('.hero-date'),
            countdownUnits: { days: document.getElementById('days'), hours: document.getElementById('hours'), minutes: document.getElementById('minutes'), seconds: document.getElementById('seconds') },
            carouselTrack: document.querySelector('.carousel-track'),
            carouselPagination: document.querySelector('.carousel-pagination'),
            prevButton: document.querySelector('.carousel-button.prev'),
            nextButton: document.querySelector('.carousel-button.next'),
            info: { localNome: document.getElementById('local-nome'), localEndereco: document.getElementById('local-endereco'), localLink: document.getElementById('local-link'), observacoes: document.getElementById('observacoes') },
            thankYouModal: document.getElementById('thank-you-modal'),
            modalBody: document.getElementById('modal-body'),
            closeModalButton: document.querySelector('.modal-close'),
            addToCalendarButton: document.getElementById('add-to-calendar'),
            easterEgg: document.getElementById('easter-egg'),
            bubbleSound: document.getElementById('bubble-sound'),
            ctaScrolls: document.querySelectorAll('.cta-scroll'),
            contactLink: document.getElementById('contact-link'),
            rsvpSubmitButton: document.querySelector('#rsvp-form .btn-submit'),
        },
        state: { lastSubmissionTimestamp: 0, countdownInterval: null, currentSlide: 0, carouselAutoplay: null, elementToFocusOnModalClose: null },
        init() {
            this.checkInviteKey();
            this.populateData();
            this.startCountdown();
            this.setupCarousel();
            this.setupRsvpForm();
            this.setupModal();
            this.setupContactButton();
            this.setupMicrointeractions();
            this.setupScrollLinks();
        },
        checkInviteKey() {
            const { chaveSecreta } = window.AppConfig.rsvp;
            const ctaButton = document.querySelector('a.cta-scroll[href="#rsvp"]');
            if (!chaveSecreta) {
                this.elements.rsvpSection.hidden = false;
                return;
            }
            const urlParams = new URLSearchParams(window.location.search);
            const keyFromUrl = urlParams.get('k');
            if (keyFromUrl === chaveSecreta) {
                this.elements.rsvpSection.hidden = false;
            } else {
                if (ctaButton) {
                    ctaButton.classList.add('disabled');
                    ctaButton.title = "Use o link de convite que você recebeu para confirmar a presença.";
                }
            }
        },
        populateData() {
            const { aniversariante, evento } = window.AppConfig;
            this.elements.heroTitle.textContent = aniversariante.nome;
            this.elements.heroDate.textContent = evento.data;
            this.elements.info.localNome.textContent = evento.local.nome;
            this.elements.info.localEndereco.textContent = evento.local.endereco;
            this.elements.info.localLink.href = evento.local.googleMapsLink;
            this.elements.info.observacoes.textContent = evento.observacoes;
        },
        startCountdown() {
            const targetDate = new Date(window.AppConfig.evento.dataISO).getTime();
            this.state.countdownInterval = setInterval(() => {
                const now = new Date().getTime();
                const distance = targetDate - now;
                if (distance < 0) {
                    clearInterval(this.state.countdownInterval);
                    document.getElementById('countdown-section').innerHTML = `<h3 class="section-title">A festa já aconteceu!</h3>`;
                    return;
                }
                const days = Math.floor(distance / (1000 * 60 * 60 * 24));
                const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((distance % (1000 * 60)) / 1000);
                this.elements.countdownUnits.days.textContent = String(days).padStart(2, '0');
                this.elements.countdownUnits.hours.textContent = String(hours).padStart(2, '0');
                this.elements.countdownUnits.minutes.textContent = String(minutes).padStart(2, '0');
                this.elements.countdownUnits.seconds.textContent = String(seconds).padStart(2, '0');
            }, 1000);
        },
        setupCarousel() {
            const { fotos, videos } = window.AppConfig.media;
            const media = [...fotos, ...videos];
            if (media.length === 0) return;
            media.forEach((src, index) => {
                const slide = document.createElement('div');
                slide.className = 'carousel-slide';
                if (src.endsWith('.mp4')) {
                    slide.innerHTML = `<video src="public/assets/video/${src}" preload="metadata" controls loading="lazy"></video>`;
                } else {
                    const imageName = src.substring(0, src.lastIndexOf('.'));
                    const imageExt = src.substring(src.lastIndexOf('.') + 1);
                    slide.innerHTML = `<img src="public/assets/img/${src}" srcset="public/assets/img/${imageName}-600w.${imageExt} 600w, public/assets/img/${imageName}-1200w.${imageExt} 1200w" sizes="(max-width: 800px) 90vw, 800px" alt="Foto ${index + 1} do ensaio" loading="lazy">`;
                }
                this.elements.carouselTrack.appendChild(slide);
                const dot = document.createElement('button');
                dot.className = 'pagination-dot';
                dot.dataset.slide = index;
                dot.setAttribute('aria-label', `Ir para slide ${index + 1}`);
                this.elements.carouselPagination.appendChild(dot);
            });
            this.updateCarousel();
            this.elements.nextButton.addEventListener('click', () => this.moveSlide(1));
            this.elements.prevButton.addEventListener('click', () => this.moveSlide(-1));
            this.elements.carouselPagination.addEventListener('click', (e) => {
                if (e.target.matches('.pagination-dot')) {
                    this.state.currentSlide = parseInt(e.target.dataset.slide);
                    this.updateCarousel();
                }
            });
            this.startCarouselAutoplay();
            this.elements.carouselTrack.parentElement.addEventListener('mouseenter', () => clearInterval(this.state.carouselAutoplay));
            this.elements.carouselTrack.parentElement.addEventListener('mouseleave', () => this.startCarouselAutoplay());
        },
        moveSlide(direction) {
            const totalSlides = this.elements.carouselTrack.children.length;
            this.state.currentSlide = (this.state.currentSlide + direction + totalSlides) % totalSlides;
            this.updateCarousel();
        },
        updateCarousel() {
            const offset = this.state.currentSlide * -100;
            this.elements.carouselTrack.style.transform = `translateX(${offset}%)`;
            document.querySelectorAll('.pagination-dot').forEach((dot, index) => dot.classList.toggle('active', index === this.state.currentSlide));
        },
        startCarouselAutoplay() {
            clearInterval(this.state.carouselAutoplay);
            this.state.carouselAutoplay = setInterval(() => this.moveSlide(1), 5000);
        },
        setupRsvpForm() {
            if (this.elements.rsvpSection.hidden) return;
            this.elements.rsvpForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const now = Date.now();
                if (now - this.state.lastSubmissionTimestamp < 10000) {
                    alert('Por favor, aguarde um momento antes de tentar enviar novamente.');
                    return;
                }
                if (this.validateForm()) {
                    const formData = new FormData(this.elements.rsvpForm);
                    const rsvpData = {
                        nome: formData.get('name'),
                        mensagem: formData.get('message')
                    };
                    const result = await saveRsvp(rsvpData);
                    if (result.success) {
                        this.state.lastSubmissionTimestamp = now;
                        this.state.elementToFocusOnModalClose = document.activeElement;
                        this.showThankYouModal(rsvpData.nome);
                        this.elements.rsvpForm.reset();
                    } else {
                        alert(result.message || 'Ocorreu um erro ao salvar sua confirmação.');
                    }
                }
            });
            this.elements.rsvpSubmitButton.addEventListener('click', () => {
                if (this.elements.bubbleSound) {
                    this.elements.bubbleSound.currentTime = 0;
                    this.elements.bubbleSound.play();
                }
            });
        },
        validateForm() {
            let isValid = true;
            const nameInput = this.elements.rsvpForm.querySelector('#name');
            const nameError = nameInput.nextElementSibling;
            if (nameInput.value.trim() === '') {
                nameInput.classList.add('invalid');
                nameError.textContent = 'Por favor, preencha seu nome.';
                isValid = false;
            } else {
                nameInput.classList.remove('invalid');
                nameError.textContent = '';
            }
            return isValid;
        },
        showThankYouModal(name) {
            this.elements.modalBody.textContent = `Sua presença foi confirmada, ${name}! Esperamos por você.`;
            this.elements.thankYouModal.hidden = false;
            this.elements.thankYouModal.setAttribute('aria-hidden', 'false');
            this.elements.closeModalButton.focus();
        },
        setupModal() {
            const closeModal = () => {
                this.elements.thankYouModal.hidden = true;
                this.elements.thankYouModal.setAttribute('aria-hidden', 'true');
                if (this.state.elementToFocusOnModalClose) {
                    this.state.elementToFocusOnModalClose.focus();
                }
            };
            this.elements.closeModalButton.addEventListener('click', closeModal);
            this.elements.thankYouModal.addEventListener('click', (e) => { if (e.target === this.elements.thankYouModal) closeModal(); });
            document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !this.elements.thankYouModal.hidden) closeModal(); });
            this.elements.addToCalendarButton.addEventListener('click', () => this.generateIcsFile());
        },
        generateIcsFile() {
            const { evento, aniversariante } = window.AppConfig;
            const escapeIcsString = (str) => {
                if (!str) return '';
                return str.replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\n/g, '\\n');
            };
            const startDate = new Date(evento.dataISO);
            const endDate = new Date(startDate.getTime() + (4 * 60 * 60 * 1000));
            const toIcsDate = (date) => date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
            const icsContent = [
                'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//FestaDoIsaac//NONSGML v1.0//EN',
                'BEGIN:VEVENT', `UID:${Date.now()}@festadoisaac.com`, `DTSTAMP:${toIcsDate(new Date())}`,
                `DTSTART:${toIcsDate(startDate)}`, `DTEND:${toIcsDate(endDate)}`,
                `SUMMARY:${escapeIcsString(`Festa de 1 Aninho do ${aniversariante.nome}`)}`,
                `DESCRIPTION:${escapeIcsString(`Vamos celebrar o primeiro aninho do ${aniversariante.nome}! ${evento.observacoes}`)}`,
                `LOCATION:${escapeIcsString(`${evento.local.nome}, ${evento.local.endereco}`)}`,
                'END:VEVENT', 'END:VCALENDAR'
            ].join('\r\n');
            triggerDownload(`festa-${aniversariante.nome.toLowerCase()}.ics`, 'text/calendar;charset=utf-8', icsContent);
        },
        setupMicrointeractions() {
            document.querySelectorAll('.btn').forEach(button => button.addEventListener('click', this.createRipple));
            document.body.addEventListener('click', (e) => { if (!e.target.closest('a, button, input, select, textarea')) this.createClickBubbles(e.clientX, e.clientY); });
            this.elements.easterEgg.addEventListener('click', () => {
                this.elements.bubbleSound.currentTime = 0;
                this.elements.bubbleSound.play();
                this.createClickBubbles(this.elements.easterEgg.getBoundingClientRect().left, this.elements.easterEgg.getBoundingClientRect().top);
            });
        },
        createRipple(event) {
            const button = event.currentTarget;
            const circle = document.createElement("span");
            const diameter = Math.max(button.clientWidth, button.clientHeight);
            circle.style.width = circle.style.height = `${diameter}px`;
            circle.style.left = `${event.clientX - button.getBoundingClientRect().left - (diameter / 2)}px`;
            circle.style.top = `${event.clientY - button.getBoundingClientRect().top - (diameter / 2)}px`;
            circle.classList.add("ripple");
            const existingRipple = button.querySelector(".ripple");
            if (existingRipple) existingRipple.remove();
            button.appendChild(circle);
        },
        createClickBubbles(x, y) {
            const container = document.querySelector('.bubbles-container');
            for (let i = 0; i < 5; i++) {
                const bubble = document.createElement('div');
                bubble.className = 'bubble';
                const size = Math.random() * 20 + 10;
                bubble.style.width = `${size}px`; bubble.style.height = `${size}px`;
                bubble.style.left = `${x + (Math.random() * 40 - 20)}px`;
                bubble.style.top = `${y + (Math.random() * 40 - 20)}px`;
                bubble.style.animationDuration = `${Math.random() * 2 + 1}s`;
                bubble.style.animationDelay = `${Math.random() * 0.2}s`;
                bubble.addEventListener('animationend', () => bubble.remove());
                container.appendChild(bubble);
            }
        },
        setupScrollLinks() {
            this.elements.ctaScrolls.forEach(link => {
                link.addEventListener('click', (e) => {
                    if (link.classList.contains('disabled')) {
                        e.preventDefault();
                        return;
                    }
                    e.preventDefault();
                    const targetId = link.getAttribute('href');
                    document.querySelector(targetId).scrollIntoView({ behavior: 'smooth' });
                });
            });
        },
        setupContactButton() {
            const { contato } = window.AppConfig;
            if (!contato || !contato.numero) {
                this.elements.contactLink.parentElement.hidden = true;
                return;
            }
            if (contato.tipo === 'whatsapp') {
                const mensagemCodificada = encodeURIComponent(contato.mensagemPadrao);
                const url = `https://wa.me/${contato.numero}?text=${mensagemCodificada}`;
                this.elements.contactLink.href = url;
                this.elements.contactLink.textContent = 'Fale conosco via WhatsApp';
            } else if (contato.tipo === 'telefone') {
                this.elements.contactLink.href = `tel:${contato.numero}`;
                this.elements.contactLink.textContent = 'Ligue para nós';
            }
        },
    };
    ui.init();
});