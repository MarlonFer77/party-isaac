function sanitize(str) {
  if (!str) return '';
  return str.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function saveRsvp(rsvpData) {
  const payload = {
    id: `id-${Date.now()}`,
    timestamp: new Date().toISOString(),
    nome: sanitize(rsvpData.nome),
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

async function countTotals() {
    const rsvps = await listRsvps();
    return { confirmed: rsvps.length };
}

async function exportCSV() {
    const rsvps = await listRsvps();
    if (rsvps.length === 0) {
        alert("Nenhuma confirmação para exportar.");
        return;
    }

    const headers = "ID,Nome,Mensagem,Data da Confirmação\n";
    const rows = rsvps.map(r => 
        [
            r.id,
            `"${(r.nome || '').replace(/"/g, '""')}"`,
            `"${(r.mensagem || '').replace(/"/g, '""')}"`,
            new Date(r.timestamp).toLocaleString('pt-BR')
        ].join(',')
    ).join('\n');

    const csvContent = headers + rows;
    triggerDownload(csvContent, 'confirmacoes_festa.csv', 'text/csv');
}

async function exportJSON() {
    const rsvps = await listRsvps();
    if (rsvps.length === 0) {
        alert("Nenhuma confirmação para exportar.");
        return;
    }
    const jsonContent = JSON.stringify(rsvps, null, 2);
    triggerDownload(jsonContent, 'confirmacoes_festa.json', 'application/json');
}

function triggerDownload(content, fileName, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}