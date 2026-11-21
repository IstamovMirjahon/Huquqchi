namespace Huquqchi.Domain;

// Legacy enums: serialized PascalCase, used by the mobile app. Do not rename values.
public enum WorkspaceKind { Personal, Business }
public enum MemberRole { Owner, Member, LegalEditor, Support, Administrator }
public enum MessageRole { User, Assistant, System }
public enum DocumentStatus { Saved, Processing, Ready, Failed, Draft, Deleted }
public enum DocumentOrigin { Uploaded, Chat, Generated }
public enum AnalysisStatus { Queued, Processing, Completed, Failed }
public enum FindingSeverity { Information, NeedsReview, HighAttention }
public enum ContentStatus { Draft, Review, Published, Archived }
public enum OtpDeliveryChannel { Telegram, Sms }

// Platform enums (BACKEND_API.md §C): serialized snake_case.
public enum UserRole { Client, Lawyer, Moderator, Editor, Admin }
public enum LawyerStatus { Draft, Pending, Verified, Rejected, Suspended }
public enum LawyerType { Advocate, LegalConsultant }
public enum FilePurpose { OrderMessage, Kyc, JobAttachment, Delivery, Avatar }
public enum FileScanStatus { Clean, Skipped }
public enum OtpDeliveryStatus { Pending, Processing, Sent, Failed, Expired }
public enum DataExportStatus { Requested, Processing, Ready, Failed }
