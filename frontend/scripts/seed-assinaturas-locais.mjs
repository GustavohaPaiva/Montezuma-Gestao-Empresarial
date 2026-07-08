/**
 * Envia assinaturas de src/assets/Assinaturas para usuários correspondentes.
 *
 * Uso (pasta frontend):
 *   1. Adicione ao .env: SEED_LOGIN=seu_usuario  SEED_SENHA=sua_senha
 *   2. node scripts/seed-assinaturas-locais.mjs
 *
 * Se aparecer erro de certificado TLS no Windows:
 *   node --use-system-ca scripts/seed-assinaturas-locais.mjs
 * ou (somente dev local):
 *   SEED_INSECURE_TLS=1 node scripts/seed-assinaturas-locais.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const envPath = join(__dirname, "..", ".env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i <= 0) continue;
    const key = t.slice(0, i).trim();
    const val = t
      .slice(i + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnv();

if (process.env.SEED_INSECURE_TLS === "1") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  console.warn(
    "AVISO: SEED_INSECURE_TLS=1 — verificação TLS desativada (apenas dev local).",
  );
}

const supabaseUrl = process.env.VITE_SUPABASE_URL?.trim();
const anonKey = process.env.VITE_SUPABASE_ANON_KEY?.trim();
const login = process.env.SEED_LOGIN?.trim();
const senha = process.env.SEED_SENHA?.trim();

const REFERENCIAS = [
  { arquivo: "Gustavo.jpg", nomeSugerido: "Gustavo" },
  { arquivo: "Leonardo.jpg", nomeSugerido: "Leonardo" },
  { arquivo: "Otavio.jpg", nomeSugerido: "Otavio" },
  { arquivo: "Paulo Vitor.jpg", nomeSugerido: "Paulo Vitor" },
];

function sair(mensagem, code = 1) {
  console.error(mensagem);
  process.exit(code);
}

function tratarErroRede(err, contexto) {
  const cause = err?.cause ?? err;
  const code = cause?.code ?? "";
  const msg = String(cause?.message ?? err?.message ?? err);

  if (
    code === "UNABLE_TO_VERIFY_LEAF_SIGNATURE" ||
    msg.includes("unable to verify") ||
    msg === "fetch failed"
  ) {
    sair(
      `${contexto}: falha de certificado TLS ao conectar ao Supabase.\n` +
        "Tente uma destas opções:\n" +
        "  node --use-system-ca scripts/seed-assinaturas-locais.mjs\n" +
        "  SEED_INSECURE_TLS=1 node scripts/seed-assinaturas-locais.mjs\n" +
        `(detalhe: ${msg})`,
    );
  }

  sair(`${contexto}: ${msg}`);
}

if (!supabaseUrl || !anonKey) {
  sair("Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no frontend/.env");
}

if (!login || !senha || login === "seu_login" || senha === "sua_senha") {
  sair(
    "Defina credenciais reais no .env:\n" +
      "  SEED_LOGIN=login_admin\n" +
      "  SEED_SENHA=senha_admin\n" +
      "(mesmo login/senha do /loginadm, sem @sistema.com)",
  );
}

const supabase = createClient(supabaseUrl, anonKey);
const assetsDir = join(__dirname, "..", "src", "assets", "Assinaturas");

let authErr;
try {
  const result = await supabase.auth.signInWithPassword({
    email: `${login}@sistema.com`,
    password: senha,
  });
  authErr = result.error;
} catch (err) {
  tratarErroRede(err, "Login");
}

if (authErr) {
  sair(`Login falhou: ${authErr.message}`);
}

const { data: usuarios, error: listErr } = await supabase
  .from("usuarios")
  .select("id, nome")
  .neq("tipo", "cliente");
if (listErr) {
  sair(`Listagem falhou: ${listErr.message}`);
}

let ok = 0;
for (const ref of REFERENCIAS) {
  const path = join(assetsDir, ref.arquivo);
  if (!existsSync(path)) {
    console.warn(`Arquivo não encontrado: ${path}`);
    continue;
  }

  const usuario = (usuarios || []).find((u) =>
    String(u.nome ?? "")
      .toLowerCase()
      .includes(ref.nomeSugerido.toLowerCase()),
  );
  if (!usuario) {
    console.warn(`Usuário não encontrado para: ${ref.nomeSugerido}`);
    continue;
  }

  const buffer = readFileSync(path);
  const filePath = `${usuario.id}/assinatura.jpg`;
  const { error: upErr } = await supabase.storage
    .from("assinaturas_usuarios")
    .upload(filePath, buffer, {
      upsert: true,
      contentType: "image/jpg",
    });
  if (upErr) {
    console.error(`Upload ${ref.arquivo}: ${upErr.message}`);
    continue;
  }

  const { data: urlData } = supabase.storage
    .from("assinaturas_usuarios")
    .getPublicUrl(filePath);

  const { error: updErr } = await supabase
    .from("usuarios")
    .update({ assinatura_url: urlData.publicUrl })
    .eq("id", usuario.id);
  if (updErr) {
    console.error(`Update ${usuario.nome}: ${updErr.message}`);
    continue;
  }

  console.log(`OK: ${usuario.nome} <- ${ref.arquivo}`);
  ok += 1;
}

await supabase.auth.signOut();

if (ok === 0) {
  sair(
    "Nenhuma assinatura foi enviada. Verifique migration/bucket e nomes dos usuários.",
  );
}

console.log(`Concluído. ${ok} assinatura(s) enviada(s).`);
