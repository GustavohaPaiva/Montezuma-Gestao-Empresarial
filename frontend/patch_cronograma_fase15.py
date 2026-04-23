from pathlib import Path

p = Path("src/components/obras/CronogramaObra.jsx")
s = p.read_text(encoding="utf-8")

s = s.replace(
    '  const [lancDesc, setLancDesc] = useState("");',
    '  const [lancDesc, setLancDesc] = useState("");\n  const [lancDataFim, setLancDataFim] = useState("");',
    1,
)
s = s.replace(
    "    setLancDesc(\"\");\n    setLancamentoAberto(true);",
    '    setLancDesc("");\n    setLancDataFim("");\n    setLancamentoAberto(true);',
    1,
)

old_epd = """  const eventosPorDia = useMemo(() => {
    const map = new Map();
    for (const ev of eventos) {
      const key = String(ev.data_evento).slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(ev);
    }
    return map;
  }, [eventos]);"""
new_epd = """  const diasVisiveis = isMobile ? weekCells : cells;

  const eventosPorDia = useMemo(() => {
    const map = new Map();
    for (const dayIso of diasVisiveis) {
      const list = eventos.filter((ev) => eventoCobreDia(ev, dayIso));
      if (list.length) map.set(dayIso, list);
    }
    return map;
  }, [eventos, diasVisiveis]);"""
if old_epd in s:
    s = s.replace(old_epd, new_epd, 1)
else:
    raise SystemExit("eventosPorDia block missing")

old_save = """    const corAtribuida = corAutomaticaEvento(
      `${lancData}|${t}|${eventos.length}`,
    );
    const payload = {
      obra_id: obraIdValue,
      titulo: t,
      descricao: String(lancDesc || "").trim() || null,
      data_evento: lancData,
      user_id: String(user.id),
      cor: corAtribuida,
    };"""
new_save = """    const fimStr = String(lancDataFim || "").trim();
    let dataFimVal = null;
    if (fimStr) {
      if (compareIso(fimStr, lancData) < 0) {
        showFeedback("A data de fim não pode ser anterior à data de início.");
        return;
      }
      dataFimVal = fimStr;
    }
    const corAtribuida = corAutomaticaEvento(
      `${lancData}|${t}|${eventos.length}`,
    );
    const payload = {
      obra_id: obraIdValue,
      titulo: t,
      descricao: String(lancDesc || "").trim() || null,
      data_evento: lancData,
      data_fim: dataFimVal,
      user_id: String(user.id),
      cor: corAtribuida,
    };"""
if old_save in s:
    s = s.replace(old_save, new_save, 1)
else:
    raise SystemExit("payload block missing")

s = s.replace("corParaPillClasse", "corParaBarraEvento")
s = s.replace("M.vis.bar", "M.vis.barSolid")

old_ev = """  const etapasVigentesNoDia = (dayIso) =>
    etapasComRange.filter(({ range }) =>
      isIsoInRange(dayIso, range.start, range.end),
    );

  const abrirLancamento = useCallback("""
new_ev = """  const etapasVigentesNoDia = (dayIso) =>
    etapasComRange.filter(({ range }) =>
      isIsoInRange(dayIso, range.start, range.end),
    );

  const eventosNoModalDia = useMemo(() => {
    if (!modalDia) return [];
    return eventos.filter((ev) => eventoCobreDia(ev, modalDia));
  }, [eventos, modalDia]);

  const abrirLancamento = useCallback("""
if old_ev in s:
    s = s.replace(old_ev, new_ev, 1)
else:
    raise SystemExit("etapasVigentes block missing")

s = s.replace("(eventosPorDia.get(modalDia) || []).length", "eventosNoModalDia.length", 1)
s = s.replace(
    "{(eventosPorDia.get(modalDia) || []).map((ev) => (",
    "{eventosNoModalDia.map((ev) => (",
    1,
)

# Form: insert Data fim after data início block
form_marker = """            />
          </div>
          <div>
            <label
              className="mb-1.5 block text-[10px] font-semibold uppercase tracking-tight text-text-muted"
              htmlFor="cronograma-titulo"
"""
# Find the closing </div> after cronograma-data - unique string
form_before_titulo = """              className="w-full rounded-2xl border border-border-primary bg-surface-alt px-4 py-3 text-sm font-medium text-text-primary transition focus:border-accent-primary focus:bg-surface focus:outline-none focus:ring-2 focus:ring-accent-primary/25"
            />
          </div>
          <div>
            <label
              className="mb-1.5 block text-[10px] font-semibold uppercase tracking-tight text-text-muted"
              htmlFor="cronograma-titulo"
"""
if form_before_titulo in s and "cronograma-data-fim" not in s:
    insert = """              className="w-full rounded-2xl border border-border-primary bg-surface-alt px-4 py-3 text-sm font-medium text-text-primary transition focus:border-accent-primary focus:bg-surface focus:outline-none focus:ring-2 focus:ring-accent-primary/25"
            />
          </div>
          <div>
            <label
              className="mb-1.5 block text-[10px] font-semibold uppercase tracking-tight text-text-muted"
              htmlFor="cronograma-data-fim"
            >
              Data de fim (opcional)
            </label>
            <input
              id="cronograma-data-fim"
              type="date"
              value={lancDataFim}
              onChange={(e) => setLancDataFim(e.target.value)}
              min={lancData}
              className="w-full rounded-2xl border border-border-primary bg-surface-alt px-4 py-3 text-sm font-medium text-text-primary transition focus:border-accent-primary focus:bg-surface focus:outline-none focus:ring-2 focus:ring-accent-primary/25"
            />
            <p className="mt-1 text-[10px] text-text-muted">
              Intervalo: o evento aparece em todos os dias entre início e fim. Vazio: um
              único dia.
            </p>
          </div>
          <div>
            <label
              className="mb-1.5 block text-[10px] font-semibold uppercase tracking-tight text-text-muted"
              htmlFor="cronograma-titulo"
"""
    s = s.replace(form_before_titulo, insert, 1)

# Header: nav on top, Lançar full width below
old_header = """      <div className="mb-4 flex flex-col gap-3 border-b border-slate-200/50 pb-4">
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <h2 className="text-lg font-bold tracking-tight text-slate-900 sm:text-[22px]">
              Cronograma da obra
            </h2>
            <p className="mt-0.5 text-sm tracking-tight text-slate-600">
              Etapas e eventos no mesmo calendário.
            </p>
          </div>
          <div className="flex w-full shrink-0 flex-col items-stretch gap-2 sm:w-auto sm:max-w-sm sm:items-end">
            {showLancarButton && (
              <button
                type="button"
                onClick={abrirLancamento}
                className="w-full rounded-xl border border-border-primary bg-surface px-4 py-2.5 text-sm font-semibold tracking-tight text-text-primary shadow-sm transition hover:bg-surface-alt sm:w-auto"
              >
                Lançar no Cronograma
              </button>
            )}
            {!isMobile && (
              <div className="flex w-full items-center justify-end gap-2 sm:w-auto">"""

new_header = """      <div className="mb-4 flex flex-col gap-4 border-b border-slate-200/50 pb-4">
        <div className="min-w-0">
          <h2 className="text-lg font-bold tracking-tight text-slate-900 sm:text-[22px]">
            Cronograma da obra
          </h2>
          <p className="mt-0.5 text-sm tracking-tight text-slate-600">
            Etapas e eventos no mesmo calendário.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2">
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:gap-3">"""

if old_header in s:
    s = s.replace(old_header, new_header, 1)
    # close the nav div and add Lançar row - need to find after Hoje button section
    old_close = """            )}
          </div>
        </div>
      </div>

      {loading &&"""
    new_close = """            )}
          </div>
          {showLancarButton && (
            <button
              type="button"
              onClick={abrirLancamento}
              className="w-full rounded-xl border-2 border-accent-primary bg-accent-primary px-4 py-3.5 text-sm font-bold tracking-tight text-white shadow-md shadow-accent-primary/30 transition hover:bg-accent-primary-dark sm:py-3"
            >
              Lançar no Cronograma
            </button>
          )}
        </div>
      </div>

      {loading &&"""
    if old_close in s:
        s = s.replace(old_close, new_close, 1)
    else:
        print("WARN: header close not replaced")
else:
    print("WARN: old header not found")

# Modal: period subtitle for event
old_modal_span = """                      {ev.descricao && (
                        <p className="text-xs text-slate-600">{ev.descricao}</p>
                      )}"""
new_modal_span = """                      {ev.data_fim &&
                        String(ev.data_fim).slice(0, 10) !==
                          String(ev.data_evento).slice(0, 10) && (
                        <p className="text-[11px] font-medium text-slate-500">
                          {String(ev.data_evento).slice(0, 10)} →{" "}
                          {String(ev.data_fim).slice(0, 10)}
                        </p>
                      )}
                      {ev.descricao && (
                        <p className="text-xs text-slate-600">{ev.descricao}</p>
                      )}"""
if old_modal_span in s and "→" not in s.split("Eventos manuais")[1][:800]:
    s = s.replace(old_modal_span, new_modal_span, 1)

p.write_text(s, encoding="utf-8")
print("done")
