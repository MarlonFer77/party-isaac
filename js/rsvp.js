/**
 * Helper para sanitizar strings, prevenindo injeção de HTML.
 * @param {string} str - A string a ser sanitizada.
 * @returns {string} - A string sanitizada.
 */
function sanitize(str) {
  if (!str) return '';
  return str.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Salva uma nova confirmação enviando os dados para a API do SheetDB.
 * @param {object} rsvpData - Os dados da confirmação.
 * @returns {Promise<object>} - Retorna uma promessa que resolve para { success: true } ou { success: false, message: '...' }.
 */
async function saveRsvp(rsvpData) {
  const payload = {
    id: `id-${Date.now()}`,
    timestamp: new Date().toISOString(),
    nome: sanitize(rsvpData.nome),
    acompanhantes: parseInt(rsvpData.acompanhantes) || 0,
    mensagem: sanitize(rsvpData.mensagem),
  };

  try {
    const response = await fetch(window.AppConfig.api.url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      const data = await response.json();
      if (data.created >= 1) {
        return { success: true };
      }
    }
    return { success: false, message: 'Não foi possível enviar sua confirmação. Tente novamente.' };
  } catch (error) {
    console.error('Erro de rede ao salvar RSVP:', error);
    return { success: false, message: 'Erro de conexão. Verifique sua internet e tente novamente.' };
  }
}

/**
 * Lista todas as confirmações buscando os dados da API.
 * @returns {Promise<Array>} - Uma promessa que resolve para um array de confirmações.
 */
async function listRsvps() {
  try {
    const response = await fetch(window.AppConfig.api.url);
    if (!response.ok) {
      console.error("Erro ao buscar RSVPs da API");
      return [];
    }
    return await response.json();
  } catch (error) {
    console.error('Erro de rede ao listar RSVPs:', error);
    return [];
  }
}

/**
 * Remove uma confirmação específica via API.
 * @param {string} id - O ID do RSVP a ser removido.
 */
async function deleteRsvp(id) {
    const url = `${window.AppConfig.api.url}/id/${id}`;
    try {
        const response = await fetch(url, { method: 'DELETE' });
        if (!response.ok) console.error("Erro ao deletar RSVP via API");
        return await response.json();
    } catch (error) {
        console.error('Erro de rede ao deletar RSVP:', error);
    }
}

/**
 * Calcula os totais de confirmações e convidados a partir dos dados da API.
 * @returns {Promise<object>}
 */
async function countTotals() {
    const rsvps = await listRsvps();
    const confirmed = rsvps.length;
    const guests = rsvps.reduce((acc, rsvp) => acc + parseInt(rsvp.acompanhantes || 0), 0);
    return { confirmed, guests, total: confirmed + guests };
}

/**
 * Prepara e aciona o download dos dados em formato CSV.
 */
async function exportCSV() {
    const rsvps = await listRsvps();
    if (rsvps.length === 0) {
        alert("Nenhuma confirmação para exportar.");
        return;
    }

    const headers = "ID,Nome,Acompanhantes,Mensagem,Data da Confirmação\n";
    const rows = rsvps.map(r => 
        [
            r.id,
            `"${(r.nome || '').replace(/"/g, '""')}"`,
            r.acompanhantes,
            `"${(r.mensagem || '').replace(/"/g, '""')}"`,
            new Date(r.timestamp).toLocaleString('pt-BR')
        ].join(',')
    ).join('\n');

    const csvContent = headers + rows;
    triggerDownload(csvContent, 'text/csv', 'confirmacoes_festa.csv');
}

/**
 * Prepara e aciona o download dos dados em formato JSON.
 */
async function exportJSON() {
    const rsvps = await listRsvps();
    if (rsvps.length === 0) {
        alert("Nenhuma confirmação para exportar.");
        return;
    }

    const jsonContent = JSON.stringify(rsvps, null, 2);
    triggerDownload(jsonContent, 'application/json', 'confirmacoes_festa.json');
}

/**
 * Helper genérico para acionar o download de um arquivo.
 * @param {string} content - O conteúdo do arquivo.
 * @param {string} mimeType - O tipo MIME do arquivo.
 * @param {string} fileName - O nome do arquivo para download.
 */
function triggerDownload(content, mimeType, fileName) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}