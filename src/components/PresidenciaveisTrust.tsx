import {
  BadgeCheck,
  Bot,
  Eye,
  Hash,
  Scale,
  Search,
  ShieldCheck,
  UserCheck,
  Wallet,
} from "lucide-react";
import { formatBrl } from "@/lib/card-format";
import { CtaButton } from "@/components/CtaButton";

// Antes era uma comparação linha a linha com "pesquisa tradicional" — cortado
// pra só os 4 fatos daqui, em cards. O contraste com pesquisa já fica
// implícito no título da seção, não precisa repetir em cada card.
const FACTS = [
  {
    icon: Hash,
    question: "De onde vem o número",
    answer:
      "Contagem direta, uma por uma, das pessoas que apoiaram aqui. Sem projeção.",
  },
  {
    icon: UserCheck,
    question: "Quem participa",
    answer: "Qualquer pessoa, na hora que quiser. Inclusive você, agora.",
  },
  {
    icon: Wallet,
    question: "O que custa participar",
    answer: "Um valor simbólico. Quem entra no ranking colocou algo em jogo.",
  },
  {
    icon: Search,
    question: "Como conferir",
    answer:
      "Cada apoio tem um rosto público na galeria do candidato. Dá pra ir lá e contar.",
  },
];

const GUARANTEES = [
  {
    icon: Bot,
    title: "Robô não paga boleto",
    description:
      "Como todo apoio passa por um pagamento real, lista comprada e cadastro automático não entram na conta.",
  },
  {
    icon: Eye,
    title: "Cada número tem um rosto",
    description:
      "O apoio só é contabilizado depois que a pessoa baixa a moldura.",
  },
  {
    icon: BadgeCheck,
    title: "Ninguém digita o placar",
    description:
      "O ranking não é preenchido à mão: é a contagem automática dos apoios publicados, refeita a cada acesso.",
  },
];

export function PresidenciaveisTrust({ priceCents }: { priceCents: number }) {
  return (
    <>
      <section className="w-full px-6">
        <div className="text-center">
          <span className="text-xs font-bold uppercase tracking-wide text-decor-coral">
            Por que criamos isso
          </span>
          <h2 className="mt-2 font-display text-2xl font-normal leading-tight tracking-wide text-white">
            Chega de tentar adivinhar. Vamos contar.
          </h2>
          <p className="mt-3 text-base leading-snug text-white/60">
            Em vez de estimativas, queremos mostrar participação. Cada pessoa
            que escolhe uma moldura e apoia um candidato entra no placar. Quanto
            mais pessoas participam, maior o candidato aparece no ranking.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          {FACTS.map((fact) => (
            <div
              key={fact.question}
              className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-decor-lime/15 text-decor-lime">
                <fact.icon size={16} strokeWidth={2} />
              </div>
              <h3 className="mt-3 text-xs font-bold uppercase tracking-wide text-white/40">
                {fact.question}
              </h3>
              <p className="mt-1.5 text-sm leading-snug text-white">
                {fact.answer}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* NAO EXCLUIR, AINDA POSSO USAR */}
      {/* <section className="w-full px-6">
        <div className="rounded-3xl bg-linear-to-b from-secondary/25 to-transparent p-6 ring-1 ring-secondary/40">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary/30 text-decor-coral">
            <Scale size={20} strokeWidth={2} />
          </div>
          <h2 className="mt-4 text-xl font-bold leading-tight tracking-tight text-white">
            Os R$ {formatBrl(priceCents)} não são o preço da moldura.
            <br />
            São o que mantém o ranking limpo.
          </h2>
          <p className="mt-3 text-base leading-snug text-white/70">
            Qualquer contador gratuito na internet vira lixo em uma semana —
            bota um robô pra rodar e o placar deixa de significar coisa alguma.
            Ao custar menos que um cafezinho, o apoio fica ao alcance de
            qualquer pessoa e, ao mesmo tempo, caro demais para quem quer
            fraudar em escala.
          </p>
          <p className="mt-3 text-base leading-snug text-white/70">
            É por isso que um apoio aqui pesa mais que um clique: alguém decidiu
            tirar o cartão do bolso e colocar a própria cara na campanha.
          </p>
        </div>
      </section> */}

      <section className="w-full px-6">
        <div className="text-center">
          <span className="text-xs font-bold uppercase tracking-wide text-decor-coral">
            Transparência
          </span>
          <h2 className="mt-2 font-display text-2xl font-normal leading-tight tracking-wide text-white">
            Como a conta é feita
          </h2>
          <p className="mt-3 text-base leading-snug text-white/60">
            É assim que cada apoio vira número no placar, do início ao fim, sem
            etapa escondida.
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          {GUARANTEES.map((item) => (
            <div
              key={item.title}
              className="flex gap-4 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success/15 text-success-light">
                <item.icon size={18} strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">{item.title}</h3>
                <p className="mt-1 text-sm leading-snug text-white/60">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Depois de toda a explicação de como o placar funciona, fecha com
            o mesmo CTA usado no resto da página — quem leu até aqui já
            entendeu as regras, é o momento certo de converter. */}
        <CtaButton
          href="#escolha"
          title="Quero minha moldura"
          subtitle="e levar meu candidato ao topo"
          className="mt-6"
        />
      </section>
    </>
  );
}
