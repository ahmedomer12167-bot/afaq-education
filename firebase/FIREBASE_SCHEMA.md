# Afaq Educational Platform - Firestore Schema v8.0

## Collections
- students
- teachers
- parents
- subjects
- stages
- subscriptions
- subscriptionRequests
- rejectedSubscriptions
- studentSubjects
- lessons
- assignments
- assignmentSubmissions
- exams
- examAttempts
- essayAnswers
- attendance
- attendanceRecords
- notifications
- messages
- results
- finalGrades
- activityLog
- settings
- levels
- leaderboard

## Notes
- الإصدار v8.0 يضيف طبقة Firebase فوق النظام الحالي بدون حذف localStorage.
- عند إدخال apiKey و appId الصحيحين في firebase-config.js سيبدأ التزامن مع Firestore.
- في حالة عدم إدخال البيانات الصحيحة يعمل المشروع محلياً مثل السابق.
- الملفات والصور لا تستخدم Firebase Storage حالياً للحفاظ على المجانية.
- ملفات PDF يمكن حفظ روابطها فقط داخل Firestore.
