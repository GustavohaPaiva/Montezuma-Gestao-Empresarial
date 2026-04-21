import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { ID_VOGELKOP, ID_YBYOCA } from "../../constants/escritorios";
import { api } from "../../services/api";
import { UserRound, Camera, X, Hourglass } from "lucide-react";
import CardHome from "../../components/cards/CardHome";
import ModalPortal from "../../components/gerais/ModalPortal";
import logo from "../../assets/logos/logo sem fundo.png";
import imagemHome from "../../assets/img/ImagemHome.png";
import { homeDictionary } from "../../constants/dictionaries";

export default function Home() {
  const { user, updateUserFoto } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const fileInputRef = useRef(null);
  const [fotoLocal, setFotoLocal] = useState(null);

  useEffect(() => {
    if (user) {
      setFotoLocal(user?.user_metadata?.foto || user?.foto || null);
    }
  }, [user]);

  const modulos = [
    {
      id: 1,
      titulo: homeDictionary.modulos.meuEscritorio,
      imagem: "https://img.icons8.com/ios/125/building.png",
      path: null,
      meuEscritorio: true,
    },
    {
      id: 2,
      titulo: homeDictionary.modulos.processos,
      imagem:
        "https://img.icons8.com/external-outline-design-circle/125/external-Process-Lists-artificial-intelligence-outline-design-circle.png",
      path: "/processos",
      roles: ["gestor_master", "diretoria", "secretaria", "suporte_ti"],
    },
    {
      id: 3,
      titulo: homeDictionary.modulos.obras,
      imagem: "https://img.icons8.com/ios/125/company--v1.png",
      path: "/obras",
      roles: ["gestor_master", "diretoria", "suporte_ti"],
    },
    {
      id: 4,
      titulo: homeDictionary.modulos.financeiro,
      imagem:
        "https://img.icons8.com/external-outline-wichaiwi/125/external-financial-business-continuity-plan-outline-wichaiwi.png",
      path: "/financeiro",
      roles: ["gestor_master", "diretoria", "secretaria", "suporte_ti"],
    },

    {
      id: 5,
      titulo: homeDictionary.modulos.fornecedores,
      imagem: "https://img.icons8.com/ios/125/supplier.png",
      path: "/fornecedores",
      roles: ["gestor_master", "diretoria", "suporte_ti"],
    },

    {
      id: 6,
      titulo: homeDictionary.modulos.prestadores,
      imagem: "https://img.icons8.com/ios/125/worker-male.png",
      path: "/prestadores",
      roles: ["gestor_master", "diretoria", "suporte_ti"],
    },
  ];

  const modulosPermitidos = modulos
    .filter((modulo) => {
      if (modulo.meuEscritorio) {
        return (
          (user?.tipo === "diretoria" || user?.tipo === "gestor_master") &&
          (user?.escritorio_id === ID_VOGELKOP ||
            user?.escritorio_id === ID_YBYOCA)
        );
      }
      return modulo.roles.includes(user?.tipo);
    })
    .map((modulo) => {
      if (modulo.meuEscritorio) {
        const path =
          user?.escritorio_id === ID_VOGELKOP
            ? "/escritorio/vogelkop"
            : "/escritorio/ybyoca";
        return { ...modulo, path };
      }
      return modulo;
    });

  const handleAbrirModal = () => {
    setSelectedFile(null);
    setPreviewUrl(fotoLocal);
    setIsModalOpen(true);
  };

  const handleFecharModal = () => {
    if (uploadingFoto) return;
    setIsModalOpen(false);
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleConfirmarUpload = async () => {
    if (!selectedFile) {
      alert(homeDictionary.modalFoto.pickImageError);
      return;
    }

    if (!user?.id) {
      alert(homeDictionary.modalFoto.missingUserIdError);
      return;
    }

    try {
      setUploadingFoto(true);

      const response = await api.uploadFotoUsuario(user.id, selectedFile);

      setFotoLocal(response.fotoUrl);
      updateUserFoto(response.fotoUrl);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Erro ao fazer upload da foto:", error);
      alert(homeDictionary.modalFoto.uploadError);
    } finally {
      setUploadingFoto(false);
      if (fileInputRef.current) fileInputRef.current.value = null;
    }
  };

  return (
    <div
      className="text-center min-h-screen bg-cover bg-center bg-no-repeat relative pb-[60px]"
      style={{ backgroundImage: `url(${imagemHome})` }}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        className="hidden"
      />

      {isModalOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
            <div className="bg-white rounded-2xl w-full max-w-sm p-6 flex flex-col items-center shadow-xl relative animate-in fade-in zoom-in-95 duration-200">
              <button
                onClick={handleFecharModal}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 transition-colors"
                disabled={uploadingFoto}
              >
                <X size={24} />
              </button>

              <h2 className="text-xl font-bold text-text-primary mb-6">
                {homeDictionary.modalFoto.title}
              </h2>

              <div className="relative w-[150px] h-[150px] rounded-full border-[3px] border-accent-primary flex items-center justify-center bg-avatar-bg overflow-hidden mb-6 shadow-sm">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserRound className="w-[80px] h-[80px] text-accent-primary" />
                )}
              </div>

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingFoto}
                className="w-full py-3 px-4 bg-bg-primary text-text-primary font-bold rounded-lg border border-border-primary hover:bg-gray-200 transition-colors mb-6 flex items-center justify-center gap-2"
              >
                <Camera className="w-5 h-5" />
                {selectedFile
                  ? homeDictionary.modalFoto.changeImage
                  : homeDictionary.modalFoto.chooseImage}
              </button>

              <div className="w-full flex gap-3">
                <button
                  onClick={handleFecharModal}
                  disabled={uploadingFoto}
                  className="flex-1 py-3 rounded-lg font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  {homeDictionary.modalFoto.cancel}
                </button>
                <button
                  onClick={handleConfirmarUpload}
                  disabled={!selectedFile || uploadingFoto}
                  className={`flex-1 py-3 rounded-lg font-bold text-white transition-colors flex items-center justify-center gap-2 ${!selectedFile || uploadingFoto ? "bg-gray-300 cursor-not-allowed" : "bg-accent-primary hover:bg-accent-primary-dark"}`}
                >
                  {uploadingFoto ? (
                    <Hourglass className="w-5 h-5 animate-spin" />
                  ) : (
                    homeDictionary.modalFoto.savePhoto
                  )}
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      <div className="w-full flex justify-end pt-4 px-16 relative z-10">
        <div
          className="relative cursor-pointer group"
          onClick={handleAbrirModal}
          title="Alterar foto de perfil"
        >
          {fotoLocal ? (
            <img
              src={fotoLocal}
              alt="Foto Usuário"
              className="w-[50px] h-[50px] rounded-[50%] border-2 border-accent-primary object-cover group-hover:opacity-70 transition-opacity bg-surface"
            />
          ) : (
            <div className="w-[50px] h-[50px] rounded-[50%] border-2 border-accent-primary flex items-center justify-center bg-surface group-hover:opacity-70 transition-opacity">
              <UserRound className="w-[30px] h-[30px] text-accent-primary" />
            </div>
          )}
        </div>
      </div>

      <div className="w-full p-5 md:p-20 md:pt-7 flex md:flex-row flex-col justify-center items-center gap-8 md:gap-14 relative z-10">
        <img src={logo} className="w-30 md:w-60" alt="Logo Montezuma" />
        <div className="flex md:gap-5 items-center md:items-start flex-col">
          <h2 className="text-3xl md:text-7xl font-bold">
            {homeDictionary.hero.title}
          </h2>
          <p className="text-xl md:text-3xl">{homeDictionary.hero.subtitle}</p>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-8 relative z-10 mx-auto max-w-[1200px]">
        {modulosPermitidos.map((item) => (
          <div
            key={item.id}
            className="w-full md:w-[calc(33.333%-22px)] min-w-[200px] max-w-[320px]"
          >
            <CardHome titulo={item.titulo} img={item.imagem} path={item.path} />
          </div>
        ))}
      </div>
    </div>
  );
}
