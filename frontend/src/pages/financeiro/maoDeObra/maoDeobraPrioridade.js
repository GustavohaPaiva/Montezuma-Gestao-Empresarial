import { isPago } from "../../fornecedores/fornecedorFinanceiro";
import { labelObraCliente } from "../materiais/materiaisPrioridade";

export { isPago, labelObraCliente };

function statusPagamentoItem(item) {
  return item?.status_pagamento ?? item?.status_financeiro;
}

export function resumirKpisMaoDeObra(maoDeObra = []) {
    let itensAbertos = 0
    let aPagar = 0;
    let totalLancado = 0;
    let pago = 0;
    for (const item of maoDeObra || []) {
        totalLancado += parseFloat(item.valor);
        if (item?.status_pagamento === 'Pago') {
            pago += parseFloat(item.valor) || "-";
        } else {
            aPagar += parseFloat(item.valor) || "-";
            itensAbertos ++
        }
    }
    return { aPagar, totalLancado, pago, itensAbertos };
}

export function agregarFinanceiroPrestador(itens = []) {
  let totalLancado = 0;
  let pago = 0;
  let itensAbertos = 0;

  for (const item of itens || []) {
    const val = parseFloat(item.valor) || 0;
    totalLancado += val;
    if (isPago(statusPagamentoItem(item))) {
      pago += val;
    } else {
      itensAbertos += 1;
    }
  }

  return {
    totalLancado,
    pago,
    aPagar: totalLancado - pago,
    itensAbertos,
  };
}

export function itensEmAbertoPrestador(itens = []) {
  return [...(itens || [])]
    .filter((item) => !isPago(statusPagamentoItem(item)))
    .sort((a, b) => {
      const obraDiff = labelObraCliente(a.obras).localeCompare(
        labelObraCliente(b.obras),
        "pt-BR",
      );
      if (obraDiff !== 0) return obraDiff;
      return String(a.id).localeCompare(String(b.id));
    });
}

export function prestadoresEmAberto(maoDeObra = []) {
    const porPrestador = new Map();

    for (const item of maoDeObra || []) {
        if (item?.status_pagamento === 'Aguardando pagamento') {    

            const id = item.prestador_id ?? item.prestadores?.id; 
            const key = String(id);

            if (id != null) {
                if (!porPrestador.has(key)) {
                    porPrestador.set(key, {
                        id,
                        nome: item.prestadores?.nome || "Prestador",
                        qtdItens: 0,
                        aPagar: 0,
                    });
                }
                
                const card =porPrestador.get(key);
                card.qtdItens ++;
                card.aPagar += parseFloat(item.valor) || 0;
            }
        }
    }
    return [...porPrestador.values()].sort((a, b) =>
        (a.nome || "").localeCompare(b.nome || "", "pt-BR"),
      );
}