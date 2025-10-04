// signup.js
    // Supabase Configuration
    const SUPABASE_URL = "https://dhbmtcnuxishkaycskea.supabase.co";
   const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoYm10Y251eGlzaGtheWNza2VhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4NDA3MDAsImV4cCI6MjA3NDQxNjcwMH0.L_BwZNz4BW8GqSyOuJzaKkUkZoRq-7Uz3y5SUha05bM";
   
   const { createClient } = window.supabase;
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    const signupForm = document.getElementById('signupForm');
    const signupBtn = document.getElementById('signupBtn');
    const messageDiv = document.getElementById('message');

    // Generate referral code function
    function generateReferralCode(username) {
        const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `${username.toLowerCase().slice(0, 4)}${randomNum}`;
    }

    // Show message function
    function showMessage(text, type = 'success') {
        messageDiv.textContent = text;
        messageDiv.className = `message ${type}`;
        messageDiv.classList.remove('hidden');
        setTimeout(() => messageDiv.classList.add('hidden'), 8000);
    }

    // Auto-fill referral code from URL
    window.addEventListener("DOMContentLoaded", () => {
        const urlParams = new URLSearchParams(window.location.search);
        const ref = urlParams.get("ref");
        if (ref) {
            document.getElementById("referral-code").value = ref;
        }
    });

    // Validate passwords match
    function validatePasswords(password, confirmPassword) {
        if (password !== confirmPassword) {
            showMessage('Passwords do not match', 'error');
            return false;
        }
        return true;
    }

    // Validate referral code exists
async function validateReferralCode(referralCode) {
    if (!referralCode) return null; // Optional field

    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('id, referral_code')
            .eq('referral_code', referralCode)
            .single();

        if (error || !data) {
            showMessage('Invalid referral code, proceeding without it', 'info');
            return null; // Use null instead of false
        }
        
        return referralCode; // Valid referral code
    } catch (error) {
        console.error('Referral validation error:', error);
        showMessage('Error validating referral code, proceeding without it', 'info');
        return null; // Always null if lookup fails
    }
}
    // Main signup logic
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(signupForm);
        const full_name = formData.get('full_name').trim();
        const username = formData.get('username').trim();
        const email = formData.get('email').trim();
        const password = formData.get('password');
        const confirmPassword = formData.get('confirmPassword');
        const referral_code = formData.get('referral_code').trim();

        // Validate required fields
        if (!full_name || !username || !email || !password) {
            showMessage('Please fill in all required fields', 'error');
            return;
        }

        // Validate passwords match
        if (!validatePasswords(password, confirmPassword)) {
            return;
        }

        // Validate referral code if provided
        const validReferralCode = await validateReferralCode(referral_code);
        if (referral_code && validReferralCode === false) {
            return; // Invalid referral code
        }

        signupBtn.disabled = true;
        signupBtn.textContent = 'Creating Account...';

        try {
            // Create auth user with email verification required
            // Build metadata safely
let userMetadata = {
    full_name: full_name,
    username: username
};

if (validReferralCode) {
    // Only attach referral_code if truly valid
    userMetadata.referral_code = validReferralCode;
} else {
    showMessage('Proceeding without referral code', 'info');
}

// Create auth user with email verification required
const { data, error } = await supabase.auth.signUp({
    email: email,
    password: password,
    options: {
        emailRedirectTo: `${window.location.origin}/email-verified.html`,
        data: userMetadata
    }
});

            if (error) {
                throw new Error(error.message);
            }

            if (data.user && !data.user.email_confirmed_at) {
                // Email verification required
                showMessage('Account created! Please check your email and click the verification link to complete your registration.', 'success');
                signupForm.reset();
            } else if (data.user && data.user.email_confirmed_at) {
                // Email already verified (shouldn't happen in normal flow)
                showMessage('Account created and verified! Redirecting to login...', 'success');
                setTimeout(() => window.location.href = 'login.html', 2000);
            }

        } catch (error) {
            console.error('Signup error:', error);
            let errorMessage = 'An error occurred during signup';
            
            if (error.message.includes('already registered')) {
                errorMessage = 'An account with this email already exists';
            } else if (error.message.includes('Password should be')) {
                errorMessage = 'Password is too weak. Please use a stronger password';
            } else if (error.message.includes('Username')) {
                errorMessage = 'Username is already taken';
            } else {
                errorMessage = error.message;
            }
            
            showMessage(errorMessage, 'error');
        } finally {
            signupBtn.disabled = false;
            signupBtn.textContent = 'Sign Up';
        }
    });

        // Check if user is already logged in
    async function checkAuthState() {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user && session.user.email_confirmed_at) {
            window.location.href = 'dashboard.html';
        }
    }

    checkAuthState();
