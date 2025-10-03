"use client";

export default function Demo() {
  const slots = ["12h00", "13h00", "19h00", "20h00", "21h00"];

  return (
    <main style={{ padding: "40px", textAlign: "center" }}>
      <h1>Réserver un créneau</h1>
      <p>Sélectionnez une heure ci-dessous :</p>

      <div style={{ marginTop: "20px" }}>
        {slots.map((s) => (
          <button
            key={s}
            style={{
              padding: "10px 20px",
              margin: "5px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              cursor: "pointer",
            }}
            onClick={() => alert(`Vous avez réservé : ${s}`)}
          >
            {s}
          </button>
        ))}
      </div>

      <div style={{ marginTop: "30px" }}>
        <a href="/" style={{ color: "lightblue" }}>
          ← Retour à l’accueil
        </a>
      </div>
    </main>
  );
}
