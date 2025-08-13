import { TipoTransacao } from "./TipoTransacao.js";
let saldo = JSON.parse(localStorage.getItem("saldo")) || 0; //inicia com valor 0;
const transacoes = JSON.parse(localStorage.getItem("transacoes"), (key, value) => {
    if (key === "data") {
        return new Date(value);
    }
    return value;
}) || [];
let quantidadeTransacoes = JSON.parse(localStorage.getItem("quantidadeTransacoes")) || 0; //inicia com valor 0;
function debitar(valor) {
    if (valor <= 0) {
        throw new Error("O valor a ser debitado deve ser maior que zero!");
    }
    if (valor > saldo) {
        throw new Error("Saldo insuficiente para realizar a transação!");
    }
    saldo -= valor;
    localStorage.setItem("saldo", saldo.toString());
}
function depositar(valor) {
    if (valor <= 0) {
        throw new Error("O valor a ser depositado deve ser maior que zero!");
    }
    saldo += valor;
    localStorage.setItem("saldo", saldo.toString());
}
const Conta = {
    getSaldo() {
        return saldo;
    },
    getDataAcesso() {
        return new Date();
    },
    getGrupoTransacoes() {
        const gruposTransacoes = []; //inicia vazio;
        const listaTransacoes = structuredClone(transacoes);
        const transacoesOrdenadas = 
        // Ordena as transações por data, do mais recente para o mais antigo 
        listaTransacoes.sort((t1, t2) => t2.data.getTime() - t1.data.getTime());
        // Ordena as transações por data, do mais antigo para o mais recente
        //listaTransacoes.sort((t1, t2) => t1.data.getTime() - t2.data.getTime());
        let labelAtualGrupoTransacao = "";
        for (let transacao of transacoesOrdenadas) {
            let labelGrupoTransacao = transacao.data.toLocaleDateString("pt-BR", {
                month: "long",
                year: "numeric"
            });
            if (labelAtualGrupoTransacao !== labelGrupoTransacao) {
                labelAtualGrupoTransacao = labelGrupoTransacao;
                gruposTransacoes.push({
                    label: labelAtualGrupoTransacao,
                    transacoes: []
                });
            }
            gruposTransacoes.at(-1).transacoes.push(transacao);
        }
        return gruposTransacoes;
    },
    registrarTransacao(novaTransacao) {
        if (novaTransacao.tipoTransacao == TipoTransacao.DEPOSITO) {
            depositar(novaTransacao.valor);
        }
        else if (novaTransacao.tipoTransacao == TipoTransacao.TRANSFERENCIA || novaTransacao.tipoTransacao == TipoTransacao.PAGAMENTO_BOLETO) {
            debitar(novaTransacao.valor);
            novaTransacao.valor *= -1;
        }
        else {
            throw new Error("Tipo de Transação é inválido!");
        }
        transacoes.push(novaTransacao);
        console.log(this.getGrupoTransacoes());
        localStorage.setItem("transacoes", JSON.stringify(transacoes));
    },
    getResumoTransacao() {
        let resumoTransacoes = {
            totalDepositos: 0,
            totalTransferencias: 0,
            totalPagamentosBoleto: 0
        };
        let totalDepositos = 0;
        let totalTransferencias = 0;
        let totalPagamentosBoleto = 0;
        for (let transacao of transacoes) {
            if (transacao.tipoTransacao === TipoTransacao.DEPOSITO) {
                resumoTransacoes.totalDepositos += transacao.valor;
            }
            else if (transacao.tipoTransacao === TipoTransacao.TRANSFERENCIA) {
                resumoTransacoes.totalTransferencias += transacao.valor;
            }
            else if (transacao.tipoTransacao === TipoTransacao.PAGAMENTO_BOLETO) {
                resumoTransacoes.totalPagamentosBoleto += transacao.valor;
            }
        }
        console.log(resumoTransacoes);
    }
};
export default Conta;
