# Instrucoes do projeto

Estas regras se aplicam a todas as alteracoes neste projeto. Preserve a arquitetura simples e nao introduza dependencias ou funcionalidades fora do escopo sem necessidade.

## Tecnologias Utilizadas

- Backend: Node.js com Express.
- Frontend: HTML, CSS e JavaScript puro, servidos como arquivos estaticos.
- Integre-se com a API APOD da NASA. O backend deve fazer as chamadas externas.
- Nao use frameworks ou bibliotecas pesadas de frontend, incluindo React, Vue, Angular, Next.js ou equivalentes. Nao adicione um processo de build para o frontend.
- Nunca coloque chaves, tokens ou segredos no HTML, CSS, JavaScript do navegador, URLs entregues ao navegador ou arquivos versionados.
- Prefira as APIs nativas da plataforma e dependencias pequenas e justificadas.

## Arquitetura do Sistema

- Mantenha uma separacao clara entre o backend Express e o frontend estatico.
- O backend atua como proxy: recebe a solicitacao do frontend, consulta a API APOD da NASA e retorna ao navegador somente os dados necessarios para a interface.
- O frontend deve chamar apenas endpoints do proprio backend. Nao deve chamar a NASA diretamente nem conhecer credenciais da API.
- Mantenha a logica de acesso a API externa e o tratamento de erros no backend; retorne respostas consistentes e sem detalhes internos.
- Evite duplicar logica de integracao com a NASA entre rotas ou no frontend.

## Estilizacao

- Use um tema Dark Mode com identidade espacial: fundo escuro, contraste legivel e cores de destaque usadas com moderacao.
- A interface deve ser responsiva e funcionar em telas pequenas e grandes, sem rolagem horizontal indevida.
- Use CSS simples e organizado, preferindo layout flexivel e unidades relativas quando apropriado.
- Preserve a legibilidade, acessibilidade, estados de carregamento e apresentacao clara de erros e do conteudo multimidia do APOD.

## Seguranca

- A credencial `NASA_API_KEY` deve existir e ser lida exclusivamente no backend por meio de variaveis de ambiente carregadas de `.env`.
- Nunca exponha `NASA_API_KEY` ao frontend, em respostas HTTP, logs, mensagens de erro, HTML, repositorio ou historico de commits.
- Mantenha `.env` fora do controle de versao e forneca, se necessario, apenas um arquivo de exemplo sem valores secretos, como `.env.example`.
- Valide no inicio do backend que `NASA_API_KEY` esta configurada; informe o problema somente nos logs do servidor sem imprimir o valor da chave.
- Construa as chamadas a API da NASA no servidor e nao permita que dados fornecidos pelo usuario alterem arbitrariamente o destino da requisicao externa.
- Trate erros da API e entradas externas com seguranca: nao retorne stack traces, credenciais ou detalhes internos ao cliente.
