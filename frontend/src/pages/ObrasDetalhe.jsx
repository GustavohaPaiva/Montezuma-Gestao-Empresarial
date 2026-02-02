import { useNavigate, useParams } from "react-router-dom";
import TabelaSimples from "../components/TabelaSimples";
import ButtonDefault from "../components/ButtonDefault";
import { gerarPDF } from "../services/pdfService";
import { useEffect, useState } from "react";
import { api } from "../services/api";

export default function ObrasDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [obra, setObra] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);

    api.getObraById(id).then((dados) => setObra(dados));

    return () => window.removeEventListener("resize", handleResize);
  }, [id]);

  if (!obra)
    return <div className="flex justify-center mt-20">Carregando...</div>;

  return (
    <div className="flex flex-col items-center min-h-screen bg-[#EEEDF0] pb-[40px]">
      <header className="h-[82px] border-b border-[#DBDADE] flex justify-center sticky top-0 z-10 w-full bg-white">
        <div className="w-[90%] flex items-center justify-between">
          <div className="flex items-center gap-[16px]">
            <button
              onClick={() => navigate(-1)}
              className="border-none bg-transparent cursor-pointer flex items-center"
            >
              <img
                width="30"
                height="30"
                src="https://img.icons8.com/ios/50/back--v1.png"
                alt="voltar"
              />
            </button>
            {!isMobile && (
              <h1 className="text-[20px] font-bold uppercase tracking-[2px]">
                {obra.nome}
              </h1>
            )}
          </div>
          {isMobile && (
            <h1 className="text-[18px] font-bold uppercase tracking-[2px]">
              {obra.nome}
            </h1>
          )}
          {!isMobile && (
            <div className="flex gap-[16px]">
              <ButtonDefault className="w-[180px] text-[14px]">
                + Materiais
              </ButtonDefault>
              <ButtonDefault className="w-[180px] text-[14px]">
                + Mão de Obra
              </ButtonDefault>
            </div>
          )}
        </div>
      </header>

      <main className="w-[90%] mt-[24px]">
        {isMobile && (
          <div className="flex flex-col gap-[12px] mb-[24px]">
            <ButtonDefault className="w-full h-[50px] text-[18px]">
              + Solicitar Materiais
            </ButtonDefault>
            <ButtonDefault className="w-full h-[50px] text-[18px]">
              + Solicitar Mão de Obra
            </ButtonDefault>
          </div>
        )}

        <div>
          <TabelaSimples
            titulo="Relatório de Materiais"
            colunas={["Material", "Quantidade", "Data"]}
            dados={obra.materiais}
          />

          <div className="bg-[#ffffff] border border-[#DBDADE] rounded-[12px] text-center px-[12px] shadow-sm flex flex-col items-center gap-[24px] mt-[24px] pt-[24px]">
            <TabelaSimples
              titulo="Relatório de Mão de Obra"
              colunas={["Tipo", "Valor", "Data"]}
              dados={obra.maoDeObra}
            />
            <ButtonDefault
              onClick={() =>
                gerarPDF(
                  "Relatorio de Mao de Obra",
                  ["Profissão", "Valor", "Data de Execução"],
                  obra.maoDeObra,
                  obra.nome,
                )
              }
              className="w-full max-w-[450px] mb-[24px] h-[47px] "
            >
              Gerar Relatório Mão-de-Obra (PDF)
            </ButtonDefault>
          </div>
        </div>

        <div className="bg-[#ffffff] border border-[#DBDADE] rounded-[12px] text-center px-[30px] shadow-sm flex flex-col items-center gap-[24px] mt-[24px] pt-[24px]">
          <h3 className="font-bold text-[#464C54] m-[0px]">
            Relatórios para Cliente
          </h3>
          {!isMobile && (
            <div className="w-full">
              <TabelaSimples
                titulo="Prévia do Relatório Semanal"
                colunas={[
                  "Material/Serviço",
                  "Tipo",
                  "Quantidade",
                  "Data",
                  "Valor",
                ]}
                dados={obra.relatorioCliente || []}
              />
            </div>
          )}
          <ButtonDefault
            onClick={() =>
              gerarPDF(
                "Relatório Semanal para Cliente",
                ["Item", "Tipo", "Qtd", "Data", "Valor"],
                obra.relatorioCliente,
                obra.nome,
              )
            }
            className="w-full max-w-[450px] mb-[24px] h-[47px] "
          >
            Gerar Relatório Cliente (PDF)
          </ButtonDefault>
        </div>
      </main>
    </div>
  );
}
