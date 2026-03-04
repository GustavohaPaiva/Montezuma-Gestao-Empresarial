import os

# Foco apenas no que define a inteligência do projeto
IGNORE_DIRS = {'.git', 'node_modules', 'dist', 'build', '__pycache__', 'env', 'venv', 'assets'}
# Vamos focar apenas nos arquivos de configuração e lógica
CORE_EXTENSIONS = {'.json', '.py', '.js', '.ts', '.tsx'} 

def generate_blueprint():
    with open("blueprint_montezuma.txt", "w", encoding="utf-8") as f:
        f.write("=== BLUEPRINT TÉCNICO: PROJETO MONTEZUMA ===\n")
        
        # 1. Mapeia a estrutura de pastas primeiro
        f.write("\n--- ESTRUTURA DE PASTAS ---\n")
        for root, dirs, files in os.walk('.'):
            dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
            level = root.replace('.', '').count(os.sep)
            indent = ' ' * 4 * (level)
            f.write(f"{indent}{os.path.basename(root)}/\n")
        
        # 2. Pega apenas arquivos VITAIS (package.json, main, routes, etc)
        f.write("\n--- CONTEÚDO DOS ARQUIVOS CORE ---\n")
        for root, dirs, files in os.walk('.'):
            dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
            for file in files:
                # Prioriza arquivos de config e entrada
                if file in ['package.json', 'requirements.txt', 'App.tsx', 'main.py', 'index.js']:
                    file_path = os.path.join(root, file)
                    f.write(f"\nFILE: {file_path}\n")
                    with open(file_path, 'r', encoding='utf-8') as c:
                        f.write(c.read()[:2000]) # Limita para não estourar
                    f.write("\n" + "="*30)

    print("Blueprint gerado: blueprint_montezuma.txt")

if __name__ == "__main__":
    generate_blueprint()