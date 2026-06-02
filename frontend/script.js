let BANCO_RESERVAS = [];
let USUARIO_LOGADO = null;
let BANCO_CARROS = [];

async function carregarCarrosDoBanco() {
    try {
        const resposta = await fetch('http://localhost:3000/veiculos');
        const dados = await resposta.json();
        
        if (Array.isArray(dados)) {
            BANCO_CARROS = dados;
        } else if (dados.carros && Array.isArray(dados.carros)) {
            BANCO_CARROS = dados.carros;
        } else {
            BANCO_CARROS = []; 
        }

        renderizarCatalogo();
        
    } catch (erro) {
        console.error("Erro ao buscar os carros do back-end:", erro);
        BANCO_CARROS = []; 
        renderizarCatalogo();
        alert("Não foi possível conectar ao servidor. O Back-end está rodando?");
    }
}        

async function efetuarLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const senha = document.getElementById('loginSenha').value.trim();

    if (!email || !senha) {
        alert("Erro: Preencha todos os campos para autenticar.");
        return;
    }

    try {
        const resposta = await fetch('http://localhost:3000/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email, senha: senha })
        });

        const dados = await resposta.json();

        if (resposta.ok) {
            
            USUARIO_LOGADO = { 
                id: dados.id,
                nome: dados.nome, 
                nivel: dados.nivel 
            };
            
            localStorage.setItem('usuarioLogado', JSON.stringify(USUARIO_LOGADO));

            document.getElementById('tela-login').classList.remove('active');
            document.getElementById('cabecalho-sistema').style.display = 'flex';
            document.getElementById('nomeUsuarioLogado').innerText = `👤 ${USUARIO_LOGADO.nome} (${USUARIO_LOGADO.nivel})`;

            if (USUARIO_LOGADO.nivel === 'Admin') {
                document.getElementById('btn-adm').style.display = 'inline-block';
                carregarReservasDoBanco(); 
            } else {
                document.getElementById('btn-adm').style.display = 'none';
            }

            if (typeof carregarCarrosDoBanco === 'function') {
                carregarCarrosDoBanco(); 
            }

            alternarTela('catalogo');

        } else {
            alert(`Erro: ${dados.mensagem}`);
        }

    } catch (erro) {
        console.error('Erro ao comunicar com a API de login:', erro);
        alert('Erro ao conectar com o servidor. Verifique se o Back-end está rodando.');
    }
}

function efetuarLogout() {
    USUARIO_LOGADO = null;
    document.getElementById('cabecalho-sistema').style.display = 'none';
    
    document.querySelectorAll('.tela').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('header nav button').forEach(b => b.classList.remove('active'));
    
    document.getElementById('btn-cat').classList.add('active');
    document.getElementById('tela-login').classList.add('active');
    
    document.getElementById('loginEmail').value = '';
    document.getElementById('loginSenha').value = '';
}

function alternarTela(telaNome) {
    document.querySelectorAll('.tela').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('header nav button').forEach(b => b.classList.remove('active'));
    
    document.getElementById('tela-' + telaNome).classList.add('active');
    
    if(telaNome === 'catalogo') {
        document.getElementById('btn-cat').classList.add('active');
        renderizarCatalogo();
    }
    if(telaNome === 'historico') {
        document.getElementById('btn-his').classList.add('active');
        renderizarHistorico();
    }
    if(telaNome === 'admin') {
        document.getElementById('btn-adm').classList.add('active');
        renderizarGerenciadorFrota();
    }
}

function renderizarCatalogo() {
    const container = document.getElementById('listaCarrosContainer');
    
    if (!container) return; 
    
    container.innerHTML = '';

    if (!Array.isArray(BANCO_CARROS)) {
        console.error("Alerta: BANCO_CARROS não é uma lista válida.", BANCO_CARROS);
        container.innerHTML = '<p style="text-align:center; padding: 20px;">Nenhum veículo disponível no momento ou erro de conexão.</p>';
        return; 
    }

    BANCO_CARROS.forEach(carro => {
        const preco = parseFloat(carro.valor_diaria || 0);

        const imagem = carro.img || 'https://via.placeholder.com/300x180?text=Sem+Foto';
        const statusReal = carro.status ? carro.status.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "") : '';
        const podeReservar = statusReal === 'disponivel';

        let statusTexto = "Disponível";
        if (statusReal === 'alugado') statusTexto = "Alugado";
        if (statusReal === 'manutencao') statusTexto = "Em Manutenção";

        const card = document.createElement('div');
        card.className = 'card-carro';

        card.innerHTML = `
            <img src="${imagem}" class="img-carro" alt="${carro.marca} ${carro.modelo}">
            <div class="conteudo-carro">
                <div style="font-size:18px; font-weight:bold;">${carro.marca} ${carro.modelo}</div>
                <span class="badge ${podeReservar ? 'disponivel' : 'indisponivel'}">${statusTexto}</span>
                <p style="font-size:13px; color:#666;">Ano: ${carro.ano} | Placa: ${carro.placa}</p>
                <div class="preco">${preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} <span style="font-size:12px; font-weight:normal; color:#666;">/dia</span></div>
                
                <button class="btn-acao" ${podeReservar ? '' : 'disabled'} onclick="abrirFormularioReserva(${carro.id}, '${carro.marca} ${carro.modelo}', ${preco})">
                    ${podeReservar ? 'Reservar' : 'Indisponível'}
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

function renderizarGerenciadorFrota() {
    const tbody = document.getElementById('tabelaGerenciarFrotaBody');
    tbody.innerHTML = '';

    BANCO_CARROS.forEach(carro => {
        const tr = document.createElement('tr');
        
        let statusBadge = '';
        let acaoBotao = '';

        if (carro.status === 'Disponivel') {
            statusBadge = `<span class="badge disponivel">Disponível</span>`;
            acaoBotao = `<button class="btn-table" style="background-color: #e74c3c;" onclick="alterarStatusCarro(${carro.id}, 'manutencao')">🔧 Pôr em Manutenção</button>`;
        } else if (carro.status === 'Manutencao') {
            statusBadge = `<span class="badge manutencao">Em Manutenção</span>`;
            acaoBotao = `<button class="btn-table" style="background-color: #2e7d32;" onclick="alterarStatusCarro(${carro.id}, 'disponivel')">✅ Liberar p/ Frota</button>`;
        } else if (carro.status === 'Alugado') {
            statusBadge = `<span class="badge alugado">Alugado</span>`;
            acaoBotao = `<span style="color: #777; font-size: 13px; font-style: italic;">Carro em trânsito</span>`;
        }

        const botaoExcluir = `<button class="btn-table" style="background-color: #2c3e50; margin-left: 5px;" onclick="deletarCarro(${carro.id})">🗑️ Excluir</button>`;

        tr.innerHTML = `
            <td><b>${carro.marca} ${carro.modelo}</b> <br><small style="color:#777;">Ano: ${carro.ano}</small></td>
            <td><code>${carro.placa}</code></td>
            <td>${statusBadge}</td>
            <td>${acaoBotao} ${botaoExcluir}</td>
        `;
        tbody.appendChild(tr);
    });
}
    
async function alterarStatusCarro(idCarro, novoStatus) {
    const carro = BANCO_CARROS.find(c => c.id === idCarro);
    if (!carro) return;

    const carroAtualizado = { ...carro, status: novoStatus };

    try {
        const resposta = await fetch(`http://localhost:3000/veiculos/${idCarro}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(carroAtualizado)
        });

        if (resposta.ok) {
            alert(`Sucesso: Estado do veículo ${carro.marca} atualizado no banco!`);
            carregarCarrosDoBanco(); 
        } else {
            alert("Erro ao atualizar o status no servidor.");
        }
    } catch (erro) {
        console.error("Erro ao atualizar status:", erro);
    }
}

function abrirFormularioReserva(id, nomeCarro, precoDiaria) {
    document.getElementById('reservaCarroId').value = id;
    
    const titulo = document.getElementById('reservaCarroTitulo');
    if(titulo) titulo.innerText = `Veículo Selecionado: ${nomeCarro}`;
    
    const inputPreco = document.getElementById('reservaPrecoDiaria');
    if(inputPreco) inputPreco.value = precoDiaria;

    const hoje = new Date().toISOString().split('T')[0];
    document.getElementById('dataRetirada').min = hoje;
    document.getElementById('dataDevolucao').min = hoje;

    alternarTela('reserva'); 
}

async function salvarNovaReserva() {
    const veiculoId = document.getElementById('reservaCarroId').value;
    const dataInicio = document.getElementById('dataRetirada').value;
    const dataFim = document.getElementById('dataDevolucao').value;
    const precoDiaria = parseFloat(document.getElementById('reservaPrecoDiaria').value || 0);

   const dataIda = new Date(dataInicio + 'T00:00:00').getTime();
    const dataVolta = new Date(dataFim + 'T00:00:00').getTime();
    
    const agora = new Date();
    const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate()).getTime();

    if (dataIda < hoje) {
        alert("⚠️ A data de retirada não pode ser anterior ao dia de hoje!");
        return;
    }

    if (dataVolta < dataIda) {
        alert("⚠️ A data de devolução não pode ser anterior à data de retirada!");
        return;
    }

    const diferencaTempo = Math.abs(dataVolta - dataIda);
    const diferencaDias = Math.ceil(diferencaTempo / (1000 * 60 * 60 * 24)) || 1; 
    const valorTotal = diferencaDias * precoDiaria;

    const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));
    const usuarioId = usuarioLogado ? usuarioLogado.id : 1; 

    const dadosReserva = {
        usuario_id: usuarioId,
        veiculo_id: parseInt(veiculoId),
        data_inicio: dataInicio,
        data_fim: dataFim,
        valor_total: valorTotal
    };

    try {
        const resposta = await fetch('http://localhost:3000/reservas', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dadosReserva)
        });

        const resultado = await resposta.json();
        if (resposta.ok) {
            alert(`🎉 ${resultado.mensagem || 'Reserva realizada com sucesso!'}\nTotal de ${diferencaDias} diárias: R$ ${valorTotal.toFixed(2)}`);
            
            document.getElementById('dataRetirada').value = '';
            document.getElementById('dataDevolucao').value = '';

            alternarTela('historico');
            
            if (typeof carregarReservasDoBanco === 'function') carregarReservasDoBanco();
            if (typeof carregarCarrosDoBanco === 'function') carregarCarrosDoBanco(); 
        } else {
            alert("Erro ao finalizar locação: " + (resultado.mensagem || resultado.erro));
        }

    } catch (erro) {
        console.error("Erro ao enviar reserva:", erro);
        alert("Não foi possível conectar ao servidor para concluir a locação.");
    }
}

function renderizarHistorico() {
    const tbody = document.getElementById('tabelaHistoricoBody');
    tbody.innerHTML = '';

    if(BANCO_RESERVAS.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#999;">Nenhuma reserva realizada ainda.</td></tr>`;
        return;
    }

    BANCO_RESERVAS.forEach(res => {
        const tr = document.createElement('tr');
        const badgeCor = res.status === 'Ativa' ? 'background:#e8f5e9; color:#2e7d32;' : 'background:#ffebee; color:#c62828;';
        const botaoBot = res.status === 'Ativa' 
            ? `<button onclick="cancelarReserva(${res.id})" style="background:#e74c3c; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer; font-weight:bold;">Cancelar</button>` 
            : `<span style="color:#999; font-size:13px;">Sem ações</span>`;

        const dInFormatada = res.retirada.split('-').reverse().join('/');
        const dOutFormatada = res.devolucao.split('-').reverse().join('/');

        tr.innerHTML = `
            <td>#00${res.id}</td>
            <td><b>${res.veiculo}</b></td>
            <td>${dInFormatada}</td>
            <td>${dOutFormatada}</td>
            <td style="color:#2e7d32; font-weight:bold;">${Number(res.total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
            <td><span style="${badgeCor} padding:3px 8px; border-radius:4px; font-size:12px; font-weight:bold;">${res.status}</span></td>
            <td>${botaoBot}</td>
        `;
        tbody.appendChild(tr);
    });
}

function cancelarReserva(idReserva) {
    if (confirm("Tem certeza que deseja cancelar esta reserva?")) {
        const reserva = BANCO_RESERVAS.find(r => r.id === idReserva);
        
        if (reserva) {
            reserva.status = "Cancelada";
            const carro = BANCO_CARROS.find(c => c.id === reserva.carroId);
            if (carro) {
                carro.status = "disponivel";
            }
            alert("Reserva cancelada com sucesso. O veículo voltou a ficar disponível no catálogo!");
            renderizarCatalogo();
            renderizarHistorico();
        }
    }
}

async function cadastrarCarroAdmin() {
    const marca = document.getElementById('addMarca').value;
    const modelo = document.getElementById('addModelo').value;
    const ano = document.getElementById('addAno').value;
    const placa = document.getElementById('addPlaca').value;
    const preco = document.getElementById('addPreco').value;
    let imgUrl = document.getElementById('addImg').value.trim();

    if(!marca || !modelo || !ano || !placa || !preco) {
        alert("Erro: Todos os campos do veículo são obrigatórios para cadastro.");
        return;
    }

    if (!imgUrl) {
        imgUrl = "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=500&q=80";
    }

    const novoVeiculo = {
        marca: marca,
        modelo: modelo,
        ano: parseInt(ano),
        placa: placa,
        valor_diaria: parseFloat(preco), 
        status: "Disponivel", 
        img: imgUrl 
    };

    try {
        const resposta = await fetch('http://localhost:3000/veiculos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(novoVeiculo)
        });

        if (resposta.ok) {
            alert(`Sucesso: ${marca} ${modelo} foi incluído no banco de dados!`);
            
            document.getElementById('addMarca').value = '';
            document.getElementById('addModelo').value = '';
            document.getElementById('addAno').value = '';
            document.getElementById('addPlaca').value = '';
            document.getElementById('addPreco').value = '';
            document.getElementById('addImg').value = ''; 

            carregarCarrosDoBanco();
            alternarTela('catalogo');
        } else {
            alert("Erro ao cadastrar o veículo no servidor.");
        }
    } catch (erro) {
        console.error("Erro na requisição:", erro);
    }
}

async function deletarCarro(idCarro) {
    const confirmacao = confirm("Tem certeza que deseja excluir permanentemente este veículo?");
    if (!confirmacao) return; 

    try {
        const resposta = await fetch(`http://localhost:3000/veiculos/${idCarro}`, {
            method: 'DELETE'
        });

        if (resposta.ok) {
            alert("Sucesso: Veículo excluído do sistema!");
            carregarCarrosDoBanco(); 
        } else {
            const erro = await resposta.json();
            alert(`Aviso: ${erro.mensagem}`);
        }
    } catch (erro) {
        console.error("Erro ao excluir:", erro);
        alert("Falha na comunicação com o servidor.");
    }
}

async function carregarReservasDoBanco() {
    try {
        const resposta = await fetch('http://localhost:3000/reservas');
        if (!resposta.ok) throw new Error("Erro na resposta do servidor");

        const reservas = await resposta.json();
        const tbody = document.getElementById('tabelaReservasBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (!reservas || reservas.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:#777; padding: 20px;">📋 Nenhuma reserva encontrada.</td></tr>';
            return;
        }

        reservas.forEach(reserva => {
            const dataInicio = new Date(reserva.data_inicio).toLocaleDateString('pt-BR', {timeZone: 'UTC'});
            const dataFim = new Date(reserva.data_fim).toLocaleDateString('pt-BR', {timeZone: 'UTC'});
            
            let corStatus = '#95a5a6'; 
            if (reserva.status === 'Confirmada') corStatus = '#2ecc71'; 
            if (reserva.status === 'Concluida') corStatus = '#3498db'; 
            if (reserva.status === 'Cancelada') corStatus = '#e74c3c'; 
            if (reserva.status === 'Pendente') corStatus = '#f39c12';

            let botoesAcao = '';
            if (reserva.status === 'Pendente') {
                botoesAcao = `
                    <button onclick="alterarStatusReserva(${reserva.id}, 'Confirmada')" style="background:#2ecc71; color:white; border:none; padding:6px 10px; border-radius:4px; cursor:pointer; font-size:12px; font-weight:bold; margin-right:5px;">✅ Confirmar</button>
                    <button onclick="alterarStatusReserva(${reserva.id}, 'Cancelada')" style="background:#e74c3c; color:white; border:none; padding:6px 10px; border-radius:4px; cursor:pointer; font-size:12px; font-weight:bold;">❌ Cancelar</button>
                `;
            } else if (reserva.status === 'Confirmada') {
                botoesAcao = `
                    <button onclick="alterarStatusReserva(${reserva.id}, 'Concluida')" style="background:#3498db; color:white; border:none; padding:6px 10px; border-radius:4px; cursor:pointer; font-size:12px; font-weight:bold; margin-right:5px;">🏁 Concluir</button>
                    <button onclick="alterarStatusReserva(${reserva.id}, 'Cancelada')" style="background:#e74c3c; color:white; border:none; padding:6px 10px; border-radius:4px; cursor:pointer; font-size:12px; font-weight:bold;">❌ Cancelar</button>
                `;
            } else {
                botoesAcao = `<span style="color:#aaa; font-style: italic; font-size:12px;">Finalizada</span>`;
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>#${reserva.id}</td>
                <td><b>${reserva.cliente}</b></td>
                <td>${reserva.marca} ${reserva.modelo} <br><small style="color:#777;">(${reserva.placa})</small></td>
                <td>${dataInicio} - ${dataFim}</td>
                <td>${Number(reserva.valor_total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                <td><span style="background-color: ${corStatus}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">${reserva.status}</span></td>
                <td style="text-align: center;">${botoesAcao}</td> `;
            tbody.appendChild(tr);
        });
    } catch (erro) {
        console.error("Erro ao carregar reservas:", erro);
    }
}

async function alterarStatusReserva(id, novoStatus) {
    if (!confirm(`Tem certeza que deseja alterar o status da reserva #${id} para '${novoStatus}'?`)) {
        return;
    }

    try {
        const resposta = await fetch(`http://localhost:3000/reservas/${id}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: novoStatus })
        });

        const dados = await resposta.json();

        if (resposta.ok) {
            alert(dados.mensagem);
            carregarReservasDoBanco();
        } else {
            alert("Erro: " + dados.erro);
        }
    } catch (erro) {
        console.error("Erro ao atualizar status:", erro);
        alert("Não foi possível conectar ao servidor para alterar o status.");
    }
}

window.onload = carregarCarrosDoBanco;