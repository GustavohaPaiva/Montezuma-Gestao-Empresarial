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
    id: 1,
    titulo: "Infraestrutura",
    descricao: (
      <>
        Esta é a fase que exige a maior precisão técnica, pois erros aqui são
        difíceis e caros de consertar. O tipo de fundação é definido por um
        cálculo estrutural e por um exame chamado sondagem de solo, que avalia a
        resistência da terra.
        <br />
        <strong>Fundações rasas:</strong> Usadas em terrenos firmes. Incluem as
        sapatas (blocos de concreto armado sob os pilares) e o radier (uma laje
        contínua de concreto que pega toda a área da casa).
        <br />
        <strong>Fundações profundas:</strong> Necessárias quando o solo firme
        está muito abaixo da superfície. Envolve a perfuração e o uso de estacas
        (que podem chegar a dezenas de metros de profundidade) ou tubulões.
        <br />
        <strong>Vigas Baldrame:</strong> São as vigas horizontais que conectam
        as estacas ou sapatas, ficando no nível do solo. Elas suportam o peso
        das paredes e precisam receber uma impermeabilização rigorosa para
        evitar que a umidade da terra suba pelas paredes da casa (a famosa
        umidade de rodapé).
      </>
    ),
    dataConclusao: "12/03/2026",
    imagem: infraestrutura,
  },
  {
    id: 2,
    titulo: "Supraestrutura",
    descricao: (
      <>
        É a armação que mantém o prédio de pé. A lógica de distribuição de peso
        aqui é uma reação em cadeia: a laje descarrega o peso nas vigas, as
        vigas descarregam nos pilares, e os pilares descarregam na fundação.
        <br />
        <strong>Fôrmas e Escoramentos:</strong> O concreto é líquido quando
        chega à obra. Ele é despejado dentro de moldes de madeira ou metal
        (fôrmas) que contêm armações de aço (vergalhões).
        <br />
        <strong>Tempo de Cura:</strong> O concreto não seca, ele passa por uma
        reação química chamado "cura". É fundamental molhar as lajes e vigas nos
        primeiros dias para que o concreto não rache, e respeitar o tempo de
        escoramento (geralmente de 21 a 28 dias) antes de retirar as madeiras.
      </>
    ),
    dataConclusao: "12/03/2026",
    imagem: supraestrutura,
  },
  {
    id: 3,
    titulo: "Alvenaria",
    descricao: (
      <>
        Existem duas formas principais de erguer essas paredes, e a escolha muda
        totalmente a dinâmica da obra:
        <br />
        <strong>Alvenaria de Vedação:</strong> Os tijolos servem apenas para
        fechar os vãos e dividir os cômodos. Se você derrubar uma parede, a casa
        não cai, pois o peso está nos pilares e vigas.
        <br />
        <strong>Alvenaria Estrutural:</strong> Aqui, não há pilares
        convencionais. Os próprios blocos (geralmente de concreto ou cerâmica
        estrutural) suportam o peso da laje e do telhado. É mais rápido e
        econômico, mas não permite reformas futuras (como quebrar uma parede
        para integrar a sala à cozinha).
        <br />
        <strong>Vergas e Contravergas:</strong> Detalhe crucial. São pequenas
        vigas de concreto colocadas em cima e embaixo das janelas e portas. Sem
        elas, é quase certeza que aparecerão rachaduras nos cantos das
        esquadrias.
      </>
    ),
    dataConclusao: "12/03/2026",
    imagem: alvenaria,
  },
  {
    id: 4,
    titulo: "Cobertura",
    descricao: (
      <>
        O telhado é um sistema complexo que vai muito além de colocar telhas
        lado a lado.
        <br />
        <strong>Trama (Madeiramento ou Estrutura Metálica):</strong> É composta
        por tesouras (a base triangular), terças (vigas horizontais), caibros
        (que dão a inclinação) e ripas (onde as telhas se apoiam).
        <br />
        <strong>Caimento:</strong> Cada tipo de telha (fibrocimento, cerâmica
        colonial, concreto) exige um ângulo mínimo de inclinação. Se o telhado
        for muito "reto" para uma telha que exige alta inclinação, a água da
        chuva vai voltar e causar goteiras.
        <br />
        <strong>Manta Térmica e Calhas:</strong> Antes das telhas, é altamente
        recomendado instalar uma manta subcobertura (para isolamento térmico e
        proteção extra contra vazamentos). Também é nesta fase que se instalam
        os rufos (chapas metálicas nos encontros do telhado com a parede) e
        calhas.
      </>
    ),
    imagem: cobertura,
  },
  {
    id: 5,
    titulo: "Revestimentos externos",
    descricao: (
      <>
        O lado de fora da casa sofre com dilatação térmica (sol) e chuva, por
        isso o revestimento precisa ser muito bem executado.
        <br />
        <strong>Chapisco:</strong> É uma mistura áspera de cimento e areia
        jogada na parede de tijolos para que a próxima camada não desgrude.
        <br />
        <strong>Emboço e Reboco:</strong> O emboço nivela a parede e cobre os
        canos. O reboco é a camada final e fina. Para o exterior, é fundamental
        respeitar o tempo de secagem entre essas camadas para evitar fissuras.
        <br />
        <strong>Impermeabilização de Fachada:</strong> Adicionar aditivos
        impermeabilizantes na argamassa do reboco externo é um cuidado que
        aumenta a vida útil da pintura e evita mofo no lado de dentro da casa.
      </>
    ),
    imagem: revestimentosExternos,
  },
  {
    id: 6,
    titulo: "Revestimentos internos",
    descricao: (
      <>
        Aqui a casa começa a ficar confortável e pronta para a decoração.
        <br />
        <strong>Gesso vs. Argamassa:</strong> Nas paredes internas, o reboco
        tradicional de cimento e areia vem sendo substituído pelo gesso
        projetado ou reboco de gesso, que é mais rápido, mais barato e deixa a
        parede perfeitamente lisa, economizando massa corrida depois.
        <br />
        <strong>Contrapiso:</strong> É a camada de cimento e areia feita no chão
        para deixá-lo 100% nivelado antes de receber o piso. Em áreas molhadas
        (banheiros e varandas), o contrapiso deve ter um leve caimento em
        direção ao ralo.
        <br />
        <strong>Argamassas Colantes:</strong> Cada tipo de piso exige uma "cola"
        diferente. Cerâmicas comuns usam argamassa AC-I. Pisos externos usam
        AC-II. Porcelanatos e pisos sobre pisos exigem AC-III (a mais forte).
      </>
    ),
    imagem: revestimentosInternos,
  },
  {
    id: 7,
    titulo: "Hidráulica",
    descricao: (
      <>
        A regra de ouro da hidráulica é: faça testes antes de fechar as paredes.
        <br />
        <strong>Tubulações Específicas:</strong> Usa-se PVC marrom para água
        fria e materiais mais resistentes para água quente, como CPVC (plástico
        bege), PPR (plástico verde fundido a calor) ou Cobre.
        <br />
        <strong>Caimento do Esgoto:</strong> Os canos de esgoto e águas pluviais
        dependem da gravidade. Eles precisam de uma inclinação precisa
        (geralmente de 1% a 2%) para que os resíduos escoem sem entupir.
        <br />
        <strong>Teste de Estanqueidade:</strong> Antes de cimentar o chão e
        rebocar as paredes, toda a rede deve ser enchida de água e mantida sob
        pressão por alguns dias para garantir que não há nenhum microvazamento
        nas emendas.
      </>
    ),
    imagem: hidráulica,
  },
  {
    id: 8,
    titulo: "Estrutura Elétrica",
    descricao: (
      <>
        Uma elétrica malfeita gera alto consumo de energia e risco de incêndio.
        O projeto elétrico define a espessura dos fios de acordo com o que será
        ligado neles.
        <br />
        <strong>Eletrodutos (Conduítes):</strong> São as mangueiras corrugadas
        embutidas na parede e na laje. As amarelas são para paredes internas, as
        laranjas (mais reforçadas) vão na laje ou no chão.
        <br />
        <strong>Quadro de Distribuição (QDC):</strong> É o "cérebro" da casa,
        onde ficam os disjuntores. É vital ter circuitos separados para a
        iluminação, para as tomadas gerais e circuitos exclusivos para aparelhos
        de alta potência (chuveiros, ar-condicionado, forno elétrico).
      </>
    ),
    imagem: estruturaElétrica,
  },
  {
    id: 9,
    titulo: "Primeira etapa de pintura",
    descricao: (
      <>
        A pintura é a maquiagem da obra. Se a pele (parede) não estiver bem
        tratada, a maquiagem fica ruim.
        <br />
        <strong>Fundo Preparador e Selador:</strong> O tijolo e o reboco são
        porosos e absorvem muito líquido. O selador fecha esses poros, fazendo
        com que você gaste muito menos tinta e massa corrida.
        <br />
        <strong>Massa Corrida vs. Massa Acrílica:</strong> A Massa Corrida (PVA)
        só pode ser usada dentro de casa, em áreas secas (salas, quartos). Se
        molhar, ela estufa e descasca. Para áreas externas, banheiros e
        cozinhas, deve-se usar a Massa Acrílica, que é resistente à água.
        <br />
        <strong>Lixamento e Primeira Demão:</strong> Após passar a massa, a
        parede é lixada até ficar impecável. É necessário remover todo o pó com
        panos úmidos antes de aplicar a primeira demão de tinta, que servirá de
        base para a cor definitiva.
      </>
    ),
    imagem: primeiraEtapaDePintura,
  },
  {
    id: 10,
    titulo: "Assentamento de piso",
    descricao: (
      <>
        A escolha do piso dita o conforto e a estética, mas a instalação correta
        é o que garante que ele não solte ou trinque com o passar dos anos.
        <br />
        <strong>Argamassas e Dupla Colagem:</strong> Peças grandes (geralmente
        acima de 30x30cm) exigem dupla colagem. Isso significa aplicar a
        argamassa dentada tanto no chão quanto no verso da peça. Isso evita a
        formação de bolsões de ar, que deixam o piso com "som oco" e propício a
        quebrar se algo cair em cima.
        <br />
        <strong>Juntas de Dilatação e Niveladores:</strong> O piso expande no
        calor. O uso de espaçadores (cunhas e clipes niveladores) garante a
        distância milimétrica correta entre as peças. É o rejunte nesse espaço
        que absorve a movimentação da casa sem que o piso estufe e salte do
        chão.
        <br />
        <strong>Tipos de Rejunte:</strong> O cimentício é comum e barato, mas
        poroso e encarde fácil. O acrílico é mais liso e resistente. O epóxi é
        100% impermeável e ideal para banheiros e piscinas, mas seca rápido e
        exige mão de obra qualificada para não manchar a pedra.
      </>
    ),
    imagem: assentamentoDePiso,
  },
  {
    id: 11,
    titulo: "Esquadrias",
    descricao: (
      <>
        Fechar os vãos exige precisão milimétrica para evitar infiltrações de
        água e vento, além de garantir o isolamento acústico.
        <br />
        <strong>Contramarcos:</strong> Para esquadrias de alumínio ou PVC,
        chumba-se o contramarco (uma moldura fina de alumínio) na parede ainda
        durante o reboco. A janela ou porta final, que é cara e sensível, só é
        encaixada ali no final da obra, evitando riscos e amassados.
        <br />
        <strong>Espuma Expansiva e Vedação:</strong> Portas de madeira modernas
        geralmente são fixadas com espuma expansiva de poliuretano, que preenche
        todas as frestas, em vez de cimento tradicional. Pelo lado de fora das
        janelas, a aplicação rigorosa de silicone ou selante PU é vital para que
        a água da chuva não infiltre pelas laterais.
        <br />
        <strong>Sentido de Abertura:</strong> Um detalhe prático muitas vezes
        esquecido. Portas devem abrir em direção à parede mais próxima, e o lado
        da maçaneta não pode bater em móveis planejados, pias ou bloquear
        interruptores.
      </>
    ),
    imagem: esquadrias,
  },
  {
    id: 12,
    titulo: "Pedras",
    descricao: (
      <>
        Bancadas, pias e soleiras são itens pesados, caros e muitas vezes
        frágeis antes de instalados, exigindo suportes robustos.
        <br />
        <strong>Chumbamento vs. Mão Francesa:</strong> Bancadas pesadas precisam
        ser "chumbadas" (embutidas cerca de 3 a 5 centímetros dentro da parede
        rasgada na alvenaria) ou apoiadas em mãos francesas (suportes metálicos)
        chumbadas na parede para suportar o peso da pedra e das cubas cheias de
        água.
        <br />
        <strong>Soleiras e Pingadeiras:</strong> A soleira marca a transição de
        pisos debaixo da porta e cria um pequeno degrau para barrar a água do
        banheiro. A pingadeira é instalada na base das janelas ou no topo de
        muros: ela tem um pequeno corte embaixo para que a água da chuva
        "pingue" no chão, em vez de escorrer e manchar toda a parede.
        <br />
        <strong>Naturais vs. Sintéticos:</strong> Granitos e mármores são
        naturais e porosos (mármore pode manchar com vinho ou shampoo). Para
        cozinhas, materiais industrializados como Quartzo (Silestone) não têm
        porosidade e não mancham, mas não suportam panelas pelando de quentes
        direto da boca do fogão.
      </>
    ),
    imagem: pedras,
  },
  {
    id: 13,
    titulo: "Louças e metais",
    descricao: (
      <>
        A instalação dos acabamentos transforma os "canos saindo da parede" em
        banheiros e cozinhas funcionais.
        <br />
        <strong>Pressão da Água (MCA):</strong> Chuveiros modernos e torneiras
        monocomando (aquelas que misturam água quente e fria no mesmo registro)
        exige uma pressão mínima, medida em Metros de Coluna de Água (MCA). Se a
        caixa d'água não for alta o suficiente em relação ao chuveiro, a água
        sairá fraca, exigindo a instalação de um pressurizador elétrico.
        <br />
        <strong>Sifões e Ralos (Fecho Hídrico):</strong> O sifão (aquele cano
        torto debaixo da pia) e os ralos sifonados do chão têm um design feito
        para manter um pouco de água parada no fundo (o fecho hídrico). É essa
        barreirinha de água que impede que o gás e o mau cheiro do esgoto voltem
        para dentro de casa.
        <br />
        <strong>Alturas e Ergonomia:</strong> Existe padrão para tudo. A altura
        da bica da torneira precisa ser compatível com o modelo da cuba (seja
        ela de apoio, embutida ou sobrepor) para que a água não espirre para
        todo lado ao lavar as mãos.
      </>
    ),
    imagem: louçasEMetais,
  },
  {
    id: 14,
    titulo: "Final Elétrica",
    descricao: (
      <>
        É o momento de dar "vida" à casa instalando tomadas, luzes e ligando
        tudo no quadro geral com segurança.
        <br />
        <strong>Disjuntores DR (Diferencial Residual):</strong> Obrigatório por
        norma técnica, principalmente em áreas molhadas (banheiros, cozinhas,
        lavanderias). O DR é um dispositivo no quadro de energia que detecta
        fugas de corrente e desarma a energia em milissegundos se alguém tomar
        um choque, salvando vidas.
        <br />
        <strong>Amperagem de Tomadas (TUG e TUE):</strong> Tomadas de Uso Geral
        (TUG) são de 10A (pinos finos). Tomadas de Uso Específico (TUE) são para
        aparelhos que "puxam" muita energia (micro-ondas, lava-louças, secador
        de cabelo) e devem ser de 20A (pinos grossos), conectadas a fios mais
        grossos e disjuntores exclusivos para não derreterem.
        <br />
        <strong>Temperatura de Cor da Iluminação:</strong> Medida em Kelvins
        (K). Luzes "quentes" (amareladas, 2700K a 3000K) trazem aconchego e
        relaxamento para salas e quartos. Luzes "frias" (brancas, 4000K a 6000K)
        mantêm a atenção e melhoram a visibilidade em cozinhas, banheiros e
        escritórios.
      </>
    ),
    imagem: finalElétrica,
  },
  {
    id: 15,
    titulo: "Final Pintura",
    descricao: (
      <>
        A pintura final é muito sensível. É a última etapa úmida da casa e exige
        isolamento total de tudo o que já foi instalado.
        <br />
        <strong>Isolamento e Preparação:</strong> Antes de abrir a lata de
        tinta, gasta-se muito tempo com lona, papelão e fita crepe cobrindo o
        chão pronto, maçanetas, vidros e rodapés. A preparação é 70% do sucesso
        de uma pintura sem dores de cabeça.
        <br />
        <strong>Tipos de Acabamento:</strong> Tintas foscas não refletem luz,
        então disfarçam pequenas ondulações da parede, mas sujam com facilidade.
        Tintas acetinadas (brilho suave) ou semibrilho são fáceis de lavar, mas
        revelam qualquer tortuosidade deixada pelo pedreiro ou gesseiro.
        <br />
        <strong>Tempo de Cura e Demãos:</strong> Nunca se pinta de uma vez só
        com uma camada grossa. Aplicam-se de duas a três demãos finas. Respeitar
        as horas de secagem do fabricante entre uma demão e outra é crucial;
        caso contrário, o rolo de pintura "arranca" a tinta fresca de baixo,
        descascando a parede.
      </>
    ),
    imagem: finalPintura,
  },
  {
    id: 16,
    titulo: "Detalhes e limpeza final",
    descricao: (
      <>
        A obra acabou, mas a casa ainda não é um lar. A limpeza de uma obra é um
        processo pesado e químico.
        <br />
        <strong>Remoção de Resíduos Químicos:</strong> Não adianta vassoura e
        sabão neutro. A limpeza pós-obra usa removedores específicos
        (desincrustantes e limpa-pedras) para diluir respingos de cimento, massa
        corrida e o véu embaçado do rejunte epóxi que fica no porcelanato, sem
        arranhar o esmalte do piso.
        <br />
        <strong>Instalação de Acessórios:</strong> É a instalação cuidadosa do
        box de vidro dos banheiros, espelhos, suportes de toalha, olho mágico,
        números da fachada e varais. Exige cuidado com a furadeira para não
        perfurar canos d'água acidentalmente (já que agora as paredes estão
        todas fechadas e pintadas).
        <br />
        <strong>Check-list de Entrega (As-Built):</strong> O teste final.
        Abrem-se todas as torneiras juntas, dá-se descarga para testar a
        pressão, liga-se o chuveiro, todas as luzes, e testa-se tomada por
        tomada com um multímetro ou carregador de celular. É comum atualizar a
        planta da casa para o "As-Built" (Como Construído), registrando onde os
        canos e fios realmente ficaram caso você precise furar a parede no
        futuro.
      </>
    ),
    imagem: detalhesELimpezaFinal,
  },
];

const Etapas = ({ etapas = etapasMock }) => {
  const [etapaAtiva, setEtapaAtiva] = useState(null);
  const [renderEtapa, setRenderEtapa] = useState(null);
  const [isFading, setIsFading] = useState(false);

  const [isMounted, setIsMounted] = useState(false);
  const [progressAnim, setProgressAnim] = useState(0);

  const etapaAtualId = 5;

  const etapaAtualIndex =
    etapas.findIndex((e) => e.id === etapaAtualId) !== -1
      ? etapas.findIndex((e) => e.id === etapaAtualId)
      : 0;

  const totalEtapas = etapas.length;
  const concluidas = etapaAtualIndex;
  const emAndamento = 1;
  const restantes = totalEtapas - concluidas - emAndamento;
  const porcentagem = Math.round((concluidas / totalEtapas) * 100);

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

  if (!etapas || etapas.length === 0) return null;

  const tituloAtual = etapas[etapaAtualIndex]?.titulo || "";
  const proximoTitulo = etapas[etapaAtualIndex + 1]?.titulo || "Finalização";

  const raioCirculo = 70;
  const circunferencia = 2 * Math.PI * raioCirculo;
  const preenchimentoArc =
    circunferencia - (circunferencia * progressAnim) / 100;

  return (
    <div className="w-full flex justify-center items-center min-h-[80vh]">
      <div className="w-full h-full mb-6 bg-white p-2 md:p-8 flex flex-col relative font-serif text-black shadow-sm rounded-lg border border-gray-200">
        <h2 className="text-3xl font-bold text-center mb-10 tracking-wide">
          Etapas da Obra
        </h2>

        <div className="flex flex-1 relative gap-6 items-stretch">
          <div className="w-16 relative flex flex-col items-center">
            <div className="relative flex flex-col gap-4 w-full items-center z-10">
              <div className="absolute top-3 bottom-3 w-0.5 bg-gray-300 z-0 left-1/2 -translate-x-1/2"></div>

              <div
                className="absolute top-3 w-1 bg-[#DC3B0B] z-0 transition-all duration-500 ease-in-out left-1/2 -translate-x-1/2"
                style={{ height: `${etapaAtualIndex * 60}px` }}
              ></div>

              {etapas.map((_, index) => {
                const isCompleted = index < etapaAtualIndex;
                const isCurrent = index === etapaAtualIndex;
                const isFuture = index > etapaAtualIndex;
                const isActive = etapaAtiva === index;

                return (
                  <button
                    key={index}
                    onClick={() => handleToggleEtapa(index)}
                    className={`w-8 h-8 md:w-10 md:h-10 rounded-full border-2 transition-all duration-500 cursor-pointer focus:outline-none flex items-center justify-center text-sm md:text-base font-sans font-bold relative z-10 
                      ${isCompleted ? "bg-[#DC3B0B] border-[#DC3B0B] text-white" : ""}
                      ${isCurrent ? "bg-white border-[#DC3B0B] text-[#DC3B0B]" : ""}
                      ${isFuture ? "bg-white border-gray-300 text-gray-400 hover:border-gray-400" : ""}
                      ${isActive ? "scale-115 shadow-lg" : "hover:scale-110"}`}
                    title={`Ver etapa: ${etapas[index].titulo}`}
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
                        src={etapas[etapaAtualIndex].imagem}
                        alt={`Imagem da etapa atual: ${tituloAtual}`}
                        className="w-full h-auto max-h-[300px] object-contain transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>

                    <div className="w-full flex justify-between items-center bg-gray-50 rounded-md px-4 py-3 border border-gray-100">
                      <span className="text-sm text-gray-600 font-medium">
                        Iniciado em:
                      </span>
                      <span className="text-sm font-bold text-[#464C54]">
                        {etapas[etapaAtualIndex].dataInicio || "Recente"}
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
                            {etapas[renderEtapa].titulo}
                          </h3>
                        </div>
                      </div>

                      <div className="mb-4 md:items-center md:justify-center flex">
                        {etapas[renderEtapa].dataConclusao && (
                          <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded font-sans">
                            Concluído em {etapas[renderEtapa].dataConclusao}
                          </span>
                        )}
                        {renderEtapa === etapaAtualIndex &&
                          etapas[renderEtapa].dataInicio && (
                            <span className="bg-orange-100 text-orange-800 text-xs font-semibold px-2.5 py-0.5 rounded font-sans">
                              Iniciado em {etapas[renderEtapa].dataInicio}
                            </span>
                          )}
                      </div>
                    </div>

                    <p className="text-md sm:text-lg md:text-xl lg:text-2xl leading-relaxed font-sans mb-6">
                      {etapas[renderEtapa].descricao}
                    </p>

                    <div className="w-full h-full flex justify-center items-center xl:mt-20">
                      <div className="w-full flex flex-col gap-4">
                        <div className="w-full rounded-xl overflow-hidden shadow-md border border-gray-200 bg-white p-2">
                          <img
                            src={etapas[renderEtapa].imagem}
                            alt={`Imagem da etapa: ${etapas[renderEtapa].titulo}`}
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
