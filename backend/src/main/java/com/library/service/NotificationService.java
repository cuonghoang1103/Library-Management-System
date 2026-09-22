package com.library.service;

import com.library.entity.Notification;
import com.library.entity.User;
import com.library.repository.NotificationRepository;
import com.library.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@Transactional   // class-level: the notify...() methods are transactional too (a this-call skips the proxy)
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    /**
     * Create a notification for a user
     */
    public Notification createNotification(Long userId, String title, String message, 
            Notification.NotificationType type, Long relatedId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return null;

        Notification notification = Notification.builder()
            .user(user)
            .title(title)
            .message(message)
            .type(type)
            .relatedId(relatedId)
            .read(false)
            .build();

        return notificationRepository.save(notification);
    }

    /**
     * Get user's notifications
     */
    public List<Notification> getUserNotifications(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    /**
     * Get unread notifications count
     */
    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndReadFalse(userId);
    }

    /**
     * Mark notification as read
     */
    public void markAsRead(Long notificationId) {
        notificationRepository.findById(notificationId).ifPresent(n -> {
            n.setRead(true);
            notificationRepository.save(n);
        });
    }

    /**
     * Mark all notifications as read for a user
     */
    public void markAllAsRead(Long userId) {
        List<Notification> unread = notificationRepository.findByUserIdAndReadFalseOrderByCreatedAtDesc(userId);
        unread.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unread);
    }

    // Convenience methods for common notifications

    public void notifyLoanCreated(Long userId, String bookTitle) {
        createNotification(userId, "Book Borrowed", 
            "You have borrowed \"" + bookTitle + "\". Enjoy your reading!",
            Notification.NotificationType.LOAN_CREATED, null);
    }

    public void notifyLoanReturned(Long userId, String bookTitle) {
        createNotification(userId, "Book Returned",
            "You have returned \"" + bookTitle + "\". Thank you!",
            Notification.NotificationType.LOAN_RETURNED, null);
    }

    public void notifyLoanDueSoon(Long userId, String bookTitle, int daysRemaining) {
        createNotification(userId, "Book Due Soon",
            "Your loan for \"" + bookTitle + "\" is due in " + daysRemaining + " days.",
            Notification.NotificationType.LOAN_DUE_SOON, null);
    }

    public void notifyLoanOverdue(Long userId, String bookTitle, int daysOverdue) {
        createNotification(userId, "Book Overdue",
            "Your loan for \"" + bookTitle + "\" is " + daysOverdue + " days overdue. Please return as soon as possible.",
            Notification.NotificationType.LOAN_OVERDUE, null);
    }

    public void notifyReservationReady(Long userId, String bookTitle) {
        createNotification(userId, "Reservation Ready",
            "Your reserved book \"" + bookTitle + "\" is now available! Please pick it up within 3 days.",
            Notification.NotificationType.RESERVATION_READY, null);
    }

    public void notifyReservationExpired(Long userId, String bookTitle) {
        createNotification(userId, "Reservation Expired",
            "Your reservation for \"" + bookTitle + "\" has expired.",
            Notification.NotificationType.RESERVATION_EXPIRED, null);
    }
}
