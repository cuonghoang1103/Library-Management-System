package com.library.controller;

import com.library.dto.ApiResponse;
import com.library.dto.ReviewDTO;
import com.library.service.ReviewService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @GetMapping("/books/{bookId}/reviews")
    public ResponseEntity<ApiResponse<Page<ReviewDTO>>> getBookReviews(
            @PathVariable Long bookId,
            @PageableDefault(size = 10) Pageable pageable) {
        Page<ReviewDTO> reviews = reviewService.getReviewsByBookId(bookId, pageable);
        return ResponseEntity.ok(ApiResponse.success(reviews));
    }

    @GetMapping("/books/{bookId}/reviews/rating")
    public ResponseEntity<ApiResponse<ReviewStats>> getBookRatingStats(@PathVariable Long bookId) {
        Double avgRating = reviewService.getAverageRating(bookId);
        Long count = reviewService.getReviewCount(bookId);
        return ResponseEntity.ok(ApiResponse.success(new ReviewStats(avgRating, count)));
    }

    @PostMapping("/books/{bookId}/reviews")
    public ResponseEntity<ApiResponse<ReviewDTO>> createReview(
            @PathVariable Long bookId,
            @Valid @RequestBody CreateReviewRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = extractUserId(userDetails);
        ReviewDTO review = reviewService.createReview(userId, bookId, request.rating(), request.comment());
        return ResponseEntity.ok(ApiResponse.success(review));
    }

    @PutMapping("/reviews/{reviewId}")
    public ResponseEntity<ApiResponse<ReviewDTO>> updateReview(
            @PathVariable Long reviewId,
            @RequestBody UpdateReviewRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = extractUserId(userDetails);
        ReviewDTO review = reviewService.updateReview(reviewId, userId, request.rating(), request.comment());
        return ResponseEntity.ok(ApiResponse.success(review));
    }

    @DeleteMapping("/reviews/{reviewId}")
    public ResponseEntity<ApiResponse<Void>> deleteReview(
            @PathVariable Long reviewId,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = extractUserId(userDetails);
        reviewService.deleteReview(reviewId, userId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    private Long extractUserId(UserDetails userDetails) {
        // Extract user ID from UserDetails - implementation depends on your auth setup
        // For now, return null or fetch from userDetails
        return null;
    }

    public record CreateReviewRequest(@NotNull @Min(1) @Max(5) Integer rating, String comment) {}
    public record UpdateReviewRequest(Integer rating, String comment) {}
    public record ReviewStats(Double averageRating, Long count) {}
}
