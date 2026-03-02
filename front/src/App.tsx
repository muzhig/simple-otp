import './App.css';
import {Button, Grid, Link, Stack, TextField, Typography} from "@mui/material";
import {useState} from "react";
import jwt_decode from "jwt-decode";
import GitHubIcon from '@mui/icons-material/GitHub';
import ArticleIcon from '@mui/icons-material/Article';

function App() {
  const [verifiedSub, setVerifiedSub] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [isOtpCodeSent, setIsOtpCodeSent] = useState(false);
  const [pinCode, setPinCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);  // TODO: show loading circle, disable buttons

  const validateEmail = (emailOrPhone: string): string | undefined => {
    const emailCandidate = emailOrPhone.replace(" ", "").toLowerCase()
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailCandidate)) {
      return emailCandidate
    }
  }

  const validatePhone = (emailOrPhone: string): string | undefined => {
    const phoneCandidate = emailOrPhone.replace(/[^0-9+]/g, "")
    if (/^\+?[0-9]{10,12}$/.test(phoneCandidate)) {
      return phoneCandidate
    }
  }
  const sendOtpCode = async (emailOrPhone: string) => {
    const email = validateEmail(emailOrPhone)
    const phone = validatePhone(emailOrPhone)
    const query = email ? `email=${email}` : `phone=${phone}`
    const resp = await fetch(`https://api.potapov.dev/otp/otp-verification/start?${query}`, {
      method: "POST",
      mode: "cors",
    })
    if (!resp.ok) {
      // TODO: display error
      console.log("error", resp)
      return
    }
    setIsOtpCodeSent(true)
  }

  const completeAuth = async (emailOrPhone: string, pinCode: string) => {
    const email = validateEmail(emailOrPhone)
    const phone = validatePhone(emailOrPhone)
    const query = email ? `email=${email}&pin=${pinCode}` : `phone=${phone}&pin=${pinCode}`
    const resp = await fetch(`https://api.potapov.dev/otp/otp-verification/complete?${query}`, {
      method: "POST",
      mode: "cors",
    })
    if (!resp.ok) {
      // TODO: display error
      console.log("error", resp, await resp.json())
      return
    }
    const json = await resp.json()
    const token = json.token
    const decoded = jwt_decode(token) as { sub: string }

    setVerifiedSub(decoded.sub)
    setToken(token)
    setIsOtpCodeSent(false)
    setPinCode("")

  }
  return (
    <div className="App">
      <Grid container justifyContent={"center"} spacing={2} sx={{mt: 4, mb: 4}}>
        <Grid item xs={11} sm={8} md={6}>
          <Typography variant="h4" component="h1" gutterBottom sx={{fontWeight: 600}}>
            Simple OTP Demo
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{mb: 3}}>
            Passwordless authentication with HOTP and JWT.
            Enter your email or phone number, receive a one-time code, and get a signed JWT token back.
          </Typography>
        </Grid>

        <Grid item xs={11} sm={8} md={6}>
          <Stack spacing={2} direction={"column"}>
            {
              verifiedSub ? (
                <>
                  <TextField
                    label={`JWT Token (✅ ${verifiedSub})`}
                    value={token}
                    autoFocus={true}
                    sx={{width: "100%"}}
                    onFocus={event => {
                      event.target.select();
                    }}
                  />
                  <Link href={`https://jwt.io/#debugger-io?token=${token}`} target="_blank" rel="noreferrer">
                    Check on jwt.io
                  </Link>
                </>
              ) : (
                <>
                  <TextField
                    label="Email or Phone"
                    value={emailOrPhone}
                    onChange={(e) => setEmailOrPhone(e.target.value)}
                    sx={{width: "100%"}}
                  />
                  {isOtpCodeSent ? (
                    <>
                      <TextField
                        label="PIN code"
                        value={pinCode}
                        onChange={(e) => setPinCode(e.target.value)}
                        sx={{width: "100%"}}
                      />
                      <Button
                        variant="contained"
                        disabled={!pinCode}
                        onClick={() => completeAuth(emailOrPhone, pinCode)}
                      >Complete Auth</Button>
                    </>
                  ) : (
                    <Button
                      variant="contained"
                      disabled={!validateEmail(emailOrPhone) && !validatePhone(emailOrPhone)}
                      onClick={() => sendOtpCode(emailOrPhone)}
                    >Send Code</Button>
                  )}
                </>
              )
            }
          </Stack>
        </Grid>

        <Grid item xs={11} sm={8} md={6} sx={{mt: 4}}>
          <Typography variant="h6" component="h2" gutterBottom sx={{fontWeight: 500}}>
            How It Works
          </Typography>
          <Typography variant="body2" color="text.secondary" component="div" sx={{textAlign: "left", mb: 2}}>
            <ol style={{paddingLeft: "1.2em", margin: 0}}>
              <li>Enter your email address or phone number</li>
              <li>Receive a 6-digit HOTP code (RFC 4226) via email (Mailgun) or SMS (Twilio)</li>
              <li>Enter the code to verify ownership</li>
              <li>Get a signed JWT token with your verified identity</li>
            </ol>
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{mb: 3}}>
            The entire backend is two AWS Lambda functions, a DynamoDB table, and 180 lines of Python.
            Running in production since 2023 for under $1/month.
          </Typography>

          <Stack direction="row" spacing={3} justifyContent="center">
            <Link
              href="https://potapov.dev/blog/building-simple-otp/"
              target="_blank"
              rel="noopener"
              underline="hover"
              sx={{display: "flex", alignItems: "center", gap: 0.5}}
            >
              <ArticleIcon fontSize="small" />
              Read the article
            </Link>
            <Link
              href="https://github.com/muzhig/simple-otp"
              target="_blank"
              rel="noopener"
              underline="hover"
              sx={{display: "flex", alignItems: "center", gap: 0.5}}
            >
              <GitHubIcon fontSize="small" />
              Source code
            </Link>
          </Stack>
        </Grid>
      </Grid>
    </div>
  );
}

export default App;
