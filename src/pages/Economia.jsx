import { useSearchParams } from "react-router-dom";
import { EconomyBar } from "../components/Economy";

export default function Economia() {
  const [params] = useSearchParams();
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>💼 Economia</h1>
          <p className="muted">Trabalhe, guarde no banco, faça compras, ajude em causas e evolua sua persona.</p>
        </div>
      </div>
      <EconomyBar startOpen={params.get("abrir")} />
    </div>
  );
}
