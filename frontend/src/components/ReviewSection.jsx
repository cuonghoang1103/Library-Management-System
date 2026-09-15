import { useState, useEffect } from 'react';
import { Star, Send, Edit2, Trash2, User } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ReviewSection({ bookId, currentUser }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ratingStats, setRatingStats] = useState({ averageRating: 0, count: 0 });
  const [newReview, setNewReview] = useState({ rating: 0, comment: '' });
  const [editingReview, setEditingReview] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchReviews();
    fetchRatingStats();
  }, [bookId]);

  const fetchReviews = async () => {
    try {
      const res = await fetch(`http://localhost:8080/api/books/${bookId}/reviews?page=0&size=20`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await res.json();
      setReviews(data.data?.content || []);
    } catch (err) {
      console.error('Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  };

  const fetchRatingStats = async () => {
    try {
      const res = await fetch(`http://localhost:8080/api/books/${bookId}/reviews/rating`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await res.json();
      if (data.data) {
        setRatingStats({
          averageRating: data.data.averageRating || 0,
          count: data.data.count || 0
        });
      }
    } catch (err) {
      console.error('Failed to fetch rating stats');
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (newReview.rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    try {
      const res = await fetch(`http://localhost:8080/api/books/${bookId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newReview)
      });

      if (res.ok) {
        toast.success('Review submitted successfully');
        setNewReview({ rating: 0, comment: '' });
        setShowForm(false);
        fetchReviews();
        fetchRatingStats();
      } else {
        const data = await res.json();
        toast.error(data.message || 'Failed to submit review');
      }
    } catch (err) {
      toast.error('Failed to submit review');
    }
  };

  const updateReview = async (reviewId) => {
    try {
      const res = await fetch(`http://localhost:8080/api/reviews/${reviewId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(editingReview)
      });

      if (res.ok) {
        toast.success('Review updated successfully');
        setEditingReview(null);
        fetchReviews();
        fetchRatingStats();
      } else {
        toast.error('Failed to update review');
      }
    } catch (err) {
      toast.error('Failed to update review');
    }
  };

  const deleteReview = async (reviewId) => {
    if (!confirm('Are you sure you want to delete this review?')) return;

    try {
      const res = await fetch(`http://localhost:8080/api/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (res.ok) {
        toast.success('Review deleted successfully');
        fetchReviews();
        fetchRatingStats();
      } else {
        toast.error('Failed to delete review');
      }
    } catch (err) {
      toast.error('Failed to delete review');
    }
  };

  const renderStars = (rating, interactive = false, onRate = null) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => interactive && onRate && onRate(star)}
            className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
            disabled={!interactive}
          >
            <Star
              size={interactive ? 24 : 18}
              className={star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
            />
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 dark:text-white">
                {ratingStats.averageRating > 0 ? ratingStats.averageRating.toFixed(1) : '0.0'}
              </div>
              {renderStars(Math.round(ratingStats.averageRating))}
              <div className="text-sm text-gray-500 mt-1">
                {ratingStats.count} {ratingStats.count === 1 ? 'review' : 'reviews'}
              </div>
            </div>
          </div>

          {currentUser && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="btn-primary"
            >
              {showForm ? 'Cancel' : 'Write a Review'}
            </button>
          )}
        </div>

        {/* Review Form */}
        {showForm && (
          <form onSubmit={submitReview} className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="font-medium text-gray-900 dark:text-white mb-4">Your Review</h3>
            <div className="mb-4">
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">Rating</label>
              {renderStars(newReview.rating, true, (rating) => setNewReview({ ...newReview, rating }))}
            </div>
            <div className="mb-4">
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">Comment (optional)</label>
              <textarea
                value={newReview.comment}
                onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                className="input w-full h-24 resize-none"
                placeholder="Share your thoughts about this book..."
              />
            </div>
            <button type="submit" className="btn-primary flex items-center gap-2">
              <Send size={16} />
              Submit Review
            </button>
          </form>
        )}
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-white">
          {reviews.length} {reviews.length === 1 ? 'Review' : 'Reviews'}
        </h3>

        {reviews.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center border border-gray-200 dark:border-gray-700">
            <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No reviews yet. Be the first to review!</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              {editingReview?.id === review.id ? (
                // Edit Mode
                <div className="space-y-4">
                  {renderStars(editingReview.rating, true, (rating) => setEditingReview({ ...editingReview, rating }))}
                  <textarea
                    value={editingReview.comment}
                    onChange={(e) => setEditingReview({ ...editingReview, comment: e.target.value })}
                    className="input w-full h-24 resize-none"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => updateReview(review.id)} className="btn-primary">
                      Save
                    </button>
                    <button onClick={() => setEditingReview(null)} className="btn-secondary">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                // Display Mode
                <>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <User size={20} className="text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{review.userName}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString()}
                          {review.updatedAt && ' (edited)'}
                        </p>
                      </div>
                    </div>
                    {renderStars(review.rating)}
                  </div>

                  {review.comment && (
                    <p className="text-gray-700 dark:text-gray-300">{review.comment}</p>
                  )}

                  {/* Actions for own reviews */}
                  {currentUser && currentUser.id === review.userId && (
                    <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                      <button
                        onClick={() => setEditingReview({ id: review.id, rating: review.rating, comment: review.comment || '' })}
                        className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <Edit2 size={14} /> Edit
                      </button>
                      <button
                        onClick={() => deleteReview(review.id)}
                        className="text-sm text-red-600 hover:underline flex items-center gap-1"
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
