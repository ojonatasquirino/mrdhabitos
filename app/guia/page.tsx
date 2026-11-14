"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  BarChart3,
  Bell,
  BookOpen,
  ChevronDown,
  CircleCheck,
  Flame,
  GripVertical,
  HelpCircle,
  Lightbulb,
  ListChecks,
  NotebookPen,
  PlayCircle,
  Smartphone,
  Sparkles,
  UserRound,
} from "lucide-react"
import { AppShell, IconButton, PageHeader } from "@/components/app-shell"
import { Onboarding } from "@/components/onboarding"

interface Section {
  id: string
  icon: typeof BookOpen
  title: string
  summary: string
  body: React.ReactNode
}

const SECTIONS: Section[] = [
  {
    id: "metodo",
    icon: Sparkles,
    title: "O método",
    summary: "O que é o mínimo ridículo e as 4 regras",
    body: (
      <>
        <p>
          Quem falha em hábitos quase sempre começou grande demais. A motivação passa; o que sustenta o hábito é o que
          você consegue fazer no <b>pior dia</b>. O mínimo ridículo é a menor ação que ainda conta: ler 1 página, fazer
          1 flexão.
        </p>
        <ol>
          <li>
            <b>Pequeno demais para falhar.</b> Se começar exige coragem, o hábito está grande demais.
          </li>
          <li>
            <b>De 5 a 10 hábitos.</b> Mais que isso vira lista de tarefas; menos não gera mudança.
          </li>
          <li>
            <b>Nunca zerar o dia.</b> Num dia ruim, faça só o mínimo e a sequência continua.
          </li>
          <li>
            <b>O mínimo é o piso.</b> Fazer mais é ótimo, mas o compromisso continua sendo o mínimo.
          </li>
        </ol>
      </>
    ),
  },
  {
    id: "comecar",
    icon: ListChecks,
    title: "Primeiros passos",
    summary: "Do zero ao primeiro dia marcado",
    body: (
      <ol>
        <li>
          Toque no <b>+</b> e escreva o hábito na versão mínima. Ex.: &quot;Ler 1 página&quot;, não &quot;Ler
          mais&quot;.
        </li>
        <li>Repita até ter entre 5 e 10 hábitos.</li>
        <li>Instale o MRD na tela de início do celular (veja &quot;Instalar o app&quot;).</li>
        <li>Ative o lembrete diário no sino.</li>
        <li>Todo dia, abra e marque o que fez.</li>
      </ol>
    ),
  },
  {
    id: "marcar",
    icon: CircleCheck,
    title: "Marcar o dia",
    summary: "Feito, não feito e como corrigir",
    body: (
      <ul>
        <li>
          Toque na bolinha do dia: <b>1 toque</b> marca feito (verde), <b>2 toques</b> marcam não feito (vermelho),{" "}
          <b>3 toques</b> limpam.
        </li>
        <li>O dia de hoje tem um anel em volta. Dias futuros ficam bloqueados.</li>
        <li>Errou? Toque de novo. Na tela Hoje você corrige a semana atual.</li>
        <li>
          Para dias mais antigos, toque no nome do hábito e use o <b>calendário</b>: qualquer dia passado pode ser
          marcado.
        </li>
      </ul>
    ),
  },
  {
    id: "sequencia",
    icon: Flame,
    title: "Sequência e recorde",
    summary: "Como o 🔥 é contado",
    body: (
      <ul>
        <li>O 🔥 ao lado do hábito mostra quantos dias seguidos ele foi feito.</li>
        <li>
          A sequência <b>não zera durante o dia de hoje</b>: você tem até meia-noite para marcar. Ela só quebra se um
          dia inteiro passar sem o hábito feito.
        </li>
        <li>No detalhe do hábito você vê a sequência atual, o recorde e a taxa dos últimos 30 dias.</li>
      </ul>
    ),
  },
  {
    id: "nota",
    icon: NotebookPen,
    title: "Frase e nota do dia",
    summary: "Motivação e registro do que valeu",
    body: (
      <ul>
        <li>A frase do dia muda à meia-noite. Toque nela para ver outra.</li>
        <li>
          A nota do dia é opcional: uma conquista, um aprendizado, algo memorável (até 500 caracteres). Toque em
          &quot;Algo memorável hoje?&quot; para escrever.
        </li>
        <li>
          Suas notas ficam reunidas no <b>Diário</b>, no fim da tela Análise.
        </li>
      </ul>
    ),
  },
  {
    id: "analise",
    icon: BarChart3,
    title: "Ler a Análise",
    summary: "O que cada gráfico mostra",
    body: (
      <ul>
        <li>
          <b>Período:</b> 7, 30 ou 90 dias (no computador também 1 ano). Tudo na tela segue o período escolhido.
        </li>
        <li>
          <b>Constância:</b> cada quadrado é um dia. Quanto mais escuro o verde, mais hábitos cumpridos naquele dia.
        </li>
        <li>
          <b>Concluído:</b> % de todos os hábitos feitos no período. <b>Sequência:</b> dias seguidos com pelo menos um
          hábito feito. <b>Melhor dia:</b> o dia da semana em que você é mais constante.
        </li>
        <li>
          <b>Tendência:</b> a curva da sua constância (em 30 e 90 dias, média dos últimos 7 dias, para não oscilar).
        </li>
        <li>
          <b>Por dia da semana</b> e <b>Hábitos:</b> onde você vai bem e qual hábito está ficando para trás.
        </li>
      </ul>
    ),
  },
  {
    id: "organizar",
    icon: GripVertical,
    title: "Organizar hábitos",
    summary: "Reordenar, renomear e excluir",
    body: (
      <ul>
        <li>
          <b>Reordenar:</b> segure o card por meio segundo e arraste para cima ou para baixo.
        </li>
        <li>
          <b>Renomear ou excluir:</b> toque no nome do hábito e use o lápis ou a lixeira no topo.
        </li>
        <li>Excluir apaga todo o histórico daquele hábito e não dá para desfazer.</li>
      </ul>
    ),
  },
  {
    id: "lembrete",
    icon: Bell,
    title: "Lembrete diário",
    summary: "Para ser avisado mesmo com o app fechado",
    body: (
      <ul>
        <li>
          Toque no <b>sino</b>, escolha o horário e use <b>Adicionar ao Calendário</b> (recomendado). O celular avisa
          todo dia nesse horário, com o app fechado e a tela bloqueada.
        </li>
        <li>
          O <b>aviso dentro do app</b> só aparece se o MRD estiver aberto no horário. Use &quot;Testar agora&quot; para
          conferir as notificações.
        </li>
      </ul>
    ),
  },
  {
    id: "instalar",
    icon: Smartphone,
    title: "Instalar o app",
    summary: "iPhone, Android e computador",
    body: (
      <ul>
        <li>
          <b>iPhone:</b> abra no Safari &gt; botão Compartilhar &gt; Adicionar à Tela de Início.
        </li>
        <li>
          <b>Android:</b> abra no Chrome &gt; menu ⋮ &gt; Instalar app.
        </li>
        <li>
          <b>Computador:</b> no Chrome ou Edge, clique no ícone de instalar na barra de endereço.
        </li>
      </ul>
    ),
  },
  {
    id: "perfil",
    icon: UserRound,
    title: "Perfil e tema",
    summary: "Foto, apelido, modo escuro e sair",
    body: (
      <ul>
        <li>Toque na sua foto (canto superior direito) para abrir o Perfil.</li>
        <li>Lá você troca foto, nome ou apelido, alterna o tema claro/escuro e sai da conta.</li>
        <li>Seus hábitos, notas e perfil ficam salvos na sua conta e aparecem em qualquer aparelho em que você entrar.</li>
      </ul>
    ),
  },
  {
    id: "dicas",
    icon: Lightbulb,
    title: "Dicas para usar bem",
    summary: "Hábitos de quem não larga o app",
    body: (
      <ul>
        <li>
          <b>Marque sempre no mesmo momento</b>, como antes de dormir. Vira parte da rotina.
        </li>
        <li>
          <b>Hábito vivendo no vermelho?</b> Ele está grande demais. Diminua até ficar ridículo.
        </li>
        <li>
          <b>Revise a Análise uma vez por semana</b> e veja qual dia da semana te derruba.
        </li>
        <li>
          <b>Use a nota para registrar vitórias.</b> Em dias ruins, reler o Diário ajuda.
        </li>
        <li>
          <b>Só aumente o mínimo depois que ele virar automático.</b> E mesmo assim, o piso continua o mesmo.
        </li>
      </ul>
    ),
  },
  {
    id: "faq",
    icon: HelpCircle,
    title: "Perguntas frequentes",
    summary: "Dúvidas comuns",
    body: (
      <dl>
        <dt>Esqueci de marcar ontem. Perdi a sequência?</dt>
        <dd>Não necessariamente: marque o dia de ontem (na tela Hoje ou no calendário do hábito) e a sequência é recalculada.</dd>
        <dt>Meus dados ficam salvos se eu trocar de celular?</dt>
        <dd>Sim. Entre com a mesma conta e tudo aparece.</dd>
        <dt>O lembrete não tocou.</dt>
        <dd>Use a opção Adicionar ao Calendário no sino. O aviso dentro do app só funciona com ele aberto.</dd>
        <dt>Quantos hábitos devo ter?</dt>
        <dd>De 5 a 10. Comece com poucos e vá adicionando.</dd>
      </dl>
    ),
  },
]

export default function GuidePage() {
  const router = useRouter()
  const [open, setOpen] = useState<string | null>("metodo")
  const [intro, setIntro] = useState(false)

  return (
    <AppShell nav={false} size="narrow">
      <PageHeader
        subtitle="Ajuda"
        title="Guia de uso"
        left={
          <IconButton aria-label="Voltar" onClick={() => router.back()} className="-ml-2">
            <ArrowLeft className="h-5 w-5" />
          </IconButton>
        }
      />

      <button
        type="button"
        onClick={() => setIntro(true)}
        className="pressable flex w-full items-center gap-4 rounded-3xl bg-foreground p-5 text-left text-background"
      >
        <PlayCircle className="h-8 w-8 shrink-0" />
        <span>
          <span className="block text-base font-semibold">Rever a introdução</span>
          <span className="block text-sm opacity-60">6 passos rápidos, com demonstração</span>
        </span>
      </button>

      <div className="mt-5 space-y-2">
        {SECTIONS.map(({ id, icon: Icon, title, summary, body }) => {
          const isOpen = open === id
          return (
            <section key={id} className="overflow-hidden rounded-3xl border border-border bg-card">
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? null : id)}
                className="flex w-full items-center gap-3 px-5 py-4 text-left"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted">
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-semibold">{title}</span>
                  <span className="block truncate text-xs text-muted-foreground">{summary}</span>
                </span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                />
              </button>
              {isOpen && (
                <div className="guide-body px-5 pb-5 text-sm leading-relaxed text-muted-foreground animate-in fade-in slide-in-from-top-1 duration-200">
                  {body}
                </div>
              )}
            </section>
          )
        })}
      </div>

      <p className="mt-8 text-center text-xs text-muted-foreground">
        Mais sobre o método em{" "}
        <a
          href="https://www.ojonatasquirino.com/mrd"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          ojonatasquirino.com/mrd
        </a>
      </p>

      <Onboarding open={intro} onClose={() => setIntro(false)} onFinish={() => setIntro(false)} finishLabel="Entendi" />
    </AppShell>
  )
}
