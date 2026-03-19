/**
 * HomePage - Entry point with player name input, mode selection, and start button
 */
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { GameMode, GameCategory } from '@/types';

interface HomePageProps {
  onStartGame?: (playerName: string) => void;
}

interface ModeOption {
  id: GameMode;
  icon: string;
  title: string;
  description: string;
  color: string;
}

interface CategoryOption {
  id: GameCategory;
  icon: string;
  title: string;
}

const MODE_OPTIONS: ModeOption[] = [
  {
    id: 'standard',
    icon: '🎯',
    title: 'Classic',
    description: '10 questions, per-question timer',
    color: 'bg-green-500/10 border-green-500 hover:bg-green-500/20',
  },
  {
    id: 'timed_1',
    icon: '⚡',
    title: 'Sprint 1 min',
    description: 'As many as possible in 1 minute',
    color: 'bg-orange-500/10 border-orange-500 hover:bg-orange-500/20',
  },
  {
    id: 'timed_3',
    icon: '🏃',
    title: 'Race 3 min',
    description: 'As many as possible in 3 minutes',
    color: 'bg-blue-500/10 border-blue-500 hover:bg-blue-500/20',
  },
  {
    id: 'timed_5',
    icon: '🏅',
    title: 'Marathon 5 min',
    description: 'As many as possible in 5 minutes',
    color: 'bg-purple-500/10 border-purple-500 hover:bg-purple-500/20',
  },
  {
    id: 'endless',
    icon: '∞',
    title: 'Endless',
    description: 'No time limit, unlimited questions',
    color: 'bg-gray-500/10 border-gray-500 hover:bg-gray-500/20',
  },
];

const CATEGORY_OPTIONS: CategoryOption[] = [
  { id: 'countries', icon: '🌍', title: 'Countries' },
  { id: 'cities', icon: '🏙️', title: 'Cities' },
  { id: 'capitals', icon: '🗽', title: 'Capitals' },
];

// Full color configuration for each mode
const modeConfig: Record<GameMode, { outline: string; border: string; bg: string; text: string; button: string }> = {
  standard: {
    outline: 'outline-green-500',
    border: 'border-green-500',
    bg: 'bg-green-500/10',
    text: 'text-green-400',
    button: 'bg-green-600 hover:bg-green-700',
  },
  timed_1: {
    outline: 'outline-orange-500',
    border: 'border-orange-500',
    bg: 'bg-orange-500/10',
    text: 'text-orange-400',
    button: 'bg-orange-600 hover:bg-orange-700',
  },
  timed_3: {
    outline: 'outline-blue-500',
    border: 'border-blue-500',
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    button: 'bg-blue-600 hover:bg-blue-700',
  },
  timed_5: {
    outline: 'outline-purple-500',
    border: 'border-purple-500',
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    button: 'bg-purple-600 hover:bg-purple-700',
  },
  endless: {
    outline: 'outline-gray-400',
    border: 'border-gray-400',
    bg: 'bg-gray-400/10',
    text: 'text-gray-300',
    button: 'bg-gray-600 hover:bg-gray-700',
  },
};

export default function HomePage(_props: HomePageProps) {
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState('');
  const [selectedMode, setSelectedMode] = useState<GameMode>('standard');
  const [selectedCategory, setSelectedCategory] = useState<GameCategory>(null);
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

    // Clear any previous game state
    sessionStorage.removeItem('gameState');

    // Store player name, mode, and category for GamePage to use
    sessionStorage.setItem('playerName', playerName.trim());
    sessionStorage.setItem('gameMode', selectedMode);
    sessionStorage.setItem('gameCategory', selectedCategory || '');

    // Navigate to game (GamePage will start the round)
    navigate('/game');
  };

  const handleModeSelect = (mode: GameMode) => {
    setSelectedMode(mode);
  };

  const handleCategorySelect = (category: GameCategory) => {
    setSelectedCategory(category);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-4xl"
      >
        <Card className="mb-6 border-border bg-card">
          <CardHeader className="text-center">
            <div className="mb-2 text-6xl">🌍</div>
            <CardTitle className="text-3xl font-bold">Geography Quiz</CardTitle>
            <CardDescription>Test your knowledge of world locations</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
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

              {/* Mode Selection */}
              <div className="mb-6">
                <h3 className="mb-3 text-lg font-semibold">Select Game Mode</h3>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                  {MODE_OPTIONS.map((mode) => {
                    const isSelected = selectedMode === mode.id;
                    const config = modeConfig[mode.id];
                    return (
                      <motion.button
                        key={mode.id}
                        type="button"
                        onClick={() => handleModeSelect(mode.id)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`
                          relative flex flex-col items-center justify-center rounded-lg border-2 p-4 transition-all
                          ${isSelected ? `${config.bg} ${config.border}` : 'bg-white/5 border-white/10'}
                          ${isSelected ? `outline outline-2 ${config.outline} outline-offset-2` : ''}
                        `}
                      >
                        <span className={`mb-2 text-3xl ${isSelected ? config.text : ''}`}>{mode.icon}</span>
                        <span className={`text-sm font-semibold ${isSelected ? config.text : 'text-white'}`}>{mode.title}</span>
                        <span className="mt-1 text-xs text-muted-foreground text-center">
                          {mode.description}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Category Selection */}
              <div className="mb-6">
                <h3 className="mb-3 text-lg font-semibold">Select Category (Optional)</h3>
                <div className="flex gap-3 overflow-x-auto pb-2 p-2 -m-2">
                  {CATEGORY_OPTIONS.map((category) => {
                    const isSelected = selectedCategory === category.id;
                    const config = modeConfig[selectedMode];
                    return (
                      <motion.button
                        key={category.id}
                        type="button"
                        onClick={() => handleCategorySelect(category.id)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`
                          flex items-center gap-2 rounded-lg border-2 px-4 py-3 transition-all
                          ${isSelected ? `${config.bg} ${config.border}` : 'border-border bg-muted hover:bg-accent'}
                          ${isSelected ? `outline outline-2 ${config.outline} outline-offset-2` : ''}
                        `}
                      >
                        <span className={`text-2xl ${isSelected ? config.text : ''}`}>{category.icon}</span>
                        <span className={`font-medium ${isSelected ? config.text : ''}`}>{category.title}</span>
                      </motion.button>
                    );
                  })}
                  {/* Clear category option */}
                  <motion.button
                    type="button"
                    onClick={() => handleCategorySelect(null)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`
                      flex items-center gap-2 rounded-lg border-2 px-4 py-3 transition-all
                      ${selectedCategory === null ? `${modeConfig[selectedMode].bg} ${modeConfig[selectedMode].border}` : 'border-border bg-muted hover:bg-accent'}
                      ${selectedCategory === null ? `outline outline-2 ${modeConfig[selectedMode].outline} outline-offset-2` : ''}
                    `}
                  >
                    <span className={`text-2xl ${selectedCategory === null ? modeConfig[selectedMode].text : ''}`}>🎲</span>
                    <span className={`font-medium ${selectedCategory === null ? modeConfig[selectedMode].text : ''}`}>All</span>
                  </motion.button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={!playerName.trim()}
                className={`w-full text-white ${modeConfig[selectedMode].button}`}
              >
                Start Game
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link
                to="/suggest"
                className="block text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                💡 Suggest a Question
              </Link>
            </div>

            <div className="mt-4 text-center">
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
                <li>Choose a game mode: Classic (10 questions), Sprint (1 min), Race (3 min), Marathon (5 min), or Endless</li>
                <li>Optionally select a category: Countries, Cities, Landmarks, Capitals, or All</li>
                <li>For each question, click on the map where you think the location is</li>
                <li>Points are awarded based on accuracy (how close) and speed (faster = more points)</li>
                <li>Complete the round and submit your score to the leaderboard!</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
