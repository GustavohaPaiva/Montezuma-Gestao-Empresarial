# Montezuma Gestão Empresarial

O frontend fica em `frontend/`. O site público é [montezuma-empreendimentos.online](https://montezuma-empreendimentos.online/), servido pelo GitHub Pages a partir da branch `gh-pages`.

## Deploy

Cada push na `main` que altere `frontend/` dispara `.github/workflows/deploy-pages.yml`: instala, gera o build e publica em `gh-pages`.

No GitHub, em Settings → Secrets and variables → Actions, o repositório precisa destes secrets (os mesmos valores de `frontend/.env`, que não entra no Git):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Para publicar manualmente, na pasta `frontend`, com o `.env` preenchido:

```bash
npm run deploy
```
