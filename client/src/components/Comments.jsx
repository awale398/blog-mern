import { useState, useContext } from 'react';
import { UserContext } from '../UserContext';
import { formatISO9075 } from 'date-fns';

export default function Comments({ comments: initialComments, postId }) {
  const { userInfo } = useContext(UserContext);
  const [comments, setComments] = useState(initialComments || []);
  const [newComment, setNewComment] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function addComment(ev) {
    ev.preventDefault();
    setError('');
    
    // Check for empty comment
    if (!newComment.trim()) {
      setError('Please write something before submitting');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('http://localhost:5000/comment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newComment,
          postId,
        }),
        credentials: 'include',
      });

      if (response.ok) {
        const comment = await response.json();
        setComments(prev => [comment, ...prev]);
        setNewComment('');
        setError('');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to add comment. Please try again.');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      setError('Something went wrong. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="comments">
      <h3>Comments</h3>
      
      {userInfo?.id && (
        <form className="comment-form" onSubmit={addComment}>
          <textarea
            value={newComment}
            onChange={ev => {
              setNewComment(ev.target.value);
              if (error) setError('');
            }}
            placeholder="Add a comment..."
            disabled={isSubmitting}
            className={error ? 'error' : ''}
          />
          {error && <div className="error-message">{error}</div>}
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
        </form>
      )}

      <div className="comment-list">
        {comments.map(comment => (
          <div key={comment._id} className="comment">
            <div className="comment-header">
              <span className="comment-author">@{comment.author.username}</span>
              <time>{formatISO9075(new Date(comment.createdAt))}</time>
            </div>
            <div className="comment-content">{comment.content}</div>
          </div>
        ))}
        {comments.length === 0 && (
          <div className="no-comments">No comments yet. Be the first to comment!</div>
        )}
      </div>
    </div>
  );
} 