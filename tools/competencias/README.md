# Gerar `competencias.json`

Os scripts extraem o texto dos dois guias anexados à página Mentoria Carreira Humanitária no Notion e montam a referência usada pela aba Carreira. Precisam de Python 3 e do `pdftotext` (poppler).

```sh
# 1. texto dos PDFs (baixe os anexos do Notion para uma pasta, ex.: dl/)
pdftotext -layout dl/interview_guide.pdf dl/interview_guide.txt          # guia da ONU (OHRM), em duas colunas
pdftotext dl/unhcr_guide.pdf - | sed 's/^[ \t]*//;s/[ \t]*$//' | awk 'NF' > dl/unhcr_clean.txt

# 2. extração
python3 parse_unhcr.py dl/unhcr_clean.txt dl/unhcr_framework.json        # definições, níveis L1–L4 e perguntas do ACNUR
python3 parse_ohrm.py dl/interview_guide.txt dl/ohrm_indicators.json     # indicadores positivos e negativos da ONU
python3 parse_ohrm_q.py dl/interview_guide.txt dl/ohrm_indicators.json dl/ohrm_full.json   # perguntas e sondagens da ONU

# 3. montagem, mapeada para as competências da base do Notion
python3 build_framework.py dl ../../competencias.json
```

`build_framework.py` contém a tabela que liga cada competência da base do Notion (pelo id da página) aos nomes usados nos dois guias. Ao criar ou renomear uma competência no Notion, atualize essa tabela. Competências sem correspondência continuam aparecendo no painel, só que sem definição, níveis e perguntas.
