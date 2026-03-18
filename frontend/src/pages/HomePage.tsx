/**
 * HomePage - Entry point with player name input and start button
 * Restyled with Tailwind CSS and shadcn/ui
 */
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface HomePageProps {
  onStartGame?: (playerName: string) => void;
}

export default function HomePage(_props: HomePageProps) {
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate name
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    if (playerName.trim().length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }

    if (playerName.trim().length > 20) {
      setError('Name must be 20 characters or less');
      return;
    }

    // Store player name for GamePage to use
    sessionStorage.setItem('playerName', playerName.trim());

    // Navigate to game (GamePage will start the round)
    navigate('/game');
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="w-full max-w-md border-border bg-card">
          <CardHeader className="text-center">
            <div className="mb-2 text-6xl">🌍</div>
            <CardTitle className="text-3xl font-bold">Geography Quiz</CardTitle>
            <CardDescription>Test your knowledge of world locations</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <Input
                  type="text"
                  placeholder="Enter your name"
                  value={playerName}
                  onChange={(e) => {
                    setPlayerName(e.target.value);
                    setError('');
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit(e)}
                  className="w-full"
                  maxLength={20}
                />
                {error && (
                  <p className="mt-2 text-sm text-destructive">{error}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={!playerName.trim()}
                className="w-full"
              >
                Start Quiz
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link
                to="/leaderboard"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                🏆 View Leaderboard
              </Link>
            </div>

            <div className="mt-6 rounded-lg bg-muted p-4">
              <p className="mb-2 text-sm font-semibold">How to play:</p>
              <ul className="list-inside list-disc text-sm text-muted-foreground">
                <li>You'll get 10 geography questions</li>
                <li>Click on the map where you think the location is</li>
                <li>Points based on accuracy and speed</li>
                <li>Submit your score to the leaderboard!</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
