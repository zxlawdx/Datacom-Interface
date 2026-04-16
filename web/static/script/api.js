async function getStatus() {
    const res = await fetch("/api/onu-status/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            olt: "KM70"
        })
    });

    const data = await res.json();
    console.log(data);
}

async function loadONUs(e) {
  const btn = e.target.closest('button');
  setLoading(btn, true);
  const container = document.getElementById("onu-output");
  container.innerHTML = `<div class="col-span-full text-center py-16" style="color:#475569;"><div class="loading-spinner mx-auto mb-3" style="width:24px;height:24px;border-width:3px;"></div><p class="text-sm">Buscando ONUs...</p></div>`;
  try {
    const olt = document.getElementById("onu-olt").value;
    const res = await fetch(API + "/onu/status", {
      method: "POST", headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ olt })
    });
    const data = await res.json();
    parseONUsToCards(data.output || data.error, container);
  } catch {
    container.innerHTML = `<div class="col-span-full text-center py-16" style="color:#f87171;"><p class="text-sm">Erro ao carregar ONUs. Verifique a conexão com a API.</p></div>`;
    showToast("Erro ao carregar ONUs", "error");
  }
  setLoading(btn, false);
}


async function loadDiscovered(e) {
  const btn = e.target.closest('button');
  setLoading(btn, true);
  const container = document.getElementById("disc-output");
  container.innerHTML = `<div class="col-span-full text-center py-16" style="color:#475569;"><div class="loading-spinner mx-auto mb-3" style="width:24px;height:24px;border-width:3px;"></div><p class="text-sm">Buscando dispositivos...</p></div>`;
  try {
    const olt = document.getElementById("disc-olt").value;
    const res = await fetch(API + "/onu/discovered", {
      method: "POST", headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ olt })
    });
    const data = await res.json();
    parseONUsToCards(data.output || data.error, container);
  } catch {
    container.innerHTML = `<div class="col-span-full text-center py-16" style="color:#f87171;"><p class="text-sm">Erro ao buscar ONUs descobertas.</p></div>`;
    showToast("Erro ao buscar ONUs", "error");
  }
  setLoading(btn, false);
}

window.loadONUs = async function (event) {
    console.log("Carregando ONUs...");
};