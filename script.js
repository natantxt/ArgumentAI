class ArgumentAI {
  constructor() {
    console.log("ArgumentAI iniciada.");
  }

  formatarResposta(resposta) {
    let textoFormatado = resposta;
    textoFormatado = textoFormatado.replace(/\*\*/g, '').replace(/\*/g, '');
    textoFormatado = textoFormatado.replace(/(Tese Principal:|Análise do Argumento \d:|Avaliação Geral da Argumentação:|Nota para a Força Argumentativa:)/g, '\n\n$1');
    textoFormatado = textoFormatado.replace(/(Argumento:|Repertório\/Evidência:|Análise Crítica:|Sugestão de Melhoria:)/g, '\n$1');
    textoFormatado = textoFormatado.replace(/\n{3,}/g, '\n\n');
    return textoFormatado.trim();
  }

  async analisarArgumentos() {
    // Esta função permanece a mesma da versão anterior, buscando e exibindo os dados.
    // Lógica para a página do professor
    const turmaInput = document.getElementById("turma");
    const alunoInput = document.getElementById("aluno");
    const turma = turmaInput ? turmaInput.value.trim() : null;
    const aluno = alunoInput ? alunoInput.value.trim() : null;
    
    const tema = document.getElementById("tema").value.trim();
    const redacao = document.getElementById("redacao").value.trim();
    const resultadoDiv = document.getElementById("resultado");
    const resultadoContainer = document.getElementById("resultado-container");
    const notaSpan = document.getElementById("nota");

    if (!tema || !redacao || (turmaInput && (!turma || !aluno))) {
      alert("Por favor, preencha todos os campos.");
      return;
    }

    this.toggleLoading(true);
    resultadoContainer.style.display = "none";
    resultadoDiv.innerText = "Analisando a estrutura argumentativa, aguarde...";

    try {
      const prompt = this.criarPrompt(tema, redacao);
      const respostaBruta = await this.enviarParaAPI(prompt);
      const respostaFormatada = this.formatarResposta(respostaBruta);
      
      resultadoDiv.innerText = respostaFormatada || "Não houve resposta da IA.";
      const notaMatch = respostaFormatada.match(/Nota para a Força Argumentativa:\s*(\d+)/);
      notaSpan.innerText = notaMatch ? notaMatch[1] : "N/A";
      
      if(turmaInput){ // Se for a página do professor, atualiza os dados do aluno
          document.getElementById("turma-resultado").innerText = turma;
          document.getElementById("aluno-resultado").innerText = aluno;
          document.getElementById("tema-resultado").innerText = tema;
          document.getElementById("data-resultado").innerText = new Date().toLocaleDateString("pt-BR");
      }

      resultadoContainer.style.display = "block";
    } catch (erro) {
      resultadoDiv.innerText = "Erro ao processar a análise: " + erro.message;
      resultadoContainer.style.display = "block";
    } finally {
      this.toggleLoading(false);
    }
  }

  criarPrompt(tema, redacao) {
    return `Você é um especialista em lógica e estrutura argumentativa, focado em analisar a qualidade dos argumentos em redações do ENEM. Ignore erros gramaticais e foque exclusivamente na construção argumentativa (Competência 3). Sua tarefa é dissecar a argumentação da redação do usuário sobre o tema "${tema}". Siga ESTRITAMENTE a estrutura de resposta abaixo:\n\n1. **Tese Principal:** Identifique e transcreva a tese central defendida na redação.\n\n2. **Análise do Argumento 1:**\n    * **Argumento:** Descreva o primeiro argumento principal usado para defender a tese.\n    * **Repertório/Evidência:** Cite o repertório sociocultural (filme, livro, fato histórico, etc.) usado para embasar este argumento.\n    * **Análise Crítica:** Avalie a força e a pertinência do argumento e do repertório. O argumento é claro? O repertório está bem conectado e desenvolve o argumento? É previsível ou autoral?\n    * **Sugestão de Melhoria:** Dê uma sugestão específica para fortalecer este argumento ou a conexão com o repertório.\n\n3. **Análise do Argumento 2:**\n    * **Argumento:** Descreva o segundo argumento principal.\n    * **Repertório/Evidência:** Cite o repertório sociocultural usado.\n    * **Análise Crítica:** Faça a mesma análise crítica do argumento 2.\n    * **Sugestão de Melhoria:** Dê uma sugestão específica para este segundo argumento.\n\n4. **Avaliação Geral da Argumentação:** Faça um parágrafo final comentando sobre a coerência geral, a progressão das ideias e a capacidade de persuasão do texto.\n\n5. **Nota para a Força Argumentativa:** Atribua uma nota de 0 a 200, baseada exclusivamente na seleção, relação e organização das informações para defender a tese (Critérios da Competência 3 do ENEM).\n\n---\nRedação do Usuário:\n${redacao}`;
  }

  async enviarParaAPI(prompt) {
    const urlDaApi = "https://argumentai.vercel.app/api/chat";
    const resposta = await fetch(urlDaApi, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", content: prompt }] })
    });
    if (!resposta.ok) {
        const erro = await resposta.json();
        throw new Error(erro.detalhes || "Erro na comunicação com a API");
    }
    const dados = await resposta.json();
    return dados.choices?.[0]?.message?.content;
  }

  toggleLoading(loading) {
    const loadingElement = document.getElementById("loading");
    // O ID dos botões pode variar, então buscamos ambos
    const analiseBtn = document.getElementById("analiseBtn") || document.querySelector('.btn-primary');
    const pdfBtn = document.getElementById("pdfBtn") || document.querySelector('.btn-secondary');

    if (loadingElement) loadingElement.style.display = loading ? "block" : "none";
    if(analiseBtn) analiseBtn.disabled = loading;
    if(pdfBtn) pdfBtn.disabled = loading;
  }

  baixarPDF() {
    const resultado = document.getElementById("resultado").innerText.trim();
    const tema = document.getElementById("tema").value.trim();
    
    // Identifica se está na página do professor
    const turmaInput = document.getElementById("turma");
    const alunoInput = document.getElementById("aluno");
    const turma = turmaInput ? turmaInput.value.trim() : null;
    const aluno = alunoInput ? alunoInput.value.trim() : null;

    if (!resultado || resultado.includes("aguarde") || resultado.includes("Analisando")) {
      alert("Nenhuma análise disponível para exportar.");
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // --- Nova Lógica de Layout ---
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const maxWidth = pageWidth - margin * 2;
    const lineHeight = 7;
    let y = margin; // Posição vertical inicial

    // Adiciona o cabeçalho
    doc.setFontSize(14);
    doc.text("Análise da Estrutura Argumentativa - ArgumentAI", margin, y);
    y += lineHeight * 1.5;

    doc.setFontSize(10);
    const hoje = new Date().toLocaleDateString("pt-BR");
    let infoLine = `Data: ${hoje} | Tema: ${tema}`;
    if (turma && aluno) {
      infoLine = `Aluno: ${aluno} | Turma: ${turma} | ${infoLine}`;
    }
    doc.text(infoLine, margin, y);
    y += lineHeight * 2; // Espaço após o cabeçalho
    
    // Adiciona o conteúdo principal
    doc.setFontSize(12);
    const linhas = doc.splitTextToSize(resultado, maxWidth);
    
    linhas.forEach(linha => {
      // Verifica se a próxima linha cabe na página atual
      if (y + lineHeight > pageHeight - margin) {
        doc.addPage(); // Adiciona uma nova página
        y = margin; // Reseta a posição Y para o topo da nova página
      }
      doc.text(linha, margin, y);
      y += lineHeight; // Move para a próxima linha
    });

    const nomeBase = aluno ? `Analise_ArgumentAI_${aluno.replace(/\s/g, '_')}` : `Analise_ArgumentAI`;
    doc.save(`${nomeBase}.pdf`);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.corretor = new ArgumentAI();
});