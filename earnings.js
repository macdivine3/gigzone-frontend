document.addEventListener('DOMContentLoaded', async () => {
  const supabase = window.supabaseClient;

  // Get user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    console.error('User not authenticated:', userError);
    return;
  }

  const userId = user.id;

  // Fetch profile (referral earnings + code)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('referral_earnings, referral_code')
    .eq('id', userId)
    .single();

  const referralEarnings = profile?.referral_earnings || 0;
  const referralCode = profile?.referral_code || '';
  const referralLink = `https://gigzone.com/signup?ref=${referralCode}`;

  // Inject referral link
  const referralEl = document.querySelector('.referral-code');
  if (referralEl) {
    referralEl.textContent = referralLink;
  }

  // Fetch wallet (withdrawable balance)
  const { data: wallet, error: walletError } = await supabase
    .from('wallets')
    .select('withdrawable_balance')
    .eq('user_id', userId)
    .single();

  const walletBalance = wallet?.withdrawable_balance || 0;

  // Fetch badge rewards (achievement bonuses)
  const { data: badgeRewards, error: badgeError } = await supabase
    .from('badge_rewards')
    .select('amount')
    .eq('user_id', userId);

  const totalBadgeRewards = badgeRewards?.reduce((sum, row) => sum + (Number(row.amount) || 0), 0) || 0;

  // Fetch task reward transactions
  const { data: taskTransactions, error: taskError } = await supabase
    .from('transactions')
    .select('amount')
    .eq('user_id', userId)
    .eq('type', 'task_reward');

  const taskEarnings = taskTransactions?.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0) || 0;

  // Calculate total earnings
  const totalEarnings = referralEarnings + taskEarnings + totalBadgeRewards;

  // ===== Render Summary Cards =====
  document.querySelector('.total-earnings').textContent = `₦${totalEarnings.toLocaleString()}`;
  document.querySelector('.wallet-balance').textContent = `₦${walletBalance.toLocaleString()}`;
  document.querySelector('.referral-earnings').textContent = `₦${referralEarnings.toLocaleString()}`;

  // ===== Earnings Breakdown Section =====
  const breakdownEls = document.querySelectorAll('.earnings-breakdown .withdrawal-amount');
  if (breakdownEls.length >= 3) {
    breakdownEls[0].textContent = `₦${taskEarnings.toLocaleString()}`;        // Tasks
    breakdownEls[1].textContent = `₦${referralEarnings.toLocaleString()}`;    // Referrals
    breakdownEls[2].textContent = `₦${totalBadgeRewards.toLocaleString()}`;   // Achievements
  }
    // ===== Fetch and Render Recent Withdrawals =====
const { data: withdrawals, error: withdrawalError } = await supabase
.from("transactions")
.select("amount, created_at")
.eq("type", "withdrawal")
.eq("user_id", user.id)
.eq("status", "success")
.order('created_at', { ascending: false })  // ✅ Valid in v2+
.limit(2);

  const withdrawalList = document.querySelector('.withdrawal-list');
if (withdrawalList) {
  withdrawalList.innerHTML = '';

  if (withdrawals?.length > 0) {
    withdrawalList.innerHTML = "<li>No withdrawals yet.</li>";
    withdrawals.forEach(txn => {
      const date = new Date(txn.created_at);
      const formattedDate = date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });

      const li = document.createElement('li');
      li.innerHTML = `
        <div>
          <span class="withdrawal-amount">₦${Number(txn.amount).toLocaleString()}</span>
          <div class="withdrawal-date">${formattedDate}</div>
        </div>
        <div>
          <span class="badge" style="background: var(--success-gradient); color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px;">
            <i class="fas fa-check-circle" style="margin-right: 4px;"></i>Completed
          </span>
        </div>
      `;
      withdrawalList.appendChild(li);
    });
  } else {
    const li = document.createElement('li');
    li.innerHTML = `
      <div>
        <span class="withdrawal-amount"></span>
        <div class="withdrawal-date">No withdrawals yet.</div>
      </div>
    `;
    withdrawalList.appendChild(li);
  }
}
  // ===== Get Verified Button Routing =====
  const verifyBtn = document.querySelector('.get-verified-btn');
  if (verifyBtn) {
    verifyBtn.addEventListener('click', () => {
      window.location.href = 'verify.html';
    });
  }
});
document.addEventListener('DOMContentLoaded', async () => {
  const supabase = window.supabaseClient;

  // Get user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    console.error('User not authenticated:', userError);
    return;
  }

  const userId = user.id;

  // Fetch profile (only referral_code is needed)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('referral_code')
    .eq('id', userId)
    .single();

  if (profileError || !profile) {
    console.error('Unable to fetch referral code:', profileError);
    return;
  }

  const referralCode = profile.referral_code;

  // Create referral link
  const referralLink = `https://gigzone.com/signup?ref=${referralCode}`;

  // Set the referral link in the input field
  const referralInput = document.getElementById('referralLink');
  if (referralInput) {
    referralInput.value = referralLink;
  }
});
