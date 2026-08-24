import { CreditCard, Megaphone, Palette, PawPrint, Server, Wrench } from "lucide-react";
import { formatBrl } from "@/lib/card-format";
import { RescuePhotosCarousel } from "@/components/RescuePhotosCarousel";

// Candidatas, não parceiras confirmadas — nomes reais de ONGs de resgate
// animal atuantes no Brasil, só pra dar concretude à ideia enquanto a
// parceria de verdade não é fechada com nenhuma delas.
const CANDIDATE_NGOS = [
  "SUIPA",
  "Ampara Animal",
  "Instituto Caramelo",
  "Adote um Gatinho",
  "Cão sem Dono",
  "Paraíso dos Focinhos",
];

const COSTS = [
  {
    icon: Megaphone,
    title: "Alcançar mais gente",
    description:
      "Tráfego pago pra chegar em apoiadores no Brasil inteiro, não só em quem já conhece a campanha.",
  },
  {
    icon: Palette,
    title: "Artistas criando as molduras",
    description:
      "Profissionais de design em criação constante, sempre pensando em novas artes e temas pra moldura não ficar repetida.",
  },
  {
    icon: Server,
    title: "Infraestrutura e servidores",
    description:
      "O placar, a galeria e o processamento das fotos rodam o tempo todo, isso tem custo fixo, com pouco ou muito apoio.",
  },
  {
    icon: CreditCard,
    title: "Taxa do gateway de pagamento",
    description:
      "Toda cobrança por Pix ou cartão passa por uma taxa da operadora, é isso que garante que o pagamento é real.",
  },
  {
    icon: Wrench,
    title: "Manutenção e suporte",
    description:
      "Gente de verdade mantendo o sistema no ar, corrigindo problemas e respondendo quem precisa de ajuda.",
  },
];

export function PresidenciaveisImpact({
  totalRaisedCents,
}: {
  totalRaisedCents: number;
}) {
  return (
    <section className="w-full px-6">
      <div className="text-center">
        <span className="text-xs font-bold uppercase tracking-wide text-decor-coral">
          Pra onde vai o valor
        </span>
        <h2 className="mt-2 font-display text-2xl font-normal leading-tight tracking-wide text-white">
          Um valor simbólico, não um preço
        </h2>
        <p className="mt-3 text-base leading-snug text-white/60">
          O que você paga pra confirmar seu apoio cobre o que mantém o placar de
          pé e limpo de fraude. Nada disso é lucro escondido.
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {COSTS.map((cost) => (
          <div
            key={cost.title}
            className="flex gap-4 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary-light">
              <cost.icon size={18} strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">{cost.title}</h3>
              <p className="mt-1 text-sm leading-snug text-white/60">
                {cost.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-3xl bg-linear-to-b from-decor-lime/15 to-transparent p-6 text-center ring-1 ring-decor-lime/25">
        <span className="text-xs font-bold uppercase tracking-wide text-white/50">
          Arrecadado até agora
        </span>
        <span className="mt-1 block text-4xl font-bold leading-none text-white">
          R$ {formatBrl(totalRaisedCents)}
        </span>
      </div>

      {/* Sem nome de ONG específica de propósito — ainda não foi decidido
          qual. O que sobra dos custos acima vai pra uma causa real, fora da
          campanha, reforçando que o valor não é pra lucrar em cima do apoio
          de ninguém. */}
      <div className="mt-4 rounded-3xl bg-white/5 p-6 ring-1 ring-white/10">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary/20 text-secondary-light">
          <PawPrint size={20} strokeWidth={2} />
        </div>
        <h3 className="mt-4 text-lg font-bold text-white">
          O que sobra vira ração
        </h3>
        <p className="mt-1 text-sm leading-snug text-white/60">
          O que sobra depois de cobrir os custos acima é usado pra comprar
          pacotes de ração, direcionados a várias ONGs de resgate de animais
          abandonados por seus donos, espalhadas pelo país.
        </p>

        {/* Só nomes candidatos (nenhuma parceria fechada ainda) — por isso
            sem link, sem logo, sem nada que sugira endosso da ONG. */}
        <span className="mt-4 block text-[11px] font-bold uppercase tracking-wide text-white/35">
          Algumas ONGs:
        </span>
        <div className="mt-2 flex flex-wrap gap-2">
          {CANDIDATE_NGOS.map((name) => (
            <span
              key={name}
              className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-white"
            >
              {name}
            </span>
          ))}
        </div>

        {/* Fotos reais de resgates — dá rosto (ou focinho) à causa, em vez
            de só o texto explicando o que "ração" significa na prática. */}
        <RescuePhotosCarousel />
      </div>
    </section>
  );
}
