let ispb;

fetch("./static/json/ispb.json")
    .then(res => res.json())
    .then(data => {
        const select = document.getElementById("instituicao");

        const optionInicial = document.createElement("option");
        optionInicial.value = "";
        optionInicial.textContent = "--SELECIONE UMA INSTITUIÇÃO--";
        optionInicial.disabled = true;
        optionInicial.selected = true;
        select.appendChild(optionInicial);

        data.forEach(item => {
            const option = document.createElement('option');
            option.value = item.ISPB;
            option.textContent = item.Nome_Extenso;
            select.appendChild(option);
        });
    
        $(select).select2({
            width: '100%',
            placeholder: "Selecione uma instituição",
            allowClear: true
        }).on('change', function(){
            ispb = $(this).val();
            console.log('ISPB Selecionado: ', ispb);
        });
    })
    .catch(error => console.error('Erro ao carregar JSON: ', error));

const selectElement = document.getElementById('instituicao');

function formatarValor(input) {
    let valor = input.value.replace(/\D/g, '');
    let valorNumero = parseFloat(valor);

    if (!isNaN(valorNumero)){
        let valorFormatado = valorNumero / 100;
        input.value = 'R$ ' + valorFormatado.toLocaleString('pt-br', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    } else {
        input.value = 'R$ 0,00';
    }
}

/****************CALCULA O VALOR QUE FOI LIBERADO NO ATO DA CONTRATAÇÃO**************************************/

document.getElementById("calcular").addEventListener("click", function() {
    const valorPrestacaoStr = document.getElementById('valor-parcela').value.replace('R$', '').replace('.', '').replace(',', '.');
    const valorPrestacao = parseFloat(valorPrestacaoStr);
    const qtdeParcelas = document.getElementById('qtde-parcela').value;

    if (qtdeParcelas <= 0){
        alert("Número de parcelas deve ser superior a zero.")
    }


    function subtractMonthsFromDate(date, months) {
        let dataAtual = new Date(date);
        dataAtual.setMonth(dataAtual.getMonth() - months);
        return dataAtual;
    }

    const proximaParcela = document.getElementById('parcela-restante').value;
    const parcelasPagas = proximaParcela - 1;

    if (qtdeParcelas <= parcelasPagas){
        alert('A quantidade total de parcelas não pode ser menor que o número de parcelas pagas.')
    };

    let dataAtual = new Date();
    let dataContratacao = subtractMonthsFromDate(dataAtual, parcelasPagas);
    console.log('Contratado em: ', dataContratacao.toISOString().split('T')[0]);

    const tempoRestante = qtdeParcelas - parcelasPagas;
    document.getElementById('parcelas-em-ser').textContent = `Parcelas restantes: ${tempoRestante}`;

    function construirURL(cnpj, dataInicio) {
        const baseURL = 'https://olinda.bcb.gov.br/olinda/servico/taxaJuros/versao/v2/odata/TaxasJurosDiariaPorInicioPeriodo?$format=json&';
        const filtros = `$filter=cnpj8 eq '${cnpj}' and Modalidade eq 'Crédito pessoal consignado público - Pré-fixado' and InicioPeriodo eq '${dataInicio}'`;
        return `${baseURL}${filtros}`;
    }

    // Função para obter dados e ajustar a data até encontrar resultados
    async function obterDadosBacen() {
        const primeiroDiaDoMes = new Date(dataContratacao.getFullYear(), dataContratacao.getMonth(), 1);
        const ultimoDiaDoMes = new Date(dataContratacao.getFullYear(), dataContratacao.getMonth() + 1, 0); // Último dia do mês

        let diaAtual = primeiroDiaDoMes;

        while (diaAtual <= ultimoDiaDoMes) {
            document.getElementById("taxa").textContent = 'Verificando, aguarde...';
            const url = construirURL(ispb, diaAtual.toISOString().split('T')[0]);
            try {
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error("Network response was not ok " + response.statusText);
                }

                const data = await response.json();
                if (data.value && data.value.length > 0) {
                    const taxa = data.value[0].TaxaJurosAoMes;
                    document.getElementById("taxa").textContent = 'Taxa no período: ' + taxa.toFixed(2).toString().replace('.', ',') + '%';
                    return taxa; // Retorna a taxa encontrada
                } else {
                    console.log("Nenhum dado retornado para a data: ", diaAtual.toISOString().split('T')[0]);
                }
            } catch (error) {
                console.log("Houve um problema com a requisição fetch: ", error);
                break; // Sai do loop se houver erro
            }

            diaAtual.setDate(diaAtual.getDate() + 1); // Avança para o próximo dia
        }

        // Se não encontrar nenhuma taxa, atualiza a UI e dá opção de mostrar popup de ajuda
     
        var HTML = '<a href="#" id="taxaLink">Sem taxa disponível para o período. ⓘ</a>'
        document.getElementById("taxa").innerHTML = HTML;

        document.getElementById("taxaLink").addEventListener("click", function(event){
            event.preventDefault();
            openDialog();
        })

        function openDialog(){
            document.getElementById("taxaDialog").showModal();
        }

        document.getElementById("closeDialog").addEventListener("click", function(){
            document.getElementById("taxaDialog").close();
        })
        return null;
    };

    obterDadosBacen().then(taxa => {
        if (taxa !== null) {
            function calculaValorLiberado(parcela, tempo, taxa) {
                let taxaDecimal = taxa / 100;
                let valorFinanciado = ((1 - Math.pow((1 + taxaDecimal), -tempo)) / taxaDecimal) * parcela;
                return valorFinanciado;
            }
            let valorLiberado = calculaValorLiberado(valorPrestacao, qtdeParcelas, taxa);
            let valorLiberadoFormatado = valorLiberado.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2});
            document.getElementById("valor-liberado").textContent = 'Valor liberado: R$ ' + valorLiberadoFormatado;

            /**************************CALCULADORA DE VALOR PRESENTE, DESCONTANDO PARCELAS JÁ PAGAS*************************/
            function calculaValorPresente(parcela, tempo, taxa) {
                let txDec = taxa / 100;
                let valorPresente = parcela * ((1 - Math.pow(1 + txDec, -tempo)) / txDec);
                return valorPresente;
            }
            let saldoDevedor = calculaValorPresente(valorPrestacao, tempoRestante, taxa);
            let saldoDevedorFormatado = saldoDevedor.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2});
            document.getElementById("saldo-devedor").textContent = 'Saldo devedor: R$ ' + saldoDevedorFormatado;
        }
    });
});
