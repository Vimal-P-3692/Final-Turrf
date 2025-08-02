import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase/config";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import Logo from "../assets/logo.png";
import "./Login.css";

// Extend Window interface to include recaptchaVerifier
declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier;
  }
}

function Login() {
  const [formData, setFormData] = useState({
    username: "",
    otp: Array(6).fill("").join(""),
    password: "",
    phoneNumber: "",
  });

  const [currentStep, setCurrentStep] = useState<"initial" | "phone-verify">(
    "initial"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [recaptchaVerified, setRecaptchaVerified] = useState(false);
  const [otpTimer, setOtpTimer] = useState(300);
  const [timerActive, setTimerActive] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const navigate = useNavigate();

  const sendSMS = async () => {
    try {
      console.log("Sending SMS to:", phoneNumber);
      const response = await fetch("http://localhost:5126/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // 'Authorization': 'Bearer YOUR_API_KEY', // add if needed
        },
        body: JSON.stringify({
          phone: "8778879866",
        }),
      });

      if (!response.ok) {
        console.log(
          `Failed to send SMS: ${response.status} ${response.statusText}`
        );
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log("API response:", data);
      return data;
    } catch (error) {
      console.error("Failed to send SMS:", error);
    }
  };

  const verifyOtp = async () => {
    try {
      const phonenumber = phoneNumber; // make sure formData.phone is defined
      const otp = formData.otp; // make sure formData.otp is defined

      console.log("Sending verify request:", { phonenumber, otp });

      const response = await fetch("http://localhost:5126/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: phonenumber, // ✅ make sure your backend expects `phone` (not `phoneNumber`)
          otp: otp,
        }),
      });

      if (!response.ok) {
        const text = await response.text(); // helpful for debugging bad responses
        console.error(`Backend says:`, text);
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log("OTP verification response:", data);
      console.log();

      // ✅ adjust this check to match your backend’s real response
      if (response.ok) {
      } else {
        console.error("OTP verification failed:", data.message);
      }
      return true;
    } catch (error) {
      console.error("Failed to verify OTP:", error);
      return false;
    }
  };

  useEffect(() => {
    const initializeRecaptcha = () => {
      try {
        if (
          !window.recaptchaVerifier &&
          document.getElementById("recaptcha-container")
        ) {
          window.recaptchaVerifier = new RecaptchaVerifier(
            auth,
            "recaptcha-container",
            {
              size: "normal",
              callback: () => {
                setRecaptchaVerified(true);
                setError("");
              },
              "expired-callback": () => {
                setRecaptchaVerified(false);
                setError("reCAPTCHA expired. Please verify again.");
              },
            }
          );

          window.recaptchaVerifier.render().catch(() => {
            setError("Failed to load reCAPTCHA. Please refresh the page.");
          });
        }
      } catch (error) {
        setError("Failed to initialize reCAPTCHA. Please refresh the page.");
      }
    };

    const timeout = setTimeout(initializeRecaptcha, 1000);

    return () => {
      clearTimeout(timeout);
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
          // delete window.recaptchaVerifier?;
        } catch {}
      }
    };
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (timerActive && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prevTimer) => {
          if (prevTimer <= 1) {
            setTimerActive(false);
            setError("OTP has expired. Please request a new one.");
            return 0;
          }
          return prevTimer - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [timerActive, otpTimer]);

  const formatTimer = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!recaptchaVerified) {
      setError("Please complete the reCAPTCHA verification.");
      setLoading(false);
      return;
    }

    // const fullPhone = `+91${phoneNumber}`;

    // try {
    //   await signInWithPhoneNumber(auth, fullPhone, window.recaptchaVerifier);
    // } catch {}

    setCurrentStep("phone-verify");
    setOtpTimer(300);
    setTimerActive(true);
    setLoading(false);
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { otp } = formData;

    if (!otp || otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP.");
      setLoading(false);
      return;
    }

    if (otpTimer === 0) {
      setError("OTP has expired. Please request a new one.");
      setLoading(false);
      return;
    }
    const result = await verifyOtp();
    console.log("OTP verification result:", result);

    setTimerActive(false);
    localStorage.setItem(
      "user",
      JSON.stringify({
        phone: formData.phoneNumber,
        isAuthenticated: true,
      })
    );
    window.dispatchEvent(new CustomEvent("userLogin"));
    navigate("/");
    setLoading(false);
  };

  const handleResendOTP = async () => {
    setLoading(true);
    setError("");

    try {
      const fullPhone = `+91${formData.phoneNumber}`;
      await signInWithPhoneNumber(auth, fullPhone, window.recaptchaVerifier);
      setOtpTimer(300);
      setTimerActive(true);
      setError("");
      setFormData((prev) => ({ ...prev, otp: "" }));
    } catch (err: any) {
      setError(err.message || "Failed to resend OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleValidatePassword = async () => {
    if (!formData.username || !formData.password) {
      setError("Enter both username and password");
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:5127/api/AdminLogin/validate",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: formData.username,
            password: formData.password,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        // setPhoneNumber(data.phoneNumber); // ✅ store the phone number
        console.log("Phone number retrieved:", data.phoneNumber);
        await setPhoneNumber(data.phoneNumber);
        sendSMS(); // Call sendSMS to send OTP
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Invalid credentials");
      }
    } catch (err) {
      setError("Failed to validate. Try again.");
    }
  };

  return (
    <div className="overall">
      <div className="left-log">
        <img src={Logo} alt="Logo" className="logo-image" />
      </div>
      <div className="right-log">
        <div className="form">
          {currentStep === "initial" && (
            <form className="login-form" onSubmit={handleVerificationSubmit}>
              <h2>Login</h2>
              <div className="lables">
                <label htmlFor="username">Username :</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Enter your username"
                  required
                />
              </div>
              <div className="lables">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  required
                />
              </div>
              <div className="recaptcha-wrapper">
                <div id="recaptcha-container"></div>
              </div>
              {error && <p className="error-message">{error}</p>}
              <button
                type="submit"
                disabled={loading || !recaptchaVerified}
                className="submit-btn"
                onClick={handleValidatePassword}
                style={{ opacity: recaptchaVerified ? 1 : 0.6 }}
              >
                {loading ? "Sending OTP..." : "Send OTP"}
              </button>
            </form>
          )}

          {currentStep === "phone-verify" && (
            <form className="login-form" onSubmit={handleVerifyOTP}>
              <h2>Verify Phone Number</h2>
              <div className="message-container">
                <p className="success-message">
                  A verification code has been sent to{" "}
                  <strong>+91{phoneNumber}</strong>.
                </p>

                <div className="otp-timer-container">
                  {timerActive ? (
                    <p className="timer-message">
                      OTP expires in:
                      <span className="timer-display">
                        {formatTimer(otpTimer)}
                      </span>
                    </p>
                  ) : otpTimer === 0 ? (
                    <p className="timer-expired">
                      OTP has expired. Please go back and request a new one.
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="lables">
                <p>Please enter the 6-digit code below.</p>

                <div className="otp-input-container">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <input
                      key={i}
                      id={`otp-${i}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      className="otp-box"
                      disabled={otpTimer === 0}
                      value={formData.otp[i] || ""}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/, ""); // Digits only
                        const otpArray = formData.otp.split("");

                        otpArray[i] = val || ""; // If empty or cleared
                        setFormData((prev) => ({
                          ...prev,
                          otp: otpArray.join(""),
                        }));

                        if (val && i < 5) {
                          const next = document.getElementById(`otp-${i + 1}`);
                          if (next) (next as HTMLInputElement).focus();
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Backspace") {
                          const otpArray = formData.otp.split("");

                          // Clear current box
                          otpArray[i] = "";
                          setFormData((prev) => ({
                            ...prev,
                            otp: otpArray.join(""),
                          }));

                          // Move back
                          if (i > 0) {
                            const prevInput = document.getElementById(
                              `otp-${i - 1}`
                            );
                            if (prevInput)
                              (prevInput as HTMLInputElement).focus();
                          }
                        }
                      }}
                    />
                  ))}
                </div>
              </div>
              {error && <p className="error-message">{error}</p>}
              <button type="submit" disabled={loading || otpTimer === 0}>
                {loading ? "Verifying..." : "Verify Code"}
              </button>
              {otpTimer === 0 && (
                <button
                  type="button"
                  className="resend-button"
                  onClick={handleResendOTP}
                  disabled={loading}
                >
                  {loading ? "Resending..." : "Resend OTP"}
                </button>
              )}
              <button
                type="button"
                className="L-back-button"
                onClick={() => {
                  setCurrentStep("initial");
                  setError("");
                  setTimerActive(false);
                  setOtpTimer(300);
                }}
                disabled={loading}
              >
                Back
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default Login;
