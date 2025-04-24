import { useState } from "react";
import { auth } from "../firebase";
import { GoogleAuthProvider, signInWithPopup, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { 
  Button, 
  Card, 
  Container, 
  Typography, 
  Box, 
  CardContent, 
  Divider, 
  Paper,
  CardHeader,
  Avatar,
  IconButton
} from '@mui/material';
import { Google, Logout, Security } from '@mui/icons-material';

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const navigate = useNavigate();
  const provider = new GoogleAuthProvider();

  const handleLogin = async () => {
    try {
      setIsLoggingIn(true);
      // Ensure the provider has the correct scope before each sign-in attempt
      provider.addScope("https://www.googleapis.com/auth/calendar.readonly");
      
      const result = await signInWithPopup(auth, provider);
      
      // Get the credential from the authentication result
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const accessToken = credential.accessToken;
      
      localStorage.setItem("accessToken", accessToken);
      
      console.log("Login successful! Access Token:", accessToken);
      navigate("/");
    } catch (error) {
      console.error("Login failed:", error);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const emailSignIn = async () => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const register = async () => {
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const logOut = async () => {
    await signOut(auth);
  };

  return (
    <Container maxWidth="sm" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <Paper 
        elevation={3}
        sx={{
          width: '100%',
          borderRadius: 2,
          overflow: 'hidden',
          bgcolor: 'background.paper'
        }}
      >
        <Box sx={{ 
          p: 2, 
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          py: 4
        }}>
          <Avatar 
            sx={{ 
              bgcolor: 'background.paper', 
              color: 'primary.main',
              width: 56, 
              height: 56,
              mb: 2
            }}
          >
            <Security fontSize="large" />
          </Avatar>
          <Typography variant="h4" component="h1" fontWeight="500" align="center">
            Welcome
          </Typography>
          <Typography variant="subtitle1" align="center" sx={{ mt: 1, opacity: 0.9 }}>
            Sign in to access your calendar
          </Typography>
        </Box>

        <CardContent sx={{ p: 4 }}>
          <Box sx={{ mb: 3 }}>
            <Button
              variant="contained"
              size="large"
              fullWidth
              startIcon={<Google />}
              onClick={handleLogin}
              disabled={isLoggingIn}
              sx={{
                py: 1.5,
                boxShadow: 2,
                textTransform: 'none',
                fontSize: 16,
                fontWeight: 500,
                bgcolor: '#4285F4',
                '&:hover': {
                  bgcolor: '#3367D6'
                }
              }}
            >
              {isLoggingIn ? "Signing in..." : "Sign in with Google"}
            </Button>
          </Box>

          <Divider sx={{ my: 4 }}>
            <Typography variant="body2" color="text.secondary">
              OR
            </Typography>
          </Divider>

          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <Button
              variant="outlined"
              color="error"
              startIcon={<Logout />}
              onClick={logOut}
              sx={{
                textTransform: 'none',
                borderRadius: 1,
                px: 3,
                py: 1,
                fontSize: 15
              }}
            >
              Sign Out
            </Button>
          </Box>

          <Typography variant="caption" color="text.secondary" align="center" sx={{ display: 'block', mt: 4 }}>
            By continuing, you agree to our Terms of Service and Privacy Policy
          </Typography>
        </CardContent>
      </Paper>
    </Container>
  );
};

export default Auth;