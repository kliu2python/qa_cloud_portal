import React, { useState } from 'react';
import { Button, Container, Row, Table, Col, Form, Modal } from 'react-bootstrap';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import '../styles/ReviewFinder.css';
import config from '../config/config';

interface Review {
  user: string;
  rating: number;
  review: string;
  reviewCreatedVersion: string;
  thumbsUpCount: number;
  date: string;
  isExpanded?: boolean; // To manage expanded state of reviews
}

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

const ReviewFinder: React.FC = () => {
  const [appName, setAppName] = useState('');
  const [appId, setAppId] = useState('');
  const [platform, setPlatform] = useState('');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState(''); // To store content for popup
  const reviewsPerPage = 10;

  const fetchAndDisplayReviews = async () => {
    if (!platform || !appName || (platform === 'App Store' && !appId)) {
      setError('Please fill in all required fields.');
      return;
    }

    setError(null);
    const fetchedReviews = await fetchReviews(platform, appName, appId);
    if (fetchedReviews.length === 0) {
      setError('No reviews found or failed to fetch reviews.');
    }
    setReviews(fetchedReviews);
    setCurrentPage(1);
  };

  const getTotalPages = () => {
    const filteredReviews = filterRating
      ? reviews.filter((review) => review.rating === filterRating)
      : reviews;
    return Math.ceil(filteredReviews.length / reviewsPerPage);
  };

  const downloadExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(reviews);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reviews');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, `${appName}_reviews.xlsx`);
  };

  const getPagedReviews = () => {
    const filteredReviews = filterRating
      ? reviews.filter((review) => review.rating === filterRating)
      : reviews;
    const startIndex = (currentPage - 1) * reviewsPerPage;
    const endIndex = startIndex + reviewsPerPage;
    return filteredReviews.slice(startIndex, endIndex);
  };

  const toggleExpand = (reviewIndex: number) => {
    const globalIndex = (currentPage - 1) * reviewsPerPage + reviewIndex; // Calculate the global index
    const updatedReviews = [...reviews];
    updatedReviews[globalIndex].isExpanded = !updatedReviews[globalIndex].isExpanded;
    setReviews(updatedReviews);
  };

  const handleShowMore = (content: string) => {
    setModalContent(content);
    setShowModal(true);
  };

  const renderPagination = () => {
    const totalFilteredPages = getTotalPages(); // Dynamically calculate total pages
    const pageButtons = [];
    const maxVisiblePages = 3;

    const startPage = Math.max(currentPage - 1, 1);
    const endPage = Math.min(startPage + maxVisiblePages - 1, totalFilteredPages);

    if (startPage > 1) {
      pageButtons.push(
        <Button key="start-ellipsis" variant="link" disabled>
          ...
        </Button>
      );
    }

    for (let i = startPage; i <= endPage; i++) {
      pageButtons.push(
        <Button
          key={i}
          variant={currentPage === i ? 'primary' : 'link'}
          onClick={() => setCurrentPage(i)}
        >
          {i}
        </Button>
      );
    }

    if (endPage < totalFilteredPages) {
      pageButtons.push(
        <Button key="end-ellipsis" variant="link" disabled>
          ...
        </Button>
      );
    }

    return pageButtons;
  };

  return (
    <Container>
      <Row className="mb-10">
        <Col xs={2}>
          <Form.Group controlId="platform">
            <Form.Label>Platform</Form.Label>
            <Form.Control
              as="select"
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
            >
              <option value="">Select Platform</option>
              <option value="google_play">Google Play</option>
              <option value="apple_store">App Store</option>
            </Form.Control>
          </Form.Group>
        </Col>

        {platform === 'google_play' && (
          <Col xs={2}>
            <Form.Group controlId="appName">
              <Form.Label>App Name</Form.Label>
              <Form.Control
                type="text"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
              />
            </Form.Group>
          </Col>
        )}

        {platform === 'apple_store' && (
          <>
            <Col xs={2}>
              <Form.Group controlId="appName">
                <Form.Label>App Name</Form.Label>
                <Form.Control
                  type="text"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col xs={2}>
              <Form.Group controlId="appId">
                <Form.Label>App ID</Form.Label>
                <Form.Control
                  type="text"
                  value={appId}
                  onChange={(e) => setAppId(e.target.value)}
                />
              </Form.Group>
            </Col>
          </>
        )}

        {platform && (
          <Col xs={2}>
            <Form.Group controlId="filterRating">
              <Form.Label>Filter by Rating</Form.Label>
              <Form.Control
                as="select"
                value={filterRating ?? ''}
                onChange={(e) =>
                  setFilterRating(e.target.value ? parseInt(e.target.value, 10) : null)
                }
              >
                <option value="">All Ratings</option>
                <option value="1">1 Star</option>
                <option value="2">2 Stars</option>
                <option value="3">3 Stars</option>
                <option value="4">4 Stars</option>
                <option value="5">5 Stars</option>
              </Form.Control>
            </Form.Group>
          </Col>
        )}
      </Row>

      <Row className="mb-4">
        <Col className="text-center">
          <Button variant="primary" onClick={fetchAndDisplayReviews} className="me-3">
            Fetch Reviews
          </Button>
          <Button variant="secondary" onClick={() => window.location.reload()} className="me-3">
            Refresh
          </Button>
          {reviews.length > 0 && (
            <Button variant="success" onClick={downloadExcel}>
              Download
            </Button>
          )}
        </Col>
      </Row>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {reviews.length > 0 && (
        <div>
          <h2>Reviews</h2>
          <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Username</th>
              <th>Rating</th>
              <th>Content</th>
              <th>Review Version</th>
              <th>Thumbs Up Count</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {getPagedReviews().map((review, index) => (
              <tr key={index}>
                <td>{review.user}</td>
                <td>{review.rating}</td>
                <td>{review.review.length > 50
                    ? `${review.review.slice(0, 50)}...`
                    : review.review}
                  {review.review.length > 50 && (
                    <span
                      style={{
                        cursor: 'pointer',
                        color: 'blue',
                        textDecoration: 'underline',
                        marginLeft: '5px',
                      }}
                      onClick={() => handleShowMore(review.review)}
                    >
                      Show More
                    </span>
                  )}</td>
                <td>{review.reviewCreatedVersion}</td>
                <td>{review.thumbsUpCount}</td>
                <td>{review.date}</td>
              </tr>
            ))}
          </tbody>
        </Table>
          <div className="d-flex justify-content-center mt-3">
            <Button
              onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
              disabled={currentPage === 1}
              variant="secondary"
              style={{ marginRight: '5px' }}
            >
              Previous
            </Button>
            {renderPagination()}
            <Button
              onClick={() => setCurrentPage(Math.min(currentPage + 1, getTotalPages()))}
              disabled={currentPage === getTotalPages()}
              variant="secondary"
              style={{ marginLeft: '5px' }}
            >
              Next
            </Button>
            <div style={{ marginLeft: '15px', alignSelf: 'center' }}>
              Page {currentPage} of {getTotalPages()}
            </div>
          </div>
        </div>
      )}

{/* Modal for Showing Full Content */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Full Review Content</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ backgroundColor: 'rgba(255,255,255,0.8)' }}>
          <p>{modalContent}</p>
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
