import { useState } from "react";
import logo from "../assets/MONT PASSARO.png";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function LoginAdm() {
  const [login, setLogin] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const navigate = useNavigate();
  const { loginAdmin } = useAuth();

  const handleNavigation = async () => {
    setErro("");
    setCarregando(true);
    try {
      await loginAdmin(login, senha);
      navigate("/");
    } catch (error) {
      console.error(error);
      setErro("Acesso negado. Verifique suas credenciais.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="flex h-[90vh] w-full items-center justify-center font-montserrat">
      <div className="flex box-border h-[550px] w-[825px] shadow-[20px_10px_20px_rgba(0,0,0,0.3)] rounded-[20px] overflow-hidden">
        {/* Lado Esquerdo - Igual */}
        <div className="flex px-[20px] box-border w-[70%] flex-col items-center bg-[#FD3A02] text-center text-white h-full">
          <img className="h-[95px] w-[130px] mt-[30px]" src={logo} alt="" />
          <h2 className="mt-[40px] mb-[15px] text-[18px] font-black uppercase">
            Bem-vindo ao acompanhamento <br /> do seu sonho.
          </h2>
          <p className="mt-0 text-[15px]">
            Aqui, cada etapa do processo representa a construção de algo único e
            especial. É um prazer ter você conosco mais uma vez.
          </p>
          <p className="mt-[40px] font-black uppercase text-[20px]">
            Salmos 127:1
          </p>
          <h3 className="">
            “Se o Senhor não edificar a casa, em vão trabalham os que a
            edificam.”
          </h3>
        </div>

        {/* Lado Direito - Admin */}
        <div className="flex w-full flex-col items-center text-center h-full bg-white justify-center">
          <p className="mb-[50px] mt-[50px] m-0 text-[25px] uppercase text-[#FD3A02]">
            Acesso Administrativo
          </p>

          {erro && <p className="text-red-600 text-sm mb-4">{erro}</p>}

          <input
            type="text"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            className="m-[6px] h-[45px] w-[60%] rounded-[60px] bg-gray-100 px-[12px] text-[17px] placeholder-gray-500 outline-none focus:ring-2 focus:ring-[#1900ffdc]"
            placeholder="Login"
          />

          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="m-[6px] h-[45px] w-[60%] rounded-[60px] bg-gray-100 px-[12px] text-[17px] placeholder-gray-500 outline-none focus:ring-2 focus:ring-[#1900ffdc]"
            placeholder="Senha"
          />

          <button
            type="button"
            onClick={handleNavigation}
            disabled={carregando}
            className="mt-[33px] mb-[20px] h-[45px] w-[150px] cursor-pointer rounded-[30px] border-none bg-[#FD3A02] text-white uppercase hover:bg-orange-700 transition-colors disabled:bg-gray-400"
          >
            <strong>{carregando ? "Validando..." : "Entrar"}</strong>
          </button>
        </div>
      </div>
    </div>
  );
}
