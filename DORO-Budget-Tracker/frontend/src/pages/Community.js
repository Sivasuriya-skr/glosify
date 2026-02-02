import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import '../styles/Community.css';

// Helper function to get user-friendly error messages
const getErrorMessage = (error, defaultMessage) => {
  const backendMessage = error.response?.data?.message;
  
  const errorMap = {
    'Connection refused': 'Unable to connect to server. Please check your internet connection.',
    'Network Error': 'Unable to connect to server. Please check your internet connection.',
    'timeout': 'Request timed out. Please try again.',
    '401': 'Your session has expired. Please log in again.',
    '403': 'You don\'t have permission to perform this action.',
    '500': 'Server error. Please try again later.',
  };
  
  if (backendMessage) {
    for (const [key, value] of Object.entries(errorMap)) {
      if (backendMessage.toLowerCase().includes(key.toLowerCase())) {
        return value;
      }
    }
    return backendMessage;
  }
  
  return defaultMessage;
};

export default function Community() {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    content: ''
  });

  const categories = [
    'Budgeting Tips',
    'Saving Strategies',
    'Investment Advice',
    'Expense Management',
    'Financial Goals',
    'Debt Management',
    'General Discussion'
  ];

  // Load posts from backend on mount
  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/posts');
      setPosts(response.data);
      // Save to localStorage as backup
      localStorage.setItem('bw_community_posts', JSON.stringify(response.data));
    } catch (error) {
      console.error('Error loading posts from backend:', error);
      // Try to load from localStorage as fallback
      const savedPosts = localStorage.getItem('bw_community_posts');
      if (savedPosts) {
        try {
          setPosts(JSON.parse(savedPosts));
        } catch (e) {
          console.error('Error parsing saved posts:', e);
          setPosts([]);
        }
      } else {
        setPosts([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!formData.title.trim()) {
      setMessage({ type: 'error', text: 'Post title cannot be empty' });
      return;
    }
    if (!formData.category) {
      setMessage({ type: 'error', text: 'Please select a category' });
      return;
    }
    if (!formData.content.trim()) {
      setMessage({ type: 'error', text: 'Post content cannot be empty' });
      return;
    }

    try {
      setLoading(true);
      setMessage({ type: '', text: '' });
      const response = await axios.post('/api/posts', formData);
      setPosts([response.data, ...posts]);
      setFormData({ title: '', category: '', content: '' });
      setShowNewPostModal(false);
      localStorage.setItem('bw_community_posts', JSON.stringify([response.data, ...posts]));
      setMessage({ type: 'success', text: 'Post created successfully!' });
    } catch (error) {
      console.error('Error creating post:', error);
      // Fallback to localStorage
      const newPost = {
        id: Date.now(),
        author: user?.username || 'Anonymous',
        authorAvatar: user?.username ? user.username[0].toUpperCase() : 'A',
        title: formData.title,
        category: formData.category,
        content: formData.content,
        createdAt: new Date().toISOString(),
        comments: [],
        likes: 0,
        isLikedByUser: false
      };
      const updatedPosts = [newPost, ...posts];
      setPosts(updatedPosts);
      localStorage.setItem('bw_community_posts', JSON.stringify(updatedPosts));
      setFormData({ title: '', category: '', content: '' });
      setShowNewPostModal(false);
      setMessage({ type: 'success', text: 'Post created (offline mode)' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedPost) {
      setMessage({ type: 'error', text: 'Comment cannot be empty' });
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`/api/posts/${selectedPost.id}/comments`, {
        content: newComment
      });

      // Update the selected post with the new comment
      setSelectedPost({
        ...selectedPost,
        comments: [response.data, ...(selectedPost.comments || [])]
      });

      // Update the posts list
      setPosts(posts.map(p => 
        p.id === selectedPost.id 
          ? { ...p, comments: [response.data, ...(p.comments || [])] }
          : p
      ));

      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
      setMessage({ type: 'error', text: getErrorMessage(error, 'Unable to add comment. Please try again.') });
    } finally {
      setLoading(false);
    }
  };

  const handleLikePost = async (postId) => {
    try {
      const response = await axios.post(`/api/posts/${postId}/like`);
      
      // Update posts list
      const updatedPosts = posts.map(p => 
        p.id === postId ? response.data : p
      );
      setPosts(updatedPosts);

      // Update selected post if it's the liked one
      if (selectedPost?.id === postId) {
        setSelectedPost(response.data);
      }
    } catch (error) {
      console.error('Error liking post:', error);
      setMessage({ type: 'error', text: getErrorMessage(error, 'Unable to like post. Please try again.') });
    }
  };

  const handleDeletePost = async (postId) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await axios.delete(`/api/posts/${postId}`);
        setPosts(posts.filter(p => p.id !== postId));
        if (selectedPost?.id === postId) {
          setSelectedPost(null);
        }
        setMessage({ type: 'success', text: 'Post deleted successfully!' });
      } catch (error) {
        console.error('Error deleting post:', error);
        setMessage({ type: 'error', text: getErrorMessage(error, 'Unable to delete post. Please try again.') });
      }
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      try {
        await axios.delete(`/api/posts/comments/${commentId}`);
        
        // Update selected post
        if (selectedPost) {
          const updatedComments = selectedPost.comments.filter(c => c.id !== commentId);
          setSelectedPost({ ...selectedPost, comments: updatedComments });
          
          // Update posts list
          setPosts(posts.map(p =>
            p.id === selectedPost.id
              ? { ...p, comments: updatedComments }
              : p
          ));
        }
        setMessage({ type: 'success', text: 'Comment deleted successfully!' });
      } catch (error) {
        console.error('Error deleting comment:', error);
        setMessage({ type: 'error', text: 'Failed to delete comment. Please try again.' });
      }
    }
  };

  const bgColor = isDarkMode ? '#0f172a' : '#f8fafb';
  const cardBg = isDarkMode ? '#1e293b' : '#ffffff';
  const textColor = isDarkMode ? '#f1f5f9' : '#111827';
  const subtleText = isDarkMode ? '#94a3b8' : '#6b7280';
  const borderColor = isDarkMode ? '#334155' : '#e5e7eb';
  const primaryColor = '#2563eb';
  const buttonHover = isDarkMode ? '#1e3a8a' : '#1d4ed8';

  return (
    <div className="community-container">
      {/* Message notification */}
      {message.text && (
        <div style={{
          padding: '16px 20px',
          marginBottom: '20px',
          borderRadius: '12px',
          background: message.type === 'success' 
            ? (isDarkMode ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.1)')
            : (isDarkMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)'),
          border: `1px solid ${message.type === 'success' ? '#10b981' : '#ef4444'}`,
          color: message.type === 'success' ? '#10b981' : '#ef4444',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          animation: 'fadeIn 0.3s ease-out',
          maxWidth: '1400px',
          margin: '0 auto 20px auto'
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {message.type === 'success' ? '✅' : '⚠️'} {message.text}
          </span>
          <button
            onClick={() => setMessage({ type: '', text: '' })}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'inherit',
              cursor: 'pointer',
              fontSize: '18px',
              padding: '0 4px'
            }}
          >
            ×
          </button>
        </div>
      )}
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div className="page-title-card" style={{
          background: isDarkMode 
            ? 'linear-gradient(135deg, #2e1065 0%, #3b0764 25%, #4c1d95 50%, #5b21b6 75%, #6d28d9 100%)'
            : 'linear-gradient(135deg, #e9d5ff 0%, #d8b4fe 25%, #c4b5fd 50%, #a78bfa 75%, #8b5cf6 100%)',
          boxShadow: isDarkMode 
            ? '0 10px 40px rgba(91, 33, 182, 0.3), 0 0 60px rgba(139, 92, 246, 0.1)'
            : '0 8px 32px rgba(139, 92, 246, 0.2), 0 0 60px rgba(167, 139, 250, 0.15)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          {/* Animated Glowing Orbs */}
          <div style={{
            position: 'absolute',
            top: '-60px',
            right: '-60px',
            width: '200px',
            height: '200px',
            background: isDarkMode 
              ? 'radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, rgba(109, 40, 217, 0.2) 40%, transparent 70%)'
              : 'radial-gradient(circle, rgba(192, 132, 252, 0.5) 0%, rgba(167, 139, 250, 0.3) 40%, transparent 70%)',
            borderRadius: '50%',
            animation: 'pulse 3s ease-in-out infinite',
            filter: 'blur(20px)'
          }} />
          <div style={{
            position: 'absolute',
            bottom: '-40px',
            left: '10%',
            width: '150px',
            height: '150px',
            background: isDarkMode 
              ? 'radial-gradient(circle, rgba(124, 58, 237, 0.3) 0%, rgba(139, 92, 246, 0.15) 50%, transparent 70%)'
              : 'radial-gradient(circle, rgba(216, 180, 254, 0.6) 0%, rgba(196, 181, 253, 0.3) 50%, transparent 70%)',
            borderRadius: '50%',
            animation: 'pulse 4s ease-in-out infinite 1s',
            filter: 'blur(15px)'
          }} />
          <div style={{
            position: 'absolute',
            top: '20%',
            left: '60%',
            width: '100px',
            height: '100px',
            background: isDarkMode 
              ? 'radial-gradient(circle, rgba(167, 139, 250, 0.25) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(233, 213, 255, 0.7) 0%, transparent 70%)',
            borderRadius: '50%',
            animation: 'pulse 5s ease-in-out infinite 0.5s',
            filter: 'blur(10px)'
          }} />
          {/* Sparkle effects */}
          <div style={{
            position: 'absolute',
            top: '15%',
            right: '20%',
            width: '8px',
            height: '8px',
            background: 'white',
            borderRadius: '50%',
            boxShadow: '0 0 10px 2px rgba(255,255,255,0.8)',
            animation: 'pulse 2s ease-in-out infinite'
          }} />
          <div style={{
            position: 'absolute',
            bottom: '25%',
            right: '35%',
            width: '6px',
            height: '6px',
            background: 'white',
            borderRadius: '50%',
            boxShadow: '0 0 8px 2px rgba(255,255,255,0.6)',
            animation: 'pulse 2.5s ease-in-out infinite 0.3s'
          }} />
          
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h1 style={{
              fontSize: '28px',
              fontWeight: '700',
              marginBottom: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{
                background: isDarkMode 
                  ? 'linear-gradient(135deg, #ffffff 0%, #e9d5ff 50%, #d8b4fe 100%)'
                  : 'linear-gradient(135deg, #581c87 0%, #6b21a8 50%, #7c3aed 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>Community Forum</span>
              <span style={{ WebkitTextFillColor: 'initial' }}>💬</span>
            </h1>
            <p style={{ color: isDarkMode ? 'rgba(255,255,255,0.85)' : 'rgba(88, 28, 135, 0.8)', fontSize: '15px', margin: 0, fontWeight: '500' }}>Share tips and learn from others</p>
          </div>
          <button
            onClick={() => setShowNewPostModal(true)}
            disabled={loading}
            style={{
              padding: '10px 20px',
              background: isDarkMode ? '#334155' : '#ffffff',
              border: isDarkMode ? '1px solid #475569' : '1px solid #e2e8f0',
              borderRadius: '10px',
              color: isDarkMode ? '#e2e8f0' : '#1e293b',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              opacity: loading ? 0.6 : 1,
              position: 'relative',
              zIndex: 1,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
            }}
          >
            + New Post
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: selectedPost ? '1fr 1fr' : '1fr', gap: '24px' }}>
          {/* Posts Feed */}
          <div>
            {loading && posts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: subtleText }}>
                Loading posts...
              </div>
            ) : posts.length === 0 ? (
              <div
                style={{
                  background: cardBg,
                  padding: '40px',
                  borderRadius: '12px',
                  textAlign: 'center',
                  border: `1px solid ${borderColor}`
                }}
              >
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
                <p style={{ color: subtleText }}>No posts yet. Be the first to share!</p>
              </div>
            ) : (
              posts.map(post => (
                <div
                  key={post.id}
                  onClick={() => setSelectedPost(post)}
                  style={{
                    background: cardBg,
                    padding: '20px',
                    borderRadius: '12px',
                    marginBottom: '16px',
                    border: `1px solid ${borderColor}`,
                    cursor: 'pointer',
                    transition: '0.3s',
                    boxShadow: selectedPost?.id === post.id ? `0 0 0 2px ${primaryColor}` : 'none'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = isDarkMode ? '#334155' : '#f3f4f6'}
                  onMouseLeave={(e) => e.currentTarget.style.background = cardBg}
                >
                  {/* Post Header */}
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px', gap: '12px' }}>
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: primaryColor,
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        fontWeight: '600'
                      }}
                    >
                      {post.authorAvatar}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: textColor, fontWeight: '600', fontSize: '14px' }}>{post.author}</div>
                      <div style={{ color: subtleText, fontSize: '12px' }}>{new Date(post.createdAt).toLocaleString()}</div>
                    </div>
                  </div>

                  {/* Post Title and Category */}
                  <h3 style={{ color: textColor, marginBottom: '8px', fontSize: '16px' }}>{post.title}</h3>
                  <div style={{ display: 'inline-block', background: primaryColor, color: 'white', padding: '4px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', marginBottom: '12px' }}>
                    {post.category}
                  </div>

                  {/* Post Content */}
                  <p style={{ color: textColor, marginBottom: '16px', lineHeight: '1.6' }}>{post.content}</p>

                  {/* Post Stats */}
                  <div
                    style={{
                      display: 'flex',
                      gap: '20px',
                      paddingTop: '12px',
                      borderTop: `1px solid ${borderColor}`,
                      color: subtleText,
                      fontSize: '13px'
                    }}
                  >
                    <span>❤️ {post.likes || 0} Likes</span>
                    <span>💬 {post.comments?.length || 0} Comments</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Post Details Panel */}
          {selectedPost && (
            <div
              style={{
                background: cardBg,
                padding: '20px',
                borderRadius: '12px',
                border: `1px solid ${borderColor}`,
                maxHeight: '600px',
                overflowY: 'auto'
              }}
            >
              {/* Post Header */}
              <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: `1px solid ${borderColor}` }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px', gap: '12px' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: primaryColor,
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}
                  >
                    {selectedPost.authorAvatar}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: textColor, fontWeight: '600' }}>{selectedPost.author}</div>
                    <div style={{ color: subtleText, fontSize: '12px' }}>{new Date(selectedPost.createdAt).toLocaleString()}</div>
                  </div>
                  {selectedPost.author === user?.username && (
                    <button
                      onClick={() => handleDeletePost(selectedPost.id)}
                      disabled={loading}
                      style={{
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '12px',
                        opacity: loading ? 0.6 : 1
                      }}
                    >
                      Delete
                    </button>
                  )}
                </div>
                <h2 style={{ color: textColor, marginBottom: '12px', fontSize: '20px' }}>{selectedPost.title}</h2>
                <div style={{ display: 'inline-block', background: primaryColor, color: 'white', padding: '4px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', marginBottom: '16px' }}>
                  {selectedPost.category}
                </div>
                <p style={{ color: textColor, lineHeight: '1.6' }}>{selectedPost.content}</p>

                {/* Like Button */}
                <div style={{ marginTop: '16px' }}>
                  <button
                    onClick={() => handleLikePost(selectedPost.id)}
                    disabled={loading}
                    style={{
                      background: selectedPost.isLikedByUser ? primaryColor : isDarkMode ? '#334155' : '#e5e7eb',
                      color: selectedPost.isLikedByUser ? 'white' : textColor,
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                      transition: '0.3s',
                      opacity: loading ? 0.6 : 1
                    }}
                    onMouseEnter={(e) =>
                      !loading && (e.currentTarget.style.background = selectedPost.isLikedByUser
                        ? buttonHover
                        : isDarkMode ? '#475569' : '#d1d5db')
                    }
                    onMouseLeave={(e) =>
                      !loading && (e.currentTarget.style.background = selectedPost.isLikedByUser
                        ? primaryColor
                        : isDarkMode ? '#334155' : '#e5e7eb')
                    }
                  >
                    ❤️ {selectedPost.likes || 0} Likes
                  </button>
                </div>
              </div>

              {/* Comments Section */}
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ color: textColor, marginBottom: '16px', fontSize: '16px' }}>Comments</h3>

                {/* Add Comment Form */}
                <div style={{ marginBottom: '20px' }}>
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: `1px solid ${borderColor}`,
                      background: isDarkMode ? '#0f172a' : '#ffffff',
                      color: textColor,
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      resize: 'vertical',
                      minHeight: '80px',
                      marginBottom: '10px',
                      opacity: loading ? 0.6 : 1
                    }}
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={loading}
                    style={{
                      background: primaryColor,
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontSize: '13px',
                      fontWeight: '600',
                      width: '100%',
                      transition: '0.3s',
                      opacity: loading ? 0.6 : 1
                    }}
                    onMouseEnter={(e) => !loading && (e.target.style.background = buttonHover)}
                    onMouseLeave={(e) => !loading && (e.target.style.background = primaryColor)}
                  >
                    Post Comment
                  </button>
                </div>

                {/* Comments List */}
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {!selectedPost.comments || selectedPost.comments.length === 0 ? (
                    <p style={{ color: subtleText, fontSize: '13px' }}>No comments yet</p>
                  ) : (
                    selectedPost.comments.map(comment => (
                      <div
                        key={comment.id}
                        style={{
                          background: isDarkMode ? '#0f172a' : '#f8fafb',
                          padding: '12px',
                          borderRadius: '8px',
                          marginBottom: '12px',
                          border: `1px solid ${borderColor}`
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                background: primaryColor,
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '12px',
                                fontWeight: '600'
                              }}
                            >
                              {comment.authorAvatar}
                            </div>
                            <div>
                              <div style={{ color: textColor, fontWeight: '600', fontSize: '13px' }}>
                                {comment.author}
                              </div>
                              <div style={{ color: subtleText, fontSize: '11px' }}>{new Date(comment.createdAt).toLocaleString()}</div>
                            </div>
                          </div>
                          {comment.author === user?.username && (
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              disabled={loading}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#ef4444',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                fontSize: '12px',
                                opacity: loading ? 0.6 : 1
                              }}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                        <p style={{ color: textColor, fontSize: '13px', margin: '0', lineHeight: '1.5' }}>
                          {comment.content}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Post Modal */}
      {showNewPostModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setShowNewPostModal(false)}
        >
          <div
            style={{
              background: cardBg,
              padding: '28px',
              borderRadius: '12px',
              width: '90%',
              maxWidth: '600px',
              border: `1px solid ${borderColor}`,
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ color: textColor, marginBottom: '24px', fontSize: '20px' }}>Create a New Post</h2>

            {/* Title Field */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ color: textColor, fontWeight: '600', fontSize: '14px', display: 'block', marginBottom: '8px' }}>Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="What's your post about?"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: `1px solid ${borderColor}`,
                  background: isDarkMode ? '#0f172a' : '#ffffff',
                  color: textColor,
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Category Field */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ color: textColor, fontWeight: '600', fontSize: '14px', display: 'block', marginBottom: '8px' }}>Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: `1px solid ${borderColor}`,
                  background: isDarkMode ? '#0f172a' : '#ffffff',
                  color: textColor,
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                  cursor: 'pointer'
                }}
              >
                <option value="">Select a category</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Content Field */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ color: textColor, fontWeight: '600', fontSize: '14px', display: 'block', marginBottom: '8px' }}>Content</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Share your thoughts..."
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: `1px solid ${borderColor}`,
                  background: isDarkMode ? '#0f172a' : '#ffffff',
                  color: textColor,
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  minHeight: '140px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowNewPostModal(false);
                  setFormData({ title: '', category: '', content: '' });
                }}
                style={{
                  background: isDarkMode ? '#334155' : '#e5e7eb',
                  color: textColor,
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: '0.3s'
                }}
                onMouseEnter={(e) => e.target.style.background = isDarkMode ? '#475569' : '#d1d5db'}
                onMouseLeave={(e) => e.target.style.background = isDarkMode ? '#334155' : '#e5e7eb'}
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePost}
                style={{
                  background: primaryColor,
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: '0.3s'
                }}
                onMouseEnter={(e) => e.target.style.background = buttonHover}
                onMouseLeave={(e) => e.target.style.background = primaryColor}
              >
                Post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
