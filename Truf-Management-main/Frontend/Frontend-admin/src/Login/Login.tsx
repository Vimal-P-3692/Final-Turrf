import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../assets/logo.png";
import "./Login.css";

function Login() {
  const [formData, setFormData] = useState({
    username: "",
    otp: "",
    password: "",
    phoneNumber: "",
  });

  const [currentStep, setCurrentStep] = useState<"initial" | "phone-verify">(
    "initial"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [otpTimer, setOtpTimer] = useState(300);
  const [timerActive, setTimerActive] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const navigate = useNavigate();

  const sendSMS = async () => {
    try {
      console.log("Sending SMS to:", phoneNumber);
      const response = await fetch("http://localhost:5126/admin/otp/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: "8072832018",
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
      const phonenumber = "8072832018"; // make sure formData.phone is defined
      const otp = formData.otp; // make sure formData.otp is defined

      console.log("Sending verify request:", { phonenumber, otp });

      const response = await fetch("http://localhost:5126/admin/otp/verify", {
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

    if (result) {
      setTimerActive(false);
      localStorage.setItem(
        "user",
        JSON.stringify({
          phone: phoneNumber,
          username: formData.username,
          isAuthenticated: true,
        })
      );
      window.dispatchEvent(new CustomEvent("userLogin"));
      navigate("/admin/dashboard");
      setLoading(false);
    } else {
      alert("Invalid otp");
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    setError("");

    try {
      await sendSMS();
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
        "https://admin-api.turrfzone.com/api/AdminLogin/validate",
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
              {error && <p className="error-message">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="submit-btn"
                onClick={handleValidatePassword}
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
                <p>Please enter the 6-digit code below.</p>
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
                <label htmlFor="otp">Verification Code:</label>
                <input
                  type="text"
                  id="otp"
                  name="otp"
                  value={formData.otp}
                  onChange={handleChange}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  required
                  disabled={otpTimer === 0}
                />
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
