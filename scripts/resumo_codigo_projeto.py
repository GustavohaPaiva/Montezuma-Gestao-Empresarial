#!/usr/bin/env python3
"""
Relatório completo do repositório Montezuma Gestão Empresarial.

Gera Markdown com:
  1) Inventário (extensões, linhas, lista de arquivos)
  2) Mapa heurístico de REGRAS DE NEGÓCIO (padrões no código: auth, papéis, rotas, API, SQL)
  3) Opcionalmente o CONTEÚDO INTEIRO de cada arquivo (sem limite de tamanho por padrão)

A seção de regras é automática: não substitui documentação humana, mas aponta onde
no código aparecem decisões típicas de negócio (login, tipo de usuário, rotas, Supabase).

Uso (na raiz do repo):
  python scripts/resumo_codigo_projeto.py
  python scripts/resumo_codigo_projeto.py -o docs/relatorio.md
  python scripts/resumo_codigo_projeto.py --completo -o dump_projeto.md
  python scripts/resumo_codigo_projeto.py --conteudo --max-bytes 0 -o tudo.md

  # Sem heurística de regras (só inventário + dump)
  python scripts/resumo_codigo_projeto.py --completo --sem-regras -o so_codigo.md
"""

from __future__ import annotations

import argparse
import os
import re
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path


DEFAULT_IGNORE_DIR_NAMES = {
    ".git",
    ".hg",
    ".svn",
    "node_modules",
    "dist",
    "build",
    ".next",
    "coverage",
    ".nyc_output",
    "__pycache__",
    ".pytest_cache",
    ".venv",
    "venv",
    ".idea",
    ".vscode",
    "mcps",
}

DEFAULT_IGNORE_FILE_SUFFIXES = (
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".webp",
    ".ico",
    ".pdf",
    ".zip",
    ".woff",
    ".woff2",
    ".ttf",
    ".eot",
)

SPECIAL_FILENAMES = {
    ".gitignore",
    ".editorconfig",
    ".env",
    ".env.local",
    ".env.example",
    "Dockerfile",
    "Makefile",
    "LICENSE",
    "README",
    "README.md",
}

DEFAULT_EXTENSIONS = {
    ".py",
    ".js",
    ".jsx",
    ".mjs",
    ".cjs",
    ".ts",
    ".tsx",
    ".css",
    ".scss",
    ".html",
    ".sql",
    ".md",
    ".json",
    ".yml",
    ".yaml",
    ".toml",
    ".env",
    ".example",
    ".sh",
    ".bash",
    ".xml",
    ".lock",
}

# (categoria, descrição curta, regex por linha)
BUSINESS_LINE_PATTERNS: list[tuple[str, str, re.Pattern[str]]] = [
    (
        "Autenticação e sessão",
        "Login, Supabase Auth, sessão local",
        re.compile(
            r"loginAdmin|loginCliente|signInWithPassword|signOut\(|getSession|getUser\(|"
            r"sessionStorage|montezuma_session|AuthProvider|useAuth\b",
            re.IGNORECASE,
        ),
    ),
    (
        "Papéis, permissões e perfis",
        "Tipos de usuário, guards de rota, checagens de tipo",
        re.compile(
            r"allowedTypes|RotaProtegida|user\?\.tipo|user\.tipo|tipo\s*===|tipo\s*==|"
            r"encarregado|gestor_master|diretoria|secretaria|suporte_ti|somenteProcesso|"
            r"isSomenteProcesso|isEncarregado|allowedEscritorios",
            re.IGNORECASE,
        ),
    ),
    (
        "Rotas e navegação",
        "React Router, paths, redirecionamentos",
        re.compile(
            r"<Route\b|createBrowserRouter|HashRouter|path=\{|path=\"|navigate\(|"
            r"<Navigate\b|to=\{|useParams\b|useNavigate\b",
            re.IGNORECASE,
        ),
    ),
    (
        "Integração API / Supabase client",
        "Chamadas api.* e supabase.*",
        re.compile(
            r"\bapi\.[a-zA-Z0-9_]+\b|supabase\.(from|rpc|auth|storage)\b",
            re.IGNORECASE,
        ),
    ),
    (
        "SQL, RLS e integridade",
        "Políticas, constraints, triggers em migrations",
        re.compile(
            r"\b(create|alter)\s+table\b|\b(policy|policies)\b|row\s+level\s+security|"
            r"\bRLS\b|\bconstraint\b|\bcheck\s*\(|\btrigger\b|\bforeign\s+key\b",
            re.IGNORECASE,
        ),
    ),
    (
        "Domínio Obras / Cliente (termos)",
        "Palavras-chave frequentes no domínio",
        re.compile(
            r"\bobra(s)?\b|\bcliente(s)?\b|modalidade|cronograma|etapa|material|"
            r"mão de obra|extrato|financeiro|relatório",
            re.IGNORECASE,
        ),
    ),
]


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument(
        "-r",
        "--raiz",
        type=Path,
        default=None,
        help="Raiz do projeto (default: diretório pai de scripts/)",
    )
    p.add_argument(
        "-o",
        "--saida",
        type=Path,
        default=Path("resumo_codigo_projeto.md"),
        help="Arquivo de saída (default: resumo_codigo_projeto.md na raiz)",
    )
    p.add_argument(
        "--conteudo",
        action="store_true",
        help="Incluir o conteúdo completo de cada arquivo listado",
    )
    p.add_argument(
        "--completo",
        action="store_true",
        help="Atalho: --conteudo + incluir *.lock + sem limite de bytes",
    )
    p.add_argument(
        "--max-bytes",
        type=int,
        default=None,
        help="Ignorar arquivos maiores que N bytes no dump (default: sem limite). Use p.ex. 1000000 se precisar.",
    )
    p.add_argument(
        "--incluir-lock",
        action="store_true",
        help="Incluir package-lock.json e outros *.lock (também ligado por --completo)",
    )
    p.add_argument(
        "--sem-regras",
        action="store_true",
        help="Não gerar a seção heurística de regras de negócio",
    )
    p.add_argument(
        "--max-ocorrencias-regras",
        type=int,
        default=8000,
        help="Teto global de linhas citadas na seção de regras (default 8000)",
    )
    p.add_argument(
        "--max-linha-snippet",
        type=int,
        default=400,
        help="Caracteres máximos por linha citada nas regras (default 400)",
    )
    return p.parse_args()


def repo_root_from_script() -> Path:
    return Path(__file__).resolve().parent.parent


def should_skip_dir(name: str, ignore_names: set[str]) -> bool:
    return name in ignore_names


def include_source_file(
    fp: Path,
    extensions: set[str],
    ignore_suffixes: tuple[str, ...],
    include_lock: bool,
) -> bool:
    name = fp.name
    suf = fp.suffix.lower()

    if not include_lock and name.endswith(".lock"):
        return False
    if suf in ignore_suffixes:
        return False
    if name in SPECIAL_FILENAMES:
        return True
    if suf in extensions:
        return True
    if suf == "" and name in ("README", "LICENSE"):
        return True
    return False


def collect_files(
    root: Path,
    extensions: set[str],
    ignore_dirs: set[str],
    ignore_suffixes: tuple[str, ...],
    include_lock: bool,
) -> list[Path]:
    out: list[Path] = []
    for dirpath, dirnames, filenames in os.walk(root):
        dpath = Path(dirpath)
        dirnames[:] = [d for d in dirnames if not should_skip_dir(d, ignore_dirs)]
        for fn in filenames:
            fp = dpath / fn
            try:
                if not fp.is_file():
                    continue
            except OSError:
                continue
            if include_source_file(fp, extensions, ignore_suffixes, include_lock):
                out.append(fp)
    out.sort(key=lambda p: str(p).replace("\\", "/").lower())
    return out


def read_text_file(path: Path) -> str | None:
    try:
        raw = path.read_bytes()
    except OSError:
        return None
    if b"\0" in raw[:8192]:
        return None
    try:
        return raw.decode("utf-8")
    except UnicodeDecodeError:
        try:
            return raw.decode("latin-1")
        except UnicodeDecodeError:
            return None


def count_lines(path: Path) -> int | None:
    text = read_text_file(path)
    if text is None:
        return None
    return text.count("\n") + (0 if text.endswith("\n") or text == "" else 1)


def fence_lang(path: Path) -> str:
    suf = path.suffix.lower()
    return {
        ".js": "javascript",
        ".jsx": "jsx",
        ".ts": "typescript",
        ".tsx": "tsx",
        ".py": "python",
        ".sql": "sql",
        ".json": "json",
        ".yaml": "yaml",
        ".yml": "yaml",
        ".md": "markdown",
        ".css": "css",
        ".html": "html",
        ".sh": "bash",
        ".bash": "bash",
    }.get(suf, "")


def scan_business_rules(
    root: Path,
    files: list[Path],
    max_total: int,
    max_line_chars: int,
) -> tuple[list[str], bool]:
    """Retorna linhas Markdown e se houve truncamento global."""
    lines_out: list[str] = []
    lines_out.append(
        "Esta secção lista **trechos de código** onde aparecem decisões típicas de "
        "negócio (autenticação, perfis, rotas, API, SQL). Foi gerada por **heurística** "
        "(expressões regulares), não substitui análise manual.\n\n"
    )
    total = 0
    truncated = False

    for categoria, descricao, pattern in BUSINESS_LINE_PATTERNS:
        lines_out.append(f"### {categoria}\n")
        lines_out.append(f"_{descricao}_\n\n")
        for fp in files:
            if total >= max_total:
                truncated = True
                break
            rel = fp.relative_to(root).as_posix()
            text = read_text_file(fp)
            if text is None:
                continue
            for i, line in enumerate(text.splitlines(), 1):
                if total >= max_total:
                    truncated = True
                    break
                if not pattern.search(line):
                    continue
                snippet = line.strip()
                if len(snippet) > max_line_chars:
                    snippet = snippet[: max_line_chars - 3] + "..."
                snippet = snippet.replace("`", "'")
                lines_out.append(f"- `{rel}` **L{i}:** `{snippet}`\n")
                total += 1
        lines_out.append("\n")
        if truncated:
            break

    if truncated:
        lines_out.append(
            f"\n> **Atenção:** truncado em **{max_total}** ocorrências globais. "
            "Aumente `--max-ocorrencias-regras` se precisar de mais.\n\n"
        )
    return lines_out, truncated


def main() -> None:
    args = parse_args()
    root = (args.raiz or repo_root_from_script()).resolve()
    saida = (args.saida if args.saida.is_absolute() else root / args.saida).resolve()

    include_lock = bool(args.incluir_lock or args.completo)
    conteudo = bool(args.conteudo or args.completo)
    max_bytes = args.max_bytes
    if args.completo:
        max_bytes = None

    ignore_dirs = set(DEFAULT_IGNORE_DIR_NAMES)
    ignore_suffixes = tuple(DEFAULT_IGNORE_FILE_SUFFIXES)

    extensions = set(DEFAULT_EXTENSIONS)
    if not include_lock:
        extensions.discard(".lock")

    files = collect_files(root, extensions, ignore_dirs, ignore_suffixes, include_lock)

    by_ext: Counter[str] = Counter()
    lines_by_ext: defaultdict[str, int] = defaultdict(int)
    file_lines: list[tuple[Path, int | None]] = []

    for fp in files:
        rel = fp.relative_to(root)
        ext = fp.suffix.lower() or "(sem extensão)"
        by_ext[ext] += 1
        n = count_lines(fp)
        file_lines.append((rel, n))
        if n is not None:
            lines_by_ext[ext] += n

    total_files = len(files)
    total_lines = sum(n for _, n in file_lines if n is not None)

    agora = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

    lines_out: list[str] = []
    lines_out.append("# Relatório completo do projeto\n\n")
    lines_out.append(f"- **Raiz:** `{root}`\n")
    lines_out.append(f"- **Gerado em:** {agora}\n")
    lines_out.append(f"- **Arquivos considerados:** {total_files}\n")
    lines_out.append(f"- **Linhas (aprox.):** {total_lines}\n")
    lines_out.append(f"- **Dump de conteúdo:** {'sim' if conteudo else 'não'}\n")
    if conteudo:
        lim = "sem limite" if max_bytes is None else str(max_bytes)
        lines_out.append(f"- **Limite de bytes por arquivo no dump:** {lim}\n")
    lines_out.append("\n## Inventário por extensão\n\n")
    lines_out.append("| Extensão | Arquivos | Linhas |\n")
    lines_out.append("|---|---:|---:|\n")
    for ext in sorted(by_ext.keys(), key=lambda e: (-by_ext[e], e)):
        lines_out.append(
            f"| `{ext}` | {by_ext[ext]} | {lines_by_ext.get(ext, 0)} |\n"
        )

    lines_out.append("\n## Lista de arquivos (caminho relativo)\n\n")
    for rel, n in file_lines:
        ln = "—" if n is None else str(n)
        lines_out.append(f"- `{rel.as_posix()}` — **{ln}** linhas\n")

    if not args.sem_regras:
        lines_out.append("\n---\n\n")
        lines_out.append("# Mapa heurístico de regras de negócio\n\n")
        sec, _ = scan_business_rules(
            root,
            files,
            max_total=args.max_ocorrencias_regras,
            max_line_chars=args.max_linha_snippet,
        )
        lines_out.extend(sec)

    if conteudo:
        lines_out.append("\n---\n\n# Conteúdo completo dos arquivos\n\n")
        for fp in files:
            rel = fp.relative_to(root)
            rel_pos = rel.as_posix()
            try:
                size = fp.stat().st_size
            except OSError:
                continue
            if max_bytes is not None and size > max_bytes:
                lines_out.append(
                    f"\n## `{rel_pos}`\n\n"
                    f"_Ignorado no dump: {size} bytes (limite {max_bytes})._\n\n"
                )
                continue
            lang = fence_lang(fp)
            fence = f"```{lang}\n" if lang else "```\n"
            lines_out.append(f"\n## `{rel_pos}`\n\n{fence}")
            text = read_text_file(fp)
            if text is None:
                lines_out.append("(binário ou ilegível — omitido)\n")
            else:
                lines_out.append(text)
                if not text.endswith("\n"):
                    lines_out.append("\n")
            lines_out.append("```\n")

    saida.parent.mkdir(parents=True, exist_ok=True)
    text_out = "".join(lines_out)
    saida.write_text(text_out, encoding="utf-8")
    print(f"Escrito: {saida} ({len(text_out)} caracteres)")


if __name__ == "__main__":
    main()
