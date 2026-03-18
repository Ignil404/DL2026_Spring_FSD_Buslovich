/**
 * SuggestPage - Form for players to submit their own questions
 */
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { suggestQuestion } from '../services/api';

// Fix default marker icon for bundled assets
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Custom blue icon for selected position
const blueIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const CATEGORIES = ['Countries', 'Cities', 'Landmarks', 'Capitals'];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

export default function SuggestPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [questionText, setQuestionText] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [hint, setHint] = useState('');
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [latitude, setLatitude] = useState<string>('');
  const [longitude, setLongitude] = useState<string>('');
  const [selectedPos, setSelectedPos] = useState<{ lat: number; lng: number } | null>(null);

  // Handle map click to pick coordinates
  const handleMapClick = useCallback((pos: { lat: number; lng: number }) => {
    setSelectedPos(pos);
    setLatitude(pos.lat.toFixed(6));
    setLongitude(pos.lng.toFixed(6));
  }, []);

  // Handle manual coordinate input
  const handleLatChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLatitude(val);
    if (val && !isNaN(parseFloat(val))) {
      setSelectedPos({ lat: parseFloat(val), lng: parseFloat(longitude) || 0 });
    }
  };

  const handleLonChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLongitude(val);
    if (val && !isNaN(parseFloat(val))) {
      setSelectedPos({ lat: parseFloat(latitude) || 0, lng: parseFloat(val) });
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    if (!questionText.trim()) {
      setError('Question text is required');
      return false;
    }
    if (questionText.length > 500) {
      setError('Question must be 500 characters or less');
      return false;
    }
    if (!playerName.trim()) {
      setError('Your name is required');
      return false;
    }
    if (playerName.trim().length < 2 || playerName.trim().length > 20) {
      setError('Name must be between 2 and 20 characters');
      return false;
    }
    if (!latitude || !longitude) {
      setError('Please provide coordinates');
      return false;
    }
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      setError('Latitude must be between -90 and 90');
      return false;
    }
    if (isNaN(lon) || lon < -180 || lon > 180) {
      setError('Longitude must be between -180 and 180');
      return false;
    }
    return true;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      await suggestQuestion({
        player_name: playerName.trim(),
        question_text: questionText.trim(),
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        hint: hint.trim() || undefined,
        category: category || undefined,
        difficulty: difficulty || undefined,
      });

      setIsSubmitted(true);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.detail || err?.message || 'Failed to submit suggestion. Please try again.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form for new submission
  const handleReset = () => {
    setQuestionText('');
    setPlayerName('');
    setHint('');
    setCategory('');
    setDifficulty('');
    setLatitude('');
    setLongitude('');
    setSelectedPos(null);
    setIsSubmitted(false);
    setError(null);
  };

  return (
    <div className="flex min-h-screen flex-col items-center p-4 pt-8 md:pt-12">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-2xl"
      >
        <Card className="border-border bg-card">
          <CardHeader className="text-center pb-4">
            <div className="mb-2 text-4xl">💡</div>
            <CardTitle className="text-2xl font-bold">Suggest a Question</CardTitle>
            <CardDescription>
              Help us improve the game by submitting your own geography questions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isSubmitted ? (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="py-8 text-center"
              >
                <div className="mb-4 text-5xl">✅</div>
                <h2 className="mb-2 text-xl font-bold">Thank you!</h2>
                <p className="mb-6 text-muted-foreground">
                  Your question has been submitted for review.
                </p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button onClick={handleReset} className="flex-1">
                    Submit Another
                  </Button>
                  <Button onClick={() => navigate('/')} variant="outline" className="flex-1">
                    Go Home
                  </Button>
                </div>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit}>
                {/* Question Text */}
                <div className="mb-4 space-y-2">
                  <Label htmlFor="question">Question Text *</Label>
                  <Textarea
                    id="question"
                    placeholder="e.g. Where is the Eiffel Tower?"
                    value={questionText}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setQuestionText(e.target.value)}
                    maxLength={500}
                    rows={3}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    {questionText.length}/500 characters
                  </p>
                </div>

                {/* Player Name */}
                <div className="mb-4 space-y-2">
                  <Label htmlFor="name">Your Name *</Label>
                  <Input
                    id="name"
                    placeholder="Your name"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    maxLength={20}
                    required
                  />
                </div>

                {/* Hint */}
                <div className="mb-4 space-y-2">
                  <Label htmlFor="hint">Hint (Optional)</Label>
                  <Input
                    id="hint"
                    placeholder="e.g. Paris, France"
                    value={hint}
                    onChange={(e) => setHint(e.target.value)}
                    maxLength={200}
                  />
                  <p className="text-xs text-muted-foreground">
                    {hint.length}/200 characters
                  </p>
                </div>

                {/* Category and Difficulty */}
                <div className="mb-4 grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="difficulty">Difficulty</Label>
                    <Select value={difficulty} onValueChange={setDifficulty}>
                      <SelectTrigger id="difficulty">
                        <SelectValue placeholder="Select difficulty" />
                      </SelectTrigger>
                      <SelectContent>
                        {DIFFICULTIES.map((diff) => (
                          <SelectItem key={diff} value={diff}>
                            {diff}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Coordinates Section */}
                <div className="mb-4 space-y-2">
                  <Label>Coordinates *</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="latitude" className="text-xs">Latitude</Label>
                      <Input
                        id="latitude"
                        type="number"
                        placeholder="Latitude"
                        value={latitude}
                        onChange={handleLatChange}
                        min={-90}
                        max={90}
                        step="any"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="longitude" className="text-xs">Longitude</Label>
                      <Input
                        id="longitude"
                        type="number"
                        placeholder="Longitude"
                        value={longitude}
                        onChange={handleLonChange}
                        min={-180}
                        max={180}
                        step="any"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enter coordinates manually or click on the map below
                  </p>
                </div>

                {/* Map for coordinate selection */}
                <div className="mb-4">
                  <Label className="mb-2 block">Pick on Map</Label>
                  <div className="h-[300px] w-full overflow-hidden rounded-lg border border-border">
                    <LeafletMap
                      selectedPos={selectedPos}
                      onSelect={handleMapClick}
                    />
                  </div>
                  {selectedPos && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Selected: {selectedPos.lat.toFixed(4)}, {selectedPos.lng.toFixed(4)}
                    </p>
                  )}
                </div>

                {/* Error message */}
                {error && (
                  <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}

                {/* Submit button */}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Suggestion'}
                </Button>

                {/* Back button */}
                <Button
                  type="button"
                  onClick={() => navigate('/')}
                  variant="outline"
                  className="mt-3 w-full"
                >
                  ← Back to Home
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

// Leaflet map component for coordinate selection
interface LeafletMapProps {
  selectedPos: { lat: number; lng: number } | null;
  onSelect: (pos: { lat: number; lng: number }) => void;
}

function MapClickHandler({ onSelect }: { onSelect: (pos: { lat: number; lng: number }) => void }) {
  useMapEvents({
    click(e) {
      onSelect({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

function LeafletMap({ selectedPos, onSelect }: LeafletMapProps) {
  return (
    <MapContainer
      center={[20, 0]}
      zoom={2}
      className="h-full w-full"
      style={{ height: '100%', width: '100%' }}
      zoomControl={true}
      scrollWheelZoom={false}
      dragging={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      <MapClickHandler onSelect={onSelect} />
      {selectedPos && <Marker position={[selectedPos.lat, selectedPos.lng]} icon={blueIcon} />}
    </MapContainer>
  );
}
