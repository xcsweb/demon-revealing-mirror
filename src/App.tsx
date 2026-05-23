import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { StartPage } from "@/pages/StartPage";
import { MirrorPage } from "@/pages/MirrorPage";
import { ResultPage } from "@/pages/ResultPage";

export default function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/" element={<StartPage />} />
          <Route path="/mirror" element={<MirrorPage />} />
          <Route path="/result" element={<ResultPage />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}