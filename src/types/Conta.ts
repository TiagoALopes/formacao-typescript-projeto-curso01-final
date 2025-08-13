import { Transacao } from "./Transacao.js";
import { TipoTransacao } from "./TipoTransacao.js";
import { GrupoTransacao } from "./GrupoTransacao.js";
import { ResumoTransacoes } from "./ResumoTransacao.js";

let saldo: number = JSON.parse(localStorage.getItem("saldo")) || 0; //inicia com valor 0;
const transacoes: Transacao[] = JSON.parse(localStorage.getItem("transacoes"), (key: string, value: string) => {
    if (key === "data") {
        return new Date(value);
    }
    return value;
}) || [];
let quantidadeTransacoes: number = JSON.parse(localStorage.getItem("quantidadeTransacoes")) || 0; //inicia com valor 0;

function debitar(valor: number): void {
    if (valor <= 0) {
        throw new Error("O valor a ser debitado deve ser maior que zero!");
    }
    if (valor > saldo) {
        throw new Error("Saldo insuficiente para realizar a transação!");
    }
    saldo -= valor;
    localStorage.setItem("saldo", saldo.toString());
}

function depositar(valor: number): void {
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

    getDataAcesso(): Date {
        return new Date();
    },

    getGrupoTransacoes(): GrupoTransacao[]{
        const gruposTransacoes: GrupoTransacao[] = []; //inicia vazio;
        const listaTransacoes: Transacao[] = structuredClone(transacoes);
        const transacoesOrdenadas: Transacao[] =
            // Ordena as transações por data, do mais recente para o mais antigo 
            listaTransacoes.sort((t1, t2) => t2.data.getTime() - t1.data.getTime());
            // Ordena as transações por data, do mais antigo para o mais recente
            //listaTransacoes.sort((t1, t2) => t1.data.getTime() - t2.data.getTime());
        let labelAtualGrupoTransacao: string = "";

        for (let transacao of transacoesOrdenadas) {
            let labelGrupoTransacao: string = transacao.data.toLocaleDateString("pt-BR", {
                month: "long",
                year: "numeric"});
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

    registrarTransacao(novaTransacao: Transacao): void {
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

    getResumoTransacao(): void{

        let resumoTransacoes: ResumoTransacoes = {
            totalDepositos: 0,
            totalTransferencias: 0,
            totalPagamentosBoleto: 0
        };

        let totalDepositos: number = 0;
        let totalTransferencias: number = 0;
        let totalPagamentosBoleto: number = 0;

        for (let transacao of transacoes) {
            if (transacao.tipoTransacao === TipoTransacao.DEPOSITO) {
                resumoTransacoes.totalDepositos+= transacao.valor;
            } else if (transacao.tipoTransacao === TipoTransacao.TRANSFERENCIA) {
                resumoTransacoes.totalTransferencias += transacao.valor;
            }
            else if (transacao.tipoTransacao === TipoTransacao.PAGAMENTO_BOLETO) {
                resumoTransacoes.totalPagamentosBoleto += transacao.valor;
            }
        }
        
        console.log(resumoTransacoes);
    }
}

export default Conta;