

const API_URL = "APIURL"; 


async function loadFromBackend() {
  try {
    const response = await fetch(API_URL, {
      method: "GET",
      headers: {
        "Content-Type": "text/plain"
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error!`);
    }

    const text = await response.text();
    document.getElementById("message").textContent = text;
  } catch (err) {
    console.error("Failed to load backend:", err);
    document.getElementById("message").textContent = "Error fetching data!";
  }
}

document.addEventListener("DOMContentLoaded", loadFromBackend);