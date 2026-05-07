const form = document.querySelector(".signup-form");

if (form) {
  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const data = new FormData(form);
    const recipient = form.dataset.recipient;
    const subject = "Daso May 12 conversation signup";
    const lines = Array.from(data.entries()).map(([key, value]) => {
      const cleanValue = String(value).trim() || "(not answered)";
      return `${key}: ${cleanValue}`;
    });

    const mailto = new URL(`mailto:${recipient}`);
    mailto.searchParams.set("subject", subject);
    mailto.searchParams.set("body", lines.join("\n"));

    window.location.href = mailto.toString();

    const note = form.querySelector(".form-note");
    if (note) {
      note.textContent = "Your email app should open with the signup details filled in.";
    }
  });
}
