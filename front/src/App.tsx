import './App.css';
import {Button, Grid, Stack, TextField} from "@mui/material";
import {useState} from "react";
import jwt_decode from "jwt-decode";
import CheckIcon from '@mui/icons-material/Check';

function App() {
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [isOtpCodeSent, setIsOtpCodeSent] = useState(false);
  const [pinCode, setPinCode] = useState("");

  const sendOtpCode = async (email: string) => {
    // fetch POST api.potapov.dev/otp/otp-verification/start?email=${email}
    const resp = await fetch(`https://api.potapov.dev/otp/otp-verification/start?email=${email}`, {
      method: "POST",
      mode: "cors",
    })
    if (!resp.ok) {
      console.log("error", resp)
      return
    }
    setIsOtpCodeSent(true)
  }

  const completeAuth = async (email: string, pinCode: string) => {
    // POST api.potapov.dev/otp/otp-verification/complete?email=${email}&pin=${pinCode}
    const resp = await fetch(`https://api.potapov.dev/otp/otp-verification/complete?email=${email}&pin=${pinCode}`, {
      method: "POST",
      mode: "cors",
    })
    if (!resp.ok) {
      console.log("error", resp, await resp.json())
      return
    }
    const json = await resp.json()
    const token = json.token
    const decoded = jwt_decode(token) as { sub: string }

    const tokenEmail = decoded.sub.split(":")[1]
    console.log("decoded", decoded, decoded.sub, tokenEmail)
    setVerifiedEmail(tokenEmail)

    setIsOtpCodeSent(false)
    setPinCode("")

  }
  return (
    <div className="App">
      <h1>OTP Verification</h1>
      <Grid container justifyContent={"center"} spacing={2} sx={{mt:2}}>
        <Grid item xs={4}>
          <Stack spacing={2} direction={"column"}>
            {
              verifiedEmail && (
                <div>
                  <CheckIcon sx={{color: "green"}}/>
                  <span>Verified email: {verifiedEmail}</span>
                </div>
              )
            }
            <TextField
              label="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{width: "100%"}}
            />
            {!isOtpCodeSent && (
              <Button
                variant="contained"
                disabled={!email}
                onClick={() => sendOtpCode(email)}
              >Verify Email</Button>
            )}

            {isOtpCodeSent && (<>
                <TextField
                  label="PIN code"
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value)}
                  sx={{width: "100%"}}
                />
                <Button
                  variant="contained"
                  disabled={!pinCode}
                  onClick={() => completeAuth(email, pinCode)}
                >Complete Auth</Button>
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
