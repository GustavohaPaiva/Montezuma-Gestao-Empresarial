import { useRef } from "react";
import { UserRound, Camera, X, Hourglass } from "lucide-react";
import ModalPortal from "../../../components/gerais/ModalPortal";
import { homeDictionary } from "../../../constants/dictionaries";

export default function HomeProfilePhotoModal({
  isOpen,
  onClose,
  previewUrl,
  selectedFile,
  uploadingFoto,
  onFileSelect,
  onConfirm,
  fileInputRef,
}) {
  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
        <div className="animate-in fade-in zoom-in-95 relative flex w-full max-w-sm flex-col items-center rounded-2xl bg-white p-6 shadow-xl duration-200">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 text-gray-400 transition-colors hover:text-gray-800"
            disabled={uploadingFoto}
            aria-label="Fechar"
          >
            <X size={24} />
          </button>

          <h2 className="mb-6 text-xl font-bold text-text-primary">
            {homeDictionary.modalFoto.title}
          </h2>

          <div className="relative mb-6 flex h-[150px] w-[150px] items-center justify-center overflow-hidden rounded-full border-[3px] border-accent-primary bg-avatar-bg shadow-sm">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <UserRound className="h-[80px] w-[80px] text-accent-primary" />
            )}
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={onFileSelect}
            accept="image/*"
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingFoto}
            className="mb-6 flex w-full items-center justify-center gap-2 rounded-lg border border-border-primary bg-bg-primary px-4 py-3 font-bold text-text-primary transition-colors hover:bg-gray-200"
          >
            <Camera className="h-5 w-5" />
            {selectedFile
              ? homeDictionary.modalFoto.changeImage
              : homeDictionary.modalFoto.chooseImage}
          </button>

          <div className="flex w-full gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={uploadingFoto}
              className="flex-1 rounded-lg bg-gray-100 py-3 font-bold text-gray-600 transition-colors hover:bg-gray-200"
            >
              {homeDictionary.modalFoto.cancel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={!selectedFile || uploadingFoto}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-3 font-bold text-white transition-colors ${
                !selectedFile || uploadingFoto
                  ? "cursor-not-allowed bg-gray-300"
                  : "bg-accent-primary hover:bg-accent-primary-dark"
              }`}
            >
              {uploadingFoto ? (
                <Hourglass className="h-5 w-5 animate-spin" />
              ) : (
                homeDictionary.modalFoto.savePhoto
              )}
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
