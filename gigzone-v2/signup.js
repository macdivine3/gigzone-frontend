// Supabase setup
const SUPABASE_URL = 'https://fwwbsoesxijhhpzpdjou.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3d2Jzb2VzeGlqaGhwenBkam91Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1NzA0MzEsImV4cCI6MjA2ODE0NjQzMX0.qELrGVrVdug3q53cxNGStsFEfLcb7N-lVS9u3qu6HEE';
const { createClient } = window.supabase;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Generate unique referral code
function generateReferralCode(username) {
  const randomDigits = Math.floor(100 + Math.random() * 900); // 3-digit number
  return `${username}${randomDigits}`;
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('signupForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const full_name = document.getElementById('full_name').value.trim();
    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const referralCode = document.getElementById('referral-code').value.trim();

    if (password !== confirmPassword) {
      alert('Passwords do not match!');
      return;
    }

    try {
      // Step 1: Sign up the user
      const { data: signupData, error: signupError } = await supabase.auth.signUp({
        email,
        password
      });

      if (signupError) {
        alert('Error signing up: ' + signupError.message);
        return;
      }

      const user = signupData.user;
      const userId = user.id;
      const myReferralCode = generateReferralCode(username);

      let validReferralCode = null;

      // Step 2: Validate referral code if provided
      if (referralCode) {
        const { data: referrerData, error: referrerError } = await supabase
          .from('profiles')
          .select('id')
          .eq('referral_code', referralCode)
          .single();

        if (!referrerError && referrerData) {
          validReferralCode = referralCode;
        } else {
          alert('Invalid referral code! Proceeding without referral bonus.');
        }
      }

      // Step 3: Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{
          id: userId,
          full_name,
          username,
          email,
          referral_code: myReferralCode,
          referred_by: validReferralCode
        }]);

      if (profileError) {
        alert('Error saving profile: ' + profileError.message);
        return;
      }

      // Step 4: Create wallet
      const { error: walletError } = await supabase
        .from('wallets')
        .insert([{ user_id: userId }]);

      if (walletError) {
        console.error("Wallet creation failed:", walletError.message);
        alert("Wallet setup failed.");
        return;
      }

      // Step 5: Log referral if valid
      if (validReferralCode) {
        const { data: referrerProfile, error: refProfileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('referral_code', validReferralCode)
          .single();

        if (!refProfileError && referrerProfile) {
          const referrerId = referrerProfile.id;

          const { error: referralLogError } = await supabase
            .from('referrals')
            .insert([{
              referrer_id: referrerId,
              referred_user_id: userId,
            }]);

          if (referralLogError) {
            console.error('Referral logging failed:', referralLogError.message);
          }
        }
      }

      alert('Signup successful! Please check your email to verify your account.');
      window.location.href = 'login.html';

    } catch (error) {
      console.error('Unexpected error:', error.message);
      alert('Something went wrong.');
    }
  });
});
