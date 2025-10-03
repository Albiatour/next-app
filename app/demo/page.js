"use client";

export default function Demo() {
  const slots = [
    "12:00", "12:30", "13:00", "13:30",
    "19:00", "19:30", "20:00", "20:30",
    "21:00", "21:30", "22:00", "22:30",
  ];

  function book(time) {
    alert(`(Prototype) Créneau réservé : ${time}`);
  }

  return (
    <main style={{ padding: "40px", textAlign: "center", color: "white" }}>
      <h1 style={{ marginBottom: 8 }}>Démo — Réservations IA</h1>
      <p style={{ color: "#cbd5e1" }}>Sélectionne un créneau pour simuler une réservation :</p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "10px",
          marginTop: "20px",
          maxWidth: 600,
          marginLeft: "auto",
          marginRight: "auto",
        }}
      >
        {slots.map((s) => (
          <button
            key={s}
            onClick={() => book(s)}
            style={{
              padding: "10px",
              borderRadius: "8px",
              background: "#333",
              color: "white",
              border: "1px solid #555",
              cursor: "pointer",
            }}
          >
            {s}
          </button>
        ))}
      </div>

      <div style={{ marginTop: "30px" }}>
        <a href="/" style={{ color: "lightblue" }}>← Retour à l’accueil</a>
      </div>
    </main>
  );
}

  