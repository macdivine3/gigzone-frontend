// Initialize Supabase
    const SUPABASE_URL = "https://fwwbsoesxijhhpzpdjou.supabase.co";
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3d2Jzb2VzeGlqaGhwenBkam91Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1NzA0MzEsImV4cCI6MjA2ODE0NjQzMX0.qELrGVrVdug3q53cxNGStsFEfLcb7N-lVS9u3qu6HEE';
const supabase = supabaseClient;

// 2️⃣ On load, check for unread and show red dot
async function checkUnreadNotifications() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { data, error } = await supabase
    .from("notifications")
    .select("id")
    .eq("user_id", user.id)
    .eq("is_read", false);

  if (!error && data.length > 0) {
    document.getElementById("notif-dot").style.display = "block";
  }
}
document.addEventListener("DOMContentLoaded", checkUnreadNotifications);

// 3️⃣ Open/Close logic
document.addEventListener("DOMContentLoaded", () => {
  const bell   = document.getElementById("notif-bell");
  const modal  = document.getElementById("notif-modal");
  const close  = document.getElementById("notif-close");
  const list   = document.getElementById("notif-modal-list");

  bell.addEventListener("click", async () => {
    modal.classList.toggle("show");
    if (!modal.classList.contains("show")) {
      // fetch & render notifications…
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      list.innerHTML = (error || !data.length)
        ? "<p>No notifications</p>"
        : data.map(n => `<div class="notif-item">${n.message}</div>`).join("");

      // mark all as read
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);

      // hide red dot
      document.getElementById("notif-dot").style.display = "none";
    }
  });

  // b) Close when clicking the “×”
  close.addEventListener("click", () => {
    modal.classList.remove("show");
  });
  

  // c) Close when clicking outside the white box
  modal.addEventListener("click", e => {
    if (e.target === modal) {
      modal.classList.remove("show");
    }
  });
});

console.log('Close clicked'); // inside close.addEventListener



