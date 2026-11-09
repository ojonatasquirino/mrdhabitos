/**
 * Frases do dia. Ficam no próprio app, sem API externa.
 * Frases em inglês estão em tradução livre; a fonte de cada uma está no comentário ao lado.
 */
export interface Quote {
  text: string
  author: string
}

export const QUOTES: Quote[] = [
  // David Goggins — Can't Hurt Me (via Audible "quotes-david-goggins")
  { text: "Não pare quando estiver cansado. Pare quando tiver terminado.", author: "David Goggins" },
  { text: "As conversas mais importantes que você vai ter são as que você tem consigo mesmo.", author: "David Goggins" },
  { text: "A negação é a zona de conforto definitiva.", author: "David Goggins" },
  {
    text: "A vitória muitas vezes depende de dar o seu melhor quando você se sente no seu pior.",
    author: "David Goggins",
  },
  { text: "A maioria das guerras é vencida ou perdida dentro da nossa cabeça.", author: "David Goggins" },

  // Alex Hormozi — "Volume negates luck" (The Game, ep. 267/611) e quotlr.com/author/alex-hormozi
  { text: "Volume anula a sorte.", author: "Alex Hormozi" },
  { text: "Um tolo focado realiza mais do que um gênio distraído.", author: "Alex Hormozi" },
  { text: "Procure o desconforto. É o único lugar onde o crescimento acontece.", author: "Alex Hormozi" },
  { text: "Quando você começa algo, vai ser ruim nisso. Espere ser ruim.", author: "Alex Hormozi" },
  {
    text: "A maioria já sabe o que fazer e simplesmente não faz. Não é ignorância. É medo.",
    author: "Alex Hormozi",
  },

  // Dan Koe — quotefancy.com/dan-koe-quotes
  { text: "Nada é mais importante do que o seu potencial.", author: "Dan Koe" },
  { text: "Se você não criar um propósito, um será atribuído a você.", author: "Dan Koe" },
  {
    text: "Se você não sabe o que quer, vão te dizer o que querer, e você vai acreditar.",
    author: "Dan Koe",
  },
  {
    text: "Não parece haver missão mais valiosa do que descobrir do que você é capaz.",
    author: "Dan Koe",
  },
  { text: "Empreender é a sobrevivência dos tempos modernos.", author: "Dan Koe" },

  // Alfredo Soares (G4) — pensador.com/autor/alfredo_soares, ABC da Comunicação, FACISC
  { text: "O medo e a motivação andam lado a lado.", author: "Alfredo Soares" },
  {
    text: "Execução é principalmente administrar o medo e a incerteza e colocar o plano em primeiro lugar.",
    author: "Alfredo Soares",
  },
  { text: "Comprometimento é entrega, união, humildade, garra.", author: "Alfredo Soares" },
  { text: "Vender é entregar o intangível.", author: "Alfredo Soares" },
  {
    text: "Empreender não é sobre ser um gestor, é sobre descobrir o seu lugar de potência.",
    author: "Alfredo Soares",
  },

  // Motivacionais
  { text: "A jornada de mil léguas começa com um único passo.", author: "Lao Tsé" },
  { text: "Feito é melhor que perfeito.", author: "Provérbio" },
  { text: "Faça o mínimo ridículo hoje. Amanhã você agradece.", author: "MRD" },
  { text: "Disciplina é escolher entre o que você quer agora e o que você mais quer.", author: "Provérbio" },
  { text: "Pequeno todo dia vence grande de vez em quando.", author: "MRD" },
]

/** Mesma frase o dia inteiro; muda à meia-noite (horário local). */
export function quoteIndexFor(date: Date): number {
  const days = Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000,
  )
  // passo primo com o tamanho da lista para alternar autores em vez de repetir em bloco
  return (days * 7) % QUOTES.length
}
