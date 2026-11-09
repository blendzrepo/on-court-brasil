import { getContentTournaments } from "@/lib/content";
import CalendarioClient from "@/components/CalendarioClient";

export default async function CalendarioPage() {
  const tournaments = await getContentTournaments();

  return <CalendarioClient tournaments={tournaments} />;
}
