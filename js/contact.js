import { saveContactMessage } from "./store.js";

function initContactForm() {
  const form = document.getElementById("contactForm");
  const feedback = document.getElementById("contactFeedback");

  if (!form || !feedback) {
    return;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const payload = {
      name: String(formData.get("name") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      topic: String(formData.get("topic") || "").trim(),
      message: String(formData.get("message") || "").trim(),
    };

    if (!payload.name || !payload.email || !payload.message) {
      feedback.textContent = "Please fill name, email, and message before sending.";
      return;
    }

    saveContactMessage(payload);
    feedback.textContent = "Message saved locally in this demo build.";
    form.reset();
  });
}

initContactForm();
