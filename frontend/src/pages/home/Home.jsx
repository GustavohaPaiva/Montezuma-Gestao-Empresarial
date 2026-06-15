import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { api } from "../../services/api";
import { homeDictionary } from "../../constants/dictionaries";
import { getModulosPermitidos } from "./homeModules";
import { useHomeDashboard } from "./hooks/useHomeDashboard";
import { useScrollFadeIn } from "../../hooks/useScrollFadeIn";
import {
  homePageClass,
  homePageInnerClass,
  getSaudacao,
  getPerfilLabel,
} from "./homeUi";
import HomeBackground from "./components/HomeBackground";
import Navbar from "../../components/navbar/Navbar";
import HomeWelcome from "./components/HomeWelcome";
import HomeDashboardStrip from "./components/HomeDashboardStrip";
import HomeModuleGrid from "./components/HomeModuleGrid";
import HomeProfilePhotoModal from "./components/HomeProfilePhotoModal";

export default function Home() {
  const { user, updateUserFoto } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const fileInputRef = useRef(null);
  const [fotoLocal, setFotoLocal] = useState(null);

  const [refNav, isNavVisible] = useScrollFadeIn();
  const [refMain, isMainVisible] = useScrollFadeIn();

  const modulosPermitidos = getModulosPermitidos(user);
  const { counts, loading, visible: dashboardVisible } = useHomeDashboard(user);

  const nomeUsuario =
    user?.nome ||
    user?.user_metadata?.nome ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Usuário";

  useEffect(() => {
    if (user) {
      setFotoLocal(user?.user_metadata?.foto || user?.foto || null);
    }
  }, [user]);

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
    <div className={homePageClass}>
      <HomeBackground />

      <div
        ref={refNav}
        className={`w-full transition-all duration-500 ease-out ${
          isNavVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
        }`}
      >
        <Navbar
          variant="home"
          brand={{
            name: homeDictionary.hero.brandName,
            tagline: homeDictionary.hero.brandTagline,
          }}
          title={homeDictionary.hero.title}
          subtitle={homeDictionary.hero.subtitle}
          userProfile={{
            nomeUsuario,
            fotoUrl: fotoLocal,
            perfilLabel: getPerfilLabel(user?.tipo),
            saudacao: getSaudacao(),
            onAvatarClick: handleAbrirModal,
          }}
        />
      </div>

      <main
        ref={refMain}
        className={`${homePageInnerClass} transition-all duration-700 ease-out ${
          isMainVisible
            ? "translate-y-0 opacity-100"
            : "translate-y-8 opacity-0"
        }`}
      >
        <HomeWelcome
          modulosCount={modulosPermitidos.length}
          nomeUsuario={nomeUsuario}
          saudacao={getSaudacao()}
        />
        {dashboardVisible ? (
          <HomeDashboardStrip counts={counts} loading={loading} />
        ) : null}
        <HomeModuleGrid
          modulos={modulosPermitidos}
          counts={counts}
          loadingCounts={loading}
          showStats={dashboardVisible}
        />
      </main>

      <HomeProfilePhotoModal
        isOpen={isModalOpen}
        onClose={handleFecharModal}
        previewUrl={previewUrl}
        selectedFile={selectedFile}
        uploadingFoto={uploadingFoto}
        onFileSelect={handleFileSelect}
        onConfirm={handleConfirmarUpload}
        fileInputRef={fileInputRef}
      />
    </div>
  );
}
