import { permanentRedirect } from "next/navigation";

// Le vecchie pagine per sezione ora sono tutte nella pagina iniziale
export default function Evento() {
  permanentRedirect("/");
}
