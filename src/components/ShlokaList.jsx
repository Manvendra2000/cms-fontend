import React, { useEffect, useState } from "react";

const API_URL = "http://localhost:1337";

export default function ShlokaList({ sectionId }) {

  const [shlokas, setShlokas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchShlokas();
  }, [sectionId]);

  const fetchShlokas = async () => {

    try {

      const response = await fetch(
        `${API_URL}/api/shlokas?filters[section][id][$eq]=${sectionId}&populate=*&sort=Verse_Number:asc`
      );

      const result = await response.json();

      setShlokas(result.data || []);
      setLoading(false);

    } catch (error) {
      console.error("Error loading shlokas:", error);
      setLoading(false);
    }

  };

  if (loading) return <div>Loading Shlokas...</div>;

  if (!shlokas.length) return <div>No Shlokas in this section</div>;

  return (
    <div>

      {shlokas.map((item) => {

        const shloka = item.attributes;

        return (

          <div
            key={item.id}
            style={{
              border: "1px solid #ddd",
              padding: "15px",
              marginBottom: "10px",
              borderRadius: "6px",
              background: "#fff"
            }}
          >

            <div style={{ fontWeight: "600", marginBottom: "8px" }}>
              Verse {shloka.Verse_Number}
            </div>

            {shloka.Transliteration && (
              <div style={{ fontStyle: "italic", marginBottom: "6px" }}>
                {shloka.Transliteration}
              </div>
            )}

            {shloka.Text && (
              <div style={{ marginBottom: "6px" }}>
                {JSON.stringify(shloka.Text)}
              </div>
            )}

            {shloka.Translation && (
              <div>
                {JSON.stringify(shloka.Translation)}
              </div>
            )}

          </div>

        );
      })}

    </div>
  );
}