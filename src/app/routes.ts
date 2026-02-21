import { createBrowserRouter } from "react-router";
import { Root } from "./pages/Root";
import { Login } from "./pages/Login";
import { Signup } from "./pages/Signup";
import { ForgotPassword } from "./pages/ForgotPassword";
import { Dashboard } from "./pages/Dashboard";
import { Gait } from "./pages/Gait";
import { VoiceAnalysis } from "./pages/VoiceAnalysis";
import { Smartwatch } from "./pages/Smartwatch";
import { Lifestyle } from "./pages/Lifestyle";
import { History } from "./pages/History";
import { Appointments } from "./pages/Appointments";
import { Support } from "./pages/Support";
import { Profile } from "./pages/Profile";
import { Suggestions } from "./pages/Suggestions";
import { WalkHistory } from "./pages/WalkHistory";
import { ParkinsonsGuide } from "./pages/ParkinsonsGuide";
import { ExerciseVideos } from "./pages/ExerciseVideos";
import { Medications } from "./pages/Medications";

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Root,
    children: [
      { index: true, Component: Login },
      { path: 'signup', Component: Signup },
      { path: 'forgot-password', Component: ForgotPassword },
      { path: 'dashboard', Component: Dashboard },
      { path: 'gait', Component: Gait },
      { path: 'voice', Component: VoiceAnalysis },
      { path: 'smartwatch', Component: Smartwatch },
      { path: 'lifestyle', Component: Lifestyle },
      { path: 'history', Component: History },
      { path: 'appointments', Component: Appointments },
      { path: 'support', Component: Support },
      { path: 'profile', Component: Profile },
      { path: 'suggestions', Component: Suggestions },
      { path: 'walk-history', Component: WalkHistory },
      { path: 'parkinsons-guide', Component: ParkinsonsGuide },
      { path: 'exercises', Component: ExerciseVideos },
      { path: 'medications', Component: Medications },
      { path: '*', Component: Login },
    ],
  },
]);
