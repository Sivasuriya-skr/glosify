package com.budgetwise.service;

import com.budgetwise.dto.PostRequest;
import com.budgetwise.dto.PostResponse;
import com.budgetwise.dto.CommentRequest;
import com.budgetwise.dto.CommentResponse;
import com.budgetwise.model.Post;
import com.budgetwise.model.Comment;
import com.budgetwise.model.Like;
import com.budgetwise.model.User;
import com.budgetwise.repository.PostRepository;
import com.budgetwise.repository.CommentRepository;
import com.budgetwise.repository.LikeRepository;
import com.budgetwise.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final LikeRepository likeRepository;
    private final UserRepository userRepository;

    private User getCurrentUser() {
        String identifier = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(identifier)
                .or(() -> userRepository.findByEmail(identifier))
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    // Post Operations
    public PostResponse createPost(PostRequest request) {
        User user = getCurrentUser();

        Post post = Post.builder()
                .title(request.getTitle())
                .category(request.getCategory())
                .content(request.getContent())
                .user(user)
                .createdAt(LocalDateTime.now())
                .likes(0)
                .build();

        post = postRepository.save(post);
        return mapPostToResponse(post);
    }

    public List<PostResponse> getAllPosts() {
        User currentUser = getCurrentUser();
        List<Post> posts = postRepository.findAllByOrderByCreatedAtDesc();
        return posts.stream()
                .map(post -> mapPostToResponseWithUserContext(post, currentUser))
                .collect(Collectors.toList());
    }

    public PostResponse getPostById(Long id) {
        User currentUser = getCurrentUser();
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        return mapPostToResponseWithUserContext(post, currentUser);
    }

    public PostResponse updatePost(Long id, PostRequest request) {
        User user = getCurrentUser();
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Post not found. It may have been deleted."));

        if (!post.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("You can only edit your own posts.");
        }

        post.setTitle(request.getTitle());
        post.setCategory(request.getCategory());
        post.setContent(request.getContent());
        post.setUpdatedAt(LocalDateTime.now());

        post = postRepository.save(post);
        return mapPostToResponse(post);
    }

    public void deletePost(Long id) {
        User user = getCurrentUser();
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Post not found. It may have been deleted."));

        if (!post.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("You can only delete your own posts.");
        }

        postRepository.delete(post);
    }

    // Comment Operations
    public CommentResponse addComment(Long postId, CommentRequest request) {
        User user = getCurrentUser();
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        Comment comment = Comment.builder()
                .content(request.getContent())
                .post(post)
                .user(user)
                .createdAt(LocalDateTime.now())
                .likes(0)
                .build();

        comment = commentRepository.save(comment);
        return mapCommentToResponse(comment);
    }

    public void deleteComment(Long commentId) {
        User user = getCurrentUser();
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found. It may have been deleted."));

        if (!comment.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("You can only delete your own comments.");
        }

        commentRepository.delete(comment);
    }

    // Like Operations
    public PostResponse toggleLike(Long postId) {
        User user = getCurrentUser();
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        var existingLike = likeRepository.findByPostIdAndUserId(postId, user.getId());

        if (existingLike.isPresent()) {
            likeRepository.delete(existingLike.get());
            post.setLikes(Math.max(0, post.getLikes() - 1));
        } else {
            Like like = Like.builder()
                    .post(post)
                    .user(user)
                    .build();
            likeRepository.save(like);
            post.setLikes(post.getLikes() + 1);
        }

        post = postRepository.save(post);
        return mapPostToResponseWithUserContext(post, user);
    }

    // Mapping Methods
    private PostResponse mapPostToResponse(Post post) {
        return PostResponse.builder()
                .id(post.getId())
                .title(post.getTitle())
                .category(post.getCategory())
                .content(post.getContent())
                .author(post.getUser().getUsername())
                .authorAvatar(String.valueOf(post.getUser().getUsername().charAt(0)).toUpperCase())
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .likes(post.getLikes())
                .comments(post.getComments() != null ? 
                    post.getComments().stream()
                        .map(this::mapCommentToResponse)
                        .collect(Collectors.toList()) : 
                    List.of())
                .isLikedByUser(false)
                .build();
    }

    private PostResponse mapPostToResponseWithUserContext(Post post, User currentUser) {
        boolean isLiked = likeRepository.findByPostIdAndUserId(post.getId(), currentUser.getId()).isPresent();
        
        PostResponse response = mapPostToResponse(post);
        response.setIsLikedByUser(isLiked);
        return response;
    }

    private CommentResponse mapCommentToResponse(Comment comment) {
        return CommentResponse.builder()
                .id(comment.getId())
                .content(comment.getContent())
                .author(comment.getUser().getUsername())
                .authorAvatar(String.valueOf(comment.getUser().getUsername().charAt(0)).toUpperCase())
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt())
                .likes(comment.getLikes())
                .build();
    }
}
