/*CALCULO DO MÊS EM QUE O EMPRÉSTIMO FOI CONTRATADO. O CÓDIGO OBTÉM A DATA ATUAL E SUBTRAI A QUANTIDADE DE PARCELAS PAGAS,
COMO SE ESITVÉSSEMOS CONTANDO OS MESES DE TRÁS PARA FRENTE, PRATICAMENTE "VOLTANDO NO TEMPO"
DATA ATUAL - QUANTIDADE DE MESES PASSADOS/PARCELAS PAGAS*/

function subtractMonthsFromDate(date, months){ //Função que subtrai os meses da data atual
    let dataAtual = new Date(date);
    dataAtual.setMonth(dataAtual.getMonth() - months);

    return dataAtual;
}

//SUBSTITUIR PELO INPUT
const proximaParcela = document.getElementById('parcela-restante').value;//Usará a quantidade de parcelas pagas para calcular quando o empréstimo foi contratado
const parcelasPagas = proximaParcela - 1; //O excon mostra a próxima parcela, portanto, devemos subtrair 1 para obter a quantidade de parcelas já pagas

let dataAtual = new Date();//Obtém data atual
let dataContratacao = subtractMonthsFromDate(dataAtual, parcelasPagas)//Faz a "volta no tempo"
let dataISO = dataContratacao.toISOString().split('T')[0]; //Converte para o formato YYYY-MM-DD


//SELECIONA INSTITUIÇÃO E OBTEM ISPB
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



//ESSA FUNÇÃO CONSTRÓI A URL, QUE IRÁ PROVER UM ARQUIVO JSON A SER LIDO PELO CÓDIGO
function construirURL(cnpj, dataInicio){
    const baseURL = 'https://olinda.bcb.gov.br/olinda/servico/taxaJuros/versao/v2/odata/TaxasJurosDiariaPorInicioPeriodo?$format=json&';
    const filtros = `$filter=cnpj8 eq '${cnpj}' and Modalidade eq 'Crédito pessoal consignado público - Pré-fixado' and InicioPeriodo eq '${dataInicio}'`;
    
    return `${baseURL}${filtros}`;
}

//OBTÉM OS DADOS DO JSON OBTIDO PELA URL ACIMA, CONSIDERANDO OS INPUTS DO USUÁRIO
async function obterDadosBacen(){ //Como fetch é assíncrono, é necessário aguardar a resposta antes de continuar
    const url = construirURL(ispb, dataISO);
    try{
        const response = await fetch(url);
        if (!response.ok){
            throw new Error("Network response was not ok " + response.statusText);
        }

        const data = await response.json();
        if (data.value && data.value.length > 0){
            const taxa = data.value[0].TaxaJurosAoMes;
            document.getElementById("taxa").textContent = 'Taxa no período: ' + taxa.toFixed(2).toString().replace('.',',') + '%';
            return taxa;
        } else {
            console.log("Nenhum dado retornado");
            document.getElementById("taxa").textContent = 'Sem taxa disponível para o período.';
            return null;
        }
    } catch (error) {
        console.log("Houve um problema com a requisição fetch: ", error);
    }
};

function formatarValor(input){
    let valor = input.value.replace(/\D/g, '');
    let valorNumero = parseFloat(valor);

    if (!isNaN(valorNumero)){
        let valorFormatado = valorNumero/100;
        input.value = 'R$ ' + valorFormatado.toLocaleString('pt-br', {minimumFractionDigits:2, maximumFractionDigits:2});
    } else {
        input.value = 'R$ 0,00';
    }

}

/****************CALCULA O VALOR QUE FOI LIBERADO NO ATO DA CONTRATAÇÃO**************************************/

document.getElementById("calcular").addEventListener("click", function(){
    const valorPrestacaoStr = document.getElementById('valor-parcela').value.replace('R$','').replace('.','').replace(',','.');
    const valorPrestacao = parseFloat(valorPrestacaoStr)
    const qtdeParcelas = document.getElementById('qtde-parcela').value;
    const tempoRestante = qtdeParcelas - parcelasPagas;



    obterDadosBacen().then(taxa =>{  //Espera a função obterDadosBacen() rodar e retornar resultado
        if (taxa !== null){
            function calculaValorLiberado(parcela, tempo, taxa){
                //FORMULA: VF = (1-(1+i)^-n/j)*p Fonte: https://www3.bcb.gov.br/CALCIDADAO/publico/exibirMetodologiaFinanciamentoPrestacoesFixas.do?method=exibirMetodologiaFinanciamentoPrestacoesFixas
                let taxaDecimal = taxa/100;
                let valorFinanciado = ((1 - Math.pow((1+taxaDecimal), -tempo)) / taxaDecimal) * parcela;
                return valorFinanciado;
            }
            let valorLiberado = calculaValorLiberado(valorPrestacao, qtdeParcelas, taxa);
            let valorLiberadoFormatado = valorLiberado.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2});
            document.getElementById("valor-liberado").textContent = 'Valor liberado: R$ ' +  valorLiberadoFormatado;

            /**************************CALCULADORA DE VALOR PRESENTE, DESCONTANDO PARCELAS JÁ PAGAS*************************/
            function calculaValorPresente(parcela, tempo, taxa){
                //FÓRMULA: VP = M/i * (1-1/(1+i)^n) + VF/(1+i)^n
                let txDec = taxa/100;
                let valorPresente = parcela*((1-Math.pow(1+txDec, -tempo))/txDec);
                return valorPresente;
            }
            let saldoDevedor = calculaValorPresente(valorPrestacao, tempoRestante, taxa);
            let saldoDevedorFormatado = saldoDevedor.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2});
            document.getElementById("saldo-devedor").textContent = 'Saldo devedor: R$ ' +  saldoDevedorFormatado;
        };
    })
})





