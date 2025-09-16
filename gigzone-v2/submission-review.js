// Example mock data - replace this with Supabase response
const submissions = [
  {
    username: 'user01',
    date: 'July 30, 10:35 PM',
    evidenceUrl: 'https://via.placeholder.com/150',
    status: 'pending'
  },
  // Add more mock entries as needed
];

const submissionRows = document.getElementById('submission-rows');

submissions.forEach((submission, index) => {
  const row = document.createElement('tr');

  row.innerHTML = `
    <td>${submission.username}</td>
    <td>${submission.date}</td>
    <td>
      <a href="#" class="view-evidence" data-url="${submission.evidenceUrl}">View File</a>
    </td>
    <td>
      <button class="approve-btn">Approve</button>
      <button class="reject-btn">Reject</button>
      <button class="hold-btn" data-index="${index}">Put on Hold</button>
      <div class="feedback-section hidden" id="feedback-${index}">
        <textarea placeholder="Enter feedback..."></textarea>
        <button class="send-feedback-btn">Send Feedback</button>
      </div>
    </td>
  `;

  submissionRows.appendChild(row);
});

// View Evidence Modal
document.addEventListener('click', function (e) {
  if (e.target.classList.contains('view-evidence')) {
    e.preventDefault();
    const imageUrl = e.target.getAttribute('data-url');
    document.getElementById('modalImage').src = imageUrl;
    document.getElementById('modal').classList.remove('hidden');
  }

  if (e.target.id === 'closeModal') {
    document.getElementById('modal').classList.add('hidden');
  }

  if (e.target.classList.contains('hold-btn')) {
    const index = e.target.getAttribute('data-index');
    const section = document.getElementById(`feedback-${index}`);
    section.classList.toggle('hidden');
  }
});
