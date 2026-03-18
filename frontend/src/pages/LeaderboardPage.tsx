/**
 * LeaderboardPage - Full page leaderboard display
 * Restyled with Tailwind CSS and shadcn/ui
 */
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useQuery } from '@tanstack/react-query';
import { getLeaderboard } from '../services/api';
import type { LeaderboardResponse } from '../types';

const rankColors: Record<number, string> = {
  0: 'text-[hsl(45,93%,58%)]',  // gold
  1: 'text-[hsl(0,0%,75%)]',    // silver
  2: 'text-[hsl(30,60%,50%)]',  // bronze
};

export default function LeaderboardPage() {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: getLeaderboard,
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const entries = (data as LeaderboardResponse | undefined)?.entries || [];

  return (
    <div className="flex min-h-screen flex-col items-center p-4 pt-12 md:pt-20">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-lg"
      >
        <Card className="border-border bg-card">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">🏆 Leaderboard</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : entries.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <p className="mb-4 text-lg">No scores yet. Be the first!</p>
                <Button onClick={() => navigate('/game')}>
                  Play Now
                </Button>
              </div>
            ) : (
              <div className="rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border bg-muted/50">
                      <TableHead className="w-16">Rank</TableHead>
                      <TableHead>Player</TableHead>
                      <TableHead className="text-right">Score</TableHead>
                      <TableHead className="hidden text-right sm:table-cell">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.map((entry: { player_name: string; total_score: number; submitted_at: string }, i: number) => (
                      <TableRow
                        key={entry.player_name + entry.submitted_at}
                        className="border-border transition-colors hover:bg-muted/30"
                      >
                        <TableCell className={`font-bold ${rankColors[i] || 'text-muted-foreground'}`}>
                          #{i + 1}
                        </TableCell>
                        <TableCell className="font-medium">{entry.player_name}</TableCell>
                        <TableCell className="text-right font-bold text-secondary">
                          {entry.total_score.toLocaleString()}
                        </TableCell>
                        <TableCell className="hidden text-right text-sm text-muted-foreground sm:table-cell">
                          {new Date(entry.submitted_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button
                onClick={() => navigate('/')}
                variant="outline"
                className="flex-1"
              >
                ← Home
              </Button>
              <Button
                onClick={() => navigate('/game')}
                className="flex-1"
              >
                Play Now
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
