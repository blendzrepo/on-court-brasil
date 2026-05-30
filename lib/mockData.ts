export type NewsCategory = "Grand Slam" | "ATP" | "WTA" | "Brasil" | "Internacional";

export interface NewsArticle {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: NewsCategory;
  date: string;
  imageUrl?: string;
  imageGradient: string;
  imageEmoji: string;
  featured?: boolean;
}

export interface Tournament {
  id: string;
  name: string;
  location: string;
  country: string;
  startDate: string;
  endDate: string;
  surface: "Saibro" | "Duro" | "Grama" | "Carpete";
  category: "Grand Slam" | "ATP Masters 1000" | "ATP 500" | "ATP 250" | "WTA 1000" | "WTA 500" | "WTA 250" | "Davis Cup" | "Copa Billie Jean King";
  prize?: string;
}

export const newsArticles: NewsArticle[] = [
  {
    id: "1",
    slug: "sinner-vence-alcaraz-roland-garros-2025",
    title: "Sinner vence Alcaraz em batalha épica e conquista o título de Roland Garros 2025",
    excerpt:
      "O italiano Jannik Sinner superou o espanhol Carlos Alcaraz em uma final histórica de cinco sets e ergueu sua primeira taça em Paris. A partida, que durou mais de quatro horas, foi considerada por especialistas uma das melhores finais dos últimos anos.",
    category: "Grand Slam",
    date: "2025-06-08",
    imageGradient: "from-orange-400 to-red-600",
    imageEmoji: "🏆",
    featured: true,
  },
  {
    id: "2",
    slug: "bia-haddad-quartas-wimbledon-2025",
    title: "Bia Haddad avança às quartas de final em Wimbledon e faz história para o tênis brasileiro",
    excerpt:
      "A número 1 do Brasil no tênis feminino venceu a bielorrussa Aryna Sabalenka em três sets e garantiu vaga nas quartas de final pela segunda vez na carreira. A vitória marca um novo capítulo do tênis nacional no cenário internacional.",
    category: "WTA",
    date: "2025-07-07",
    imageGradient: "from-green-400 to-emerald-700",
    imageEmoji: "🎾",
  },
  {
    id: "3",
    slug: "djokovic-atp-finals-turim-2025",
    title: "ATP Finals: Djokovic anuncia presença em Turim e busca seu oitavo título no torneio",
    excerpt:
      "Novak Djokovic confirmou participação no ATP Finals 2025 em Turim. O sérvio, que voltou de lesão no ombro, busca superar seu próprio recorde e conquistar o oitavo título no torneio que encerra a temporada.",
    category: "ATP",
    date: "2025-10-20",
    imageGradient: "from-blue-400 to-indigo-700",
    imageEmoji: "🏅",
  },
  {
    id: "4",
    slug: "guia-us-open-2025-brasil",
    title: "Guia completo: Como assistir ao US Open 2025 no Brasil — canais, horários e favoritos",
    excerpt:
      "O último Grand Slam do ano começa em agosto em Nova York. Saiba em quais canais acompanhar as partidas ao vivo no Brasil, os horários dos jogos principais e quem são os favoritos ao título nesta edição.",
    category: "Grand Slam",
    date: "2025-08-15",
    imageGradient: "from-sky-400 to-blue-700",
    imageEmoji: "📺",
  },
  {
    id: "5",
    slug: "thiago-seyboth-wild-top-50-atp",
    title: "Thiago Seyboth Wild entra no top 50 do ranking ATP pela primeira vez na carreira",
    excerpt:
      "O brasileiro de 24 anos atingiu a melhor posição da carreira no ranking mundial após conquistar o título no ATP 250 de Genebra. A conquista consolida o crescimento de Wild e aumenta as esperanças do tênis brasileiro.",
    category: "Brasil",
    date: "2025-05-20",
    imageGradient: "from-yellow-400 to-green-600",
    imageEmoji: "⭐",
  },
  {
    id: "6",
    slug: "swiatek-titulo-aberto-polonia-2025",
    title: "Iga Swiatek defende título no Aberto da Polônia e confirma favoritismo para a temporada",
    excerpt:
      "A polonesa Iga Swiatek conquistou mais um título em Varsóvia, derrotando a americana Coco Gauff na final em dois sets. É o quinto título da temporada para Swiatek, que segue dominante no circuito feminino.",
    category: "WTA",
    date: "2025-07-22",
    imageGradient: "from-pink-400 to-rose-700",
    imageEmoji: "🌹",
  },
  {
    id: "7",
    slug: "calendario-atp-wta-julho-2025",
    title: "Calendário ATP/WTA: Confira todos os torneios de julho de 2025 e não perca nenhuma partida",
    excerpt:
      "Julho é um dos meses mais movimentados do tênis mundial, com Wimbledon no centro das atenções. Veja o calendário completo com datas, locais e transmissões de todos os torneios deste mês.",
    category: "Internacional",
    date: "2025-06-28",
    imageGradient: "from-violet-400 to-purple-700",
    imageEmoji: "📅",
  },
];

export const tournaments: Tournament[] = [
  {
    id: "1",
    name: "Australian Open",
    location: "Melbourne",
    country: "Austrália",
    startDate: "2025-01-13",
    endDate: "2025-01-26",
    surface: "Duro",
    category: "Grand Slam",
    prize: "A$ 86.500.000",
  },
  {
    id: "2",
    name: "Roland Garros",
    location: "Paris",
    country: "França",
    startDate: "2025-05-25",
    endDate: "2025-06-08",
    surface: "Saibro",
    category: "Grand Slam",
    prize: "€ 53.478.000",
  },
  {
    id: "3",
    name: "Wimbledon",
    location: "Londres",
    country: "Reino Unido",
    startDate: "2025-06-30",
    endDate: "2025-07-13",
    surface: "Grama",
    category: "Grand Slam",
    prize: "£ 50.000.000",
  },
  {
    id: "4",
    name: "US Open",
    location: "Nova York",
    country: "Estados Unidos",
    startDate: "2025-08-25",
    endDate: "2025-09-07",
    surface: "Duro",
    category: "Grand Slam",
    prize: "US$ 65.000.000",
  },
  {
    id: "5",
    name: "Indian Wells Masters",
    location: "Indian Wells",
    country: "Estados Unidos",
    startDate: "2025-03-05",
    endDate: "2025-03-16",
    surface: "Duro",
    category: "ATP Masters 1000",
    prize: "US$ 8.995.555",
  },
  {
    id: "6",
    name: "Miami Open",
    location: "Miami",
    country: "Estados Unidos",
    startDate: "2025-03-19",
    endDate: "2025-03-30",
    surface: "Duro",
    category: "ATP Masters 1000",
    prize: "US$ 8.995.555",
  },
  {
    id: "7",
    name: "Monte-Carlo Masters",
    location: "Monte Carlo",
    country: "Mônaco",
    startDate: "2025-04-06",
    endDate: "2025-04-13",
    surface: "Saibro",
    category: "ATP Masters 1000",
    prize: "€ 5.415.410",
  },
  {
    id: "8",
    name: "Mutua Madrid Open",
    location: "Madri",
    country: "Espanha",
    startDate: "2025-04-24",
    endDate: "2025-05-04",
    surface: "Saibro",
    category: "ATP Masters 1000",
    prize: "€ 7.028.735",
  },
  {
    id: "9",
    name: "Internazionali BNL d'Italia",
    location: "Roma",
    country: "Itália",
    startDate: "2025-05-07",
    endDate: "2025-05-18",
    surface: "Saibro",
    category: "ATP Masters 1000",
    prize: "€ 7.028.735",
  },
  {
    id: "10",
    name: "Canadian Open (ATP)",
    location: "Toronto / Montreal",
    country: "Canadá",
    startDate: "2025-08-04",
    endDate: "2025-08-10",
    surface: "Duro",
    category: "ATP Masters 1000",
    prize: "US$ 6.600.000",
  },
  {
    id: "11",
    name: "Western & Southern Open",
    location: "Cincinnati",
    country: "Estados Unidos",
    startDate: "2025-08-11",
    endDate: "2025-08-17",
    surface: "Duro",
    category: "ATP Masters 1000",
    prize: "US$ 6.600.000",
  },
  {
    id: "12",
    name: "Shanghai Masters",
    location: "Xangai",
    country: "China",
    startDate: "2025-10-04",
    endDate: "2025-10-12",
    surface: "Duro",
    category: "ATP Masters 1000",
    prize: "US$ 8.750.000",
  },
  {
    id: "13",
    name: "Paris Masters",
    location: "Paris",
    country: "França",
    startDate: "2025-10-27",
    endDate: "2025-11-02",
    surface: "Duro",
    category: "ATP Masters 1000",
    prize: "€ 5.415.410",
  },
  {
    id: "14",
    name: "Nitto ATP Finals",
    location: "Turim",
    country: "Itália",
    startDate: "2025-11-09",
    endDate: "2025-11-16",
    surface: "Duro",
    category: "ATP 500",
    prize: "US$ 15.250.000",
  },
  {
    id: "15",
    name: "WTA Finals",
    location: "Riade",
    country: "Arábia Saudita",
    startDate: "2025-10-26",
    endDate: "2025-11-02",
    surface: "Duro",
    category: "WTA 1000",
    prize: "US$ 15.250.000",
  },
  {
    id: "16",
    name: "WTA 1000 de Doha",
    location: "Doha",
    country: "Qatar",
    startDate: "2025-02-10",
    endDate: "2025-02-16",
    surface: "Duro",
    category: "WTA 1000",
    prize: "US$ 1.750.000",
  },
  {
    id: "17",
    name: "Davis Cup Finals",
    location: "Málaga",
    country: "Espanha",
    startDate: "2025-11-18",
    endDate: "2025-11-23",
    surface: "Duro",
    category: "Davis Cup",
    prize: "—",
  },
  {
    id: "18",
    name: "Copa Billie Jean King",
    location: "Sevilha",
    country: "Espanha",
    startDate: "2025-11-12",
    endDate: "2025-11-16",
    surface: "Duro",
    category: "Copa Billie Jean King",
    prize: "—",
  },
  {
    id: "19",
    name: "Rio Open",
    location: "Rio de Janeiro",
    country: "Brasil",
    startDate: "2025-02-15",
    endDate: "2025-02-23",
    surface: "Saibro",
    category: "ATP 500",
    prize: "US$ 2.359.280",
  },
  {
    id: "20",
    name: "Aberto de Genebra",
    location: "Genebra",
    country: "Suíça",
    startDate: "2025-05-17",
    endDate: "2025-05-24",
    surface: "Saibro",
    category: "ATP 250",
    prize: "€ 570.945",
  },
];

export function formatDatePT(dateString: string): string {
  const date = new Date(dateString + "T00:00:00");
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function formatDateRangePT(start: string, end: string): string {
  const startDate = new Date(start + "T00:00:00");
  const endDate = new Date(end + "T00:00:00");

  const startDay = startDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  const endDay = endDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

  return `${startDay} – ${endDay}`;
}

export function getCategoryBadgeClass(category: NewsCategory): string {
  switch (category) {
    case "Grand Slam":
      return "badge-grand-slam";
    case "ATP":
      return "badge-atp";
    case "WTA":
      return "badge-wta";
    case "Brasil":
      return "badge-brasil";
    case "Internacional":
      return "badge-internacional";
    default:
      return "bg-gray-100 text-gray-700 border border-gray-300";
  }
}
