# Ponto Digital

Aplicativo local para registrar entrada e saída de um único usuário, consultar os lançamentos por mês e exportar o mês selecionado em CSV.

## Recursos

- Funciona offline no navegador após abrir o app localmente.
- Salva os registros em `localStorage`, sem depender de servidor.
- Exibe os dados separados por mês em abas.
- Exporta a planilha do mês selecionado em arquivo `.csv`.
- Foi pensado para gerar um build pequeno com poucos arquivos.

## Como executar

```bash
npm install
npm run dev
```

## Como gerar o build

```bash
npm run build
```

O resultado fica em `dist/` e pode ser compartilhado como um pacote estático simples.