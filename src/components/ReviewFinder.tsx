// @ts-nocheck
import React, { useState, useRef, useEffect } from 'react';
import { Button, Container, Row, Table, Col, Form, Modal, Card, Badge, Spinner, Alert, InputGroup, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import {
  FaStar,
  FaRegStar,
  FaStarHalfAlt,
  FaSearch,
  FaFilter,
  FaDownload,
  FaBell,
  FaChartLine,
  FaThumbsUp,
  FaCalendarAlt,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaTimes,
  FaCheckCircle,
  FaExclamationCircle,
  FaQuestionCircle
} from 'react-icons/fa';
import '../styles/ReviewFinder.css';
import config from '../config/config';

interface Review {
  user: string;
  rating: number;
  review: string;
  reviewCreatedVersion: string;
  thumbsUpCount: number;
  date: string;
  isExpanded?: boolean;
}

interface SubscriptionForm {
  email: string;
  topics: string[];
}

interface Category {
  name: string;
  products: string[];
}

interface ReviewStats {
  total: number;
  average: number;
  byRating: { [key: number]: number };
  sentimentCounts: { positive: number; neutral: number; negative: number };
}

const categories: Category[] = [
  {
    name: 'FortiGate & Network Security',
    products: ['FortiGate', 'FortiGate Cloud', 'FortiGate-VM', 'FortiOS', 'FortiGuard', 'FortiCare']
  },
  {
    name: 'Cloud Security',
    products: ['FortiCNP', 'FortiWeb Cloud', 'FortiMail Cloud', 'FortiADC Cloud', 'FortiToken Cloud', 'FortiCASB', 'FortiCWP', 'FortiGSLB Cloud', 'FortiSASE', 'FortiWeb Cloud WAF-as-a-Service', 'FortiCDN', 'FortiCloud']
  },
  {
    name: 'Access & Identity',
    products: ['FortiAuthenticator', 'FortiToken', 'FortiToken Mobile', 'FortiClient', 'FortiClient Cloud', 'FortiPass', 'FortiTrust Identity']
  },
  {
    name: 'Management & Analytics',
    products: ['FortiManager', 'FortiManager Cloud', 'FortiAnalyzer', 'FortiAnalyzer Cloud', 'FortiCloud Analytics', 'FortiSOAR', 'FortiMonitor', 'FortiPortal', 'FortiReporter']
  },
  {
    name: 'Security Operations',
    products: ['FortiSIEM', 'FortiEDR', 'FortiXDR', 'FortiNDR', 'FortiDeceptor', 'FortiSandbox', 'FortiSandbox Cloud', 'FortiAI', 'FortiInsight', 'FortiResponder']
  },
  {
    name: 'Email & Web Security',
    products: ['FortiMail', 'FortiWeb', 'FortiIsolator', 'FortiProxy', 'FortiCache']
  },
  {
    name: 'Network Access',
    products: ['FortiNAC', 'FortiAP', 'FortiSwitch', 'FortiSwitch Cloud', 'FortiLAN Cloud', 'FortiExtender', 'FortiPresence']
  },
  {
    name: 'Voice & Communications',
    products: ['FortiVoice', 'FortiVoice Cloud', 'FortiFone', 'FortiCall']
  },
  {
    name: 'SD-WAN & Networking',
    products: ['FortiWAN', 'FortiSD-WAN', 'FortiGSLB', 'FortiDDoS', 'FortiBalancer', 'FortiADC', 'FortiDNS', 'FortiIPAM']
  },
  {
    name: 'IoT & OT Security',
    products: ['FortiNAC', 'FortiSilent', 'FortiGuard OT', 'FortiOT']
  },
  {
    name: 'Mobile Security',
    products: ['FortiSIM', 'FortiCarrier']
  },
  {
    name: 'Tools & Applications',
    products: ['FortiExplorer', 'FortiExplorer Go', 'FortiConverter', 'FortiTester', 'FortiRecorder', 'FortiCamera']
  },
  {
    name: 'Specialized Solutions',
    products: ['FortiPenTest', 'FortiPhish', 'FortiRecon', 'FortiDevSec', 'FortiRASA']
  },
  {
    name: 'Services',
    products: ['FortiTrust', 'FortiCare', 'FortiGuard Services', 'FortiSupport', 'FortiCloud Services', 'FortiPro Services', 'FortiCare Elite', 'FortiCare Premium', 'FortiTrust Identity', 'FortiTrust Security', 'FortiTrust Access']
  }
];

const fetchReviews = async (platform: string, app_name: string, app_id?: string): Promise<Review[]> => {
  let apiUrl = `${config.reviewfinderUrl}/reviewfinder/v1/${platform}/${app_name}`;
  if (app_id) {
    apiUrl = `${config.reviewfinderUrl}/reviewfinder/v1/${platform}/${app_name}/${app_id}`;
  }
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`Error fetching reviews: ${response.statusText}`);
    }
    const data = await response.json();
    return data.reviews || [];
  } catch (error) {
    console.error(error);
    return [];
  }
};

const subscribeToTopics = async (email: string, topics: string[]): Promise<boolean> => {
  try {
    const response = await fetch(`${config.reviewfinderUrl}/reviewfinder/v1/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        topic: topics,
      }),
    });

    if (!response.ok) {
      throw new Error(`Error subscribing: ${response.statusText}`);
    }

    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};

const ReviewFinder: React.FC = () => {
  const [appName, setAppName] = useState('');
  const [appId, setAppId] = useState('');
  const [platform, setPlatform] = useState('');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState('');
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [subscriptionForm, setSubscriptionForm] = useState<SubscriptionForm>({
    email: '',
    topics: [],
  });
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);
  const [subscriptionSuccess, setSubscriptionSuccess] = useState<string | null>(null);
  const reviewsPerPage = 15;
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [visibleItems, setVisibleItems] = useState<number>(10);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [showUnsubscribeModal, setShowUnsubscribeModal] = useState(false);
  const [unsubscribeEmail, setUnsubscribeEmail] = useState('');
  const [unsubscribeError, setUnsubscribeError] = useState<string | null>(null);
  const [unsubscribeSuccess, setUnsubscribeSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'rating' | 'thumbsUp'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [minThumbsUp, setMinThumbsUp] = useState<number>(0);

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryName)) {
        newSet.delete(categoryName);
      } else {
        newSet.add(categoryName);
      }
      return newSet;
    });
  };

  const handleScroll = () => {
    if (dropdownRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = dropdownRef.current;
      if (scrollHeight - scrollTop <= clientHeight * 1.5) {
        setVisibleItems(prev => prev + 10);
      }
    }
  };

  useEffect(() => {
    if (dropdownRef.current) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              setVisibleItems(prev => prev + 10);
            }
          });
        },
        { threshold: 0.5 }
      );

      const lastItem = dropdownRef.current.lastElementChild;
      if (lastItem) {
        observerRef.current.observe(lastItem);
      }
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [visibleItems]);

  const filteredCategories = categories.map(category => ({
    ...category,
    products: category.products.filter(product =>
      product.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.products.length > 0);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  useEffect(() => {
    if (!showSubscriptionModal) {
      setShowDropdown(false);
      setSearchTerm('');
    }
  }, [showSubscriptionModal]);

  const handleTopicSelect = (topic: string) => {
    if (!selectedTopics.includes(topic)) {
      setSelectedTopics([...selectedTopics, topic]);
      setSubscriptionForm(prev => ({
        ...prev,
        topics: [...selectedTopics, topic]
      }));
    }
    setSearchTerm('');
    setShowDropdown(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setShowDropdown(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  const removeTopic = (topicToRemove: string) => {
    const newTopics = selectedTopics.filter(topic => topic !== topicToRemove);
    setSelectedTopics(newTopics);
    setSubscriptionForm(prev => ({
      ...prev,
      topics: newTopics
    }));
  };

  const handleSubscriptionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubscriptionError(null);
    setSubscriptionSuccess(null);

    if (!subscriptionForm.email || selectedTopics.length === 0) {
      setSubscriptionError('Please provide an email and select at least one topic');
      return;
    }

    const success = await subscribeToTopics(subscriptionForm.email, selectedTopics);
    if (success) {
      setSubscriptionSuccess('Successfully subscribed!');
      setSubscriptionForm({ email: '', topics: [] });
      setSelectedTopics([]);
      setTimeout(() => {
        setShowSubscriptionModal(false);
        setSubscriptionSuccess(null);
      }, 2000);
    } else {
      setSubscriptionError('Failed to subscribe. Please try again.');
    }
  };

  const fetchAndDisplayReviews = async () => {
    if (!platform || !appName || (platform === 'apple_store' && !appId)) {
      setError('Please fill in all required fields.');
      return;
    }

    setError(null);
    setIsLoading(true);
    const fetchedReviews = await fetchReviews(platform, appName, appId);
    setIsLoading(false);

    if (fetchedReviews.length === 0) {
      setError('No reviews found or failed to fetch reviews.');
    }
    setReviews(fetchedReviews);
    setCurrentPage(1);
  };

  const calculateStats = (): ReviewStats => {
    const stats: ReviewStats = {
      total: reviews.length,
      average: 0,
      byRating: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      sentimentCounts: { positive: 0, neutral: 0, negative: 0 }
    };

    reviews.forEach(review => {
      stats.byRating[review.rating] = (stats.byRating[review.rating] || 0) + 1;

      if (review.rating >= 4) stats.sentimentCounts.positive++;
      else if (review.rating === 3) stats.sentimentCounts.neutral++;
      else stats.sentimentCounts.negative++;
    });

    stats.average = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    return stats;
  };

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const stars = [];
    const sizeClass = size === 'sm' ? 'star-sm' : size === 'lg' ? 'star-lg' : 'star-md';

    for (let i = 1; i <= 5; i++) {
      if (i <= rating) {
        stars.push(<FaStar key={i} className={`star-filled ${sizeClass}`} />);
      } else if (i - 0.5 <= rating) {
        stars.push(<FaStarHalfAlt key={i} className={`star-filled ${sizeClass}`} />);
      } else {
        stars.push(<FaRegStar key={i} className={`star-empty ${sizeClass}`} />);
      }
    }
    return <span className="star-rating">{stars}</span>;
  };

  const getSentimentBadge = (rating: number) => {
    if (rating >= 4) {
      return <Badge bg="success" className="sentiment-badge">Positive</Badge>;
    } else if (rating === 3) {
      return <Badge bg="warning" className="sentiment-badge">Neutral</Badge>;
    } else {
      return <Badge bg="danger" className="sentiment-badge">Negative</Badge>;
    }
  };

  const getFilteredAndSortedReviews = () => {
    let filtered = reviews;

    // Filter by rating
    if (filterRating) {
      filtered = filtered.filter(r => r.rating === filterRating);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(r =>
        r.review.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.user.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by date range
    if (dateRange.start) {
      filtered = filtered.filter(r => new Date(r.date) >= new Date(dateRange.start));
    }
    if (dateRange.end) {
      filtered = filtered.filter(r => new Date(r.date) <= new Date(dateRange.end));
    }

    // Filter by thumbs up
    if (minThumbsUp > 0) {
      filtered = filtered.filter(r => r.thumbsUpCount >= minThumbsUp);
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'rating':
          comparison = a.rating - b.rating;
          break;
        case 'thumbsUp':
          comparison = a.thumbsUpCount - b.thumbsUpCount;
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  };

  const getTotalPages = () => {
    const filtered = getFilteredAndSortedReviews();
    return Math.ceil(filtered.length / reviewsPerPage);
  };

  const downloadExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(getFilteredAndSortedReviews());
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reviews');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, `${appName}_reviews_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const getPagedReviews = () => {
    const filtered = getFilteredAndSortedReviews();
    const startIndex = (currentPage - 1) * reviewsPerPage;
    const endIndex = startIndex + reviewsPerPage;
    return filtered.slice(startIndex, endIndex);
  };

  const handleShowMore = (content: string) => {
    setModalContent(content);
    setShowModal(true);
  };

  const handleSortChange = (newSortBy: 'date' | 'rating' | 'thumbsUp') => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  const renderSortIcon = (column: 'date' | 'rating' | 'thumbsUp') => {
    if (sortBy !== column) return <FaSort className="sort-icon" />;
    return sortOrder === 'asc' ? <FaSortUp className="sort-icon active" /> : <FaSortDown className="sort-icon active" />;
  };

  const renderPagination = () => {
    const totalFilteredPages = getTotalPages();
    const pageButtons = [];
    const maxVisiblePages = 5;

    const startPage = Math.max(currentPage - 2, 1);
    const endPage = Math.min(startPage + maxVisiblePages - 1, totalFilteredPages);

    if (startPage > 1) {
      pageButtons.push(
        <Button key={1} variant="outline-primary" size="sm" onClick={() => setCurrentPage(1)}>
          1
        </Button>
      );
      if (startPage > 2) {
        pageButtons.push(
          <Button key="start-ellipsis" variant="link" size="sm" disabled>
            ...
          </Button>
        );
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pageButtons.push(
        <Button
          key={i}
          variant={currentPage === i ? 'primary' : 'outline-primary'}
          size="sm"
          onClick={() => setCurrentPage(i)}
        >
          {i}
        </Button>
      );
    }

    if (endPage < totalFilteredPages) {
      if (endPage < totalFilteredPages - 1) {
        pageButtons.push(
          <Button key="end-ellipsis" variant="link" size="sm" disabled>
            ...
          </Button>
        );
      }
      pageButtons.push(
        <Button
          key={totalFilteredPages}
          variant="outline-primary"
          size="sm"
          onClick={() => setCurrentPage(totalFilteredPages)}
        >
          {totalFilteredPages}
        </Button>
      );
    }

    return pageButtons;
  };

  const clearAllTopics = () => {
    setSelectedTopics([]);
    setSubscriptionForm(prev => ({
      ...prev,
      topics: []
    }));
  };

  const clearAllFilters = () => {
    setFilterRating(null);
    setSearchQuery('');
    setDateRange({ start: '', end: '' });
    setMinThumbsUp(0);
    setCurrentPage(1);
  };

  const handleUnsubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setUnsubscribeError(null);
    setUnsubscribeSuccess(null);

    if (!unsubscribeEmail) {
      setUnsubscribeError('Please enter your email address');
      return;
    }

    try {
      const response = await fetch(`${config.reviewfinderUrl}/reviewfinder/v1/subscriptions`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: unsubscribeEmail
        }),
      });

      if (!response.ok) {
        throw new Error(`Error unsubscribing: ${response.statusText}`);
      }

      setUnsubscribeSuccess('Successfully unsubscribed!');
      setUnsubscribeEmail('');
      setTimeout(() => {
        setShowUnsubscribeModal(false);
        setUnsubscribeSuccess(null);
      }, 2000);
    } catch (error) {
      console.error(error);
      setUnsubscribeError('Failed to unsubscribe. Please try again.');
    }
  };

  const stats = reviews.length > 0 ? calculateStats() : null;

  return (
    <Container fluid className="review-finder-container">
      {/* Search Form Section */}
      <Card className="search-form-card mb-4">
        <Card.Body>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <h5 className="section-title" style={{ marginBottom: 0 }}>
              <FaFilter className="me-2" />
              Review Search Configuration
            </h5>
            <OverlayTrigger
              placement="right"
              overlay={
                <Tooltip id="review-finder-help">
                  <div style={{ textAlign: 'left' }}>
                    <strong>Review Finder Service</strong>
                    <hr style={{ margin: '8px 0', borderColor: 'rgba(255,255,255,0.3)' }} />
                    <p style={{ margin: '4px 0' }}><strong>What it does:</strong></p>
                    <p style={{ margin: '4px 0', fontSize: '13px' }}>
                      Advanced review analytics platform for monitoring and analyzing product reviews across multiple app stores and platforms
                    </p>
                    <p style={{ margin: '8px 0 4px 0' }}><strong>How to use:</strong></p>
                    <ul style={{ margin: '4px 0', paddingLeft: '20px', fontSize: '13px' }}>
                      <li>Select platform (Google Play, Apple Store, or Reddit)</li>
                      <li>Enter app name and ID (for Apple Store)</li>
                      <li>Apply filters by rating, sentiment, or keywords</li>
                      <li>Click "Search" to fetch and analyze reviews</li>
                      <li>View statistics, sentiment analysis, and charts</li>
                      <li>Export results to Excel for reporting</li>
                      <li>Subscribe to email notifications for new reviews</li>
                    </ul>
                    <p style={{ margin: '8px 0 4px 0' }}><strong>What you get:</strong></p>
                    <ul style={{ margin: '4px 0', paddingLeft: '20px', fontSize: '13px' }}>
                      <li>Multi-platform review aggregation</li>
                      <li>AI-powered sentiment analysis (positive/neutral/negative)</li>
                      <li>Advanced filtering and keyword search</li>
                      <li>Visual analytics with charts and statistics</li>
                      <li>Excel export for reporting and analysis</li>
                      <li>Email subscription for monitoring new reviews</li>
                      <li>Sortable tables with expandable review details</li>
                    </ul>
                  </div>
                </Tooltip>
              }
            >
              <span style={{ cursor: 'help', color: '#4facfe', display: 'flex', alignItems: 'center' }}>
                <FaQuestionCircle size={18} />
              </span>
            </OverlayTrigger>
          </div>
          <Row className="g-3">
            <Col md={3}>
              <Form.Group controlId="platform">
                <Form.Label className="form-label-custom">Platform</Form.Label>
                <Form.Select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="form-control-custom"
                >
                  <option value="">Select Platform</option>
                  <option value="google_play">Google Play Store</option>
                  <option value="apple_store">Apple App Store</option>
                  <option value="reddit">Reddit</option>
                </Form.Select>
              </Form.Group>
            </Col>

            {platform && (
              <Col md={3}>
                <Form.Group controlId="appName">
                  <Form.Label className="form-label-custom">App Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    placeholder="Enter app name"
                    className="form-control-custom"
                  />
                </Form.Group>
              </Col>
            )}

            {platform === 'apple_store' && (
              <Col md={3}>
                <Form.Group controlId="appId">
                  <Form.Label className="form-label-custom">App ID</Form.Label>
                  <Form.Control
                    type="text"
                    value={appId}
                    onChange={(e) => setAppId(e.target.value)}
                    placeholder="Enter app ID"
                    className="form-control-custom"
                  />
                </Form.Group>
              </Col>
            )}

            {platform && (
              <Col md={3}>
                <Form.Group controlId="filterRating">
                  <Form.Label className="form-label-custom">Rating Filter</Form.Label>
                  <Form.Select
                    value={filterRating ?? ''}
                    onChange={(e) =>
                      setFilterRating(e.target.value ? parseInt(e.target.value, 10) : null)
                    }
                    className="form-control-custom"
                  >
                    <option value="">All Ratings</option>
                    <option value="5">⭐⭐⭐⭐⭐ 5 Stars</option>
                    <option value="4">⭐⭐⭐⭐ 4 Stars</option>
                    <option value="3">⭐⭐⭐ 3 Stars</option>
                    <option value="2">⭐⭐ 2 Stars</option>
                    <option value="1">⭐ 1 Star</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            )}
          </Row>

          <Row className="mt-3">
            <Col className="d-flex gap-2 flex-wrap">
              <Button
                variant="primary"
                onClick={fetchAndDisplayReviews}
                disabled={isLoading}
                className="action-button"
              >
                {isLoading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Fetching...
                  </>
                ) : (
                  <>
                    <FaSearch className="me-2" />
                    Fetch Reviews
                  </>
                )}
              </Button>
              <Button
                variant="outline-secondary"
                onClick={() => window.location.reload()}
                className="action-button"
              >
                Reset
              </Button>
              {reviews.length > 0 && (
                <Button
                  variant="success"
                  onClick={downloadExcel}
                  className="action-button"
                >
                  <FaDownload className="me-2" />
                  Download Excel
                </Button>
              )}
              <Button
                variant="info"
                onClick={() => setShowSubscriptionModal(true)}
                className="action-button"
              >
                <FaBell className="me-2" />
                Subscribe
              </Button>
              <Button
                variant="outline-danger"
                onClick={() => setShowUnsubscribeModal(true)}
                className="action-button"
              >
                Unsubscribe
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          <FaExclamationCircle className="me-2" />
          {error}
        </Alert>
      )}

      {/* Statistics Section */}
      {stats && (
        <Row className="mb-4">
          <Col md={3}>
            <Card className="stats-card stats-card-total">
              <Card.Body>
                <div className="stats-content">
                  <div className="stats-icon">
                    <FaChartLine />
                  </div>
                  <div className="stats-info">
                    <div className="stats-value">{stats.total}</div>
                    <div className="stats-label">Total Reviews</div>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="stats-card stats-card-average">
              <Card.Body>
                <div className="stats-content">
                  <div className="stats-icon">
                    <FaStar />
                  </div>
                  <div className="stats-info">
                    <div className="stats-value">{stats.average.toFixed(1)}</div>
                    <div className="stats-label">Average Rating</div>
                    <div className="mt-1">{renderStars(stats.average, 'sm')}</div>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="stats-card stats-card-positive">
              <Card.Body>
                <div className="stats-content">
                  <div className="stats-icon">
                    <FaCheckCircle />
                  </div>
                  <div className="stats-info">
                    <div className="stats-value">{stats.sentimentCounts.positive}</div>
                    <div className="stats-label">Positive Reviews</div>
                    <div className="stats-subtext">
                      {((stats.sentimentCounts.positive / stats.total) * 100).toFixed(0)}% of total
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="stats-card stats-card-negative">
              <Card.Body>
                <div className="stats-content">
                  <div className="stats-icon">
                    <FaExclamationCircle />
                  </div>
                  <div className="stats-info">
                    <div className="stats-value">{stats.sentimentCounts.negative}</div>
                    <div className="stats-label">Negative Reviews</div>
                    <div className="stats-subtext">
                      {((stats.sentimentCounts.negative / stats.total) * 100).toFixed(0)}% of total
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Advanced Filters Section */}
      {reviews.length > 0 && (
        <Card className="filters-card mb-4">
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="section-title mb-0">
                <FaFilter className="me-2" />
                Advanced Filters & Search
              </h5>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={clearAllFilters}
              >
                <FaTimes className="me-1" />
                Clear Filters
              </Button>
            </div>
            <Row className="g-3">
              <Col md={4}>
                <InputGroup>
                  <InputGroup.Text>
                    <FaSearch />
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Search in reviews..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                </InputGroup>
              </Col>
              <Col md={2}>
                <InputGroup>
                  <InputGroup.Text>
                    <FaCalendarAlt />
                  </InputGroup.Text>
                  <Form.Control
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => {
                      setDateRange(prev => ({ ...prev, start: e.target.value }));
                      setCurrentPage(1);
                    }}
                    placeholder="Start date"
                  />
                </InputGroup>
              </Col>
              <Col md={2}>
                <InputGroup>
                  <InputGroup.Text>
                    <FaCalendarAlt />
                  </InputGroup.Text>
                  <Form.Control
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => {
                      setDateRange(prev => ({ ...prev, end: e.target.value }));
                      setCurrentPage(1);
                    }}
                    placeholder="End date"
                  />
                </InputGroup>
              </Col>
              <Col md={2}>
                <InputGroup>
                  <InputGroup.Text>
                    <FaThumbsUp />
                  </InputGroup.Text>
                  <Form.Control
                    type="number"
                    min="0"
                    value={minThumbsUp}
                    onChange={(e) => {
                      setMinThumbsUp(parseInt(e.target.value) || 0);
                      setCurrentPage(1);
                    }}
                    placeholder="Min thumbs up"
                  />
                </InputGroup>
              </Col>
              <Col md={2}>
                <div className="filter-info">
                  Showing {getFilteredAndSortedReviews().length} of {reviews.length} reviews
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}

      {/* Reviews Table Section */}
      {reviews.length > 0 && (
        <Card className="reviews-table-card">
          <Card.Body>
            <h5 className="section-title mb-3">
              <FaChartLine className="me-2" />
              Review Details
            </h5>
            <div className="table-responsive">
              <Table hover className="reviews-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th
                      onClick={() => handleSortChange('rating')}
                      className="sortable-header"
                    >
                      Rating {renderSortIcon('rating')}
                    </th>
                    <th>Sentiment</th>
                    <th>Review Content</th>
                    <th>Version</th>
                    <th
                      onClick={() => handleSortChange('thumbsUp')}
                      className="sortable-header"
                    >
                      <FaThumbsUp /> {renderSortIcon('thumbsUp')}
                    </th>
                    <th
                      onClick={() => handleSortChange('date')}
                      className="sortable-header"
                    >
                      Date {renderSortIcon('date')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {getPagedReviews().map((review, index) => (
                    <tr key={index} className="review-row">
                      <td className="user-cell">
                        <strong>{review.user}</strong>
                      </td>
                      <td className="rating-cell">
                        <div className="rating-display">
                          {renderStars(review.rating, 'sm')}
                          <span className="rating-number">{review.rating}</span>
                        </div>
                      </td>
                      <td className="sentiment-cell">
                        {getSentimentBadge(review.rating)}
                      </td>
                      <td className="content-cell">
                        <div className="review-content">
                          {review.review.length > 150
                            ? `${review.review.slice(0, 150)}...`
                            : review.review}
                          {review.review.length > 150 && (
                            <Button
                              variant="link"
                              size="sm"
                              className="show-more-btn"
                              onClick={() => handleShowMore(review.review)}
                            >
                              Read more
                            </Button>
                          )}
                        </div>
                      </td>
                      <td className="version-cell">
                        <Badge bg="secondary">{review.reviewCreatedVersion || 'N/A'}</Badge>
                      </td>
                      <td className="thumbs-cell">
                        <Badge bg="info" className="thumbs-badge">
                          <FaThumbsUp className="me-1" />
                          {review.thumbsUpCount}
                        </Badge>
                      </td>
                      <td className="date-cell">
                        {new Date(review.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>

            {/* Pagination */}
            {getTotalPages() > 1 && (
              <div className="pagination-container">
                <Button
                  onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                  disabled={currentPage === 1}
                  variant="outline-primary"
                  size="sm"
                >
                  Previous
                </Button>
                <div className="pagination-buttons">
                  {renderPagination()}
                </div>
                <Button
                  onClick={() => setCurrentPage(Math.min(currentPage + 1, getTotalPages()))}
                  disabled={currentPage === getTotalPages()}
                  variant="outline-primary"
                  size="sm"
                >
                  Next
                </Button>
                <div className="pagination-info">
                  Page {currentPage} of {getTotalPages()}
                </div>
              </div>
            )}
          </Card.Body>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && reviews.length === 0 && !error && (
        <Card className="empty-state-card">
          <Card.Body className="text-center py-5">
            <FaSearch className="empty-state-icon" />
            <h3 className="mt-3">No Reviews Yet</h3>
            <p className="text-muted">
              Select a platform and app name to fetch reviews
            </p>
          </Card.Body>
        </Card>
      )}

      {/* Subscription Modal */}
      <Modal show={showSubscriptionModal} onHide={() => setShowSubscriptionModal(false)} centered size="lg">
        <Modal.Header closeButton className="modal-header-custom">
          <Modal.Title>
            <FaBell className="me-2" />
            Subscribe to Review Updates
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubscriptionSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Email Address</Form.Label>
              <Form.Control
                type="email"
                value={subscriptionForm.email}
                onChange={(e) => setSubscriptionForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="your.email@example.com"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Select Products to Monitor</Form.Label>
              <div style={{ position: 'relative' }}>
                <Form.Control
                  type="text"
                  value={searchTerm}
                  onChange={handleInputChange}
                  onClick={() => setShowDropdown(true)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search products..."
                  autoComplete="off"
                />
                {showDropdown && (
                  <div
                    ref={dropdownRef}
                    className="topics-dropdown"
                    onScroll={handleScroll}
                  >
                    {filteredCategories.slice(0, visibleItems).map((category) => (
                      <div key={category.name}>
                        <div
                          className="category-header"
                          onClick={() => toggleCategory(category.name)}
                        >
                          {expandedCategories.has(category.name) ? '▼' : '▶'} {category.name}
                        </div>
                        {expandedCategories.has(category.name) && category.products.map((product) => (
                          <div
                            key={product}
                            data-topic={product}
                            tabIndex={0}
                            className="product-item"
                            onClick={() => handleTopicSelect(product)}
                          >
                            {product}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="mt-3">
                {selectedTopics.length > 0 && (
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="text-muted">Selected: {selectedTopics.length} product(s)</span>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={clearAllTopics}
                    >
                      Clear All
                    </Button>
                  </div>
                )}
                <div className="selected-topics-container">
                  {selectedTopics.map((topic) => (
                    <Badge
                      key={topic}
                      bg="primary"
                      className="selected-topic-badge"
                    >
                      {topic}
                      <FaTimes
                        className="ms-2 remove-topic-icon"
                        onClick={() => removeTopic(topic)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            </Form.Group>
            {subscriptionError && (
              <Alert variant="danger">
                <FaExclamationCircle className="me-2" />
                {subscriptionError}
              </Alert>
            )}
            {subscriptionSuccess && (
              <Alert variant="success">
                <FaCheckCircle className="me-2" />
                {subscriptionSuccess}
              </Alert>
            )}
            <Button variant="primary" type="submit" className="w-100">
              <FaBell className="me-2" />
              Subscribe to Updates
            </Button>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Unsubscribe Modal */}
      <Modal show={showUnsubscribeModal} onHide={() => setShowUnsubscribeModal(false)} centered>
        <Modal.Header closeButton className="modal-header-custom">
          <Modal.Title>Unsubscribe from Updates</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleUnsubscribe}>
            <Form.Group className="mb-3">
              <Form.Label>Email Address</Form.Label>
              <Form.Control
                type="email"
                value={unsubscribeEmail}
                onChange={(e) => setUnsubscribeEmail(e.target.value)}
                placeholder="your.email@example.com"
                required
              />
              <Form.Text className="text-muted">
                Enter the email address you used to subscribe
              </Form.Text>
            </Form.Group>
            {unsubscribeError && (
              <Alert variant="danger">
                <FaExclamationCircle className="me-2" />
                {unsubscribeError}
              </Alert>
            )}
            {unsubscribeSuccess && (
              <Alert variant="success">
                <FaCheckCircle className="me-2" />
                {unsubscribeSuccess}
              </Alert>
            )}
            <div className="d-flex gap-2">
              <Button variant="secondary" onClick={() => setShowUnsubscribeModal(false)} className="flex-fill">
                Cancel
              </Button>
              <Button variant="danger" type="submit" className="flex-fill">
                Unsubscribe
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Review Content Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton className="modal-header-custom">
          <Modal.Title>Full Review Content</Modal.Title>
        </Modal.Header>
        <Modal.Body className="review-modal-body">
          <p className="review-full-content">{modalContent}</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ReviewFinder;
