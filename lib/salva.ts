import { modelliPer } from "./engine/models";
import { sanifica, type ProjectData } from "./project";

// L'evento non cambia; il modello deve essere uno di quelli per quell'evento
export function salvabili(attuali: ProjectData, nuovi: ProjectData): ProjectData {
  const d = sanifica({ ...nuovi, evento: attuali.evento });
  const mods = modelliPer(attuali.evento);
  const m = mods.find((x) => x.id === d.modello) ?? mods[0];
  d.modello = m.id;
  if (d.palette >= m.palettes.length) d.palette = 0;
  return d;
}
