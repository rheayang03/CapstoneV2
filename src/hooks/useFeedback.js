import { useState, useEffect } from 'react';
import { feedbackService } from '@/api/services/feedbackService';
import { toast } from 'sonner';

export const useFeedback = () => {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await feedbackService.getFeedback();
      setFeedback(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch feedback';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Mark feedback as resolved/unresolved
   * @param {string} id - feedback id
   * @param {boolean|null} force - true = force resolved, false = force unresolved, null = toggle
   */
  const markResolved = async (id, force = null) => {
    try {
      // Call backend
      const updatedFeedback = await feedbackService.markFeedbackResolved(id, force);

      // Adjust resolved state manually if force is given
      let final = updatedFeedback;
      if (force === true) final = { ...updatedFeedback, resolved: true };
      if (force === false) final = { ...updatedFeedback, resolved: false };

      // Update local state
      setFeedback((prev) =>
        prev.map((item) => (item.id === id ? final : item))
      );

      toast.success(
        `Feedback marked as ${final.resolved ? 'resolved' : 'unresolved'}`
      );
      return final;
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to mark feedback as resolved';
      toast.error(errorMessage);
      throw err;
    }
  };

  const updateFeedback = async (id, updates) => {
    try {
      const updatedFeedback = await feedbackService.updateFeedback(id, updates);
      setFeedback((prev) =>
        prev.map((item) => (item.id === id ? updatedFeedback : item))
      );
      toast.success('Feedback updated successfully');
      return updatedFeedback;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to update feedback';
      toast.error(errorMessage);
      throw err;
    }
  };

  const createFeedback = async (feedbackData) => {
    try {
      const newFeedback = await feedbackService.createFeedback(feedbackData);
      setFeedback((prev) => [newFeedback, ...prev]);
      toast.success('Feedback created successfully');
      return newFeedback;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to create feedback';
      toast.error(errorMessage);
      throw err;
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, []);

  return {
    feedback,
    loading,
    error,
    markResolved,
    updateFeedback,
    createFeedback,
    refetch: fetchFeedback,
  };
};
