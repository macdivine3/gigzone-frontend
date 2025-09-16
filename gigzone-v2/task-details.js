// 1) Initialize Supabase
const SUPABASE_URL = "https://fwwbsoesxijhhpzpdjou.supabase.co";
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3d2Jzb2VzeGlqaGhwenBkam91Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1NzA0MzEsImV4cCI6MjA2ODE0NjQzMX0.qELrGVrVdug3q53cxNGStsFEfLcb7N-lVS9u3qu6HEE';
const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 2) Grab task ID from URL and set hidden input
const params = new URLSearchParams(window.location.search);
const taskId = params.get("id");
const taskIdInput = document.getElementById("task-id");

if (!taskId) {
  // No ID → redirect to browse or show message
  alert("No task specified. Redirecting to Browse Tasks.");
  window.location.href = "browse.html";
} else {
  taskIdInput.value = taskId;
}

// 3) Fetch task details from the view
async function loadTask() {
const { data: task, error } = await db
  .from("tasks_with_details")
  .select(`
    title,
    description,
    subcategory_label,
    task_url,
    client_username,
    unit_price,
    is_premium,
    completed_count,
    max_earners
  `)
  .eq("id", taskId)
  .single();


  if (error || !task) {
    document.getElementById("task-title").textContent = "Task not found";
    return;
  }

  document.getElementById("task-title").textContent = task.title;
  document.getElementById("task-description").textContent = task.description;
  document.getElementById("sub-category").textContent = task.subcategory_label;
  document.getElementById("client-username").textContent = task.client_username;
  document.getElementById("task-link").href = task.task_url;
  // Display extra task info
document.getElementById("unit-price").textContent =
  `${task.unit_price.toLocaleString("en-NG", { style: "currency", currency: "NGN" })}`;

document.getElementById("is-premium").textContent = task.is_premium ? "🔥 Yes" : "No";

document.getElementById("progress").textContent = `${task.completed_count} / ${task.max_earners}`;

if (task.is_premium) {
    document.getElementById("premium-badge").classList.remove("hidden");
  }
if (taskId) loadTask();
}

// 4) File preview + drag/drop handling
const uploadArea = document.querySelector(".file-upload-area");
const fileInput = document.getElementById("screenshot");
const previewBox = document.getElementById("preview-container");
const previewImg = document.getElementById("preview");

fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) return showStatus("Max 5 MB", "error");
  previewImg.src = URL.createObjectURL(file);
  previewBox.style.display = "block";
});

uploadArea.addEventListener("dragover", (e) => {
  e.preventDefault();
  uploadArea.classList.add("dragover");
});
uploadArea.addEventListener("dragleave", (e) => {
  e.preventDefault();
  uploadArea.classList.remove("dragover");
});
uploadArea.addEventListener("drop", (e) => {
  e.preventDefault();
  uploadArea.classList.remove("dragover");
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith("image/")) {
    fileInput.files = e.dataTransfer.files;
    fileInput.dispatchEvent(new Event("change"));
  } else {
    showStatus("Please upload an image file.", "error");
  }
});

// Remove preview helper
window.removeImage = () => {
  fileInput.value = "";
  previewImg.src = "";
  previewBox.style.display = "none";
};

// 5) Submit evidence
const form = document.getElementById("evidence-form");
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const statusEl = document.getElementById("status-message");
  showStatus("Uploading…", "info");

  const file = fileInput.files[0];
  if (!file) return showStatus("No file selected.", "error");

  // Upload to bucket 'task-evidence'
  const cleanName = file.name.replace(/[^a-zA-Z0-9.]/g, "_");
const filePath = `task-${taskId}/${Date.now()}_${cleanName}`;
  const { error: upErr } = await db.storage
    .from("task-evidence")
    .upload(filePath, file);
  if (upErr) return showStatus("Upload failed.", "error");

  // Get public URL
   const { data, error: urlErr } = db.storage.from("task-evidence")
  .getPublicUrl(filePath);
   if (urlErr) return showStatus("Could not retrieve URL.", "error");
   const publicUrl = data.publicUrl;


  // Get current user
const { data: sessionData } = await db.auth.getSession();
const user = sessionData.session?.user;

if (!user) {
  showStatus("Please log in to submit this task.", "error");
  return;
}

const { data: existing } = await db
  .from("task_submissions")
  .select("id")
  .eq("task_id", taskId)
  .eq("freelancer_id", user.id)
  .single();

if (existing) {
  showStatus("You’ve already submitted for this task.", "error");
  return;
}

  // Insert into submissions table
  const { error: insErr } = await db
    .from("task_submissions")
    .insert([
      { task_id: taskId, freelancer_id: user.id, proof_url: publicUrl },
    ]);
  if (insErr) return showStatus("Save failed.", "error");

  showStatus("Submission successful!", "success");
  form.reset();
  removeImage();
});

// Helper to show status
function showStatus(message, type) {
  const el = document.getElementById("status-message");
  el.textContent = message;
  el.className = `status ${type} show`;
  setTimeout(() => el.classList.remove("show"), 4000);
}
