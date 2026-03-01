import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import {
  Phone, ArrowRight, ChevronDown, Shield,
  MessageCircle, Zap, Lock, RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import styles from './auth.module.css';

const COUNTRY_CODES = [
  { code: '+1',   name: 'United States',  flag: '🇺🇸' },
  { code: '+1',   name: 'Canada',         flag: '🇨🇦' },
  { code: '+44',  name: 'United Kingdom', flag: '🇬🇧' },
  { code: '+254', name: 'Kenya',          flag: '🇰🇪' },
  { code: '+234', name: 'Nigeria',        flag: '🇳🇬' },
  { code: '+27',  name: 'South Africa',   flag: '🇿🇦' },
  { code: '+91',  name: 'India',          flag: '🇮🇳' },
  { code: '+86',  name: 'China',          flag: '🇨🇳' },
  { code: '+49',  name: 'Germany',        flag: '🇩🇪' },
  { code: '+33',  name: 'France',         flag: '🇫🇷' },
  { code: '+39',  name: 'Italy',          flag: '🇮🇹' },
  { code: '+34',  name: 'Spain',          flag: '🇪🇸' },
  { code: '+55',  name: 'Brazil',         flag: '🇧🇷' },
  { code: '+52',  name: 'Mexico',         flag: '🇲🇽' },
  { code: '+61',  name: 'Australia',      flag: '🇦🇺' },
  { code: '+81',  name: 'Japan',          flag: '🇯🇵' },
  { code: '+82',  name: 'South Korea',    flag: '🇰🇷' },
  { code: '+7',   name: 'Russia',         flag: '🇷🇺' },
  { code: '+20',  name: 'Egypt',          flag: '🇪🇬' },
  { code: '+971', name: 'UAE',            flag: '🇦🇪' },
  { code: '+966', name: 'Saudi Arabia',   flag: '🇸🇦' },
  { code: '+62',  name: 'Indonesia',      flag: '🇮🇩' },
  { code: '+60',  name: 'Malaysia',       flag: '🇲🇾' },
  { code: '+63',  name: 'Philippines',    flag: '🇵🇭' },
  { code: '+92',  name: 'Pakistan',       flag: '🇵🇰' },
  { code: '+880', name: 'Bangladesh',     flag: '🇧🇩' },
  { code: '+256', name: 'Uganda',         flag: '🇺🇬' },
  { code: '+255', name: 'Tanzania',       flag: '🇹🇿' },
  { code: '+233', name: 'Ghana',          flag: '🇬🇭' },
  { code: '+212', name: 'Morocco',        flag: '🇲🇦' },
  { code: '+251', name: 'Ethiopia',       flag: '🇪🇹' },
  { code: '+249', name: 'Sudan',          flag: '🇸🇩' },
  { code: '+260', name: 'Zambia',         flag: '🇿🇲' },
  { code: '+263', name: 'Zimbabwe',       flag: '🇿🇼' },
  { code: '+65',  name: 'Singapore',      flag: '🇸🇬' },
  { code: '+64',  name: 'New Zealand',    flag: '🇳🇿' },
  { code: '+31',  name: 'Netherlands',    flag: '🇳🇱' },
  { code: '+46',  name: 'Sweden',         flag: '🇸🇪' },
  { code: '+47',  name: 'Norway',         flag: '🇳🇴' },
  { code: '+48',  name: 'Poland',         flag: '🇵🇱' },
  { code: '+380', name: 'Ukraine',        flag: '🇺🇦' },
  { code: '+90',  name: 'Turkey',         flag: '🇹🇷' },
  { code: '+98',  name: 'Iran',           flag: '🇮🇷' },
  { code: '+966', name: 'Saudi Arabia',   flag: '🇸🇦' },
];

// ── Google Sign-In button ─────────────────────────────────────────────────────
function GoogleSignInButton({ onSuccess, disabled }) {
  const btnRef = useRef(null);

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId || clientId === 'your_google_client_id.apps.googleusercontent.com') return;

    // Load Google Identity Services script once
    if (!document.getElementById('google-gsi')) {
      const script = document.createElement('script');
      script.id  = 'google-gsi';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
      script.onload = initGoogle;
    } else {
      initGoogle();
    }

    function initGoogle() {
      if (!window.google) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => onSuccess(response.credential),
      });
      if (btnRef.current) {
        window.google.accounts.id.renderButton(btnRef.current, {
          theme: 'filled_black',
          size: 'large',
          shape: 'rectangular',
          width: 320,
          text: 'continue_with',
        });
      }
    }
  }, [onSuccess]);

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const configured = clientId && clientId !== 'your_google_client_id.apps.googleusercontent.com';

  if (!configured) {
    // Show a disabled placeholder when not configured
    return (
      <button className={`${styles.googleBtn} ${styles.googleDisabled}`} disabled title="Add NEXT_PUBLIC_GOOGLE_CLIENT_ID to frontend/.env.local to enable">
        <GoogleIcon />
        <span>Continue with Google</span>
      </button>
    );
  }

  return <div ref={btnRef} className={styles.googleBtnWrapper} />;
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.706A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

// ── Main Auth Page ────────────────────────────────────────────────────────────
export default function AuthPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [step, setStep]               = useState('phone'); // phone | otp | profile
  const [phone, setPhone]             = useState('');
  const [countryCode, setCountryCode] = useState('+254');
  const [otp, setOtp]                 = useState(['', '', '', '', '', '']);
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading]         = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countrySearch, setCountrySearch]         = useState('');
  const [devMode, setDevMode]         = useState(false); // shows console hint

  // Ref-based guard prevents double-fire on OTP auto-submit
  const submittingRef = useRef(false);

  const selectedCountry = COUNTRY_CODES.find(c => c.code === countryCode) || COUNTRY_CODES[3];
  const filteredCountries = COUNTRY_CODES.filter(c =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
    c.code.includes(countrySearch)
  );

  // ── Send OTP ────────────────────────────────────────────────────────────────
  const handleSendOTP = async () => {
    const digits = phone.replace(/\D/g, '');
    if (!digits || digits.length < 6) {
      toast.error('Please enter a valid phone number');
      return;
    }
    setLoading(true);
    submittingRef.current = false; // reset for new OTP session
    try {
      const res = await api.post('/auth/send-otp', {
        phone:        digits,
        country_code: countryCode,
      });
      setOtp(['', '', '', '', '', '']);
      setStep('otp');
      if (res.data.delivery === 'console') {
        setDevMode(true);
        toast('📋 OTP printed to server console (Twilio not configured)', { icon: '⚠️', duration: 6000 });
      } else {
        setDevMode(false);
        toast.success(`Code sent to ${countryCode} ${phone}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  // ── Submit OTP — always receives the code string directly ───────────────────
  const submitOTP = async (codeString) => {
    if (submittingRef.current) return; // prevent double fire
    submittingRef.current = true;
    setLoading(true);
    try {
      const res = await api.post('/auth/verify-otp', {
        phone:        phone.replace(/\D/g, ''),
        country_code: countryCode,
        code:         codeString,
      });
      login(res.data.token, res.data.user);
      if (res.data.is_new_user || res.data.user.display_name === 'WaveChat User') {
        setStep('profile');
      } else {
        router.push('/');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid code. Please try again.');
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => document.getElementById('otp-0')?.focus(), 50);
    } finally {
      setLoading(false);
      submittingRef.current = false;
    }
  };

  // ── OTP input handlers ──────────────────────────────────────────────────────
  const handleOtpChange = (idx, val) => {
    if (!/^\d*$/.test(val)) return;
    const digit  = val.slice(-1);
    const newOtp = [...otp];
    newOtp[idx]  = digit;
    setOtp(newOtp);

    if (digit && idx < 5) {
      document.getElementById(`otp-${idx + 1}`)?.focus();
    }
    // Auto-submit when all 6 filled — pass array directly, never rely on state
    if (newOtp.every(d => d !== '')) {
      submitOTP(newOtp.join(''));
    }
  };

  const handleOtpKeyDown = (idx, e) => {
    if (e.key === 'Backspace') {
      if (otp[idx]) {
        const n = [...otp]; n[idx] = ''; setOtp(n);
      } else if (idx > 0) {
        const n = [...otp]; n[idx - 1] = ''; setOtp(n);
        document.getElementById(`otp-${idx - 1}`)?.focus();
      }
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!paste) return;
    const digits = paste.split('');
    const newOtp = ['', '', '', '', '', ''];
    digits.forEach((d, i) => { newOtp[i] = d; });
    setOtp(newOtp);
    document.getElementById(`otp-${Math.min(digits.length, 5)}`)?.focus();
    if (paste.length === 6) submitOTP(paste);
  };

  // ── Google Sign-In callback ─────────────────────────────────────────────────
  const handleGoogleSuccess = async (idToken) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/google', { id_token: idToken });
      login(res.data.token, res.data.user);
      if (res.data.is_new_user || res.data.user.display_name === 'WaveChat User') {
        setStep('profile');
      } else {
        router.push('/');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  // ── Profile completion ──────────────────────────────────────────────────────
  const handleCompleteProfile = async () => {
    if (!displayName.trim()) { toast.error('Please enter your name'); return; }
    setLoading(true);
    try {
      await api.patch('/users/me', { display_name: displayName.trim() });
      router.push('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className={styles.page}>

      {/* ── LEFT PANEL — branding with background image ── */}
      <div className={styles.left}>
        {/* Replace /images/auth-bg.jpg with your actual image path in /public/images/ */}
        <div className={styles.leftBg} style={{ backgroundImage: "url('/leftbg.jpg')" }} />
        <div className={styles.leftOverlay} />

        <div className={styles.leftContent}>
          {/* Replace /images/logo.png with your actual logo path in /public/images/ */}
          <div className={styles.logoWrapper}>
            <img
              src="/YoChat-Logo.png"
              alt="WaveChat Logo"
              className={styles.logoImage}
              onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
            />
            {/* SVG fallback shown if logo.png not found */}
            <div className={styles.logoFallback} style={{ display: 'none' }}>
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <path d="M8 30 Q12 20 16 28 Q20 36 24 18 Q28 0 32 20 Q36 38 40 22"
                      stroke="white" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
                <circle cx="40" cy="22" r="3" fill="white"/>
              </svg>
            </div>
          </div>

          <h1 className={styles.brandName}>WaveChat</h1>

          <div className={styles.heroText}>
            <h2>Connect on a<br/>new wavelength</h2>
            <p>Real-time messaging, stories, calls, and more — secure and private.</p>
          </div>

          <div className={styles.featureList}>
            {[
              { icon: Shield,        text: 'End-to-end encrypted' },
              { icon: Zap,           text: 'Real-time messaging' },
              { icon: MessageCircle, text: 'Stories & media sharing' },
              { icon: Lock,          text: 'Private & secure' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className={styles.featureItem}>
                <Icon size={16} />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL — auth form ── */}
      <div className={styles.right}>
        <div className={styles.card}>

          {/* ────────── STEP: phone ────────── */}
          {step === 'phone' && (
            <>
              <div className={styles.cardHeader}>
                <div className={styles.cardIcon}><Phone size={22} /></div>
                <h2>Sign in to WaveChat</h2>
                <p>Enter your phone number to receive a verification code</p>
              </div>

              <div className={styles.form}>
                {/* Phone input */}
                <div className={styles.phoneRow}>
                  <button
                    type="button"
                    className={styles.countryBtn}
                    onClick={() => setShowCountryPicker(v => !v)}
                  >
                    <span>{selectedCountry.flag}</span>
                    <span className={styles.countryCodeText}>{countryCode}</span>
                    <ChevronDown size={13} />
                  </button>

                  <input
                    type="tel"
                    placeholder="Phone number"
                    value={phone}
                    onChange={e => setPhone(e.target.value.replace(/[^\d\s\-()]/g, ''))}
                    onKeyDown={e => e.key === 'Enter' && handleSendOTP()}
                    className={styles.phoneInput}
                    autoFocus
                    autoComplete="tel"
                  />
                </div>

                {/* Country picker dropdown */}
                {showCountryPicker && (
                  <div className={styles.countryDropdown}>
                    <input
                      className={styles.countrySearch}
                      placeholder="Search country or code..."
                      value={countrySearch}
                      onChange={e => setCountrySearch(e.target.value)}
                      autoFocus
                    />
                    <div className={styles.countryList}>
                      {filteredCountries.map((c, i) => (
                        <button
                          key={i}
                          type="button"
                          className={`${styles.countryOption} ${c.code === countryCode ? styles.countrySelected : ''}`}
                          onClick={() => {
                            setCountryCode(c.code);
                            setShowCountryPicker(false);
                            setCountrySearch('');
                          }}
                        >
                          <span>{c.flag}</span>
                          <span className={styles.countryName}>{c.name}</span>
                          <span className={styles.countryCode}>{c.code}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  className={styles.primaryBtn}
                  onClick={handleSendOTP}
                  disabled={loading || !phone.replace(/\D/g, '')}
                >
                  {loading
                    ? <span className={styles.spinner} />
                    : <><span>Send Code</span><ArrowRight size={17} /></>
                  }
                </button>

                {/* Divider */}
                <div className={styles.divider}>
                  <span>or</span>
                </div>

                {/* Google Sign-In */}
                <GoogleSignInButton onSuccess={handleGoogleSuccess} disabled={loading} />
              </div>
            </>
          )}

          {/* ────────── STEP: otp ────────── */}
          {step === 'otp' && (
            <>
              <div className={styles.cardHeader}>
                <div className={styles.cardIcon}><Shield size={22} /></div>
                <h2>Enter the code</h2>
                <p>
                  We sent a 6-digit code to<br />
                  <strong>{countryCode} {phone}</strong>
                </p>
                {devMode && (
                  <div className={styles.devHint}>
                    ⚠️ Twilio not configured — check your <strong>server console</strong> for the OTP
                  </div>
                )}
              </div>

              <div className={styles.form}>
                <div className={styles.otpGrid} onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      id={`otp-${i}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleOtpChange(i, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(i, e)}
                      className={`${styles.otpBox} ${digit ? styles.otpFilled : ''}`}
                      autoFocus={i === 0}
                      autoComplete="one-time-code"
                      disabled={loading}
                    />
                  ))}
                </div>

                {loading && (
                  <div className={styles.verifyingRow}>
                    <span className={styles.spinner} />
                    <span>Verifying...</span>
                  </div>
                )}

                <div className={styles.otpActions}>
                  <button
                    type="button"
                    className={styles.linkBtn}
                    onClick={() => { setStep('phone'); setOtp(['','','','','','']); }}
                    disabled={loading}
                  >
                    ← Change number
                  </button>
                  <button
                    type="button"
                    className={styles.linkBtn}
                    onClick={() => { setOtp(['','','','','','']); handleSendOTP(); }}
                    disabled={loading}
                  >
                    <RefreshCw size={13} /> Resend
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ────────── STEP: profile ────────── */}
          {step === 'profile' && (
            <>
              <div className={styles.cardHeader}>
                <div className={styles.cardIcon} style={{ fontSize: '1.4rem' }}>👋</div>
                <h2>Set up your profile</h2>
                <p>What should we call you?</p>
              </div>

              <div className={styles.form}>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Display name</label>
                  <input
                    type="text"
                    placeholder="Your name"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleCompleteProfile()}
                    className={styles.textInput}
                    autoFocus
                    maxLength={50}
                  />
                </div>

                <button
                  type="button"
                  className={styles.primaryBtn}
                  onClick={handleCompleteProfile}
                  disabled={loading || !displayName.trim()}
                >
                  {loading
                    ? <span className={styles.spinner} />
                    : <><span>Start WaveChat</span><ArrowRight size={17} /></>
                  }
                </button>
              </div>
            </>
          )}

        </div>

        <p className={styles.terms}>
          By continuing you agree to our <a href="#">Terms</a> &amp; <a href="#">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}
