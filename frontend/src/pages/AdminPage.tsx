/**
 * AdminPage - Review and manage all questions
 */
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  getSuggestedQuestions,
  approveQuestion,
  rejectQuestion,
  getAllQuestions,
  updateQuestion,
  deleteQuestion,
  createQuestion,
} from '../services/api';

// Fix default marker icon
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const blueIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// Secret token for admin access
const ADMIN_TOKEN = 'admin2026';

interface SuggestedQuestion {
  id: number;
  player_name: string;
  question_text: string;
  latitude: number;
  longitude: number;
  hint: string | null;
  category: string | null;
  status: string;
  submitted_at: string;
}

interface Question {
  id: number;
  text: string;
  location_type: string;
  latitude: number;
  longitude: number;
  difficulty: string;
  hint: string | null;
  time_limit: number;
  category: string | null;
}

interface ApprovalData {
  difficulty: string;
  location_type: string;
  time_limit: number;
  category: string;
}

interface CreateQuestionData {
  text: string;
  latitude: string;
  longitude: string;
  hint: string;
  time_limit: number;
  category: string;
}

export default function AdminPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Token-based access control
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [tokenError, setTokenError] = useState(false);

  const [activeTab, setActiveTab] = useState<'suggestions' | 'all-questions'>('suggestions');

  // Suggestions state
  const [suggestions, setSuggestions] = useState<SuggestedQuestion[]>([]);
  const [suggestionFilter, setSuggestionFilter] = useState<string>('pending');
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(true);

  // All questions state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);
  const [questionFilter, setQuestionFilter] = useState<string>('all');

  // Common state
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Approve dialog state
  const [selectedSuggestion, setSelectedSuggestion] = useState<SuggestedQuestion | null>(null);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [approvalData, setApprovalData] = useState<ApprovalData>({
    difficulty: 'medium',
    location_type: 'landmark',
    time_limit: 45,
    category: 'Landmarks',
  });

  // Auto-update location_type when category changes in approve dialog
  useEffect(() => {
    const autoLocationType = get_location_type(approvalData.category);
    if (approvalData.location_type !== autoLocationType) {
      setApprovalData((prev) => ({ ...prev, location_type: autoLocationType }));
    }
  }, [approvalData.category]);

  // Auto-update difficulty when time_limit changes in approve dialog
  useEffect(() => {
    const autoDifficulty = get_difficulty(approvalData.time_limit);
    if (approvalData.difficulty !== autoDifficulty) {
      setApprovalData((prev) => ({ ...prev, difficulty: autoDifficulty }));
    }
  }, [approvalData.time_limit]);

  // Edit dialog state
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editData, setEditData] = useState<{
    text: string;
    latitude: string;
    longitude: string;
    hint: string;
    time_limit: number;
    category: string;
  }>({
    text: '',
    latitude: '',
    longitude: '',
    hint: '',
    time_limit: 45,
    category: 'Landmarks',
  });
  const [editMapCenter, setEditMapCenter] = useState<[number, number]>([51.505, -0.09]);

  // Auto-calculate location_type and difficulty based on category and time_limit
  const get_location_type = (category: string): string => {
    const categoryLower = category.toLowerCase();
    if (categoryLower === 'countries') return 'country';
    if (categoryLower === 'cities' || categoryLower === 'capitals') return 'city';
    if (categoryLower === 'landmarks') return 'landmark';
    return 'landmark'; // default
  };

  const get_difficulty = (time_limit: number): string => {
    if (time_limit <= 30) return 'hard';
    if (time_limit <= 45) return 'medium';
    return 'easy';
  };

  // Create question dialog state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createData, setCreateData] = useState<CreateQuestionData>({
    text: '',
    latitude: '',
    longitude: '',
    hint: '',
    time_limit: 45,
    category: 'Landmarks',
  });
  const [mapCenter, setMapCenter] = useState<[number, number]>([51.505, -0.09]);

  const handleCreateClick = () => {
    setCreateData({
      text: '',
      latitude: '',
      longitude: '',
      hint: '',
      time_limit: 45,
      category: 'Landmarks',
    });
    setMapCenter([51.505, -0.09]);
    setIsCreateDialogOpen(true);
  };

  const handleCreateSubmit = async () => {
    if (!createData.text || !createData.latitude || !createData.longitude) {
      setError('Please fill in all required fields');
      return;
    }

    setIsProcessing(true);
    try {
      await createQuestion({
        text: createData.text,
        latitude: parseFloat(createData.latitude),
        longitude: parseFloat(createData.longitude),
        hint: createData.hint || undefined,
        category: createData.category,
        time_limit: createData.time_limit,
      });
      setIsCreateDialogOpen(false);
      fetchQuestions();
    } catch (err) {
      setError('Failed to create question');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMapClick = (e: L.LeafletMouseEvent) => {
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;
    setMapCenter([lat, lng]);
    setCreateData((prev) => ({
      ...prev,
      latitude: lat.toFixed(6),
      longitude: lng.toFixed(6),
    }));
  };

  // Map click handler component for Create dialog
  const MapClickHandler = ({ onClick }: { onClick: (e: L.LeafletMouseEvent) => void }) => {
    useMapEvents({
      click: onClick,
    });
    return null;
  };

  // Check token on mount
  useEffect(() => {
    const token = searchParams.get('token');
    if (token === ADMIN_TOKEN) {
      setIsAuthorized(true);
    }
  }, [searchParams]);

  const handleTokenSubmit = () => {
    if (tokenInput === ADMIN_TOKEN) {
      setIsAuthorized(true);
      setTokenError(false);
      // Update URL with token
      navigate(`/admin?token=${ADMIN_TOKEN}`, { replace: true });
    } else {
      setTokenError(true);
    }
  };

  useEffect(() => {
    if (isAuthorized) {
      if (activeTab === 'suggestions') {
        fetchSuggestions();
      } else {
        fetchQuestions();
      }
    }
  }, [activeTab, suggestionFilter, questionFilter, isAuthorized]);

  const fetchSuggestions = async () => {
    setIsLoadingSuggestions(true);
    setError(null);
    try {
      const data = await getSuggestedQuestions(
        suggestionFilter === 'all' ? undefined : suggestionFilter
      );
      setSuggestions(data);
    } catch (err) {
      setError('Failed to load suggestions');
      console.error(err);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const fetchQuestions = async () => {
    setIsLoadingQuestions(true);
    setError(null);
    try {
      const data = await getAllQuestions();
      let filtered = data;

      if (questionFilter === 'countries') {
        filtered = data.filter((q: Question) => q.category?.toLowerCase() === 'countries');
      } else if (questionFilter === 'cities') {
        filtered = data.filter((q: Question) => q.category?.toLowerCase() === 'cities');
      } else if (questionFilter === 'landmarks') {
        filtered = data.filter((q: Question) => q.category?.toLowerCase() === 'landmarks');
      } else if (questionFilter === 'capitals') {
        filtered = data.filter((q: Question) => q.category?.toLowerCase() === 'capitals');
      }

      setQuestions(filtered);
    } catch (err) {
      setError('Failed to load questions');
      console.error(err);
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  const handleApproveClick = (question: SuggestedQuestion) => {
    setSelectedSuggestion(question);
    if (question.category) {
      setApprovalData((prev) => ({ ...prev, category: question.category! }));
    }
    setIsApproveDialogOpen(true);
  };

  const handleApproveSubmit = async () => {
    if (!selectedSuggestion) return;

    setIsProcessing(true);
    try {
      await approveQuestion(selectedSuggestion.id, approvalData);
      setIsApproveDialogOpen(false);
      setSelectedSuggestion(null);
      fetchSuggestions();
    } catch (err) {
      setError('Failed to approve question');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectClick = async (question: SuggestedQuestion) => {
    if (!confirm(`Reject question from ${question.player_name}?`)) return;

    setIsProcessing(true);
    try {
      await rejectQuestion(question.id);
      fetchSuggestions();
    } catch (err) {
      setError('Failed to reject question');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEditClick = (question: Question) => {
    setSelectedQuestion(question);
    setEditData({
      text: question.text,
      latitude: question.latitude.toString(),
      longitude: question.longitude.toString(),
      hint: question.hint || '',
      time_limit: question.time_limit,
      category: question.category || 'Landmarks',
    });
    setEditMapCenter([question.latitude, question.longitude]);
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!selectedQuestion || !editData.text || !editData.latitude || !editData.longitude) {
      setError('Please fill in all required fields');
      return;
    }

    setIsProcessing(true);
    try {
      await updateQuestion(selectedQuestion.id, {
        text: editData.text,
        latitude: parseFloat(editData.latitude),
        longitude: parseFloat(editData.longitude),
        hint: editData.hint || undefined,
        category: editData.category,
        time_limit: editData.time_limit,
      });
      setIsEditDialogOpen(false);
      setSelectedQuestion(null);
      fetchQuestions();
    } catch (err) {
      setError('Failed to update question');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEditMapClick = (e: L.LeafletMouseEvent) => {
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;
    setEditMapCenter([lat, lng]);
    setEditData((prev) => ({
      ...prev,
      latitude: lat.toFixed(6),
      longitude: lng.toFixed(6),
    }));
  };

  const handleDeleteClick = async (question: Question) => {
    if (!confirm(`Delete question "${question.text}"? This cannot be undone.`)) return;

    setIsProcessing(true);
    try {
      await deleteQuestion(question.id);
      fetchQuestions();
    } catch (err) {
      setError('Failed to delete question');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const ReadOnlyMap = ({ lat, lon }: { lat: number; lon: number }) => {
    return (
      <MapContainer
        center={[lat, lon]}
        zoom={5}
        className="h-full w-full"
        style={{ height: '100%', width: '100%', zIndex: 0 }}
        zoomControl={true}
        scrollWheelZoom={false}
        dragging={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <Marker position={[lat, lon]} icon={blueIcon} />
      </MapContainer>
    );
  };

  // Token authorization screen
  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Admin Access Required</CardTitle>
            <CardDescription>Enter the admin token to access this page</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Token</label>
              <input
                type="password"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleTokenSubmit()}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                placeholder="Enter admin token"
              />
              {tokenError && (
                <p className="text-sm text-red-600 dark:text-red-400">Invalid token</p>
              )}
            </div>
            <Button onClick={handleTokenSubmit} className="w-full">
              Access Admin Panel
            </Button>
            <Button variant="outline" onClick={() => navigate('/')} className="w-full dark:text-white">
              ← Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Admin Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage questions and moderate suggestions
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={handleCreateClick}
            >
              + Create Question
            </Button>
            <Button variant="outline" onClick={() => navigate('/')} className="dark:text-white">
              ← Back to Home
            </Button>
          </div>
        </motion.div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'suggestions' | 'all-questions')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="suggestions">Question Suggestions ({suggestions.length})</TabsTrigger>
            <TabsTrigger value="all-questions">All Questions ({questions.length})</TabsTrigger>
          </TabsList>

          {/* Suggestions Tab */}
          <TabsContent value="suggestions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Filter Suggestions</CardTitle>
                <CardDescription>Show suggestions by status</CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={suggestionFilter} onValueChange={setSuggestionFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="all">All</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {isLoadingSuggestions ? (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">Loading suggestions...</p>
              </div>
            ) : suggestions.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-gray-500 dark:text-gray-400">
                  No suggestions found
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {suggestions.map((suggestion) => (
                  <Card key={suggestion.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{suggestion.question_text}</CardTitle>
                          <CardDescription>
                            Submitted by {suggestion.player_name} on{' '}
                            {new Date(suggestion.submitted_at).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              suggestion.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200'
                                : suggestion.status === 'approved'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
                            }`}
                          >
                            {suggestion.status}
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="text-sm">
                            <span className="text-gray-500 dark:text-gray-400">Category:</span>{' '}
                            <span className="font-medium">{suggestion.category || 'Not specified'}</span>
                          </div>
                          {suggestion.hint && (
                            <div className="text-sm">
                              <span className="text-gray-500 dark:text-gray-400">Hint:</span>{' '}
                              <span className="font-medium">{suggestion.hint}</span>
                            </div>
                          )}
                          <div className="text-sm">
                            <span className="text-gray-500 dark:text-gray-400">Coordinates:</span>{' '}
                            <span className="font-medium">
                              {suggestion.latitude.toFixed(4)}, {suggestion.longitude.toFixed(4)}
                            </span>
                          </div>
                        </div>
                        {/* Map - same design as SuggestPage */}
                        <div className="h-[300px] w-full overflow-hidden rounded-lg border border-border">
                          <ReadOnlyMap lat={suggestion.latitude} lon={suggestion.longitude} />
                        </div>
                      </div>

                      {suggestion.status === 'pending' && (
                        <div className="flex gap-2 mt-4 pt-4 border-t">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleApproveClick(suggestion)}
                            disabled={isProcessing}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRejectClick(suggestion)}
                            disabled={isProcessing}
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* All Questions Tab */}
          <TabsContent value="all-questions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Filter Questions</CardTitle>
                <CardDescription>Show questions by category</CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={questionFilter} onValueChange={setQuestionFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="countries">Countries</SelectItem>
                    <SelectItem value="cities">Cities</SelectItem>
                    <SelectItem value="landmarks">Landmarks</SelectItem>
                    <SelectItem value="capitals">Capitals</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {isLoadingQuestions ? (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">Loading questions...</p>
              </div>
            ) : questions.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-gray-500 dark:text-gray-400">
                  No questions found
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {questions.map((question) => (
                  <Card key={question.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{question.text}</CardTitle>
                          <CardDescription className="flex items-center gap-2">
                            <span className="capitalize">{question.location_type}</span>
                            <span>•</span>
                            <span className="capitalize">{question.difficulty}</span>
                            <span>•</span>
                            <span>{question.time_limit}s</span>
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
                            {question.category || 'Uncategorized'}
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="text-sm">
                            <span className="text-gray-500 dark:text-gray-400">Coordinates:</span>{' '}
                            <span className="font-medium">
                              {question.latitude.toFixed(4)}, {question.longitude.toFixed(4)}
                            </span>
                          </div>
                          {question.hint && (
                            <div className="text-sm">
                              <span className="text-gray-500 dark:text-gray-400">Hint:</span>{' '}
                              <span className="font-medium">{question.hint}</span>
                            </div>
                          )}
                        </div>
                        {/* Map - same design as SuggestPage */}
                        <div className="h-[300px] w-full overflow-hidden rounded-lg border border-border">
                          <ReadOnlyMap lat={question.latitude} lon={question.longitude} />
                        </div>
                      </div>

                      <div className="flex gap-2 mt-4 pt-4 border-t">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditClick(question)}
                          disabled={isProcessing}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteClick(question)}
                          disabled={isProcessing}
                        >
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Approve Dialog */}
        <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Approve Question</DialogTitle>
              <DialogDescription>
                Configure the question settings before adding it to the game
              </DialogDescription>
            </DialogHeader>

            {selectedSuggestion && (
              <div className="space-y-4 py-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Question:</strong> {selectedSuggestion.question_text}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Difficulty (auto)</label>
                    <Select
                      value={approvalData.difficulty}
                      onValueChange={(value) =>
                        setApprovalData((prev) => ({ ...prev, difficulty: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">Location Type (auto)</label>
                    <Select
                      value={approvalData.location_type}
                      onValueChange={(value) =>
                        setApprovalData((prev) => ({ ...prev, location_type: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="country">Country</SelectItem>
                        <SelectItem value="city">City</SelectItem>
                        <SelectItem value="landmark">Landmark</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Time Limit</label>
                  <Select
                    value={approvalData.time_limit.toString()}
                    onValueChange={(value) =>
                      setApprovalData((prev) => ({ ...prev, time_limit: parseInt(value) }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 seconds (Hard)</SelectItem>
                      <SelectItem value="45">45 seconds (Medium)</SelectItem>
                      <SelectItem value="60">60 seconds (Easy)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Category</label>
                  <Select
                    value={approvalData.category}
                    onValueChange={(value) =>
                      setApprovalData((prev) => ({ ...prev, category: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Countries">Countries</SelectItem>
                      <SelectItem value="Cities">Cities</SelectItem>
                      <SelectItem value="Landmarks">Landmarks</SelectItem>
                      <SelectItem value="Capitals">Capitals</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Auto-calculated info */}
                <div className="text-xs text-gray-500">
                  <p>• Difficulty is auto-calculated from Time Limit</p>
                  <p>• Location Type is auto-calculated from Category</p>
                  <p>• You can still manually override above</p>
                </div>

                {/* Map preview - same design as SuggestPage */}
                <div>
                  <label className="text-sm font-medium mb-1 block">Location Preview</label>
                  <div className="h-[300px] w-full overflow-hidden rounded-lg border border-border">
                    <ReadOnlyMap lat={selectedSuggestion.latitude} lon={selectedSuggestion.longitude} />
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsApproveDialogOpen(false)}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={handleApproveSubmit}
                disabled={isProcessing}
              >
                {isProcessing ? 'Approving...' : 'Approve & Add to Pool'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-3xl bg-[#1a1a1a] text-white border-border">
            <DialogHeader>
              <DialogTitle className="text-white">Edit Question</DialogTitle>
              <DialogDescription className="text-gray-400">
                Update question details
              </DialogDescription>
            </DialogHeader>

            {selectedQuestion && (
              <div className="space-y-3 py-4">
                {/* Question Text */}
                <div>
                  <label className="text-sm font-medium mb-1 block text-gray-300">Question Text</label>
                  <input
                    type="text"
                    value={editData.text}
                    onChange={(e) => setEditData((prev) => ({ ...prev, text: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#262626] text-white border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring h-9"
                    placeholder="e.g., Where is the Eiffel Tower?"
                    maxLength={500}
                  />
                </div>

                {/* Category and Time Limit */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium mb-1 block text-gray-300">Category</label>
                    <Select
                      value={editData.category}
                      onValueChange={(value) =>
                        setEditData((prev) => ({ ...prev, category: value }))
                      }
                    >
                      <SelectTrigger className="bg-[#262626] text-white border-border h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="edit-dialog-select-content text-white">
                        <SelectItem value="Countries">Countries</SelectItem>
                        <SelectItem value="Cities">Cities</SelectItem>
                        <SelectItem value="Landmarks">Landmarks</SelectItem>
                        <SelectItem value="Capitals">Capitals</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block text-gray-300">Time Limit</label>
                    <Select
                      value={editData.time_limit.toString()}
                      onValueChange={(value) =>
                        setEditData((prev) => ({ ...prev, time_limit: parseInt(value) }))
                      }
                    >
                      <SelectTrigger className="bg-[#262626] text-white border-border h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="edit-dialog-select-content text-white">
                        <SelectItem value="30">30 sec (Hard)</SelectItem>
                        <SelectItem value="45">45 sec (Medium)</SelectItem>
                        <SelectItem value="60">60 sec (Easy)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Coordinates */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium mb-1 block text-gray-300">Latitude</label>
                    <input
                      type="text"
                      value={editData.latitude}
                      onChange={(e) => setEditData((prev) => ({ ...prev, latitude: e.target.value }))}
                      className="w-full px-3 py-2 bg-[#262626] text-white border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring h-9"
                      placeholder="51.505"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block text-gray-300">Longitude</label>
                    <input
                      type="text"
                      value={editData.longitude}
                      onChange={(e) => setEditData((prev) => ({ ...prev, longitude: e.target.value }))}
                      className="w-full px-3 py-2 bg-[#262626] text-white border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring h-9"
                      placeholder="-0.09"
                    />
                  </div>
                </div>

                {/* Hint */}
                <div>
                  <label className="text-sm font-medium mb-1 block text-gray-300">Hint (optional)</label>
                  <input
                    type="text"
                    value={editData.hint}
                    onChange={(e) => setEditData((prev) => ({ ...prev, hint: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#262626] text-white border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring h-9"
                    placeholder="e.g., It's in Paris"
                    maxLength={200}
                  />
                </div>

                {/* Auto-calculated fields */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-400">Location Type (auto):</span>{' '}
                    <span className="text-white capitalize">{get_location_type(editData.category)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Difficulty (auto):</span>{' '}
                    <span className="text-white capitalize">{get_difficulty(editData.time_limit)}</span>
                  </div>
                </div>

                {/* Map */}
                <div>
                  <label className="text-sm font-medium mb-1 block text-gray-300">Click on map to set location</label>
                  <div className="h-[250px] w-full overflow-hidden rounded-lg border border-border">
                    <MapContainer
                      center={editMapCenter}
                      zoom={5}
                      className="h-full w-full"
                      style={{ height: '100%', width: '100%', zIndex: 0 }}
                      zoomControl={true}
                      scrollWheelZoom={true}
                      dragging={true}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                      />
                      <MapClickHandler onClick={handleEditMapClick} />
                      <Marker position={[parseFloat(editData.latitude) || editMapCenter[0], parseFloat(editData.longitude) || editMapCenter[1]]} icon={blueIcon} key={`${editData.latitude}-${editData.longitude}`} />
                    </MapContainer>
                  </div>
                  {editData.latitude && editData.longitude && (
                    <p className="text-xs text-gray-400 mt-1">
                      Selected: {editData.latitude}, {editData.longitude}
                    </p>
                  )}
                </div>
              </div>
            )}

            <DialogFooter className="pt-3">
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                disabled={isProcessing}
                className="text-white border-border hover:bg-[#262626] h-9"
              >
                Cancel
              </Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white h-9"
                onClick={handleEditSubmit}
                disabled={isProcessing}
              >
                {isProcessing ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Question Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-3xl bg-[#1a1a1a] text-white border-border">
            <DialogHeader>
              <DialogTitle className="text-white">Create New Question</DialogTitle>
              <DialogDescription className="text-gray-400">
                Add a new question to the database
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-4">
              {/* Question Text */}
              <div>
                <label className="text-sm font-medium mb-1 block text-gray-300">Question Text</label>
                <input
                  type="text"
                  value={createData.text}
                  onChange={(e) => setCreateData((prev) => ({ ...prev, text: e.target.value }))}
                  className="w-full px-3 py-2 bg-[#262626] text-white border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="e.g., Where is the Eiffel Tower?"
                  maxLength={500}
                />
              </div>

              {/* Category and Time Limit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1 block text-gray-300">Category</label>
                  <Select
                    value={createData.category}
                    onValueChange={(value) =>
                      setCreateData((prev) => ({ ...prev, category: value }))
                    }
                  >
                    <SelectTrigger className="bg-[#262626] text-white border-border h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="edit-dialog-select-content text-white">
                      <SelectItem value="Countries">Countries</SelectItem>
                      <SelectItem value="Cities">Cities</SelectItem>
                      <SelectItem value="Landmarks">Landmarks</SelectItem>
                      <SelectItem value="Capitals">Capitals</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block text-gray-300">Time Limit</label>
                  <Select
                    value={createData.time_limit.toString()}
                    onValueChange={(value) =>
                      setCreateData((prev) => ({ ...prev, time_limit: parseInt(value) }))
                    }
                  >
                    <SelectTrigger className="bg-[#262626] text-white border-border h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="edit-dialog-select-content text-white">
                      <SelectItem value="30">30 sec (Hard)</SelectItem>
                      <SelectItem value="45">45 sec (Medium)</SelectItem>
                      <SelectItem value="60">60 sec (Easy)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Coordinates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1 block text-gray-300">Latitude</label>
                  <input
                    type="text"
                    value={createData.latitude}
                    onChange={(e) => setCreateData((prev) => ({ ...prev, latitude: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#262626] text-white border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring h-9"
                    placeholder="51.505"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block text-gray-300">Longitude</label>
                  <input
                    type="text"
                    value={createData.longitude}
                    onChange={(e) => setCreateData((prev) => ({ ...prev, longitude: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#262626] text-white border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring h-9"
                    placeholder="-0.09"
                  />
                </div>
              </div>

              {/* Hint */}
              <div>
                <label className="text-sm font-medium mb-1 block text-gray-300">Hint (optional)</label>
                <input
                  type="text"
                  value={createData.hint}
                  onChange={(e) => setCreateData((prev) => ({ ...prev, hint: e.target.value }))}
                  className="w-full px-3 py-2 bg-[#262626] text-white border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring h-9"
                  placeholder="e.g., It's in Paris"
                  maxLength={200}
                />
              </div>

              {/* Auto-calculated fields */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-400">Location Type (auto):</span>{' '}
                  <span className="text-white capitalize">{get_location_type(createData.category)}</span>
                </div>
                <div>
                  <span className="text-gray-400">Difficulty (auto):</span>{' '}
                  <span className="text-white capitalize">{get_difficulty(createData.time_limit)}</span>
                </div>
              </div>

              {/* Map */}
              <div>
                <label className="text-sm font-medium mb-1 block text-gray-300">Click on map to set location</label>
                <div className="h-[250px] w-full overflow-hidden rounded-lg border border-border">
                  <MapContainer
                    center={mapCenter}
                    zoom={5}
                    className="h-full w-full"
                    style={{ height: '100%', width: '100%', zIndex: 0 }}
                    zoomControl={true}
                    scrollWheelZoom={true}
                    dragging={true}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                      url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    />
                    <MapClickHandler onClick={handleMapClick} />
                    <Marker position={[parseFloat(createData.latitude) || mapCenter[0], parseFloat(createData.longitude) || mapCenter[1]]} icon={blueIcon} key={`${createData.latitude}-${createData.longitude}`} />
                  </MapContainer>
                </div>
                {createData.latitude && createData.longitude && (
                  <p className="text-xs text-gray-400 mt-1">
                    Selected: {createData.latitude}, {createData.longitude}
                  </p>
                )}
              </div>
            </div>

            <DialogFooter className="pt-3">
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                disabled={isProcessing}
                className="text-white border-border hover:bg-[#262626] h-9"
              >
                Cancel
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700 text-white h-9"
                onClick={handleCreateSubmit}
                disabled={isProcessing}
              >
                {isProcessing ? 'Creating...' : 'Create Question'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
