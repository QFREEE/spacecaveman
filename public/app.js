const $ = (selector) => document.querySelector(selector);
const dateFormat = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", weekday: "short", month: "short", day: "numeric", year: "numeric" });
const timeFormat = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "numeric", minute: "2-digit" });
let visits = [];
let filter = "all";

function element(tag, text, className) {
  const node = document.createElement(tag);
  node.textContent = text;
  if (className) node.className = className;
  return node;
}

function render() {
  const list = $("#visits");
  list.replaceChildren();
  const now = Date.now();
  const visible = visits.filter((visit) => Date.parse(visit.end) > now && (filter === "all" || visit.status === filter));
  $("#load-status").textContent = visible.length ? `${visible.length} visit${visible.length === 1 ? "" : "s"}` : "No public visit plans are available.";
  for (const visit of visible) {
    const card = element("article", "", "visit");
    const heading = element("div", "", "visit-heading");
    const info = element("div", "");
    info.append(element("h3", dateFormat.format(new Date(visit.start))), element("p", `${timeFormat.format(new Date(visit.start))}–${timeFormat.format(new Date(visit.end))} ET · ${visit.area}`, "details"));
    heading.append(info, element("span", visit.status === "confirmed" ? "Confirmed" : "Tentative", `badge ${visit.status}`));
    card.append(heading, element("p", visit.note));
    list.append(card);
  }
}

async function load() {
  $("#retry").hidden = true;
  $("#load-status").textContent = "Loading visits…";
  try {
    const response = await fetch("/api/visits");
    if (!response.ok) throw new Error("Visit request failed");
    const data = await response.json();
    if (!Array.isArray(data.visits)) throw new Error("Invalid visit response");
    visits = data.visits;
    render();
  } catch {
    $("#load-status").textContent = "Couldn't load visits. Please try again.";
    $("#retry").hidden = false;
  }
}

document.querySelectorAll("[data-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    filter = button.dataset.filter;
    document.querySelectorAll("[data-filter]").forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
    render();
  });
});
$("#retry").addEventListener("click", load);
// Remove a visit from an open tab when its availability window has ended.
setInterval(render, 60000);
load();
