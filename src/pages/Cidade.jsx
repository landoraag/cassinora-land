import City from "../components/City";

export default function Cidade() {
  return (
    <div className="page city-page">
      <div className="page-head">
        <div>
          <h1>🏙️ Cidade</h1>
          <p className="muted">Passeie, trabalhe, compre sua casa e visite os vizinhos. Quem está online aparece andando por aqui.</p>
        </div>
      </div>
      <City />
    </div>
  );
}
