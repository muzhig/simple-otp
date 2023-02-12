import './App.css';
import {Button, Grid, Stack, TextField} from "@mui/material";
import {useState} from "react";
import jwt_decode from "jwt-decode";

function App() {
  const [verifiedSub, setVerifiedSub] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [isOtpCodeSent, setIsOtpCodeSent] = useState(false);
  const [pinCode, setPinCode] = useState("");

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
      <h1>OTP Verification</h1>
      <Grid container justifyContent={"center"} spacing={2} sx={{mt:2}}>
        <Grid item xs={11} sm={6} md={4}>
          <Stack spacing={2} direction={"column"}>
            {
              verifiedSub ? (
                <>
                  <TextField
                    label={`JWT Token (✅ ️${verifiedSub})`}
                    value={token}
                    autoFocus={true}
                    sx={{width: "100%"}}
                    onFocus={event => {
                      event.target.select();
                    }}
                  />
                  <a href={`https://jwt.io/#debugger-io?token=${token}`} target="_blank" rel="noreferrer">Check on jwt.io</a>
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
      </Grid>


    </div>
  );
}

export default App;
