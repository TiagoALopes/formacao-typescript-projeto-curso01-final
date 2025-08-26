import { Armazenador } from "./Armazenador.js";
import { ValidaDebito, ValidaDeposito } from "./Decorators.js";
import { GrupoTransacao } from "./GrupoTransacao.js";
import { ResumoTransacoes } from "./ResumoTransacao.js";
import { TipoTransacao } from "./TipoTransacao.js";
import { Transacao } from "./Transacao.js";

export class Conta {
    protected nome: String = "";
    protected saldo: number = Armazenador.obter<number>("saldo") || 0;
    private transacoes: Transacao[] = Armazenador.obter<Transacao[]>(("transacoes"), (key: string, value: any) => {
        if (key === "data") {
            return new Date(value);
        }
        return value;
    }) || [];

    constructor(nome: string) {
        this.nome = nome;
    }

    public getTitular(): String{
        return this.nome;
    }

    public getSaldo(): number {
        return this.saldo;
    }

    public getDataAcesso(): Date {
        return new Date();
    }

    public registrarTransacao(novaTransacao: Transacao): void {
        if (novaTransacao.tipoTransacao == TipoTransacao.DEPOSITO) {
            this.depositar(novaTransacao.valor);
        } 
        else if (novaTransacao.tipoTransacao == TipoTransacao.TRANSFERENCIA || novaTransacao.tipoTransacao == TipoTransacao.PAGAMENTO_BOLETO) {
            this.debitar(novaTransacao.valor);
            novaTransacao.valor *= -1;
        } 
        else {
            throw new Error("Tipo de Transação é inválido!");
        }

        this.transacoes.push(novaTransacao);
        console.log(this.getGrupoTransacoes());
        Armazenador.salvar("transacoes", JSON.stringify(this.transacoes));
    }

    @ValidaDebito
    debitar(valor: number): void {
        this.saldo -= valor;
        Armazenador.salvar("saldo", this.saldo.toString());
    }

    @ValidaDeposito
    private depositar(valor: number): void {
        this.saldo += valor;
        Armazenador.salvar("saldo", this.saldo.toString());
    }

    public getGrupoTransacoes(): GrupoTransacao[] {
        const gruposTransacoes: GrupoTransacao[] = []; //inicia vazio;
        const listaTransacoes: Transacao[] = structuredClone(this.transacoes);
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
    }

    public getResumoTransacao(): void{
        let resumoTransacoes: ResumoTransacoes = {
            totalDepositos: 0,
            totalTransferencias: 0,
            totalPagamentosBoleto: 0
        };

        let totalDepositos: number = 0;
        let totalTransferencias: number = 0;
        let totalPagamentosBoleto: number = 0;

        for (let transacao of this.transacoes) {
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

export class ContaPremium extends Conta {
    public registrarTransacao(novaTransacao: Transacao): void {
        if (novaTransacao.tipoTransacao === TipoTransacao.DEPOSITO){
            console.log("Ganhou um bônus de 0.50 centavos!");
            novaTransacao.valor += 0.50;
        }

        super.registrarTransacao(novaTransacao);
    }
}

const conta = new Conta("Joana da Silva Oliveira");
const contaPremium = new ContaPremium("Tiago da Silva Oliveira");

export default conta;