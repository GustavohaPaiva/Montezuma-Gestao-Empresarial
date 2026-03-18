import { useState, useEffect } from "react";
import { CheckCircle2, HardHat, Hourglass } from "lucide-react";

import infraestrutura from "../../assets/imagensEtapas/Infraestrutura.png";
import supraestrutura from "../../assets/imagensEtapas/Supraestrutura.png";
import alvenaria from "../../assets/imagensEtapas/Alvenaria.png";
import cobertura from "../../assets/imagensEtapas/Cobertura.png";
import revestimentosExternos from "../../assets/imagensEtapas/revestimentosExternos.png";
import revestimentosInternos from "../../assets/imagensEtapas/revestimentosInternos.png";
import hidráulica from "../../assets/imagensEtapas/Hidráulica.png";
import estruturaElétrica from "../../assets/imagensEtapas/EstruturaElétrica.png";
import primeiraEtapaDePintura from "../../assets/imagensEtapas/PrimeiraEtapaDePintura.png";
import assentamentoDePiso from "../../assets/imagensEtapas/AssentamentoDePiso.png";
import esquadrias from "../../assets/imagensEtapas/Esquadrias.png";
import pedras from "../../assets/imagensEtapas/Pedras.png";
import louçasEMetais from "../../assets/imagensEtapas/LouçasEMetais.png";
import finalElétrica from "../../assets/imagensEtapas/FinalElétrica.png";
import finalPintura from "../../assets/imagensEtapas/FinalPintura.png";
import detalhesELimpezaFinal from "../../assets/imagensEtapas/DetalhesELimpezaFinal.png";

const etapasMock = [
  {
    titulo: "Infraestrutura",
    descricao: (
      <>
        Esta é a fase que exige a maior precisão técnica, pois erros aqui são
        difíceis e caros de consertar. O tipo de fundação é definido por um
        cálculo estrutural e por um exame chamado sondagem de solo, que avalia a
        resistência da terra.
        <br />
        <strong>Fundações rasas:</strong> Usadas em terrenos firmes. Incluem as
        sapatas e o radier.
        <br />
        <strong>Fundações profundas:</strong> Necessárias quando o solo firme
        está muito abaixo da superfície. Envolve a perfuração e o uso de estacas
        ou tubulões.
        <br />
        <strong>Vigas Baldrame:</strong> São as vigas horizontais que conectam
        as estacas ou sapatas, ficando no nível do solo.
      </>
    ),
    imagem: infraestrutura,
  },
  {
    titulo: "Supraestrutura",
    descricao: (
      <>
        É a armação que mantém o prédio de pé. A lógica de distribuição de peso
        aqui é uma reação em cadeia: a laje descarrega o peso nas vigas, as
        vigas descarregam nos pilares, e os pilares descarregam na fundação.
        <br />
        <strong>Fôrmas e Escoramentos:</strong> O concreto é líquido quando
        chega à obra. Ele é despejado dentro de moldes de madeira ou metal.
        <br />
        <strong>Tempo de Cura:</strong> É fundamental molhar as lajes e vigas
        nos primeiros dias para que o concreto não rache.
      </>
    ),
    imagem: supraestrutura,
  },
  {
    titulo: "Alvenaria",
    descricao: (
      <>
        Existem duas formas principais de erguer essas paredes, e a escolha muda
        totalmente a dinâmica da obra:
        <br />
        <strong>Alvenaria de Vedação:</strong> Os tijolos servem apenas para
        fechar os vãos e dividir os cômodos.
        <br />
        <strong>Alvenaria Estrutural:</strong> Aqui, não há pilares
        convencionais. Os próprios blocos suportam o peso da laje e do telhado.
        <br />
        <strong>Vergas e Contravergas:</strong> Detalhe crucial. São pequenas
        vigas de concreto colocadas em cima e embaixo das janelas e portas.
      </>
    ),
    imagem: alvenaria,
  },
  {
    titulo: "Cobertura",
    descricao: (
      <>
        O telhado é um sistema complexo que vai muito além de colocar telhas
        lado a lado.
        <br />
        <strong>Trama:</strong> É composta por tesouras, terças, caibros e
        ripas.
        <br />
        <strong>Caimento:</strong> Cada tipo de telha exige um ângulo mínimo de
        inclinação.
        <br />
        <strong>Manta Térmica e Calhas:</strong> Altamente recomendado instalar
        uma manta subcobertura para isolamento térmico e proteção extra.
      </>
    ),
    imagem: cobertura,
  },
  {
    titulo: "Revestimentos externos",
    descricao: (
      <>
        O lado de fora da casa sofre com dilatação térmica (sol) e chuva, por
        isso o revestimento precisa ser muito bem executado.
        <br />
        <strong>Chapisco:</strong> É uma mistura áspera de cimento e areia
        jogada na parede.
        <br />
        <strong>Emboço e Reboco:</strong> O emboço nivela a parede e cobre os
        canos. O reboco é a camada final e fina.
        <br />
        <strong>Impermeabilização de Fachada:</strong> Adicionar aditivos
        impermeabilizantes na argamassa do reboco externo aumenta a vida útil da
        pintura.
      </>
    ),
    imagem: revestimentosExternos,
  },
  {
    titulo: "Revestimentos internos",
    descricao: (
      <>
        Aqui a casa começa a ficar confortável e pronta para a decoração.
        <br />
        <strong>Gesso vs. Argamassa:</strong> Nas paredes internas, o reboco
        tradicional de cimento e areia vem sendo substituído pelo gesso
        projetado.
        <br />
        <strong>Contrapiso:</strong> É a camada de cimento e areia feita no chão
        para deixá-lo 100% nivelado antes de receber o piso.
        <br />
        <strong>Argamassas Colantes:</strong> Cada tipo de piso exige uma "cola"
        diferente (AC-I, AC-II, AC-III).
      </>
    ),
    imagem: revestimentosInternos,
  },
  {
    titulo: "Hidráulica",
    descricao: (
      <>
        A regra de ouro da hidráulica é: faça testes antes de fechar as paredes.
        <br />
        <strong>Tubulações Específicas:</strong> Usa-se PVC marrom para água
        fria e materiais mais resistentes para água quente.
        <br />
        <strong>Caimento do Esgoto:</strong> Os canos de esgoto e águas pluviais
        dependem da gravidade, exigindo inclinação precisa.
        <br />
        <strong>Teste de Estanqueidade:</strong> Toda a rede deve ser enchida de
        água e mantida sob pressão por alguns dias para garantir que não há
        microvazamento.
      </>
    ),
    imagem: hidráulica,
  },
  {
    titulo: "Estrutura Elétrica",
    descricao: (
      <>
        Uma elétrica malfeita gera alto consumo de energia e risco de incêndio.
        <br />
        <strong>Eletrodutos (Conduítes):</strong> São as mangueiras corrugadas
        embutidas na parede e na laje.
        <br />
        <strong>Quadro de Distribuição (QDC):</strong> É o "cérebro" da casa,
        onde ficam os disjuntores. É vital ter circuitos separados para a
        iluminação, tomadas e aparelhos de alta potência.
      </>
    ),
    imagem: estruturaElétrica,
  },
  {
    titulo: "Primeira etapa de pintura",
    descricao: (
      <>
        A pintura é a maquiagem da obra. Se a pele (parede) não estiver bem
        tratada, a maquiagem fica ruim.
        <br />
        <strong>Fundo Preparador e Selador:</strong> O selador fecha os poros,
        fazendo com que você gaste muito menos tinta e massa corrida.
        <br />
        <strong>Massa Corrida vs. Massa Acrílica:</strong> A Massa Corrida só
        pode ser usada em áreas secas. Para áreas úmidas, deve-se usar a Massa
        Acrílica.
        <br />
        <strong>Lixamento e Primeira Demão:</strong> Após passar a massa, a
        parede é lixada até ficar impecável.
      </>
    ),
    imagem: primeiraEtapaDePintura,
  },
  {
    titulo: "Assentamento de piso",
    descricao: (
      <>
        A escolha do piso dita o conforto e a estética, mas a instalação correta
        é o que garante durabilidade.
        <br />
        <strong>Argamassas e Dupla Colagem:</strong> Peças grandes exigem dupla
        colagem (argamassa no chão e na peça).
        <br />
        <strong>Juntas de Dilatação e Niveladores:</strong> O uso de espaçadores
        garante a distância milimétrica correta entre as peças.
        <br />
        <strong>Tipos de Rejunte:</strong> O cimentício é comum e barato. O
        epóxi é 100% impermeável e ideal para banheiros.
      </>
    ),
    imagem: assentamentoDePiso,
  },
  {
    titulo: "Esquadrias",
    descricao: (
      <>
        Fechar os vãos exige precisão milimétrica para evitar infiltrações de
        água e vento.
        <br />
        <strong>Contramarcos:</strong> Para esquadrias de alumínio ou PVC,
        chumba-se o contramarco na parede ainda durante o reboco.
        <br />
        <strong>Espuma Expansiva e Vedação:</strong> A aplicação rigorosa de
        silicone ou selante PU é vital para que a água da chuva não infiltre.
        <br />
        <strong>Sentido de Abertura:</strong> Portas devem abrir em direção à
        parede mais próxima.
      </>
    ),
    imagem: esquadrias,
  },
  {
    titulo: "Pedras",
    descricao: (
      <>
        Bancadas, pias e soleiras são itens pesados e frágeis antes de
        instalados, exigindo suportes robustos.
        <br />
        <strong>Chumbamento vs. Mão Francesa:</strong> Bancadas pesadas precisam
        ser chumbadas ou apoiadas em mãos francesas.
        <br />
        <strong>Soleiras e Pingadeiras:</strong> A soleira marca a transição de
        pisos. A pingadeira evita que a água da chuva escorra e manche a parede.
        <br />
        <strong>Naturais vs. Sintéticos:</strong> Granitos são naturais e
        porosos. Quartzos não têm porosidade e não mancham.
      </>
    ),
    imagem: pedras,
  },
  {
    titulo: "Louças e metais",
    descricao: (
      <>
        A instalação dos acabamentos transforma os canos saindo da parede em
        banheiros e cozinhas funcionais.
        <br />
        <strong>Pressão da Água (MCA):</strong> Chuveiros modernos e torneiras
        monocomando exigem uma pressão mínima.
        <br />
        <strong>Sifões e Ralos (Fecho Hídrico):</strong> O design mantém um
        pouco de água parada no fundo para impedir o retorno de mau cheiro.
        <br />
        <strong>Alturas e Ergonomia:</strong> A altura da bica da torneira
        precisa ser compatível com o modelo da cuba.
      </>
    ),
    imagem: louçasEMetais,
  },
  {
    titulo: "Final Elétrica",
    descricao: (
      <>
        É o momento de dar vida à casa instalando tomadas, luzes e ligando tudo
        no quadro geral.
        <br />
        <strong>Disjuntores DR:</strong> Obrigatório por norma técnica, o DR
        detecta fugas de corrente e desarma a energia em milissegundos.
        <br />
        <strong>Amperagem de Tomadas:</strong> TUGs são de 10A. TUEs são para
        aparelhos de alta potência e devem ser de 20A.
        <br />
        <strong>Temperatura de Cor:</strong> Luzes quentes (2700K a 3000K)
        trazem aconchego. Luzes frias (4000K a 6000K) melhoram a visibilidade.
      </>
    ),
    imagem: finalElétrica,
  },
  {
    titulo: "Final Pintura",
    descricao: (
      <>
        A pintura final é muito sensível e exige isolamento total de tudo o que
        já foi instalado.
        <br />
        <strong>Isolamento e Preparação:</strong> A preparação com lona e fita
        crepe é 70% do sucesso de uma pintura.
        <br />
        <strong>Tipos de Acabamento:</strong> Tintas foscas disfarçam pequenas
        ondulações. Semibrilho revela qualquer tortuosidade.
        <br />
        <strong>Tempo de Cura e Demãos:</strong> Respeitar as horas de secagem
        do fabricante entre uma demão e outra é crucial.
      </>
    ),
    imagem: finalPintura,
  },
  {
    titulo: "Detalhes e limpeza final",
    descricao: (
      <>
        A obra acabou, mas a casa ainda não é um lar. A limpeza pós-obra é um
        processo pesado e químico.
        <br />
        <strong>Remoção de Resíduos Químicos:</strong> Usa removedores
        específicos para diluir respingos de cimento e massa corrida.
        <br />
        <strong>Instalação de Acessórios:</strong> Instalação cuidadosa do box
        de vidro, espelhos e suportes.
        <br />
        <strong>Check-list de Entrega (As-Built):</strong> Testa-se a pressão da
        água, luzes e tomadas. Atualiza-se a planta da casa para o "Como
        Construído".
      </>
    ),
    imagem: detalhesELimpezaFinal,
  },
];

const formatarData = (dataStr) => {
  if (!dataStr) return null;
  if (dataStr.includes("-")) {
    const [ano, mes, dia] = dataStr.split("-");
    return `${dia}/${mes}/${ano}`;
  }
  return dataStr;
};

const Etapas = ({ etapas = [] }) => {
  const [etapaAtiva, setEtapaAtiva] = useState(null);
  const [renderEtapa, setRenderEtapa] = useState(null);
  const [isFading, setIsFading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [progressAnim, setProgressAnim] = useState(0);

  const dadosEtapas = (etapas || [])
    .map((etapaBanco) => {
      const mockItem = etapasMock.find((m) => m.titulo === etapaBanco.nome);
      if (!mockItem) return null;

      return {
        ...mockItem,
        status: etapaBanco.status || "pendente",
        dataInicio: formatarData(etapaBanco.data_inicio),
        dataConclusao: formatarData(etapaBanco.data_conclusao),
      };
    })
    .filter(Boolean);

  const totalEtapas = dadosEtapas.length;
  const concluidas = dadosEtapas.filter((e) => e.status === "concluído").length;
  const emAndamento = 1;
  const restantes = totalEtapas - concluidas - emAndamento;
  const porcentagem =
    totalEtapas === 0 ? 0 : Math.round((concluidas / totalEtapas) * 100);

  let currentIndex = dadosEtapas.findIndex((e) => e.status !== "concluído");
  if (currentIndex === -1) {
    currentIndex = totalEtapas > 0 ? totalEtapas - 1 : 0;
  }
  const etapaAtualIndex = currentIndex;

  useEffect(() => {
    const mountTimer = setTimeout(() => {
      setIsMounted(true);
    }, 50);

    const progressTimer = setTimeout(() => {
      setProgressAnim(porcentagem);
    }, 400);

    return () => {
      clearTimeout(mountTimer);
      clearTimeout(progressTimer);
    };
  }, [porcentagem]);

  const handleToggleEtapa = (index) => {
    const target = etapaAtiva === index ? null : index;
    if (target === etapaAtiva) return;

    setEtapaAtiva(target);
    setIsFading(true);

    setTimeout(() => {
      setRenderEtapa(target);
      setIsFading(false);
    }, 250);
  };

  if (!dadosEtapas || dadosEtapas.length === 0) {
    return (
      <div className="w-full flex justify-center items-center min-h-[30vh]">
        <div className="w-full bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
          <HardHat className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[#464C54] mb-2">
            Nenhuma etapa definida
          </h2>
          <p className="text-gray-500">
            Acesse o menu de seleção de etapas para começar a montar o
            cronograma desta obra.
          </p>
        </div>
      </div>
    );
  }

  const tituloAtual = dadosEtapas[etapaAtualIndex]?.titulo || "";
  const proximoTitulo =
    dadosEtapas[etapaAtualIndex + 1]?.titulo || "Finalização";

  const raioCirculo = 70;
  const circunferencia = 2 * Math.PI * raioCirculo;
  const preenchimentoArc =
    circunferencia - (circunferencia * progressAnim) / 100;

  const fraction = totalEtapas <= 1 ? 0 : etapaAtualIndex / (totalEtapas - 1);
  const redLineHeight = `calc(${fraction * 100}% - ${fraction * 40}px + 40px)`;

  return (
    <div className="w-full flex justify-center items-center min-h-[80vh]">
      <div className="w-full h-full mb-6 bg-white p-2 md:p-8 flex flex-col relative font-serif text-black shadow-sm rounded-lg border border-gray-200">
        <h2 className="text-3xl font-bold text-center mb-10 tracking-wide">
          Etapas da Obra
        </h2>

        <div className="flex flex-1 relative gap-6 items-stretch">
          <div className="w-16 relative flex flex-col items-center">
            <div className="relative flex flex-col justify-between gap-4 w-full items-center z-10 h-full">
              <div className="absolute top-0 bottom-0 w-0.5 bg-gray-300 z-0 left-1/2 -translate-x-1/2"></div>

              <div
                className="absolute top-0 w-1 bg-[#DC3B0B] z-0 transition-all duration-500 ease-in-out left-1/2 -translate-x-1/2"
                style={{ height: redLineHeight }}
              ></div>

              {dadosEtapas.map((etapaItem, index) => {
                const isCompleted = etapaItem.status === "concluído";
                const isCurrent = index === etapaAtualIndex && !isCompleted;
                const isFuture = !isCompleted && !isCurrent;
                const isActive = etapaAtiva === index;

                return (
                  <button
                    key={index}
                    onClick={() => handleToggleEtapa(index)}
                    className={`flex-shrink-0 w-10 h-10 rounded-full border-2 transition-all duration-500 cursor-pointer focus:outline-none flex items-center justify-center text-sm font-sans font-bold relative z-10 
                      ${isCompleted ? "bg-[#DC3B0B] border-[#DC3B0B] text-white" : ""}
                      ${isCurrent ? "bg-white border-[#DC3B0B] text-[#DC3B0B]" : ""}
                      ${isFuture ? "bg-white border-gray-300 text-gray-400 hover:border-gray-400" : ""}
                      ${isActive ? "scale-115 shadow-lg" : "hover:scale-110"}`}
                    title={`Ver etapa: ${etapaItem.titulo}`}
                  >
                    {isCompleted ? "✓" : index + 1}
                  </button>
                );
              })}
            </div>
          </div>

          <div
            className={`flex-1 relative flex flex-col h-full transition-all duration-300 ease-out transform ${
              isFading ? "opacity-0 translate-y-3" : "opacity-100 translate-y-0"
            }`}
          >
            {renderEtapa === null ? (
              <div className="w-full flex flex-col gap-8 items-center justify-center font-sans overflow-hidden py-4 my-auto h-full">
                <div
                  className={`w-full flex flex-col items-center gap-8 transition-all duration-1000 ease-out delay-100 ${
                    isMounted
                      ? "opacity-100 translate-x-0"
                      : "opacity-0 -translate-x-12"
                  }`}
                >
                  <h3 className="text-2xl font-bold text-[#464C54] text-center">
                    Sua obra está ganhando forma!
                  </h3>

                  <div className="relative flex items-center justify-center">
                    <svg className="w-56 h-56 transform -rotate-90 drop-shadow-sm">
                      <circle
                        cx="112"
                        cy="112"
                        r={raioCirculo}
                        stroke="currentColor"
                        strokeWidth="16"
                        fill="transparent"
                        className="text-gray-100"
                      />
                      <circle
                        cx="112"
                        cy="112"
                        r={raioCirculo}
                        stroke="currentColor"
                        strokeWidth="16"
                        fill="transparent"
                        className="text-[#DC3B0B]"
                        strokeLinecap="round"
                        style={{
                          strokeDasharray: circunferencia,
                          strokeDashoffset: preenchimentoArc,
                          transition:
                            "stroke-dashoffset 1.5s cubic-bezier(0.25, 1, 0.5, 1)",
                        }}
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center transition-opacity duration-700 delay-500">
                      <span className="text-5xl font-bold text-[#464C54]">
                        {porcentagem}%
                      </span>
                      <span className="text-xs font-bold text-gray-400 tracking-widest uppercase mt-1">
                        Concluído
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap justify-center gap-4 w-full px-4">
                    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm flex flex-col items-center justify-center flex-1 min-w-[120px] transition-transform hover:-translate-y-1 hover:shadow-md cursor-default">
                      <CheckCircle2 className="w-6 h-6 text-[#DC3B0B] mb-1" />
                      <span className="font-bold text-[#464C54] text-lg">
                        {concluidas}
                      </span>
                      <span className="text-xs text-gray-500 text-center font-medium">
                        Finalizadas
                      </span>
                    </div>
                    <div className="bg-[#fff9f8] border border-[#f5c6b8] rounded-lg p-4 shadow-sm flex flex-col items-center justify-center flex-1 min-w-[120px] transition-transform hover:-translate-y-1 hover:shadow-md cursor-default">
                      <HardHat className="w-6 h-6 text-[#DC3B0B] mb-1" />
                      <span className="font-bold text-[#DC3B0B] text-lg">
                        {emAndamento}
                      </span>
                      <span className="text-xs text-[#DC3B0B] text-center font-medium">
                        Em Andamento
                      </span>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm flex flex-col items-center justify-center flex-1 min-w-[120px] transition-transform hover:-translate-y-1 hover:shadow-md cursor-default">
                      <Hourglass className="w-6 h-6 text-[#DC3B0B] mb-1" />
                      <span className="font-bold text-[#464C54] text-lg">
                        {restantes}
                      </span>
                      <span className="text-xs text-gray-500 text-center font-medium">
                        Restantes
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  className={`w-full flex flex-col gap-4 transition-all duration-1000 ease-out delay-200 ${
                    isMounted
                      ? "opacity-100 translate-x-0"
                      : "opacity-0 translate-x-12"
                  }`}
                >
                  <div className="w-full flex flex-col items-center bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200 p-6 relative group">
                    <span className="text-xs font-bold text-[#DC3B0B] tracking-widest uppercase mb-1">
                      Fase Atual
                    </span>
                    <h4 className="text-2xl font-bold text-[#464C54] text-center mb-4 uppercase">
                      {tituloAtual}
                    </h4>

                    <div className="w-full rounded-lg overflow-hidden border border-gray-200 mb-4 bg-white flex justify-center items-center">
                      <img
                        src={dadosEtapas[etapaAtualIndex]?.imagem}
                        alt={`Imagem da etapa atual: ${tituloAtual}`}
                        className="w-full h-auto max-h-[300px] object-contain transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>

                    <div className="w-full flex justify-between items-center bg-gray-50 rounded-md px-4 py-3 border border-gray-100">
                      <span className="text-sm text-gray-600 font-medium">
                        Iniciado em:
                      </span>
                      <span className="text-sm font-bold text-[#464C54]">
                        {dadosEtapas[etapaAtualIndex]?.dataInicio || "Pendente"}
                      </span>
                    </div>

                    <div className="w-full mt-4 flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-gray-300 animate-pulse"></div>
                      <span className="text-sm text-gray-500 font-medium">
                        Próximo passo:{" "}
                        <strong className="text-gray-700">
                          {proximoTitulo}
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col relative pt-2">
                <div className="flex items-start gap-6">
                  <div className="flex-1">
                    <div className="flex flex-col md:flex-row md:gap-4">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="flex flex-row gap-2 items-center">
                          <div className="sm:w-12 sm:h-12 h-8 w-8 rounded-full bg-[#DC3B0B] flex-shrink-0 shadow-md flex items-center justify-center">
                            <span className="text-white font-bold text-lg sm:text-xl font-sans">
                              {renderEtapa + 1}
                            </span>
                          </div>
                          <h3 className="sm:text-3xl text-xl font-bold">
                            {dadosEtapas[renderEtapa].titulo}
                          </h3>
                        </div>
                      </div>

                      <div className="mb-4 md:items-center md:justify-center flex">
                        {dadosEtapas[renderEtapa].dataConclusao && (
                          <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded font-sans">
                            Concluído em{" "}
                            {dadosEtapas[renderEtapa].dataConclusao}
                          </span>
                        )}
                        {renderEtapa === etapaAtualIndex &&
                          dadosEtapas[renderEtapa].dataInicio && (
                            <span className="bg-orange-100 text-orange-800 text-xs font-semibold px-2.5 py-0.5 rounded font-sans">
                              Iniciado em {dadosEtapas[renderEtapa].dataInicio}
                            </span>
                          )}
                      </div>
                    </div>

                    <p className="text-md sm:text-lg md:text-xl lg:text-2xl leading-relaxed font-sans mb-6">
                      {dadosEtapas[renderEtapa].descricao}
                    </p>

                    <div className="w-full h-full flex justify-center items-center xl:mt-20">
                      <div className="w-full flex flex-col gap-4">
                        <div className="w-full rounded-xl overflow-hidden shadow-md border border-gray-200 bg-white p-2">
                          <img
                            src={dadosEtapas[renderEtapa].imagem}
                            alt={`Imagem da etapa: ${dadosEtapas[renderEtapa].titulo}`}
                            className="w-full max-h-[300px] object-contain"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="absolute top-0 right-0">
                  <button
                    onClick={() => handleToggleEtapa(renderEtapa)}
                    className="bg-gray-100 hover:bg-gray-300 text-gray-700 px-3 py-1.5 md:px-4 md:py-2.5 rounded-md font-sans text-sm font-bold transition-colors"
                  >
                    Voltar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Etapas;
