// 1) Initialize Supabase
     const SUPABASE_URL = "https://dhbmtcnuxishkaycskea.supabase.co";
    const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoYm10Y251eGlzaGtheWNza2VhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4NDA3MDAsImV4cCI6MjA3NDQxNjcwMH0.L_BwZNz4BW8GqSyOuJzaKkUkZoRq-7Uz3y5SUha05bM";
    const { createClient } = window.supabase;
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 2) Grab task ID from URL and set hidden input
const params = new URLSearchParams(window.location.search);
const taskId = params.get("id");
const taskIdInput = document.getElementById("task-id");

if (!taskId) {
  alert("No task specified. Redirecting to Browse Tasks.");
  window.location.href = "browse.html";
} else {
  taskIdInput.value = taskId;
}

// 3) Fetch task details from the view
async function loadTask() {
  const { data: task, error } = await supabase
    .from("tasks_with_details")
    .select(`
      title,
      description,
      subcategory_label,
      task_url,
      client_username,
      subcategory_price,
      sample_image_url
    `)
    .eq("id", taskId.toString())
    .single();

  if (error || !task) {
    console.error("Supabase error:", error);
    document.getElementById("task-title").textContent = "Task not found";
    return;
  }

  document.getElementById("task-title").textContent = task.title;
  document.getElementById("task-description").textContent = task.description;
  document.getElementById("sub-category").textContent =
    task.subcategory_label;
  document.getElementById("client-username").textContent =
    task.client_username;
  document.getElementById("task-link").href = task.task_url || "#";

   // Reward formatting
  document.getElementById("subcategory_price").textContent =
    `${task.subcategory_price.toLocaleString("en-NG", {
      style: "currency",
      currency: "NGN",
    })}`;

// Sample image handling (bulletproof)
const sampleImage = document.getElementById("sample-image");

if (task.sample_image_url) {
  let publicUrl;

  // If the DB value starts with "http", assume it's already a full URL
  if (task.sample_image_url.startsWith("http")) {
    publicUrl = task.sample_image_url;
  } else {
    // Otherwise, treat it as a relative path and get public URL from Supabase
    const { data: imgData, error: imgErr } = supabase.storage
      .from("task-evidence")
      .getPublicUrl(task.sample_image_url);

    if (imgErr) {
      console.error("Error getting public URL:", imgErr);
      sampleImage.style.display = "none";
      publicUrl = null;
    } else {
      publicUrl = imgData?.publicUrl;
    }
  }

  if (publicUrl) {
    sampleImage.src = publicUrl;
    sampleImage.style.display = "block";
  } else {
    sampleImage.style.display = "none";
  }

  // Optional: debug logs
  console.log("Resolved sample image URL:", publicUrl);
} else {
  console.log("No sample_image_url found for this task");
  sampleImage.style.display = "none";
}
}

if (taskId) loadTask();

// 4) File preview + drag/drop handling
const uploadArea = document.querySelector(".file-upload-area");
const fileInput = document.getElementById("screenshot");
const previewBox = document.getElementById("preview-container");
const previewImg = document.getElementById("preview");

fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) return showStatus("Max 5 MB", "error");
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
  const { error: upErr } = await supabase.storage
    .from("task-evidence")
    .upload(filePath, file);
  if (upErr) return showStatus("Upload failed.", "error");

  // Get public URL
  const { data, error: urlErr } = supabase.storage
    .from("task-evidence")
    .getPublicUrl(filePath);
  if (urlErr) return showStatus("Could not retrieve URL.", "error");
  const publicUrl = data.publicUrl;

  // Get current user
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;

  if (!user) {
    showStatus("Please log in to submit this task.", "error");
    return;
  }

  // Check if already submitted
    const { data: existing, error } = await supabase
  .from("task_submissions")
  .select("id")
  .eq("task_id", taskId)
  .eq("freelancer_id", user.id);

if (existing && existing.length > 0) {
  showStatus("You’ve already submitted for this task.", "error");
  return;
}

  // Insert into submissions table
  const { error: insErr } = await supabase.from("task_submissions").insert([
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
