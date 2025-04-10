const append_importmap = () => {
  const script = document.createElement("script");
  script.type = "importmap";

  return fetch("/config/importmap.json")
    .then(res => res.text())
    .then(importmap => { script.textContent = importmap })
    .then(() => document.head.append(script));
};


append_importmap()
  .then(() => import("@main"));
