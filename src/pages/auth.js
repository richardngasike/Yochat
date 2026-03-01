import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Phone, ArrowRight, ChevronDown, Shield, MessageCircle, Zap, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import styles from './auth.module.css';

const COUNTRY_CODES = [
  { code: '+1', name: 'United States', flag: '🇺🇸' },
  { code: '+1', name: 'Canada', flag: '🇨🇦' },
  { code: '+44', name: 'United Kingdom', flag: '🇬🇧' },
  { code: '+254', name: 'Kenya', flag: '🇰🇪' },
  { code: '+234', name: 'Nigeria', flag: '🇳🇬' },
  { code: '+27', name: 'South Africa', flag: '🇿🇦' },
  { code: '+91', name: 'India', flag: '🇮🇳' },
  { code: '+86', name: 'China', flag: '🇨🇳' },
  { code: '+49', name: 'Germany', flag: '🇩🇪' },
  { code: '+33', name: 'France', flag: '🇫🇷' },
  { code: '+39', name: 'Italy', flag: '🇮🇹' },
  { code: '+34', name: 'Spain', flag: '🇪🇸' },
  { code: '+55', name: 'Brazil', flag: '🇧🇷' },
  { code: '+52', name: 'Mexico', flag: '🇲🇽' },
  { code: '+61', name: 'Australia', flag: '🇦🇺' },
  { code: '+81', name: 'Japan', flag: '🇯🇵' },
  { code: '+82', name: 'South Korea', flag: '🇰🇷' },
  { code: '+7', name: 'Russia', flag: '🇷🇺' },
  { code: '+20', name: 'Egypt', flag: '🇪🇬' },
  { code: '+971', name: 'UAE', flag: '🇦🇪' },
  { code: '+966', name: 'Saudi Arabia', flag: '🇸🇦' },
  { code: '+62', name: 'Indonesia', flag: '🇮🇩' },
  { code: '+60', name: 'Malaysia', flag: '🇲🇾' },
  { code: '+63', name: 'Philippines', flag: '🇵🇭' },
  { code: '+92', name: 'Pakistan', flag: '🇵🇰' },
  { code: '+880', name: 'Bangladesh', flag: '🇧🇩' },
  { code: '+256', name: 'Uganda', flag: '🇺🇬' },
  { code: '+255', name: 'Tanzania', flag: '🇹🇿' },
  { code: '+233', name: 'Ghana', flag: '🇬🇭' },
  { code: '+212', name: 'Morocco', flag: '🇲🇦' },
];

export default function AuthPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [step, setStep] = useState('phone'); // phone | otp | profile
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+254');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');

  // Use a ref to track loading so the OTP auto-submit doesn't fire twice
  const loadingRef = useRef(false);

  const selectedCountry = COUNTRY_CODES.find(c => c.code === countryCode) || COUNTRY_CODES[0];
  const filteredCountries = COUNTRY_CODES.filter(c =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
    c.code.includes(countrySearch)
  );

  const handleSendOTP = async () => {
    if (!phone || phone.replace(/\D/g, '').length < 6) {
      toast.error('Please enter a valid phone number');
      return;
    }
    setLoading(true);
    loadingRef.current = true;
    try {
      const res = await api.post('/auth/send-otp', {
        phone: phone.replace(/\D/g, ''),
        country_code: countryCode,
      });
      setIsNewUser(res.data.is_new_user);
      setOtp(['', '', '', '', '', '']);
      setStep('otp');
      toast.success('Verification code sent!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send OTP');
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  // ── OTP auto-submit: use a dedicated function that takes the code explicitly
  // so it never relies on stale React state.
  const submitOTP = async (codeString) => {
    // Guard: don't double-fire
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);

    try {
      const res = await api.post('/auth/verify-otp', {
        phone: phone.replace(/\D/g, ''),
        country_code: countryCode,
        code: codeString,
      });

      if (
        res.data.is_new_user ||
        !res.data.user.display_name ||
        res.data.user.display_name === 'WaveChat User'
      ) {
        login(res.data.token, res.data.user);
        setIsNewUser(true);
        setStep('profile');
      } else {
        login(res.data.token, res.data.user);
        router.push('/');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid code. Please try again.');
      // Clear inputs and re-focus first box
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => document.getElementById('otp-0')?.focus(), 50);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  const handleOtpChange = (idx, val) => {
    // Only allow single digit
    if (!/^\d*$/.test(val)) return;
    const digit = val.slice(-1); // take last char in case browser pastes multiple
    const newOtp = [...otp];
    newOtp[idx] = digit;
    setOtp(newOtp);

    // Advance focus
    if (digit && idx < 5) {
      document.getElementById(`otp-${idx + 1}`)?.focus();
    }

    // Auto-submit only when all 6 boxes are filled
    const complete = newOtp.every(d => d !== '');
    if (complete) {
      // Use the local newOtp array — never stale state
      submitOTP(newOtp.join(''));
    }
  };

  const handleOtpKeyDown = (idx, e) => {
    if (e.key === 'Backspace') {
      if (otp[idx]) {
        // Clear current box
        const newOtp = [...otp];
        newOtp[idx] = '';
        setOtp(newOtp);
      } else if (idx > 0) {
        // Move to previous box and clear it
        const newOtp = [...otp];
        newOtp[idx - 1] = '';
        setOtp(newOtp);
        document.getElementById(`otp-${idx - 1}`)?.focus();
      }
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (paste.length === 6) {
      const digits = paste.split('');
      setOtp(digits);
      // Focus last box
      document.getElementById('otp-5')?.focus();
      // Submit with the pasted value directly — no state dependency
      submitOTP(paste);
    } else if (paste.length > 0) {
      // Partial paste — fill what we have
      const newOtp = ['', '', '', '', '', ''];
      paste.split('').forEach((d, i) => { newOtp[i] = d; });
      setOtp(newOtp);
      document.getElementById(`otp-${paste.length - 1}`)?.focus();
    }
  };

  const handleCompleteProfile = async () => {
    if (!displayName.trim()) {
      toast.error('Please enter your name');
      return;
    }
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

  return (
    <div className={styles.page}>
      <div className={styles.left}>
        <div className={styles.brand}>
          <div className={styles.brandIcon}>
            <svg width="40" height="40" viewBox="0 0 48 48" fill="none">
              <path d="M8 30 Q12 20 16 28 Q20 36 24 18 Q28 0 32 20 Q36 38 40 22"
                    stroke="white" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
              <circle cx="40" cy="22" r="3" fill="white"/>
            </svg>
          </div>
          <h1 className={styles.brandName}>WaveChat</h1>
        </div>

        <div className={styles.heroText}>
          <h2>Connect on a<br/>new wavelength</h2>
          <p>Real-time messaging, stories, calls, and more — all in one secure platform built for 2026.</p>
        </div>

        <div className={styles.features}>
          {[
            { icon: Shield, text: 'End-to-end encrypted' },
            { icon: Zap, text: 'Real-time messaging' },
            { icon: MessageCircle, text: 'Stories & media sharing' },
            { icon: Lock, text: 'Private & secure' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className={styles.feature}>
              <Icon size={18} />
              <span>{text}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.right}>
        <div className={styles.card}>

          {/* ── STEP 1: Phone number ── */}
          {step === 'phone' && (
            <>
              <div className={styles.cardHeader}>
                <div className={styles.cardIcon}><Phone size={24} /></div>
                <h2>Enter your phone</h2>
                <p>We'll send a verification code to this number</p>
              </div>

              <div className={styles.form}>
                <div className={styles.phoneInput}>
                  <button
                    className={styles.countryBtn}
                    onClick={() => setShowCountryPicker(!showCountryPicker)}
                    type="button"
                  >
                    <span>{selectedCountry.flag}</span>
                    <span>{countryCode}</span>
                    <ChevronDown size={14} />
                  </button>
                  <input
                    type="tel"
                    placeholder="Phone number"
                    value={phone}
                    onChange={e => setPhone(e.target.value.replace(/[^\d\s\-()]/g, ''))}
                    onKeyDown={e => e.key === 'Enter' && handleSendOTP()}
                    className={styles.phoneField}
                    autoFocus
                  />
                </div>

                {showCountryPicker && (
                  <div className={styles.countryPicker}>
                    <input
                      placeholder="Search country..."
                      value={countrySearch}
                      onChange={e => setCountrySearch(e.target.value)}
                      className={styles.countrySearch}
                      autoFocus
                    />
                    <div className={styles.countryList}>
                      {filteredCountries.map((c, i) => (
                        <button
                          key={i}
                          type="button"
                          className={`${styles.countryItem} ${c.code === countryCode ? styles.selected : ''}`}
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
                  className={styles.primaryBtn}
                  onClick={handleSendOTP}
                  disabled={loading || !phone.replace(/\D/g, '')}
                  type="button"
                >
                  {loading ? <div className={styles.spinner} /> : (
                    <>Continue <ArrowRight size={18} /></>
                  )}
                </button>
              </div>
            </>
          )}

          {/* ── STEP 2: OTP ── */}
          {step === 'otp' && (
            <>
              <div className={styles.cardHeader}>
                <div className={styles.cardIcon}><Shield size={24} /></div>
                <h2>Verify your number</h2>
                <p>
                  Enter the 6-digit code sent to<br />
                  <strong>{countryCode} {phone}</strong>
                </p>
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
                      className={`${styles.otpInput} ${digit ? styles.filled : ''}`}
                      autoFocus={i === 0}
                      autoComplete="one-time-code"
                      disabled={loading}
                    />
                  ))}
                </div>

                {loading && (
                  <div className={styles.verifying}>
                    <div className={styles.spinner} />
                    <span>Verifying...</span>
                  </div>
                )}

                <div className={styles.otpLinks}>
                  <button
                    type="button"
                    className={styles.textBtn}
                    onClick={() => {
                      setStep('phone');
                      setOtp(['', '', '', '', '', '']);
                    }}
                    disabled={loading}
                  >
                    ← Change number
                  </button>

                  <button
                    type="button"
                    className={styles.textBtn}
                    onClick={() => {
                      setOtp(['', '', '', '', '', '']);
                      handleSendOTP();
                    }}
                    disabled={loading}
                  >
                    Resend code
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ── STEP 3: Profile setup ── */}
          {step === 'profile' && (
            <>
              <div className={styles.cardHeader}>
                <div className={styles.cardIcon} style={{ fontSize: '1.5rem' }}>👋</div>
                <h2>Set up your profile</h2>
                <p>Tell us what to call you</p>
              </div>

              <div className={styles.form}>
                <div className={styles.inputGroup}>
                  <label>Your name</label>
                  <input
                    type="text"
                    placeholder="Enter your display name"
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
                  {loading ? <div className={styles.spinner} /> : (
                    <>Start WaveChat <ArrowRight size={18} /></>
                  )}
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
