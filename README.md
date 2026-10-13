# Dashboard pessoal

Código-fonte do artifact **Dashboard** do claude.ai (`https://claude.ai/artifact/8gX9F8tKZoEqyRqkm8jemu`): uma página única com quatro pilares (Saúde & corpo, Finanças, Self Improvement e Carreira) que lê e grava no Notion pelo conector do claude.ai e guarda o que não cabe no Notion no banco do próprio artifact.

| Arquivo | Conteúdo |
|---|---|
| `index.html` | A página publicada, sem o esqueleto `<html>/<body>` que o claude.ai acrescenta ao publicar. |
| `exercicios.json` | Catálogo de exercícios usado pela aba Saúde. |
| `competencias.json` | Referência de competências usada pela aba Carreira (definições, níveis, indicadores e perguntas). |
| `tools/competencias/` | Scripts que geram `competencias.json` a partir dos dois guias de entrevista anexados no Notion. |

Capacidades declaradas no artifact: conectores **Notion** (`notion-query-data-sources`, `notion-fetch`, `notion-create-pages`, `notion-update-page`) e **Parallel Search** (`web_fetch`, para ler anúncios de vagas pelo link), **db** (banco do artifact) e **sample** (chamadas ao Claude a partir da página).

## Aba Carreira

Três sub-abas, todas ligadas à meta **Land First IR Job** do Goal Tracker.

**Job Hunt.** Lê o Job Application Tracker, o Job Tasks e o Employers. Mostra próximos passos (prazos de vagas não aplicadas e tarefas abertas), o funil por etapa, o quadro de candidaturas e as fontes de vagas listadas nas páginas do Notion. **Nova vaga por link** recebe o link de um anúncio (ou o texto colado, quando o link pede login): o Claude lê a vaga, resume o contexto, aponta as competências pedidas e as etapas do processo seletivo (as escritas no anúncio e as prováveis, marcadas como tal) e propõe tarefas para o Job Tasks com datas contadas até o prazo. Se a vaga ainda não está no tracker, a candidatura (e o empregador, quando novo) é criada junto. Nada vai para o Notion antes da revisão. O mesmo plano pode ser gerado a partir de uma vaga do radar ou do dossiê de uma candidatura. Cada vaga abre um dossiê: tarefas (criadas e concluídas no Notion), resultado e notas, etapas do processo seletivo, análise de aderência ao currículo feita pelo Claude, CV e carta adaptados (que podem ser salvos como subpágina da vaga no Notion). O radar recebe anúncios colados (o Claude extrai cargo, organização e prazo) e as vagas da varredura semanal, e os leva ao tracker. O perfil de busca guarda os critérios que personalizam análises e buscas.

**Currículo.** Perfil, experiências, formação, idiomas, certificações e publicações em fichas estruturadas, com checklist de prontidão e cálculo de elegibilidade para níveis P e NO (tabela das notas da Mentoria Carreira Humanitária). **Contar ao Claude** recebe uma descrição livre de experiências, projetos, cursos e habilidades, ou um CV ou perfil do LinkedIn colado, e a converte para as fichas: realizações com verbo de ação, competências marcadas, projetos em Experiências, cursos em Certificações, ferramentas e métodos em Habilidades. Há prévia antes de gravar, e as realizações novas de uma experiência já registrada são somadas a ela. A seção "Como o Claude lê seu currículo" mostra o texto exato enviado ao Claude.

**Skill Development.** Matriz das 21 competências e 3 valores da base do Notion (Core, Managerial e Cross-Functional Competencies), com autoavaliação (campo Rating, gravado no Notion), evidência (nota da melhor história na escala NE–5 do ACNUR) e demanda nas vagas analisadas; banco de histórias na estrutura CAR com revisão pelo Claude; treino de entrevista com nota NE–5; plano de desenvolvimento com as tarefas do Personal Improvement Tasks, os cursos e o Skill Development Monitor; e uma página de método.

### Onde ficam os dados

| Dado | Lugar |
|---|---|
| Candidaturas, tarefas, empregadores, competências, ações, cursos | Notion (lidos por views; escritos por `notion-create-pages` e `notion-update-page`) |
| Perfil de busca, fontes vistas, idioma preferido dos documentos | db `carreira/config` |
| Currículo | db `carreira/cv` |
| Histórias de entrevista | db `carreira/banco/historias/{id}` |
| Dossiê de cada vaga (anúncio, análise, CV, carta, resultado, notas) | db `carreira/vagas/dossies/{id da página no Notion}` |
| Radar de vagas | db `carreira/radar/leads/{id}` |
| Treinos de entrevista | db `carreira/treino/tentativas/{id}` |
| Links de vagas que a página não conseguiu ler | db `carreira/fila/links/{id}` |
| Resumo da varredura semanal e fontes conferidas | db `carreira/scout` |

### Rotinas agendadas

Duas rotinas agendadas no app do Claude completam a aba. Elas ficam fora deste repositório e se comunicam com a página só pelo banco do artifact; os horários abaixo são os informados na página.

- **Leitura de links** (a cada 2 horas, das 8h às 22h). Quando a página não consegue ler o link (sem o conector de leitura web, ou se ele falhar), grava-o em `carreira/fila/links` com `status: "pendente"`. A rotina grava o texto do anúncio em `texto`, com `status: "lido"` e `lidoEm`, ou `status: "erro"` com `motivo`. Depois de criar as tarefas, a página marca o link como `feito` (com `appUrl`); o usuário também pode marcá-lo como `descartado`.
- **Varredura semanal** (quartas às 12h, com o app do Claude aberto). Confere os empregadores do Notion, os portais e os alertas do LinkedIn no Gmail. Grava vagas novas em `carreira/radar/leads` com `status: "novo"`, que aparecem na caixa de entrada do radar, e o resumo em `carreira/scout`: `ultima`, `novas`, `empregadores`, `linkedin`, `resumo` e `vistos`, que liga o id de cada fonte de `SOURCES` (ex.: `s-uncareers`) à data `AAAA-MM-DD` em que ela foi conferida.

### Fontes da referência de competências

- United Nations, Office of Human Resources Management. *Competency-based Interviewing Guide* (modelo *UN Competencies for the Future*, 1999).
- UNHCR. *Best Practice Interview Guide for Interviewers: Skills and processes* (quadro de competências do PAMS, 2008).

Os dois PDFs estão anexados à página Mentoria Carreira Humanitária no Notion. Para regenerar `competencias.json`, veja `tools/competencias/README.md`.

## Publicar

Publique `index.html` no mesmo artifact (mesmo URL), enviando `competencias.json` como arquivo de apoio. Arquivos de apoio não enviados (como `exercicios.json`) continuam publicados.
