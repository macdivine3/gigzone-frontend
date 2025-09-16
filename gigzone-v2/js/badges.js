(() => {
  // Use the globally created supabaseClient
  const supabase = window.supabaseClient;


  // 1) Badge definitions
  const BADGE_TIERS = {
    earner: [
      { tier: 'Beginner', threshold: 1, reward: 0 },
      { tier: 'Amateur',  threshold: 10, reward: 0 },
      { tier: 'Regular',  threshold: 20, reward: 0 },
      { tier: 'Top',      threshold: 30, reward: 5000 },
      { tier: 'Elite',    threshold: 50, reward: 7000 }
    ],
    client: [
      { tier: 'Beginner', threshold: 1, reward: 0 },
      { tier: 'Amateur',  threshold: 7, reward: 0 },
      { tier: 'Regular',  threshold: 15, reward: 0 },
      { tier: 'Top',      threshold: 20, reward: 7000 },
      { tier: 'Elite',    threshold: 30, reward: 10000 }
    ],
    affiliate: [
      { tier: 'Beginner', threshold: 3, reward: 0 },
      { tier: 'Amateur',  threshold: 10, reward: 0 },
      { tier: 'Regular',  threshold: 25, reward: 0 },
      { tier: 'Top',      threshold: 50, reward: 10000 },
      { tier: 'Elite',    threshold: 100, reward: 20000 }
    ]
  };

  // 2) Helpers
  function getNextTierAndProg(count, role) {
    const tiers = BADGE_TIERS[role];
    for (let t of tiers) {
      if (count < t.threshold) {
        return { next: t.tier, threshold: t.threshold };
      }
    }
    return null; // highest reached
  }

  function createRoleProgressBlock(role, count) {
    // Only include if user has ANY progress
    if (count === 0) return '';
    const currentBadge = tiersFor(role).reverse().find(t => count >= t.threshold)?.tier || 'None';
    const nextInfo = getNextTierAndProg(count, role);
    const pct = nextInfo
      ? Math.round((count / nextInfo.threshold) * 100)
      : 100;

    return `
      <div class="role-block">
        <h3>${capitalize(role)}: ${currentBadge}</h3>
        <progress value="${count}" max="${ nextInfo ? nextInfo.threshold : count }"></progress>
        <p>${ nextInfo
            ? `${count}/${nextInfo.threshold} toward ${nextInfo.next}`
            : `Highest tier reached! 🎉`
        }</p>
      </div>`;
  }

  function tiersFor(role) { return BADGE_TIERS[role]; }
  function capitalize(str) { return str[0].toUpperCase() + str.slice(1); }

  // 3) Main
  document.addEventListener('DOMContentLoaded', async () => {
    const user = supabase.auth.user();
    if (!user) return;

    // 3.1) Fetch latest badge
    const { data: latest, error: e1 } = await supabase
      .from('user_badges')
      .select('role, tier, last_updated')
      .eq('user_id', user.id)
      .order('last_updated', { ascending: false })
      .limit(1)
      .single();
    if (e1 || !latest) return console.error(e1);

    // 3.2) Populate badge bar
    
const badgeBar  = document.getElementById('badge-bar');
const iconEl = document.getElementById('badge-icon');
const textEl = document.getElementById('badge-text');

// If they have no badge yet:
if (!latest || !latest.tier) {
  // Option A: Hide the whole bar
  // bar.style.display = 'none';

  // Option B: Show a placeholder
  iconEl.textContent = '⌛';             // hourglass emoji as placeholder
  textEl.textContent = 'No badge yet';
  return;
}

// Otherwise—show their badge:
const emojiMap = {
  Beginner: '🥉',
  Amateur:  '🥈',
  Regular:  '⭐',
  Top:      '🥇',
  Elite:    '🏆'
};

const badgeName = `${latest.tier} ${latest.role.charAt(0).toUpperCase() + latest.role.slice(1)}`;

iconEl.textContent = emojiMap[latest.tier] || '🏅';
textEl.textContent = badgeName;


    // 3.3) Tooltip every 10 minutes
    const tooltip = document.getElementById('badge-tooltip');
    function showTip() {
      tooltip.classList.add('visible');
      setTimeout(() => tooltip.classList.remove('visible'), 4000);
    }
    showTip();
    setInterval(showTip, 10 * 60 * 1000); // 10 min

    // 3.4) Click opens modal
    const modal = document.getElementById('badge-modal');
    const close = document.getElementById('badge-modal-close');
    badgeBaar.addEventListener('click', () => modal.classList.remove('hidden'));
    close.addEventListener('click', () => modal.classList.add('hidden'));

    // 3.5) Build modal content
    // Current badge
    document.getElementById('modal-current-badge').innerHTML = `
      <p><strong>${latest.tier} ${capitalize(latest.role)}</strong></p>
    `;

    // Fetch all three progress counts
    const counts = {};
    for (let role of ['earner','client','affiliate']) {
      let table, field;
      if (role==='earner')  { table='task_submissions'; field='freelancer_id'; }
      if (role==='client')  { table='tasks';           field='uploader_id'; }
      if (role==='affiliate'){ table='referrals';      field='referrer_id'; }
      const { count } = await supabase
        .from(table)
        .select('*', { head: true, count: 'exact' })
        .eq(field, user.id);
      counts[role] = count || 0;
    }

    // Render up to 3 bars
    const barsHtml = ['earner','client','affiliate']
      .map(r => createRoleProgressBlock(r, counts[r]))
      .join('');
    document.getElementById('modal-progress-bars').innerHTML = barsHtml;
  });
})
