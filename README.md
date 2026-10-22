# 🎰 Cassinora Land

Jogos de cassino e economia com **moedas de mentira**, numa interface focada só nos jogos: linhas de jogos por categoria, como na home do Roblox (Arcade & Crash, Cartas, Sorte rápida, Clássicos, Mesas abertas, Economia & RPG e um feed "Ao vivo").

Nasceu do cassino e da economia do [landora-app-dk](https://github.com/landoraag/landora-app-dk), como projeto separado.

## O que tem

- **19 jogos solo**: Blackjack, Galinha, Cara ou coroa, Roleta russa, Minas, Dados, Caça-níquel, Raspadinha, Mais ou menos, Torre, Roleta, Bacará, Vídeo Poker, Crash, Plinko, Keno, Bingo, Truco e Uno.
- **Mesas multijogador**: quase todos os jogos podem virar uma mesa contra amigos (todo mundo aposta o mesmo valor, quem vence leva o pote).
- **Economia e RPG**: carteira, banco, bônus diário, trabalho (minigame), lojas, caridade com pontos sociais, empréstimos, pagamentos, roubo, persona que evolui de nível e ranking.
- **Lobby**: busca, favoritos (⭐), "Continuar jogando" e atalhos para a economia.

Todo mundo começa com 💰 22.000.

## Estrutura

```
src/
  pages/        Lobby (home em linhas), Mesas, Economia, Ranking, Login, Registro
  components/   jogos (Casino*, Tables*), Economy, RPG, WorkGame, Shell, Modal…
  lib/          regras e acesso ao Firestore (casino, economy, rpg, tables, catalog…)
firestore.rules · firebase.json · .firebaserc
```

Onde mexer no lobby: as linhas e os atalhos ficam em `src/lib/catalog.js` (ROWS, ECONOMY_TILES) e a cor de cada capa em `HUES`.

## Configurar o Firebase (projeto `cassinora-land`)

1. **Authentication** → *Sign-in method* → ative **E-mail/senha**.
2. **Firestore Database** → crie o banco (modo produção).
3. **Configurações do projeto** → *Seus apps* → app **Web** (`</>`) → copie o `firebaseConfig`.
4. Copie `.env.example` para `.env` e preencha (o `.env` não vai para o GitHub).
5. No Codespace, a pré-visualização roda num endereço `*.app.github.dev`. Adicione esse domínio em **Authentication → Settings → Domínios autorizados**, senão o login é recusado.

## Rodar no Codespace

```bash
npm install
npm run dev
```

## Publicar (Firebase Hosting + regras)

```bash
npm install -g firebase-tools     # uma vez
firebase login --no-localhost     # uma vez
npm run deploy                    # build + hosting + regras do Firestore
```

## Diferenças em relação ao Landora

- Não há chat, calls, notificações push nem painel de negócios. Os resultados dos jogos aparecem no feed **Ao vivo** do lobby (coleção `gameFeed`) e os pedidos de empréstimo ficam em Economia → Empréstimos.
- O banco de dados é novo: as carteiras e o histórico do Landora **não** foram trazidos.
- Para economizar leituras do Firestore (plano gratuito), o feed e as mesas carregam só os 20 itens mais recentes.
- Os jogos rodam no navegador, como no Landora: por serem moedas de mentira, a segurança é a mínima necessária. Não use para dinheiro real.
