# RankMetro — Website

Site estático pronto para ser publicado no GitHub Pages. Usa `rankbase.json` para configurar as regras de cálculo: média por time de 4/6 jogadores, faixas de rank (S–E) e lista de jogadores.

## Como funciona
- **Média:** `media = soma_total / quantidade_de_jogadores` (4 ou 6).
- **Rank:** determinado pela faixa onde a média está (S, A, B, C, D, E).
- **Validações:** tamanho do time e soma máxima por tamanho.

## Publicar no GitHub Pages
1. Crie um repositório novo no GitHub e envie estes arquivos (incluindo `rankbase.json`).
2. No GitHub, acesse Settings → Pages.
3. Em **Build and deployment**, escolha **Source: Deploy from a branch**.
4. Defina **Branch: main** e **Folder: / (root)** e salve.
5. Aguarde a publicação e acesse a URL indicada.

> Importante: o site faz `fetch` de `./rankbase.json`. No GitHub Pages, isso funciona normalmente. Abrir direto no navegador via `file://` não carrega o JSON por política do navegador — use um servidor local.

## Servidor local (opcional)
Se tiver Python instalado:

```powershell
python -m http.server 8080
# Abra http://localhost:8080/
```

Ou com Node.js:

```powershell
npx serve . -p 8080
```

## Customização
- Edite `rankbase.json` para alterar faixas, tamanhos de time e jogadores.
- A UI é simples e em português; ajuste estilos em `assets/style.css`.

## Estrutura
- [index.html](index.html)
- [assets/style.css](assets/style.css)
- [assets/app.js](assets/app.js)
- [rankbase.json](rankbase.json)
