---
name: checklist-fechamento
description: Roda a validação final (typecheck + lint), revisa o diff e prepara commit/push seguindo a convenção deste repo. Use quando o usuário disser que terminou uma rodada de correções/features e quiser fechar/publicar o trabalho (ex: "fecha isso", "sobe pro ar", "valida e commita", ou ao final de um lote de tarefas do tipo relatado pelo cliente).
---

# Checklist de fechamento de tarefa

Sequência usada neste projeto ao final de cada rodada de trabalho, antes de considerar algo pronto.

## 1. Validação

```bash
npx tsc --noEmit
npm run lint
```

Os dois têm que sair limpos (0 erros — warnings de `@next/next/no-img-element` já são conhecidos e aceitos no projeto, não precisam de correção). Se algo quebrar, corrija antes de seguir — nunca pule essa etapa pra economizar tempo.

## 2. Revisão do que vai ser commitado

```bash
git status --short
git diff
```

Confira:
- Nenhum arquivo fora do escopo do que foi pedido (ex: `.env.local`, arquivos de scratch, `node_modules`)
- Se alguma migration nova foi criada em `supabase/migrations/`, ela **já deve ter sido aplicada no banco** (ver skill `criar-migration`) antes do commit — não commita migration sem rodar

## 3. Commit

Mensagem em português, no imperativo, curta no título e explicando o *porquê* no corpo (não repita o diff em texto). Sem emoji. Sem `Co-Authored-By` a não ser que peçam. Exemplo do padrão usado no histórico deste repo:

```
git add -A
git commit -m "$(cat <<'EOF'
Corrige X — causa raiz era Y

Explicação de uma ou duas frases do porquê isso quebrava e como o
fix resolve, especialmente se veio de bug report do cliente.
EOF
)"
```

## 4. Push

```bash
git push origin main
```

Este projeto não usa PR/branch de feature pro dia a dia — o fluxo observado é commit direto em `main` e push imediato após validar. Só desvie disso (criar branch, abrir PR) se o usuário pedir explicitamente.

## 5. Pós-push (opcional, quando fizer sentido)

Se a mudança for algo que só se manifesta em produção (variável de ambiente, timing, memória), vale conferir o deploy:

```bash
npx vercel ls
npx vercel logs yarinreels-web.vercel.app --since 10m --json
```

Não é passo obrigatório do checklist — só quando o bug em questão era especificamente de runtime/produção.
