# <div align="center"><a href='https://mercado-lista.vercel.app'>MRD • Mínimo Ridículo Diário</a></div>

<p align="center">
  <image
  src="https://img.shields.io/github/languages/count/ojonatasquirino/mrdhabitos"
  />
  <image
  src="https://img.shields.io/github/languages/top/ojonatasquirino/mrdhabitos"
  />
  <image
  src="https://img.shields.io/github/last-commit/ojonatasquirino/mrdhabitos"
  />

</p>

- **NextJS** → Framework para aplicações React.
- **React** → Biblioteca para interfaces interativas.
- **TailwindCSS (V4)** → Estilização utilitária e responsiva.
- **Shadcn UI** → Biblioteca de componentes.
- **Local Storage** → Armazenamento de informações no navegador.

##

[![deploy](https://vercel.com/button)](https://mrdhabitos.vercel.app/)

## Instalação e uso

```bash
git clone https://github.com/ojonatasquirino/mrdhabitos.git

```

## Configuração

```bash
npm install
cp .env.example .env.local   # preencha com as chaves do Firebase
npm run dev
```

**Firebase:** crie um projeto, ative *Authentication* (Google e E-mail/senha) e *Firestore*, e publique as regras de `firestore.rules`. Na Vercel, cadastre as mesmas variáveis `NEXT_PUBLIC_FIREBASE_*` e adicione o domínio em *Authentication > Settings > Authorized domains*.

Sem as variáveis, o app funciona em modo local (sem login, dados no navegador).

**PWA:** em produção o app é instalável ("Adicionar à tela inicial") e abre offline. O lembrete diário dispara no horário enquanto o app está aberto, ou na próxima abertura se ainda houver hábito pendente.

```bash
npm test        # testes
npm run build   # build com checagem de tipos e lint
```
