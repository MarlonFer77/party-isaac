const AppConfig = {
  // === DADOS DO EVENTO ===
  aniversariante: {
    nome: "Isaac",
    idade: 1,
  },
  evento: {
    data: "14 de Setembro de 2025, às 13h00",
    dataISO: "2025-09-14T13:00:00", // Formato para o countdown
    local: {
      nome: "Espaço de Festas Paraísol",
      endereco: "Av. Monsenhor Solano Dantas de Menezes, 465, Heliópolis - Belford Roxo, RJ",
      googleMapsLink: "https://maps.app.goo.gl/ibE6iAtiJvyk83JT6",
    },
    observacoes: "Presentes são opcionais, sua presença é o maior tesouro! Teremos um espaço seguro e divertido para os pequenos marinheiros.",
  },
  contato: {
    // Usado para o botão de contato/dúvidas
    // Tipos podem ser 'whatsapp' ou 'telefone'
    tipo: 'whatsapp', 
    numero: '5521975070872', // Apenas números com código do país e DDD
    mensagemPadrao: 'Olá! Tenho uma dúvida sobre a festa de 1 ano do Isaac.',
  },

  // === MÍDIA ===
  media: {
    // Coloque os arquivos nas pastas /public/assets/img e /public/assets/video
    fotos: [
      "foto_isaac_sorrindo.jpg",
      "foto_ensaio_01.jpg",
      "foto_familia_01.jpg",
      "foto_detalhe_pezinho.jpg",
      "foto_isaac_engatinhando.jpg",
      "foto_familia_02.jpg",
    ],
    videos: [

    ],
  },
  
  // === CONFIGURAÇÕES DO ADMINISTRADOR ===
  admin: {
    user: "isaac",
    pass: "300824", // Senha simples para controle de acesso local
  },

  // === CONFIGURAÇÕES DO RSVP ===
  rsvp: {
    chaveSecreta: "isaacfaz1", 
  },
  api: {
  url: 'https://sheetdb.io/api/v1/p1x0ag8rxqetn'
}
};

// Tornar a configuração acessível globalmente de forma segura
window.AppConfig = AppConfig;