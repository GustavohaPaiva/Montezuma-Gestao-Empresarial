import ButtonDefault from "../gerais/ButtonDefault";

export default function ModalInformacaoCliente({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-center w-full h-full bg-black/40">
      {/* Container principal do Modal */}
      <div className="bg-[#ffffff] gap-[20px] w-[800px] max-w-[95%] rounded-[16px] p-[20px] shadow-2xl flex flex-col overflow-hidden max-h-[95vh] border border-[#C4C4C9]">
        {/* Header - Fixo */}
        <div className="flex justify-between items-center shrink-0">
          <h2 className="text-[24px] font-bold text-[#000000] text-center w-full">
            Informações Completas do Cliente
          </h2>
          <button
            onClick={onClose}
            className="cursor-pointer border-none bg-transparent"
          >
            <img
              width="30"
              height="30"
              src="https://img.icons8.com/ios/50/multiply.png"
              alt="fechar"
            />
          </button>
        </div>
        {/* Conteúdo Rolável (Scroll) */}
        <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-6 custom-scrollbar">
          {/* Informações do cliente */}
          <div className="px-[10px] border-t border-[#C4C4C9] pt-[15px] flex flex-col">
            <div className="w-full text-center mb-4">
              <h3 className="text-[25px]">Informações do cliente</h3>
            </div>

            <div className="flex flex-col md:flex-row justify-center gap-4 mb-2 w-full">
              <div className="flex flex-col text-left gap-1 w-full">
                <label className="text-[#71717A] text-sm">
                  Nome do Proprietario (nome completo)
                </label>
                <input
                  type="text"
                  name="nome"
                  className="border border-[#DBDADE] rounded-[8px] p-2 focus:outline-none focus:border-[#464C54]"
                  placeholder="Ex: João da Silva"
                />
              </div>
              <div className="flex flex-col text-left gap-1 w-full">
                <label className="text-[#71717A] text-sm">CPF do Cliente</label>
                <input
                  type="text"
                  name="cpf"
                  className="border border-[#DBDADE] rounded-[8px] p-2 focus:outline-none focus:border-[#464C54]"
                  placeholder="Ex: 123.456.789-00"
                />
              </div>
            </div>
            <div className="flex flex-col md:flex-row justify-center mt-4 gap-4 w-full">
              <div className="flex flex-col text-left gap-1 w-full">
                <label className="text-[#71717A] text-sm">
                  E-mail do Proprietário
                </label>
                <input
                  type="text"
                  name="email"
                  className="border border-[#DBDADE] rounded-[8px] p-2 focus:outline-none focus:border-[#464C54]"
                  placeholder="Ex: joao@dominio.com"
                />
              </div>
              <div className="flex flex-col text-left gap-1 w-full">
                <label className="text-[#71717A] text-sm">RG</label>
                <input
                  type="text"
                  name="RG"
                  className="border border-[#DBDADE] rounded-[8px] p-2 focus:outline-none focus:border-[#464C54]"
                  placeholder="Ex: MG-12.345.678"
                />
              </div>
            </div>
            <div className="flex flex-col md:flex-row justify-center gap-1 mt-4 w-full">
              <div className="flex flex-col text-left gap-1 w-full">
                <label className="text-[#71717A] text-sm">Profissão</label>
                <input
                  type="text"
                  name="profissao"
                  className="border border-[#DBDADE] rounded-[8px] p-2 focus:outline-none focus:border-[#464C54]"
                  placeholder="Ex: Engenheiro Civil"
                />
              </div>
            </div>
          </div>

          {/* Informações de Moradia do cliente */}
          <div className="px-[10px] border-t border-[#C4C4C9] pt-[15px] flex flex-col">
            <div className="w-full text-center mb-4">
              <h3 className="text-[25px]">Informações de Moradia</h3>
            </div>

            <div className="flex flex-col md:flex-row justify-center gap-4 mb-2 w-full">
              <div className="flex flex-col text-left gap-1 w-full">
                <label className="text-[#71717A] text-sm">Bairro</label>
                <input
                  type="text"
                  name="bairro"
                  className="border border-[#DBDADE] rounded-[8px] p-2 focus:outline-none focus:border-[#464C54]"
                  placeholder="Ex: Centro"
                />
              </div>
              <div className="flex flex-col text-left gap-1 w-full">
                <label className="text-[#71717A] text-sm">Rua</label>
                <input
                  type="text"
                  name="rua"
                  className="border border-[#DBDADE] rounded-[8px] p-2 focus:outline-none focus:border-[#464C54]"
                  placeholder="Ex: Rua das Flores"
                />
              </div>
              <div className="flex flex-col text-left gap-1 w-full md:w-[17%]">
                <label className="text-[#71717A] text-sm">Nº</label>
                <input
                  type="text"
                  name="numero_casa"
                  className="border border-[#DBDADE] rounded-[8px] p-2 focus:outline-none focus:border-[#464C54]"
                  placeholder="Ex: 123"
                />
              </div>
            </div>

            <div className="flex flex-col md:flex-row justify-center gap-4 mb-2 w-full">
              <div className="flex flex-col text-left gap-1 w-full">
                <label className="text-[#71717A] text-sm">Cidade</label>
                <input
                  type="text"
                  name="cidade"
                  className="border border-[#DBDADE] rounded-[8px] p-2 focus:outline-none focus:border-[#464C54]"
                  placeholder="Ex: Uberaba"
                />
              </div>
              <div className="flex flex-col text-left gap-1 w-full">
                <label className="text-[#71717A] text-sm">Estado</label>
                <input
                  type="text"
                  name="estado"
                  className="border border-[#DBDADE] rounded-[8px] p-2 focus:outline-none focus:border-[#464C54]"
                  placeholder="Ex: MG"
                />
              </div>
              <div className="flex flex-col text-left gap-1 w-full md:w-[17%]">
                <label className="text-[#71717A] text-sm">CEP</label>
                <input
                  type="text"
                  name="cep"
                  className="border border-[#DBDADE] rounded-[8px] p-2 focus:outline-none focus:border-[#464C54]"
                  placeholder="Ex: 12345-678"
                />
              </div>
            </div>
            <div className="flex flex-col md:flex-row justify-center gap-4 mb-2 w-full">
              <div className="flex flex-col text-left gap-1 w-full">
                <label className="text-[#71717A] text-sm">Complemento</label>
                <input
                  type="text"
                  name="complemento"
                  className="border border-[#DBDADE] rounded-[8px] p-2 focus:outline-none focus:border-[#464C54]"
                  placeholder="Ex: Apto 101, Casa"
                />
              </div>
            </div>
          </div>

          {/* Informações da Obra */}
          <div className="px-[10px] border-t border-[#C4C4C9] pt-[15px] flex flex-col">
            <div className="w-full text-center mb-4">
              <h3 className="text-[25px]">Informações da Obra</h3>
            </div>

            <div className="flex flex-col md:flex-row justify-center gap-4 mb-2 w-full">
              <div className="flex flex-col text-left gap-1 w-full">
                <label className="text-[#71717A] text-sm">Bairro</label>
                <input
                  type="text"
                  name="bairro_obra"
                  className="border border-[#DBDADE] rounded-[8px] p-2 focus:outline-none focus:border-[#464C54]"
                  placeholder="Ex: Centro"
                />
              </div>
              <div className="flex flex-col text-left gap-1 w-full">
                <label className="text-[#71717A] text-sm">Rua</label>
                <input
                  type="text"
                  name="rua_obra"
                  className="border border-[#DBDADE] rounded-[8px] p-2 focus:outline-none focus:border-[#464C54]"
                  placeholder="Ex: Rua das Flores"
                />
              </div>
              <div className="flex flex-col text-left gap-1 w-full">
                <label className="text-[#71717A] text-sm">Número</label>
                <input
                  type="text"
                  name="numero_obra"
                  className="border border-[#DBDADE] rounded-[8px] p-2 focus:outline-none focus:border-[#464C54]"
                  placeholder="Ex: 123"
                />
              </div>
            </div>

            <div className="flex flex-col md:flex-row justify-center mt-4 gap-4 w-full">
              <div className="flex flex-col text-left gap-1 w-full">
                <label className="text-[#71717A] text-sm">Tamanho em m²</label>
                <input
                  type="text"
                  name="tamanho_m2"
                  className="border border-[#DBDADE] rounded-[8px] p-2 focus:outline-none focus:border-[#464C54]"
                  placeholder="Ex: 120.5 m²"
                />
              </div>

              <div className="flex flex-col text-left gap-1 w-full">
                <label className="text-[#71717A] text-sm">Lote</label>
                <input
                  type="text"
                  name="lote"
                  className="border border-[#DBDADE] rounded-[8px] p-2 focus:outline-none focus:border-[#464C54]"
                  placeholder="Ex: Lote 123"
                />
              </div>

              <div className="flex flex-col text-left gap-1 w-full">
                <label className="text-[#71717A] text-sm">Quadra</label>
                <input
                  type="text"
                  name="quadra"
                  className="border border-[#DBDADE] rounded-[8px] p-2 focus:outline-none focus:border-[#464C54]"
                  placeholder="Ex: quadra 5"
                />
              </div>
            </div>

            <div className="flex flex-col md:flex-row justify-center mt-4 gap-4 w-full">
              <div className="flex flex-col text-left gap-1 w-full">
                <label className="text-[#71717A] text-sm">
                  Codigo de identificação do imóvel
                </label>
                <input
                  type="text"
                  name="codigo_identificacao_imovel"
                  className="border border-[#DBDADE] rounded-[8px] p-2 focus:outline-none focus:border-[#464C54]"
                  placeholder="Ex: 123456798"
                />
              </div>

              <div className="flex flex-col text-left gap-1 w-full">
                <label className="text-[#71717A] text-sm">ART</label>
                <input
                  type="text"
                  name="art"
                  className="border border-[#DBDADE] rounded-[8px] p-2 focus:outline-none focus:border-[#464C54]"
                  placeholder="Ex: 123456798"
                />
              </div>
            </div>
            <div className="flex flex-col md:flex-row justify-center mt-4 gap-4 w-full">
              <div className="flex flex-col text-left gap-1 w-full">
                <label className="text-[#71717A] text-sm">Padrão Cub.</label>
                <select className="w-full h-[45px] text-[16px] px-[12px] border border-[#C4C4C9] rounded-[8px] bg-[#F7F7F8] focus:outline-none box-border">
                  <option value="Á vista">Á vista</option>
                  <option value="Debito">Débito</option>
                  <option value="Crédito">Crédito</option>
                  <option value="Parcelado">Parcelado</option>
                </select>
              </div>
            </div>
          </div>

          {/* Informações do Alvara */}
          <div className="px-[10px] border-t border-[#C4C4C9] pt-[15px] flex flex-col">
            <div className="w-full text-center mb-4">
              <h3 className="text-[25px]">Informações do Alvara</h3>
            </div>
            <div className="flex flex-col md:flex-row justify-center mt-4 gap-4 w-full">
              <div className="flex flex-col text-left gap-1 w-full">
                <label className="text-[#71717A] text-sm">
                  Número do Alvara
                </label>
                <input
                  type="text"
                  name="numero_alvara"
                  className="border border-[#DBDADE] rounded-[8px] p-2 focus:outline-none focus:border-[#464C54]"
                  placeholder="Ex: 123456798"
                />
              </div>

              <div className="flex flex-col text-left gap-1 w-full">
                <label className="text-[#71717A] text-sm">Data expedição</label>
                <input
                  type="text"
                  name="data_expedicao"
                  className="border border-[#DBDADE] rounded-[8px] p-2 focus:outline-none focus:border-[#464C54]"
                  placeholder="Ex: 12/12/2020"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-2 pt-4 border-t border-[#C4C4C9] shrink-0">
          <div className="flex-1 w-full">
            <ButtonDefault className="w-full">Salvar</ButtonDefault>
          </div>
        </div>
      </div>
    </div>
  );
}
