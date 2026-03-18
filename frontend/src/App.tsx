import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import HomePage from './pages/HomePage';
import GamePage from './pages/GamePage';
import LeaderboardPage from './pages/LeaderboardPage';
import SuggestPage from './pages/SuggestPage';
import ErrorBoundary from './components/ErrorBoundary';
import { useGame } from './hooks/useGame';

const queryClient = new QueryClient();

// Wrapper component to pass useGame to HomePage
function AppContent() {
  const { startNewRound } = useGame();

  return (
    <Routes>
      <Route path="/" element={<HomePage onStartGame={startNewRound} />} />
      <Route path="/game" element={<GamePage />} />
      <Route path="/leaderboard" element={<LeaderboardPage />} />
      <Route path="/suggest" element={<SuggestPage />} />
    </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
